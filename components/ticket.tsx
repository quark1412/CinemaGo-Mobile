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
            const isCoupleSeat = seatData.seatType === "COUPLE" || false;

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

  // Format seat numbers for display (group couple seats)
  const formatSeatNumbers = () => {
    if (!seatsData || seatsData.length === 0) return "N/A";

    const coupleSeats = seatsData.filter(
      (seat) => seat.type === "COUPLE" || seat.isCoupleSeat
    );
    const regularSeats = seatsData.filter(
      (seat) => seat.type !== "COUPLE" && !seat.isCoupleSeat
    );

    const processedSeatIds = new Set<string>();
    const seatNumbers: string[] = [];

    // Process couple seats - group adjacent ones
    coupleSeats.forEach((seat) => {
      if (processedSeatIds.has(seat.id)) return;

      const rowMatch = seat.seatNumber.match(/^([A-Z])(\d+)$/);
      if (!rowMatch) {
        seatNumbers.push(seat.seatNumber);
        processedSeatIds.add(seat.id);
        return;
      }

      const rowLetter = rowMatch[1];
      const seatNum = parseInt(rowMatch[2]);

      // Find adjacent couple seat
      const adjacentSeat = coupleSeats.find((s) => {
        if (s.id === seat.id || processedSeatIds.has(s.id)) return false;
        const sRowMatch = s.seatNumber.match(/^([A-Z])(\d+)$/);
        if (!sRowMatch) return false;
        return (
          sRowMatch[1] === rowLetter &&
          (parseInt(sRowMatch[2]) === seatNum + 1 ||
            parseInt(sRowMatch[2]) === seatNum - 1)
        );
      });

      if (adjacentSeat) {
        // Group as couple seat number
        const minNum = Math.min(
          seatNum,
          parseInt(adjacentSeat.seatNumber.match(/^([A-Z])(\d+)$/)![2])
        );
        const maxNum = Math.max(
          seatNum,
          parseInt(adjacentSeat.seatNumber.match(/^([A-Z])(\d+)$/)![2])
        );
        seatNumbers.push(`${rowLetter}${minNum}-${maxNum}`);
        processedSeatIds.add(seat.id);
        processedSeatIds.add(adjacentSeat.id);
      } else {
        seatNumbers.push(seat.seatNumber);
        processedSeatIds.add(seat.id);
      }
    });

    // Add regular seats
    regularSeats.forEach((seat) => {
      seatNumbers.push(seat.seatNumber);
    });

    return seatNumbers.join(", ");
  };

  // Group seats by type and track couple pairs
  const groupSeatsByType = () => {
    console.log("seatsData", seatsData);
    if (!seatsData || seatsData.length === 0) return {};

    const seatsByType: Record<string, SeatData[]> = {};
    const processedSeatIds = new Set<string>();

    // First, group couple seats together
    const coupleSeats = seatsData.filter(
      (seat) => seat.type === "COUPLE" || seat.isCoupleSeat
    );

    // Group adjacent couple seats
    coupleSeats.forEach((seat) => {
      if (processedSeatIds.has(seat.id)) return;

      // Find adjacent couple seat in the same row
      const rowMatch = seat.seatNumber.match(/^([A-Z])(\d+)$/);
      if (!rowMatch) {
        if (!seatsByType["COUPLE"]) {
          seatsByType["COUPLE"] = [];
        }
        seatsByType["COUPLE"].push(seat);
        processedSeatIds.add(seat.id);
        return;
      }

      const rowLetter = rowMatch[1];
      const seatNum = parseInt(rowMatch[2]);

      // Look for adjacent couple seat
      const adjacentSeat = coupleSeats.find((s) => {
        if (s.id === seat.id || processedSeatIds.has(s.id)) return false;
        const sRowMatch = s.seatNumber.match(/^([A-Z])(\d+)$/);
        if (!sRowMatch) return false;
        return (
          sRowMatch[1] === rowLetter &&
          (parseInt(sRowMatch[2]) === seatNum + 1 ||
            parseInt(sRowMatch[2]) === seatNum - 1)
        );
      });

      if (adjacentSeat) {
        // Found adjacent couple seat
        const adjRowMatch = adjacentSeat.seatNumber.match(/^([A-Z])(\d+)$/);
        const adjSeatNum = adjRowMatch ? parseInt(adjRowMatch[2]) : seatNum;
        const minNum = Math.min(seatNum, adjSeatNum);
        const maxNum = Math.max(seatNum, adjSeatNum);

        const couplePair: SeatData = {
          ...seat,
          seatNumber: `${rowLetter}${minNum}-${maxNum}`,
        };

        if (!seatsByType["COUPLE"]) {
          seatsByType["COUPLE"] = [];
        }
        seatsByType["COUPLE"].push(couplePair);
        processedSeatIds.add(seat.id);
        processedSeatIds.add(adjacentSeat.id);
      } else {
        if (!seatsByType["COUPLE"]) {
          seatsByType["COUPLE"] = [];
        }
        seatsByType["COUPLE"].push(seat);
        processedSeatIds.add(seat.id);
      }
    });

    // Add regular seats
    seatsData.forEach((seat) => {
      if (processedSeatIds.has(seat.id)) return;

      const type = seat.type || "NORMAL";
      if (!seatsByType[type]) {
        seatsByType[type] = [];
      }
      seatsByType[type].push(seat);
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
          <View className="items-center py-2 my-4">
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
                  {formatSeatNumbers()}
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
          <View className="space-y-2 mt-4">
            <Text className={`${textColor} text-base font-black text-center`}>
              Thông tin đơn hàng
            </Text>
            <View className="space-y-1">
              {/* Seats grouped by type */}
              {Object.entries(seatsByType).map(([type, seats]) => {
                const basePrice = showtimeData?.showtimePrice || 0;

                const seatCount = seats.length;

                // Calculate total price
                const totalPrice = seats.reduce((sum, seat: SeatData) => {
                  if (type === "COUPLE" && seat.seatNumber.includes("-")) {
                    const match = seat.seatNumber.match(/^([A-Z])(\d+)-(\d+)$/);
                    if (match) {
                      const rowLetter = match[1];
                      const startNum = parseInt(match[2]);
                      const endNum = parseInt(match[3]);

                      const pairSeats = seatsData.filter((s) => {
                        const sMatch = s.seatNumber.match(/^([A-Z])(\d+)$/);
                        if (!sMatch) return false;
                        return (
                          sMatch[1] === rowLetter &&
                          parseInt(sMatch[2]) >= startNum &&
                          parseInt(sMatch[2]) <= endNum
                        );
                      });

                      // Sum price for both seats in the pair
                      return (
                        sum +
                        pairSeats.reduce((pairSum, pairSeat) => {
                          const extra = pairSeat?.extraPrice || 0;
                          return pairSum + (basePrice + extra);
                        }, 0)
                      );
                    }
                  }

                  // Regular seat or individual couple seat
                  const extra = seat?.extraPrice || 0;
                  return sum + (basePrice + extra);
                }, 0);

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
