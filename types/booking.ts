export type Booking = {
  id: string;
  userId?: string;
  showtimeId: string;
  totalPrice: number;
  bookingSeats: BookingSeat[];
  createdAt: Date;
  updatedAt: Date;
};

export type BookingSeat = {
  id: string;
  bookingId: string;
  booking: Booking;
  seatId: string;
  showtimeId: string;
  createdAt: Date;
  updatedAt: Date;
};
