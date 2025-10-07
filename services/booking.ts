import axiosConfig from "@/configs/axiosConfig";
import { Booking } from "@/types/booking";

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
  createBooking: async (showtimeId: string, seatIds: string[]) => {
    try {
      const response = await axiosConfig.post(`/bookings`, {
        showtimeId,
        seatIds,
      });

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
      throw new Error(
        error.response?.data?.message || "Failed to create booking"
      );
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
};
