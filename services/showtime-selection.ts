import axiosConfig from "@/configs/axiosConfig";
import {
  Showtime,
  SeatLayout,
  Seat,
  SeatType,
  SeatStatus,
} from "@/types/showtime";

export const showtimeSelectionService = {
  getShowtimesByMovie: async (
    movieId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Showtime[]> => {
    try {
      const params: any = {
        movieId,
        isActive: true,
        limit: undefined,
      };

      if (startDate) params.startTime = startDate;
      if (endDate) params.endTime = endDate;

      const response = await axiosConfig.get(`/showtimes/public`, { params });

      return response.data.data;
    } catch (error: any) {
      console.log(error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch showtimes"
      );
    }
  },

  // Get showtime details by ID
  getShowtimeById: async (showtimeId: string): Promise<Showtime> => {
    try {
      const response = await axiosConfig.get(`/showtimes/public/${showtimeId}`);

      return response.data.data;
    } catch (error: any) {
      console.log(error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch showtime details"
      );
    }
  },

  // Get seat layout for a specific room
  getRoomSeatLayout: async (roomId: string): Promise<SeatLayout> => {
    try {
      const response = await axiosConfig.get(`/rooms/public/${roomId}`);

      const room = response.data.data;

      if (room?.seatLayout) {
        const rawLayout: Array<{
          row: string;
          col: number;
          type: string;
        }> =
          typeof room.seatLayout === "string"
            ? JSON.parse(room.seatLayout)
            : room.seatLayout;

        if (!Array.isArray(rawLayout) || rawLayout.length === 0) {
          return { rows: 0, cols: 0, seats: [] };
        }

        // Determine grid size
        let maxRow = 0;
        let maxCol = 0;
        rawLayout.forEach((seat) => {
          const rowIndex = seat.row.charCodeAt(0) - 65; // 'A' -> 0
          const colIndex = seat.col - 1; // 1-based to 0-based
          if (rowIndex > maxRow) maxRow = rowIndex;
          if (colIndex > maxCol) maxCol = colIndex;
        });

        const rows = maxRow + 1;
        const cols = maxCol + 1;

        // Create empty grid
        const seats: Seat[][] = Array.from({ length: rows }, (_, rowIndex) =>
          Array.from({ length: cols }, (_, colIndex) => {
            const rowLetter = String.fromCharCode(65 + rowIndex);
            const seatNumber = `${rowLetter}${colIndex + 1}`;
            return {
              row: rowIndex,
              col: colIndex,
              seatNumber,
              type: SeatType.EMPTY,
              status: SeatStatus.AVAILABLE,
              price: 0,
            } as Seat;
          })
        );

        // Fill in defined seats from seatLayout
        rawLayout.forEach((seatDef) => {
          const rowIndex = seatDef.row.charCodeAt(0) - 65;
          const colIndex = seatDef.col - 1;

          if (
            rowIndex < 0 ||
            colIndex < 0 ||
            rowIndex >= rows ||
            colIndex >= cols
          ) {
            return;
          }

          const rowLetter = String.fromCharCode(65 + rowIndex);
          const seatNumber = `${rowLetter}${seatDef.col}`;

          let type: SeatType;
          switch (seatDef.type) {
            case "VIP":
              type = SeatType.VIP;
              break;
            case "COUPLE":
              type = SeatType.COUPLE;
              break;
            case "BLOCKED":
              type = SeatType.BLOCKED;
              break;
            case "EMPTY":
              type = SeatType.EMPTY;
              break;
            default:
              type = SeatType.NORMAL;
          }

          seats[rowIndex][colIndex] = {
            row: rowIndex,
            col: colIndex,
            seatNumber,
            type,
            status:
              type === SeatType.BLOCKED
                ? SeatStatus.BOOKED
                : SeatStatus.AVAILABLE,
            price: 0,
          };
        });

        // Merge adjacent couple seats
        for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
          for (let colIndex = 0; colIndex < cols - 1; colIndex++) {
            const currentSeat = seats[rowIndex][colIndex];
            const nextSeat = seats[rowIndex][colIndex + 1];

            if (
              currentSeat.type === SeatType.COUPLE &&
              nextSeat.type === SeatType.COUPLE &&
              !currentSeat.isCoupleSeat &&
              !nextSeat.isCoupleSeat
            ) {
              const rowLetter = String.fromCharCode(65 + rowIndex);
              const coupleSeatNumber = `${rowLetter}${colIndex + 1}-${
                colIndex + 2
              }`;

              seats[rowIndex][colIndex] = {
                ...currentSeat,
                seatNumber: coupleSeatNumber,
                isCoupleSeat: true,
                coupleWith: colIndex + 1,
              };

              seats[rowIndex][colIndex + 1] = {
                ...nextSeat,
                seatNumber: coupleSeatNumber,
                isCoupleSeat: true,
                coupleWith: colIndex,
              };
            }
          }
        }

        // Enrich seats with database IDs and extraPrice
        if (Array.isArray(room.seats)) {
          room.seats.forEach((seatRecord: any) => {
            if (!seatRecord?.seatNumber || !seatRecord?.id) return;
            const rowLetter = seatRecord.seatNumber[0];
            const colNum = parseInt(seatRecord.seatNumber.slice(1), 10);
            if (!rowLetter || !colNum || Number.isNaN(colNum)) return;

            const rowIndex = rowLetter.charCodeAt(0) - 65;
            const colIndex = colNum - 1;

            if (
              rowIndex < 0 ||
              colIndex < 0 ||
              rowIndex >= rows ||
              colIndex >= cols
            ) {
              return;
            }

            const existing = seats[rowIndex][colIndex];
            seats[rowIndex][colIndex] = {
              ...existing,
              id: seatRecord.id,
              extraPrice: seatRecord.extraPrice || 0,
            };
          });
        }

        return { rows, cols, seats };
      }

      // Return empty layout if none exists
      return {
        rows: 0,
        cols: 0,
        seats: [],
      };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch seat layout"
      );
    }
  },

  // Get booked seats for a specific showtime
  getBookedSeats: async (showtimeId: string): Promise<string[]> => {
    try {
      const response = await axiosConfig.get(
        `/bookings/public/${showtimeId}/booking-seat`
      );

      const bookingSeats = response.data.data || [];
      // Extract seat numbers from booking seat objects
      // Booking seats may have seatNumber or seatId field
      return bookingSeats
        .map((seat: any) => seat.seatNumber || seat.seatId || seat.id)
        .filter(Boolean);
    } catch (error: any) {
      // If endpoint doesn't exist or returns error, return empty array
      console.warn("Could not fetch booked seats:", error.message);
      return [];
    }
  },

  // Get movie details
  getMovieDetails: async (movieId: string) => {
    try {
      const response = await axiosConfig.get(`/movies/public/${movieId}`);

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch movie details"
      );
    }
  },

  // Get cinema details
  getCinemaDetails: async (cinemaId: string) => {
    try {
      const response = await axiosConfig.get(`/cinemas/public/${cinemaId}`);

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch cinema details"
      );
    }
  },

  // Get room by ID (similar to POS implementation)
  getRoomById: async (roomId: string) => {
    try {
      const response = await axiosConfig.get(`/rooms/public/${roomId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch room details"
      );
    }
  },
};
