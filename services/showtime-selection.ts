import axiosConfig from "@/configs/axiosConfig";
import {
  Showtime,
  SeatLayout,
  Seat,
  SeatType,
  SeatStatus,
} from "@/types/showtime";

export const showtimeSelectionService = {
  // Get showtimes by movie ID and optional date filter
  getShowtimesByMovie: async (
    movieId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Showtime[]> => {
    try {
      const params: any = {
        movieId,
        isActive: true,
      };

      if (startDate) params.startTime = startDate;
      if (endDate) params.endTime = endDate;

      const response = await axiosConfig.get(`/showtimes/public`, { params });

      return response.data.data;
    } catch (error: any) {
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

      // Parse the seat layout from the room data
      if (room.seatLayout) {
        return typeof room.seatLayout === "string"
          ? JSON.parse(room.seatLayout)
          : room.seatLayout;
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
};
