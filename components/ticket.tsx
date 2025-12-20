import { Booking } from "@/types/booking";
import { useTheme } from "@/contexts/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import QRCode from "react-native-qrcode-svg";
import { generateBookingQRData } from "@/utils/qrCodeHelpers";
import { showtimeSelectionService } from "@/services/showtime-selection";
import { formatDate } from "@/utils/dayUtils";

interface TicketProps {
  booking: Booking;
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

export const Ticket = ({ booking }: TicketProps) => {
  const { isDark } = useTheme();
  const [showtimeData, setShowtimeData] = useState<ShowtimeData | null>(null);
  const [seatsData, setSeatsData] = useState<SeatData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        const showtimeDetails = await showtimeSelectionService.getShowtimeById(
          booking.showtimeId
        );

        const [movieDetails, cinemaDetails, roomDetails] = await Promise.all([
          showtimeSelectionService
            .getMovieDetails(showtimeDetails.movieId)
            .catch((err) => {
              console.warn("Failed to fetch movie details:", err);
              return null;
            }),
          showtimeSelectionService
            .getCinemaDetails(showtimeDetails.cinemaId)
            .catch((err) => {
              console.warn("Failed to fetch cinema details:", err);
              return null;
            }),
          showtimeSelectionService
            .getRoomById(showtimeDetails.roomId)
            .catch((err) => {
              console.warn("Failed to fetch room details:", err);
              return null;
            }),
        ]);

        // Format start time
        const startTimeDate = new Date(showtimeDetails.startTime);
        const formattedStartTime = startTimeDate.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });

        setShowtimeData({
          id: booking.showtimeId,
          movieTitle: movieDetails?.title,
          cinemaName: cinemaDetails?.name,
          roomName: roomDetails?.name,
          startTime: formattedStartTime,
          date: formatDate(new Date(showtimeDetails.startTime)),
          price: booking.totalPrice / booking.bookingSeats.length,
        });

        const seatMap = new Map<string, any>();
        if (roomDetails?.seats && Array.isArray(roomDetails.seats)) {
          roomDetails.seats.forEach((seat: any) => {
            seatMap.set(seat.id, seat);
          });
        }

        // Map booking seats to seat data
        const seatsData = booking.bookingSeats.map((bookingSeat) => {
          const seatData = seatMap.get(bookingSeat.seatId);

          if (seatData) {
            const rowMatch = seatData.seatNumber?.match(/^([A-Z])/i);
            const row = rowMatch ? rowMatch[1].toUpperCase() : "A";

            return {
              id: bookingSeat.seatId,
              seatNumber: seatData.seatNumber || bookingSeat.seatId,
              row,
              type: seatData.seatType || "NORMAL",
            };
          }
        });
        setSeatsData(seatsData as SeatData[]);
      } catch (error) {
        console.error("Error fetching ticket data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [booking]);

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
        <Text className="text-center text-text-muted">Đang tải vé...</Text>
      </View>
    );
  }

  return (
    <View className={`mx-4 mb-4 ${isDark ? "dark" : "light"}`} key={booking.id}>
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
                    Suất chiếu
                  </Text>
                </View>
                <Text className="text-foreground text-sm font-[semibold]">
                  {showtimeData?.date ||
                    formatDate(new Date(booking.createdAt))}
                </Text>
                <Text className="text-foreground text-lg font-[bold]">
                  {showtimeData?.startTime || "N/A"}
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
                    Ghế ({booking.bookingSeats.length})
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
              Tổng tiền
            </Text>
            <Text className="text-foreground text-2xl font-[bold]">
              {formatPrice(booking.totalPrice)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-text-muted text-xs font-[medium]">
              Mã đặt vé
            </Text>
            <Text className="text-foreground text-sm font-[semibold]">
              #{booking.id.slice(-8).toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
