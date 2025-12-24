export interface BookingQRData {
  bookingId: string;
  userId?: string;
  showtimeId: string;
  totalPrice: number;
  seats: string[];
  createdAt: string;
}

export const generateBookingQRData = (booking: { id: string }): string => {
  const bookingId = booking.id;

  return JSON.stringify({
    bookingId: bookingId,
  });
};

export const parseBookingQRData = (
  qrDataString: string
): { bookingId: string } | null => {
  try {
    const parsed = JSON.parse(qrDataString);

    if (parsed.bookingId && typeof parsed.bookingId === "string") {
      return {
        bookingId: parsed.bookingId,
      };
    }

    console.error("Invalid QR data structure - missing bookingId");
    return null;
  } catch (error) {
    console.error("Failed to parse QR code data:", error);
    return null;
  }
};

export const validateBookingQR = (bookingData: {
  id: string;
  createdAt: Date | string;
  bookingSeats?: Array<{ seatId: string }>;
}): {
  isValid: boolean;
  reason?: string;
} => {
  const bookingDate = new Date(bookingData.createdAt);
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

  if (!bookingData.bookingSeats || bookingData.bookingSeats.length === 0) {
    return {
      isValid: false,
      reason: "No seats found in booking",
    };
  }

  return {
    isValid: true,
  };
};

export const formatBookingForDisplay = (booking: {
  id: string;
  totalPrice: number;
  bookingSeats: Array<{ seatId: string }>;
  createdAt: Date | string;
}) => {
  return {
    bookingId: booking.id.toUpperCase(),
    shortBookingId: booking.id.slice(-8).toUpperCase(),
    formattedPrice: new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(booking.totalPrice),
    seatCount: booking.bookingSeats?.length || 0,
    seatList: booking.bookingSeats?.map((s) => s.seatId).join(", ") || "",
    bookingDate: new Date(booking.createdAt).toLocaleDateString("en-US", {
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
    bookingId: bookingId,
  });
};
