export interface BookingQRData {
  bookingId: string;
  userId?: string;
  showtimeId: string;
  totalPrice: number;
  seats: string[];
  createdAt: string;
}

// Generate QR code data string for a booking

export const generateBookingQRData = (booking: {
  id: string;
  userId?: string;
  showtimeId: string;
  totalPrice: number;
  bookingSeats: Array<{ seatId: string }>;
  createdAt: Date;
}): string => {
  const qrData: BookingQRData = {
    bookingId: booking.id,
    userId: booking.userId,
    showtimeId: booking.showtimeId,
    totalPrice: booking.totalPrice,
    seats: booking.bookingSeats.map((seat) => seat.seatId),
    createdAt: booking.createdAt.toISOString(),
  };

  return JSON.stringify(qrData);
};

// Parse QR code data string back to booking information

export const parseBookingQRData = (
  qrDataString: string
): BookingQRData | null => {
  try {
    const parsed = JSON.parse(qrDataString);

    // Validate required fields
    if (
      !parsed.bookingId ||
      !parsed.showtimeId ||
      !parsed.totalPrice ||
      !Array.isArray(parsed.seats)
    ) {
      console.error("Invalid QR data structure");
      return null;
    }

    return {
      bookingId: parsed.bookingId,
      userId: parsed.userId,
      showtimeId: parsed.showtimeId,
      totalPrice: parsed.totalPrice,
      seats: parsed.seats,
      createdAt: parsed.createdAt,
    };
  } catch (error) {
    console.error("Failed to parse QR code data:", error);
    return null;
  }
};

export const validateBookingQR = (
  qrData: BookingQRData
): {
  isValid: boolean;
  reason?: string;
} => {
  const bookingDate = new Date(qrData.createdAt);
  const now = new Date();

  if (bookingDate > now) {
    return {
      isValid: false,
      reason: "Booking date is in the future",
    };
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (bookingDate < thirtyDaysAgo) {
    return {
      isValid: false,
      reason: "Booking is too old",
    };
  }

  if (!qrData.seats || qrData.seats.length === 0) {
    return {
      isValid: false,
      reason: "No seats found in booking",
    };
  }

  return {
    isValid: true,
  };
};

// Format booking QR data for display

export const formatBookingForDisplay = (qrData: BookingQRData) => {
  return {
    bookingId: qrData.bookingId.toUpperCase(),
    shortBookingId: qrData.bookingId.slice(-8).toUpperCase(),
    formattedPrice: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(qrData.totalPrice),
    seatCount: qrData.seats.length,
    seatList: qrData.seats.join(", "),
    bookingDate: new Date(qrData.createdAt).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

export const generateSimpleBookingQR = (bookingId: string): string => {
  return JSON.stringify({
    type: "cinemago_booking",
    id: bookingId,
    timestamp: Date.now(),
  });
};
