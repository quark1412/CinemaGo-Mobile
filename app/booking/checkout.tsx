import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { showtimeSelectionService } from "@/services/showtime-selection";
import { bookingService } from "@/services/booking";
import { paymentService } from "@/services/payment";
import { fooddrinkService, FoodDrink } from "@/services/fooddrink";
import { useToast } from "@/contexts/toastContext";

type PaymentMethod = "MOMO" | "VNPAY" | "ZALOPAY";

const TRANSACTION_TIMEOUT_MINUTES = 10;

export default function CheckoutScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { showtimeId, movieId, seats, seatIds, foodDrinks, totalPrice } =
    useLocalSearchParams<{
      showtimeId: string;
      movieId: string;
      seats: string;
      seatIds: string;
      foodDrinks: string;
      totalPrice: string;
    }>();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showtime, setShowtime] = useState<any>(null);
  const [movie, setMovie] = useState<any>(null);
  const [cinema, setCinema] = useState<any>(null);
  const [selectedFoodDrinks, setSelectedFoodDrinks] = useState<FoodDrink[]>([]);
  const [foodDrinkQuantities, setFoodDrinkQuantities] = useState<
    Record<string, number>
  >({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>("MOMO");
  const [timeRemaining, setTimeRemaining] = useState({
    minutes: TRANSACTION_TIMEOUT_MINUTES,
    seconds: 0,
  });
  const [bookingId, setBookingId] = useState<string | null>(null);

  const selectedSeats = seats ? JSON.parse(seats) : [];
  const foodDrinkData = foodDrinks ? JSON.parse(foodDrinks) : [];
  const totalAmount = totalPrice ? parseFloat(totalPrice) : 0;

  useEffect(() => {
    loadCheckoutData();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (bookingId) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev.seconds > 0) {
            return { ...prev, seconds: prev.seconds - 1 };
          } else if (prev.minutes > 0) {
            return { minutes: prev.minutes - 1, seconds: 59 };
          } else {
            clearInterval(interval);
            showToast("Giao dịch đã hết hạn", "error");
            router.back();
            return { minutes: 0, seconds: 0 };
          }
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [bookingId]);

  useEffect(() => {
    if (foodDrinkData.length > 0) {
      loadFoodDrinkDetails();
    }
  }, [foodDrinkData]);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);

      // Load showtime details
      const showtimeData =
        await showtimeSelectionService.getShowtimeById(showtimeId);
      setShowtime(showtimeData);

      // Load movie details
      const movieData = await showtimeSelectionService.getMovieDetails(movieId);
      setMovie(movieData);

      // Load cinema details
      if (showtimeData.cinemaId) {
        const cinemaData = await showtimeSelectionService.getCinemaDetails(
          showtimeData.cinemaId
        );
        setCinema(cinemaData);
      }

      // Create booking
      const seatIdsArray = seatIds ? JSON.parse(seatIds) : selectedSeats;
      const foodDrinks = foodDrinkData.map((fd: any) => ({
        id: fd.id,
        quantity: fd.quantity,
      }));

      const booking = await bookingService.createBooking(
        showtimeId,
        seatIdsArray,
        foodDrinks
      );
      setBookingId(booking.id);
    } catch (error: any) {
      showToast(error.message || "Failed to load checkout data", "error");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadFoodDrinkDetails = async () => {
    try {
      const foodDrinkIds = foodDrinkData.map((fd: any) => fd.id);
      const foodDrinksData =
        await fooddrinkService.getFoodDrinksByIds(foodDrinkIds);
      setSelectedFoodDrinks(foodDrinksData);

      // Set quantities
      const quantities: Record<string, number> = {};
      foodDrinkData.forEach((fd: any) => {
        quantities[fd.id] = fd.quantity;
      });
      setFoodDrinkQuantities(quantities);
    } catch (error: any) {
      console.error("Failed to load food drink details:", error);
    }
  };

  const handlePayment = async () => {
    if (!bookingId) {
      showToast("Đang xử lý đặt vé...", "error");
      return;
    }

    try {
      setProcessing(true);

      let paymentUrl: string;

      switch (selectedPaymentMethod) {
        case "MOMO":
          const momoResponse = await paymentService.checkoutWithMoMo(
            totalAmount,
            bookingId
          );
          paymentUrl = momoResponse.URL;
          break;
        case "VNPAY":
          const vnpayResponse = await paymentService.checkoutWithVnPay(
            totalAmount,
            bookingId
          );
          paymentUrl = vnpayResponse.URL;
          break;
        case "ZALOPAY":
          const zalopayResponse = await paymentService.checkoutWithZaloPay(
            totalAmount,
            bookingId
          );
          paymentUrl = zalopayResponse.URL;
          break;
        default:
          throw new Error("Invalid payment method");
      }

      const supported = await Linking.canOpenURL(paymentUrl);
      if (supported) {
        await Linking.openURL(paymentUrl);
        // router.push("/booking/success");
      } else {
        showToast("Không thể mở trang thanh toán", "error");
      }
    } catch (error: any) {
      showToast(error.message || "Failed to process payment", "error");
    } finally {
      setProcessing(false);
    }
  };

  const formatTime = (minutes: number, seconds: number) => {
    return {
      minutes: minutes.toString().padStart(2, "0"),
      seconds: seconds.toString().padStart(2, "0"),
    };
  };

  const ticketPrice = useMemo(() => {
    return (
      totalAmount -
      selectedFoodDrinks.reduce((sum, fd) => {
        const quantity = foodDrinkQuantities[fd.id] || 0;
        return sum + fd.price * quantity;
      }, 0)
    );
  }, [totalAmount, selectedFoodDrinks, foodDrinkQuantities]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#e11d48" />
          <Text className="text-slate-400 mt-4 text-base">Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const timeDisplay = formatTime(timeRemaining.minutes, timeRemaining.seconds);

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-800">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-white">Thanh toán</Text>
        <View className="w-6" />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Countdown Timer */}
        {bookingId && (
          <View className="px-4 py-4 border-b border-slate-800">
            <Text className="text-slate-400 text-sm text-center mb-3">
              Giao dịch sẽ hết hạn sau
            </Text>
            <View className="flex-row justify-center gap-3">
              <View className="bg-slate-800 rounded-xl px-6 py-4 items-center">
                <Text className="text-white text-3xl font-bold">
                  {timeDisplay.minutes}
                </Text>
                <Text className="text-slate-400 text-xs mt-1">Phút</Text>
              </View>
              <View className="bg-slate-800 rounded-xl px-6 py-4 items-center">
                <Text className="text-white text-3xl font-bold">
                  {timeDisplay.seconds}
                </Text>
                <Text className="text-slate-400 text-xs mt-1">Giây</Text>
              </View>
            </View>
          </View>
        )}

        {/* Movie and Order Details */}
        <View className="mx-4 mt-4 mb-4 bg-slate-800 rounded-xl p-4">
          <View className="flex-row">
            <View className="flex-1 mr-4">
              <Text className="text-white font-bold text-lg mb-2">
                {movie?.title}
              </Text>
              <Text className="text-slate-400 text-sm mb-1">
                {cinema?.name},{" "}
                {showtime &&
                  new Date(showtime.startTime).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                ,{" "}
                {showtime &&
                  new Date(showtime.startTime).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
              </Text>
            </View>
            {movie?.thumbnail && (
              <Image
                source={{ uri: movie.thumbnail }}
                className="w-20 h-28 rounded-lg"
                resizeMode="cover"
              />
            )}
          </View>

          <View className="mt-4 pt-4 border-t border-slate-700">
            <View className="flex-row justify-between mb-3">
              <Text className="text-slate-400 text-sm">Ghế đã chọn</Text>
              <Text className="text-white font-semibold">
                {selectedSeats.join(", ")}
              </Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-slate-400 text-sm">
                Vé xem phim ({selectedSeats.length})
              </Text>
              <Text className="text-white font-semibold">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(ticketPrice)}
              </Text>
            </View>
            {selectedFoodDrinks.map((fd) => {
              const quantity = foodDrinkQuantities[fd.id] || 0;
              if (quantity === 0) return null;
              return (
                <View key={fd.id} className="flex-row justify-between mb-3">
                  <Text className="text-slate-400 text-sm">
                    {fd.name} ({quantity})
                  </Text>
                  <Text className="text-white font-semibold">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(fd.price * quantity)}
                  </Text>
                </View>
              );
            })}
            <View className="flex-row justify-between mt-4 pt-4 border-t border-slate-700">
              <Text className="text-white font-bold text-lg">Tổng cộng</Text>
              <Text className="text-white font-bold text-xl">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(totalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Method Selection */}
        <View className="mx-4 mb-4">
          <Text className="text-white font-bold text-lg mb-4">
            Chọn phương thức thanh toán
          </Text>

          {/* MoMo */}
          <TouchableOpacity
            className={`flex-row items-center justify-between p-4 mb-3 rounded-xl border-2 ${
              selectedPaymentMethod === "MOMO"
                ? "bg-slate-800 border-red-600"
                : "bg-slate-800 border-slate-700"
            }`}
            onPress={() => setSelectedPaymentMethod("MOMO")}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-green-600 rounded-lg items-center justify-center">
                <Text className="text-white font-bold text-xs">MOMO</Text>
              </View>
              <Text className="text-white font-semibold">Ví MoMo</Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border-2 ${
                selectedPaymentMethod === "MOMO"
                  ? "border-red-600 bg-red-600"
                  : "border-slate-600"
              }`}
            >
              {selectedPaymentMethod === "MOMO" && (
                <View className="w-full h-full rounded-full bg-red-600" />
              )}
            </View>
          </TouchableOpacity>

          {/* Credit/Debit Card */}
          <TouchableOpacity
            className={`flex-row items-center justify-between p-4 mb-3 rounded-xl border-2 ${
              selectedPaymentMethod === "VNPAY"
                ? "bg-slate-800 border-red-600"
                : "bg-slate-800 border-slate-700"
            }`}
            onPress={() => setSelectedPaymentMethod("VNPAY")}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-slate-600 rounded-lg items-center justify-center">
                <Ionicons name="card" size={20} color="#fff" />
              </View>
              <Text className="text-white font-semibold">
                Thẻ Tín dụng / Ghi nợ
              </Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border-2 ${
                selectedPaymentMethod === "VNPAY"
                  ? "border-red-600 bg-red-600"
                  : "border-slate-600"
              }`}
            >
              {selectedPaymentMethod === "VNPAY" && (
                <View className="w-full h-full rounded-full bg-red-600" />
              )}
            </View>
          </TouchableOpacity>

          {/* ZaloPay */}
          <TouchableOpacity
            className={`flex-row items-center justify-between p-4 mb-3 rounded-xl border-2 ${
              selectedPaymentMethod === "ZALOPAY"
                ? "bg-slate-800 border-red-600"
                : "bg-slate-800 border-slate-700"
            }`}
            onPress={() => setSelectedPaymentMethod("ZALOPAY")}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-teal-500 rounded-lg items-center justify-center">
                <Text className="text-white font-bold text-xs">zab</Text>
              </View>
              <Text className="text-white font-semibold">Ví ZaloPay</Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border-2 ${
                selectedPaymentMethod === "ZALOPAY"
                  ? "border-red-600 bg-red-600"
                  : "border-slate-600"
              }`}
            >
              {selectedPaymentMethod === "ZALOPAY" && (
                <View className="w-full h-full rounded-full bg-red-600" />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Payment Button */}
      <View className="px-4 pb-5 pt-3 bg-slate-900 border-t border-slate-800">
        <TouchableOpacity
          className={`py-4 rounded-xl items-center ${
            processing ? "bg-slate-700 opacity-50" : "bg-red-600"
          }`}
          onPress={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">
              Thanh Toán{" "}
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(totalAmount)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
