import { Booking } from "@/types/booking";
import { useTheme } from "@/contexts/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import QRCode from "react-native-qrcode-svg";
import { generateBookingQRData } from "@/utils/qrCodeHelpers";
import { showtimeSelectionService } from "@/services/showtime-selection";
import { formatDate } from "@/utils/dayUtils";
import { fooddrinkService, FoodDrink } from "@/services/fooddrink";
import { Booking as ServiceBooking } from "@/services/booking";

interface TicketProps {
  booking: Booking;
}

interface ShowtimeData {
  id: string;
  movieTitle: string;
  cinemaName: string;
  cinemaAddress: string;
  roomName: string;
  startTime: string;
  date: string;
  showtimePrice: number;
  roomExtraPrices: {
    VIP?: number;
    COUPLE?: number;
    NORMAL?: number;
  };
}

interface SeatData {
  id: string;
  seatNumber: string;
  row: string;
  type: string;
  extraPrice?: number;
  isCoupleSeat?: boolean;
}

interface FoodDrinkData {
  name: string;
  quantity: number;
  price: number;
}

export const Ticket = ({ booking }: TicketProps) => {
  const { isDark } = useTheme();
  const [showtimeData, setShowtimeData] = useState<ShowtimeData | null>(null);
  const [seatsData, setSeatsData] = useState<SeatData[]>([]);
  const [foodDrinksData, setFoodDrinksData] = useState<FoodDrinkData[]>([]);
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

        // Get room extra prices
        const roomExtraPrices: {
          VIP?: number;
          COUPLE?: number;
          NORMAL?: number;
        } = {};
        if (roomDetails?.extraPrices) {
          roomExtraPrices.VIP = roomDetails.extraPrices.VIP || 0;
          roomExtraPrices.COUPLE = roomDetails.extraPrices.COUPLE || 0;
          roomExtraPrices.NORMAL = roomDetails.extraPrices.NORMAL || 0;
        }

        setShowtimeData({
          id: booking.showtimeId,
          movieTitle: movieDetails?.title || "N/A",
          cinemaName: cinemaDetails?.name || "N/A",
          cinemaAddress: cinemaDetails?.address || "N/A",
          roomName: roomDetails?.name || "N/A",
          startTime: formattedStartTime,
          date: formatDate(new Date(showtimeDetails.startTime)),
          showtimePrice: showtimeDetails.price || 0,
          roomExtraPrices,
        });

        const seatMap = new Map<string, any>();
        if (roomDetails?.seats && Array.isArray(roomDetails.seats)) {
          roomDetails.seats.forEach((seat: any) => {
            seatMap.set(seat.id, seat);
          });
        }

        // Map booking seats to seat data
        const seatsData: SeatData[] = [];
        booking.bookingSeats.forEach((bookingSeat) => {
          const seatData = seatMap.get(bookingSeat.seatId);

          if (seatData) {
            const rowMatch = seatData.seatNumber?.match(/^([A-Z])/i);
            const row = rowMatch ? rowMatch[1].toUpperCase() : "A";
            const isCoupleSeat = seatData.seatNumber?.includes("-") || false;

            seatsData.push({
              id: bookingSeat.seatId,
              seatNumber: seatData.seatNumber || bookingSeat.seatId,
              row,
              type: seatData.seatType || "NORMAL",
              extraPrice: seatData.extraPrice || 0,
              isCoupleSeat,
            });
          }
        });
        setSeatsData(seatsData);

        // Fetch food drinks
        const serviceBooking = booking as unknown as ServiceBooking & {
          bookingFoodDrinks?: Array<{
            id: string;
            foodDrinkId: string;
            quantity: number;
            totalPrice: number;
          }>;
        };
        if (
          serviceBooking.bookingFoodDrinks &&
          serviceBooking.bookingFoodDrinks.length > 0
        ) {
          try {
            const foodDrinkIds = serviceBooking.bookingFoodDrinks.map(
              (bfd) => bfd.foodDrinkId
            );
            const foodDrinks =
              await fooddrinkService.getFoodDrinksByIds(foodDrinkIds);

            const foodDrinksData: FoodDrinkData[] =
              serviceBooking.bookingFoodDrinks.map((bfd) => {
                const foodDrink = foodDrinks.find(
                  (fd) => fd.id === bfd.foodDrinkId
                );
                return {
                  name: foodDrink?.name || "N/A",
                  quantity: bfd.quantity,
                  price: bfd.totalPrice,
                };
              });

            setFoodDrinksData(foodDrinksData);
          } catch (error) {
            console.warn("Failed to fetch food drinks:", error);
          }
        }
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

  const getSeatTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      NORMAL: "Thường",
      VIP: "VIP",
      COUPLE: "Đôi",
    };
    return typeMap[type] || type;
  };

  // Group seats by type
  const groupSeatsByType = () => {
    if (!seatsData || seatsData.length === 0) return {};

    const seatsByType: Record<string, SeatData[]> = {};
    const coupleSeatNumbers = new Set<string>();

    seatsData.forEach((seat) => {
      // Check couple seat
      if (seat.seatNumber.includes("-") || seat.isCoupleSeat) {
        const coupleKey = seat.seatNumber;
        if (!coupleSeatNumbers.has(coupleKey)) {
          coupleSeatNumbers.add(coupleKey);
          if (!seatsByType["COUPLE"]) {
            seatsByType["COUPLE"] = [];
          }
          seatsByType["COUPLE"].push(seat);
        }
      } else {
        // Regular seat
        const type = seat.type || "NORMAL";
        if (!seatsByType[type]) {
          seatsByType[type] = [];
        }
        seatsByType[type].push(seat);
      }
    });

    return seatsByType;
  };

  if (loading) {
    return (
      <View
        className={`p-6 rounded-lg mx-4 mb-4 ${
          isDark ? "bg-slate-800" : "bg-white"
        } border-2 ${isDark ? "border-slate-700" : "border-gray-300"}`}
      >
        <View className="items-center py-8">
          <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
          <Text
            className={`mt-4 ${isDark ? "text-slate-400" : "text-gray-600"}`}
          >
            Đang tải vé...
          </Text>
        </View>
      </View>
    );
  }

  const seatsByType = groupSeatsByType();
  const bgColor = isDark ? "bg-slate-950" : "bg-white";
  const cardBg = isDark ? "bg-slate-800" : "bg-white";
  const borderColor = isDark ? "border-slate-700" : "border-gray-300";
  const textColor = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-slate-400" : "text-gray-600";

  return (
    <View className={`mx-4 mb-4`} key={booking.id}>
      {/* Ticket Container */}
      <View
        className={`${cardBg} border-2 ${borderColor} rounded-lg overflow-hidden`}
      >
        {/* Ticket Content */}
        <View className="p-6 space-y-4">
          {/* Movie Title */}
          <View className="items-center">
            <Text className={`${textColor} text-xl font-bold`}>
              {showtimeData?.movieTitle || "Đang tải..."}
            </Text>
          </View>

          {/* Cinema Name and Address */}
          <View className="items-center space-y-1">
            <Text className={`${textColor} text-base font-black`}>
              {showtimeData?.cinemaName}
            </Text>
            <Text className={`${textMuted} text-xs`}>
              {showtimeData?.cinemaAddress || "N/A"}
            </Text>
          </View>

          {/* QR Code */}
          <View className="items-center py-2">
            <View className="bg-white p-2 rounded-lg">
              <QRCode
                value={generateBookingQRData(booking)}
                size={160}
                color={"#000000"}
                backgroundColor={"#FFFFFF"}
                logoSize={0}
                logoMargin={0}
                logoBorderRadius={0}
              />
            </View>
          </View>

          {/* Ticket Information Section */}
          <View className="space-y-2">
            <Text className={`${textColor} text-base font-black text-center`}>
              Thông tin vé
            </Text>
            <View className="space-y-1">
              <View className="flex-row justify-between">
                <Text className={`${textMuted} text-sm`}>Mã vé</Text>
                <Text className={`${textColor} text-sm font-medium`}>
                  {booking.id}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className={`${textMuted} text-sm`}>Ghế</Text>
                <Text className={`${textColor} text-sm font-medium`}>
                  {seatsData.map((s) => s.seatNumber).join(", ") || "N/A"}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className={`${textMuted} text-sm`}>Suất chiếu</Text>
                <Text className={`${textColor} text-sm font-medium`}>
                  {showtimeData?.startTime || "N/A"}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className={`${textMuted} text-sm`}>Phòng chiếu</Text>
                <Text className={`${textColor} text-sm font-medium`}>
                  {showtimeData?.roomName || "N/A"}
                </Text>
              </View>
            </View>
          </View>

          {/* Order Information Section */}
          <View className="space-y-2">
            <Text className={`${textColor} text-base font-black text-center`}>
              Thông tin đơn hàng
            </Text>
            <View className="space-y-1">
              {/* Seats grouped by type */}
              {Object.entries(seatsByType).map(([type, seats]) => {
                let seatCount = seats.length;
                let pricePerSeat = showtimeData?.showtimePrice || 0;

                // Add extra price based on seat type
                if (type === "VIP") {
                  pricePerSeat += showtimeData?.roomExtraPrices?.VIP || 0;
                } else if (type === "COUPLE") {
                  pricePerSeat += showtimeData?.roomExtraPrices?.COUPLE || 0;
                  seatCount = seats.length * 2;
                } else {
                  pricePerSeat += showtimeData?.roomExtraPrices?.NORMAL || 0;
                }

                const totalPrice = seatCount * pricePerSeat;

                return (
                  <View key={type} className="flex-row justify-between">
                    <Text className={`${textMuted} text-sm`}>
                      {seatCount} Ghế ({getSeatTypeName(type)})
                    </Text>
                    <Text className={`${textColor} text-sm font-medium`}>
                      {formatPrice(totalPrice)}
                    </Text>
                  </View>
                );
              })}

              {/* Food/Drinks */}
              {foodDrinksData.length > 0 &&
                foodDrinksData.map((fd, index) => (
                  <View key={index} className="flex-row justify-between">
                    <Text className={`${textMuted} text-sm`}>
                      {fd.quantity} {fd.name}
                    </Text>
                    <Text className={`${textColor} text-sm font-medium`}>
                      {formatPrice(fd.price)}
                    </Text>
                  </View>
                ))}

              {/* Total */}
              <View className={`border-t ${borderColor} pt-1 mt-2`}>
                <View className="flex-row justify-between font-bold">
                  <Text className={`${textColor} text-sm`}>Tổng</Text>
                  <Text className={`${textColor} text-sm`}>
                    {formatPrice(booking.totalPrice)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
