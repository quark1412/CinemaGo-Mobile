import React, { useEffect, useState, useRef } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "@/contexts/themeContext";
import { paymentService } from "@/services/payment";
import { bookingService } from "@/services/booking";
import { useToast } from "@/contexts/toastContext";
import { useUser } from "@/contexts/userContext";
import { notificationService } from "@/services/notification";
import { generateTicketHTML } from "@/utils/ticketHtmlGenerator";
import { showtimeSelectionService } from "@/services/showtime-selection";
import { fooddrinkService } from "@/services/fooddrink";
import { formatDate } from "@/utils/dayUtils";

type Status = "pending" | "success" | "failed";
type PaymentMethod = "COD" | "MOMO" | "VNPAY" | "ZALOPAY";

export default function BookingSuccessScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const { user } = useUser();
  const params = useLocalSearchParams<{
    bookingId?: string;
    amount?: string;
    method?: PaymentMethod;
  }>();

  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState<string>(
    "Đang kiểm tra trạng thái thanh toán..."
  );
  const [bookingId, setBookingId] = useState<string | null>(
    params.bookingId ?? null
  );
  const [amount, setAmount] = useState<number | null>(
    params.amount ? Number(params.amount) : null
  );
  const emailSentRef = useRef<Set<string>>(new Set());

  const bgColor = isDark ? "bg-slate-950" : "bg-white";
  const cardBg = isDark ? "bg-slate-900" : "bg-slate-50";
  const textColor = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-slate-400" : "text-slate-600";
  const successColor = "#22c55e";
  const errorColor = "#ef4444";

  const sendBookingEmail = async (booking: any) => {
    if (!user?.email) {
      showToast("Email không khả dụng, không thể gửi email xác nhận", "error");
      return;
    }

    if (emailSentRef.current.has(booking.id)) {
      showToast(
        "Email xác nhận đã được gửi cho đặt vé này, không thể gửi lại",
        "error"
      );
      return;
    }

    try {
      // Fetch all ticket data
      const showtimeDetails = await showtimeSelectionService.getShowtimeById(
        booking.showtimeId
      );

      const [movieDetails, cinemaDetails, roomDetails] = await Promise.all([
        showtimeSelectionService
          .getMovieDetails(showtimeDetails.movieId)
          .catch(() => null),
        showtimeSelectionService
          .getCinemaDetails(showtimeDetails.cinemaId)
          .catch(() => null),
        showtimeSelectionService
          .getRoomById(showtimeDetails.roomId)
          .catch(() => null),
      ]);

      // Format start time
      const startTimeDate = new Date(showtimeDetails.startTime);
      const formattedStartTime = startTimeDate.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const formattedShowtime = `${formattedStartTime} ${formatDate(startTimeDate)}`;

      // Get seat data
      const seatMap = new Map<string, any>();
      if (roomDetails?.seats && Array.isArray(roomDetails.seats)) {
        roomDetails.seats.forEach((seat: any) => {
          seatMap.set(seat.id, seat);
        });
      }

      const seatsData =
        booking.bookingSeats?.map((bookingSeat: any) => {
          const seatData = seatMap.get(bookingSeat.seatId);
          if (seatData) {
            const rowMatch = seatData.seatNumber?.match(/^([A-Z])/i);
            const row = rowMatch ? rowMatch[1].toUpperCase() : "A";
            return {
              id: bookingSeat.seatId,
              seatNumber: seatData.seatNumber || bookingSeat.seatId,
              row,
              type: seatData.seatType || "NORMAL",
              extraPrice: seatData.extraPrice || 0,
            };
          }
          return undefined;
        }) || [];

      // Get food/drinks data
      const foodDrinksData: Array<{
        name: string;
        quantity: number;
        price: number;
      }> = [];
      if (booking.bookingFoodDrinks && booking.bookingFoodDrinks.length > 0) {
        try {
          const foodDrinkIds = booking.bookingFoodDrinks.map(
            (bfd: any) => bfd.foodDrinkId
          );
          const foodDrinks =
            await fooddrinkService.getFoodDrinksByIds(foodDrinkIds);

          booking.bookingFoodDrinks.forEach((bfd: any) => {
            const foodDrink = foodDrinks.find(
              (fd) => fd.id === bfd.foodDrinkId
            );
            foodDrinksData.push({
              name: foodDrink?.name || "N/A",
              quantity: bfd.quantity,
              price: bfd.totalPrice,
            });
          });
        } catch (error) {
          console.warn("Failed to fetch food drinks for email:", error);
        }
      }

      // Calculate seats price
      const foodDrinksTotal = foodDrinksData.reduce(
        (sum, fd) => sum + fd.price,
        0
      );
      const seatsPrice = booking.totalPrice - foodDrinksTotal;

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

      const ticketHTML = await generateTicketHTML({
        movieTitle: movieDetails?.title || "N/A",
        cinemaName: cinemaDetails?.name || "N/A",
        cinemaAddress: cinemaDetails?.address || "N/A",
        roomName: roomDetails?.name || "N/A",
        date: formatDate(startTimeDate),
        startTime: formattedShowtime,
        seatsData: seatsData.filter(Boolean) as any,
        foodDrinks: foodDrinksData,
        seatsPrice,
        showtimePrice: showtimeDetails.price || 0,
        totalPrice: booking.totalPrice,
        bookingId: booking.id,
        roomExtraPrices,
      });

      // Send email
      await notificationService.sendEmail({
        to: user.email,
        subject: `Xác nhận đặt vé - ${movieDetails?.title || "CinemaGo"}`,
        html: ticketHTML,
      });

      // Mark email as sent for this booking
      emailSentRef.current.add(booking.id);
      showToast("Email xác nhận đặt vé đã được gửi thành công", "success");
    } catch (error: any) {
      console.log("Failed to send booking email:", error);
      console.log("Error details:", {
        message: error?.message,
        response: error?.response?.data,
        stack: error?.stack,
      });
      showToast(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể gửi email xác nhận. Vui lòng thử lại sau.",
        "error"
      );
    }
  };

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (params.method === "COD") {
        setStatus("success");
        setMessage(
          "Đặt vé thành công. Vui lòng thanh toán tại quầy trước khi vào rạp."
        );

        const resolvedBookingId =
          (typeof params.bookingId === "string" && params.bookingId) ||
          (await AsyncStorage.getItem("bookingId"));
        if (resolvedBookingId) {
          try {
            const booking =
              await bookingService.getBookingById(resolvedBookingId);
            sendBookingEmail(booking);
          } catch (error) {}
        }
        return;
      }

      try {
        const resolvedBookingId =
          (typeof params.bookingId === "string" && params.bookingId) ||
          (await AsyncStorage.getItem("bookingId"));

        if (!resolvedBookingId) {
          setStatus("failed");
          setMessage("Không tìm thấy thông tin thanh toán.");
          return;
        }

        setBookingId(resolvedBookingId);

        if (!amount) {
          const storedAmount = await AsyncStorage.getItem("paymentAmount");
          if (storedAmount) {
            setAmount(Number(storedAmount));
          }
        }

        try {
          const booking =
            await bookingService.getBookingById(resolvedBookingId);
          if ((booking as any)?.status === "Đã thanh toán") {
            setStatus("success");

            if (params.method === "MOMO") {
              setMessage(
                "Thanh toán MoMo thành công. Đặt vé của bạn đã được xác nhận."
              );
            } else if (params.method === "VNPAY") {
              setMessage(
                "Thanh toán VNPAY thành công. Đặt vé của bạn đã được xác nhận."
              );
            } else if (params.method === "ZALOPAY") {
              setMessage(
                "Thanh toán ZaloPay thành công. Đặt vé của bạn đã được xác nhận."
              );
            } else {
              setMessage("Thanh toán và đặt vé thành công!");
            }

            setAmount(booking.totalPrice ?? amount ?? null);
            await AsyncStorage.multiRemove(["bookingId", "paymentAmount"]);

            // Send email notification
            sendBookingEmail(booking);
            return;
          }
        } catch (err) {
          console.warn("Cannot fetch booking before payment check", err);
        }

        if (params.method === "MOMO") {
          try {
            await paymentService.checkMoMoStatus(resolvedBookingId);

            const updatedBooking =
              await bookingService.getBookingById(resolvedBookingId);
            setAmount(updatedBooking.totalPrice ?? null);

            setStatus("success");
            setMessage(
              "Thanh toán MoMo thành công. Đặt vé của bạn đã được xác nhận."
            );

            await AsyncStorage.multiRemove(["bookingId", "paymentAmount"]);

            // Send email notification
            sendBookingEmail(updatedBooking);
          } catch (error: any) {
            setStatus("failed");
            setMessage("Thanh toán không thành công hoặc đã bị hủy.");
          }
          return;
        }

        if (params.method === "ZALOPAY") {
          try {
            await paymentService.checkZaloPayStatus(resolvedBookingId);

            const updatedBooking =
              await bookingService.getBookingById(resolvedBookingId);
            setAmount(updatedBooking.totalPrice ?? null);

            setStatus("success");
            setMessage(
              "Thanh toán ZaloPay thành công. Đặt vé của bạn đã được xác nhận."
            );

            await AsyncStorage.multiRemove(["bookingId", "paymentAmount"]);

            // Send email notification
            sendBookingEmail(updatedBooking);
          } catch (error: any) {
            setStatus("failed");
            setMessage("Thanh toán không thành công hoặc đã bị hủy.");
          }
          return;
        }
      } catch (error: any) {
        console.log("Error while checking payment status:", error);
        showToast(
          error?.message || "Không thể kiểm tra trạng thái thanh toán",
          "error"
        );
        setStatus("failed");
        setMessage("Đã xảy ra lỗi khi kiểm tra thanh toán.");
      }
    };

    checkPaymentStatus();
  }, [params.method, params.bookingId, amount]);

  const handleGoHome = () => {
    router.push("/(app)/(tabs)/home");
  };

  const handleViewTickets = () => {
    router.push("/screens/my-tickets");
  };

  const renderIcon = () => {
    if (status === "pending") {
      return <ActivityIndicator size="large" color="#3b82f6" />;
    }

    if (status === "success") {
      return (
        <Ionicons name="checkmark-circle" size={56} color={successColor} />
      );
    }

    return <Ionicons name="close-circle" size={56} color={errorColor} />;
  };

  return (
    <SafeAreaView
      className={`flex-1 items-center justify-center px-6 ${bgColor}`}
    >
      <View className={`w-full max-w-md rounded-2xl p-6 ${cardBg}`}>
        <View className="items-center mb-4">{renderIcon()}</View>

        <Text className={`text-xl font-[bold] text-center mb-2 ${textColor}`}>
          {status === "pending"
            ? "Đang xử lý thanh toán..."
            : status === "success"
              ? "Thanh toán và đặt vé thành công!"
              : "Thanh toán không thành công"}
        </Text>

        <Text className={`text-center mb-4 ${textMuted}`}>{message}</Text>

        {(bookingId || amount != null) && (
          <View className="mt-2 mb-4 rounded-xl bg-slate-800/5 dark:bg-slate-800/40 px-4 py-3">
            {bookingId && (
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs font-[medium] text-slate-500 dark:text-slate-400">
                  Mã đặt vé
                </Text>
                <Text className="text-xs font-mono text-slate-700 dark:text-slate-200">
                  {bookingId.slice(0, 8)}...{bookingId.slice(-4)}
                </Text>
              </View>
            )}
            {amount != null && (
              <View className="flex-row justify-between mt-1">
                <Text className="text-xs font-[medium] text-slate-500 dark:text-slate-400">
                  Số tiền
                </Text>
                <Text className="text-xs font-[semibold] text-slate-900 dark:text-slate-100">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(amount)}
                </Text>
              </View>
            )}
          </View>
        )}

        <View className="flex-row justify-center gap-3 mt-2">
          <TouchableOpacity
            className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-600 items-center"
            onPress={handleGoHome}
          >
            <Text className={`${textColor} font-[semibold]`}>Về trang chủ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-3 rounded-xl bg-red-600 items-center"
            onPress={handleViewTickets}
          >
            <Text className="text-white font-[semibold]">Xem vé của tôi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
