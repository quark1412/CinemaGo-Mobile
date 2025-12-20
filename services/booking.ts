import axiosConfig from "@/configs/axiosConfig";

export interface HeldSeat {
  userId: string;
  showtimeId: string;
  seatId: string;
  extraPrice: number;
}

export interface Booking {
  id: string;
  userId: string;
  showtimeId: string;
  totalPrice: number;
  type: string;
  bookingSeats: Array<{
    id: string;
    seatId: string;
    showtimeId: string;
  }>;
  bookingFoodDrinks: Array<{
    id: string;
    foodDrinkId: string;
    quantity: number;
    totalPrice: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingRequest {
  showtimeId: string;
  seatIds: string[];
  foodDrinks?: Array<{ foodDrinkId: string; quantity: number }>;
}

export const bookingService = {
  // Get all bookings for the current user
  getMyBookings: async (
    page: number = 1,
    limit: number | undefined = undefined
  ) => {
    try {
      const response = await axiosConfig.get(`/bookings`, {
        params: { page, limit },
      });

      return response.data;
    } catch (error: any) {
      throw error;
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
      throw error;
    }
  },

  // Create a new booking
  createBooking: async (
    data: CreateBookingRequest
  ): Promise<{ data: Booking }> => {
    try {
      const response = await axiosConfig.post("/bookings", data, {
        requiresAuth: true,
      } as any);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get booked seats for a showtime
  getBookedSeats: async (showtimeId: string) => {
    try {
      const response = await axiosConfig.get(
        `/bookings/public/${showtimeId}/booking-seat`
      );
      return response.data;
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
