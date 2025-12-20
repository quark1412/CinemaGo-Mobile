import axiosConfig from "@/configs/axiosConfig";
import { Booking } from "@/types/booking";

export interface HeldSeat {
  userId: string;
  showtimeId: string;
  seatId: string;
  extraPrice: number;
}

export const bookingService = {
  // Get all bookings for the current user
  getMyBookings: async (page: number = 1, limit: number = 10) => {
    try {
      const response = await axiosConfig.get(`/bookings`, {
        params: { page, limit },
      });

      // Transform the response data to ensure dates are properly converted
      const bookings = response.data.data.map((booking: any) => ({
        ...booking,
        createdAt: new Date(booking.createdAt),
        updatedAt: new Date(booking.updatedAt),
        bookingSeats: booking.bookingSeats.map((seat: any) => ({
          ...seat,
          createdAt: new Date(seat.createdAt),
          updatedAt: new Date(seat.updatedAt),
        })),
      })) as Booking[];

      return {
        bookings,
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch bookings"
      );
    }
  },

  // Get a specific booking by ID
  getBookingById: async (bookingId: string) => {
    try {
      const response = await axiosConfig.get(`/bookings/${bookingId}`);

      const booking = {
        ...response.data.data,
        createdAt: new Date(response.data.data.createdAt),
        updatedAt: new Date(response.data.data.updatedAt),
        bookingSeats: response.data.data.bookingSeats.map((seat: any) => ({
          ...seat,
          createdAt: new Date(seat.createdAt),
          updatedAt: new Date(seat.updatedAt),
        })),
      } as Booking;

      return booking;
    } catch (error: any) {
      console.log(error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch booking"
      );
    }
  },

  // Create a new booking
  createBooking: async (
    showtimeId: string,
    seatIds: string[],
    foodDrinks?: Array<{ id: string; quantity: number }>
  ) => {
    try {
      // Validate seatIds
      if (!seatIds || seatIds.length === 0) {
        throw new Error("Seat IDs are required");
      }

      // Filter out any invalid seat IDs
      const validSeatIds = seatIds.filter(
        (id): id is string => !!id && typeof id === "string" && id.trim() !== ""
      );

      if (validSeatIds.length === 0) {
        throw new Error("No valid seat IDs provided");
      }

      const foodDrinksData =
        foodDrinks && foodDrinks.length > 0
          ? foodDrinks.map((fd) => ({
              foodDrinkId: fd.id,
              quantity: fd.quantity,
            }))
          : [];

      console.log("Sending booking request:", {
        showtimeId,
        seatIds: validSeatIds,
        foodDrinks: foodDrinksData,
      });

      const response = await axiosConfig.post(
        `/bookings`,
        {
          showtimeId,
          seatIds: validSeatIds,
          foodDrinks: foodDrinksData,
        },
        {
          requiresAuth: true,
        } as any
      );

      // Transform the response data to ensure dates are properly converted
      const booking = {
        ...response.data.data,
        createdAt: new Date(response.data.data.createdAt),
        updatedAt: new Date(response.data.data.updatedAt),
        bookingSeats: response.data.data.bookingSeats.map((seat: any) => ({
          ...seat,
          createdAt: new Date(seat.createdAt),
          updatedAt: new Date(seat.updatedAt),
        })),
      } as Booking;

      return booking;
    } catch (error: any) {
      throw error;
    }
  },

  // Get booked seats for a showtime
  getBookedSeats: async (showtimeId: string) => {
    try {
      const response = await axiosConfig.get(
        `/bookings/public/${showtimeId}/booking-seat`
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch booked seats"
      );
    }
  },

  // Hold a seat temporarily for the current user
  holdSeat: async (data: {
    showtimeId: string;
    seatId: string;
  }): Promise<{ message: string }> => {
    try {
      const response = await axiosConfig.post(`/rooms/hold-seat`, data, {
        requiresAuth: true,
      } as any);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Release a previously held seat
  releaseSeat: async (data: {
    showtimeId: string;
    seatId: string;
  }): Promise<{ message: string }> => {
    try {
      const response = await axiosConfig.post(`/rooms/release-seat`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Get all held seats for a showtime
  getHeldSeats: async (showtimeId: string): Promise<{ data: HeldSeat[] }> => {
    try {
      const response = await axiosConfig.get(`/rooms/${showtimeId}/hold-seat`, {
        requiresAuth: true,
      } as any);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};
