import { Booking } from "@/types/booking";
import { useTheme } from "@/contexts/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import QRCode from "react-native-qrcode-svg";
import { generateBookingQRData } from "@/utils/qrCodeHelpers";
import { getShowtimeById } from "@/services/showtime";

interface TicketProps {
  booking: Booking;
  onPress?: () => void;
}

interface ShowtimeData {
  id: string;
  movieTitle: string;
  cinemaName: string;
  roomName: string;
  startTime: string;
  date: string;
  price: number;
}

interface SeatData {
  id: string;
  seatNumber: string;
  row: string;
  type: string;
}

export const Ticket = ({ booking, onPress }: TicketProps) => {
  const { isDark } = useTheme();
  const [showtimeData, setShowtimeData] = useState<ShowtimeData | null>(null);
  const [seatsData, setSeatsData] = useState<SeatData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        // Fetch showtime details using the real API
        const showtimeDetails = await getShowtimeById(booking.showtimeId);

        setShowtimeData({
          id: booking.showtimeId,
          movieTitle: showtimeDetails.data.movie?.title || "Movie Title",
          cinemaName: showtimeDetails.data.cinema?.name || "CinemaGo Cinema",
          roomName: showtimeDetails.data.room?.name || "Theater Room",
          startTime: showtimeDetails.data.startTime,
          date: formatDate(showtimeDetails.data.startTime),
          price: booking.totalPrice / booking.bookingSeats.length,
        });

        // Convert seat IDs to display format
        const seatsData = booking.bookingSeats.map((seat, index) => {
          // Try to extract seat info from seatId
          const seatMatch = seat.seatId.match(/seat-([a-z])(\d+)/i);
          let seatNumber = `${String.fromCharCode(65 + index)}${index + 1}`;
          let row = String.fromCharCode(65 + index);

          if (seatMatch) {
            row = seatMatch[1].toUpperCase();
            seatNumber = `${row}${seatMatch[2]}`;
          }

          return {
            id: seat.seatId,
            seatNumber,
            row,
            type: "Regular",
          };
        });
        setSeatsData(seatsData);
      } catch (error) {
        console.error("Error fetching ticket data:", error);
        // Fallback to basic data if API calls fail
        setShowtimeData({
          id: booking.showtimeId,
          movieTitle: "Movie Title",
          cinemaName: "CinemaGo Cinema",
          roomName: "Theater Room",
          startTime: "19:30",
          date: booking.createdAt.toLocaleDateString(),
          price: booking.totalPrice / booking.bookingSeats.length,
        });

        const fallbackSeats = booking.bookingSeats.map((seat, index) => ({
          id: seat.seatId,
          seatNumber: `A${index + 1}`,
          row: "A",
          type: "Regular",
        }));
        setSeatsData(fallbackSeats);
      } finally {
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [booking]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (loading) {
    return (
      <View
        className={`p-4 rounded-2xl mx-4 mb-4 bg-card-background border border-border`}
      >
        <Text className="text-center text-text-muted">Loading ticket...</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`mx-4 mb-4 ${isDark ? "dark" : "light"}`}
      activeOpacity={0.8}
    >
      {/* Ticket Container */}
      <View className="bg-card-background rounded-t-2xl border border-border border-b-0 overflow-hidden">
        {/* Header Section */}
        <View className="bg-primary p-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-white text-lg font-[bold] mb-1">
                {showtimeData?.movieTitle}
              </Text>
              <Text className="text-white/80 text-sm font-[medium]">
                {showtimeData?.cinemaName} • {showtimeData?.roomName}
              </Text>
            </View>
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-[semibold]">
                #{booking.id.slice(-6).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Ticket Info - Two Column Layout */}
        <View className="p-4">
          <View className="flex-row">
            {/* Left Column - Time and Seats */}
            <View className="flex-1 pr-4">
              {/* Date and Time */}
              <View className="mb-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={isDark ? "#9ca3af" : "#6b7280"}
                  />
                  <Text className="text-text-muted text-xs font-[medium] ml-2">
                    Date & Time
                  </Text>
                </View>
                <Text className="text-foreground text-sm font-[semibold]">
                  {formatDate(booking.createdAt.toString())}
                </Text>
                <Text className="text-foreground text-lg font-[bold]">
                  {showtimeData?.startTime}
                </Text>
              </View>

              {/* Seats */}
              <View>
                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name="desktop-outline"
                    size={18}
                    color={isDark ? "#9ca3af" : "#6b7280"}
                  />
                  <Text className="text-text-muted text-xs font-[medium] ml-2">
                    Seats ({booking.bookingSeats.length})
                  </Text>
                </View>
                <View className="flex-row flex-wrap">
                  {seatsData.map((seat, index) => (
                    <View
                      key={seat.id}
                      className="bg-muted-background px-2 py-1 rounded mr-1 mb-1"
                    >
                      <Text className="text-foreground text-xs font-[semibold]">
                        {seat.seatNumber}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Right Column - QR Code */}
            <View className="items-center justify-center">
              <View className="bg-white p-2 rounded-lg shadow-sm">
                <QRCode
                  value={generateBookingQRData(booking)}
                  size={100}
                  color={"#000000"}
                  backgroundColor={"#FFFFFF"}
                  logoSize={0}
                  logoMargin={0}
                  logoBorderRadius={0}
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Horizontal Divider */}
      <View className="w-full h-[1px] bg-border border-l border-r border-border"></View>

      {/* Price Section */}
      <View className="bg-card-background rounded-b-2xl border border-border border-t-0 p-4">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-text-muted text-xs font-[medium]">
              Total Amount
            </Text>
            <Text className="text-foreground text-2xl font-[bold]">
              {formatPrice(booking.totalPrice)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-text-muted text-xs font-[medium]">
              Booking ID
            </Text>
            <Text className="text-foreground text-sm font-[semibold]">
              #{booking.id.slice(-8).toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
