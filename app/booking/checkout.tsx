import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  AppState,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { showtimeSelectionService } from "@/services/showtime-selection";
import { bookingService } from "@/services/booking";
import { paymentService } from "@/services/payment";
import { fooddrinkService, FoodDrink } from "@/services/fooddrink";
import { useToast } from "@/contexts/toastContext";
import { useTheme } from "@/contexts/themeContext";
import * as DeepLinking from "expo-linking";

type PaymentMethod = "COD" | "MOMO" | "ZALOPAY";

export default function CheckoutScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const {
    showtimeId,
    movieId,
    seats,
    seatIds,
    seatDetails,
    foodDrinks,
    totalPrice,
  } = useLocalSearchParams<{
    showtimeId: string;
    movieId: string;
    seats: string;
    seatIds: string;
    seatDetails: string;
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
    useState<PaymentMethod>("COD");
  const appStateRef = useRef(AppState.currentState);
  const waitingForMoMoReturnRef = useRef(false);

  const selectedSeats = seats ? JSON.parse(seats) : [];
  const seatDetailsData = seatDetails ? JSON.parse(seatDetails) : [];
  const foodDrinkData = foodDrinks ? JSON.parse(foodDrinks) : [];

  useEffect(() => {
    loadCheckoutData();
  }, []);

  useEffect(() => {
    if (foodDrinkData.length > 0) {
      loadFoodDrinkDetails();
    }
  }, [foodDrinkData]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      appStateRef.current = nextAppState;

      if (
        wasBackground &&
        nextAppState === "active" &&
        waitingForMoMoReturnRef.current
      ) {
        waitingForMoMoReturnRef.current = false;

        (async () => {
          try {
            const [storedBookingId, storedAmount] = await Promise.all([
              AsyncStorage.getItem("bookingId"),
              AsyncStorage.getItem("paymentAmount"),
            ]);

            router.push({
              pathname: "/booking/success",
              params: {
                method: "MOMO",
                bookingId: storedBookingId ?? "",
                amount: storedAmount ?? "",
              },
            } as any);
          } catch (error) {
            console.warn("Failed to restore MoMo return state", error);
          }
        })();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

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
    } catch (error: any) {}
  };

  const handlePayment = async () => {
    if (!showtime || selectedSeats.length === 0) {
      showToast("Vui lòng chọn ghế", "error");
      return;
    }

    try {
      setProcessing(true);

      // Create booking
      const seatIdsArray = seatIds ? JSON.parse(seatIds) : [];

      // Validate seatIds
      if (!seatIdsArray || seatIdsArray.length === 0) {
        showToast("Vui lòng chọn ghế", "error");
        setProcessing(false);
        return;
      }

      // Filter out any invalid seat IDs
      const validSeatIds = seatIdsArray.filter(
        (id: any) => id && typeof id === "string" && id.trim() !== ""
      );

      if (validSeatIds.length === 0) {
        showToast("Không có ghế hợp lệ để đặt", "error");
        setProcessing(false);
        return;
      }

      try {
        await Promise.all(
          validSeatIds.map((seatId: string) =>
            bookingService
              .holdSeat({
                showtimeId,
                seatId,
              })
              .catch((error: any) => {
                if (error.response?.status !== 409) {
                  console.warn("Failed to re-hold seat:", seatId, error);
                }
              })
          )
        );
      } catch (error) {
        console.warn("Error re-holding seats:", error);
      }

      const foodDrinksData =
        foodDrinkData.length > 0
          ? foodDrinkData.map((fd: any) => ({
              foodDrinkId: fd.id,
              quantity: fd.quantity,
            }))
          : [];

      console.log("Creating booking with:", {
        showtimeId,
        seatIds: validSeatIds,
        foodDrinks: foodDrinksData,
      });

      const bookingResponse = await bookingService.createBooking({
        showtimeId,
        seatIds: validSeatIds,
        foodDrinks: foodDrinksData.length > 0 ? foodDrinksData : [],
      });

      const booking = bookingResponse.data;

      switch (selectedPaymentMethod) {
        case "COD": {
          router.push({
            pathname: "/booking/success",
            params: {
              bookingId: booking.id,
              amount: totalAmount.toString(),
              method: "COD",
            },
          } as any);
          return;
        }
        case "MOMO": {
          const redirectUrl = DeepLinking.createURL("booking/success");
          const momoResponse = await paymentService.checkoutWithMoMo(
            totalAmount,
            booking.id,
            redirectUrl
          );

          const paymentUrl = momoResponse.URL;

          // Persist identifiers for the booking completed screen
          try {
            await AsyncStorage.multiSet([
              ["bookingId", booking.id],
              ["paymentAmount", totalAmount.toString()],
            ]);
          } catch (storageError) {
            console.warn("Failed to persist payment identifiers", storageError);
          }

          const supported = await Linking.canOpenURL(paymentUrl);
          if (supported) {
            waitingForMoMoReturnRef.current = true;
            await Linking.openURL(paymentUrl);
          } else {
            showToast("Không thể mở trang thanh toán", "error");
            waitingForMoMoReturnRef.current = false;
          }
          return;
        }
        case "ZALOPAY": {
          const redirectUrl = DeepLinking.createURL("booking/success");
          const zaloResponse = await paymentService.checkoutWithZaloPay(
            totalAmount,
            booking.id,
            redirectUrl
          );

          const paymentUrl = zaloResponse.URL;

          if (!paymentUrl) {
            showToast("Không thể tạo liên kết thanh toán ZaloPay", "error");
            return;
          }

          // Persist identifiers for the booking completed screen
          try {
            await AsyncStorage.multiSet([
              ["bookingId", booking.id],
              ["paymentAmount", totalAmount.toString()],
            ]);
          } catch (storageError) {
            console.warn("Failed to persist payment identifiers", storageError);
          }

          const supported = await Linking.canOpenURL(paymentUrl);
          if (supported) {
            await Linking.openURL(paymentUrl);
          } else {
            showToast("Không thể mở trang thanh toán ZaloPay", "error");
          }
          return;
        }
      }
    } catch (error: any) {
      showToast(
        error.response?.data?.message ||
          error.message ||
          "Failed to process payment",
        "error"
      );
    } finally {
      setProcessing(false);
    }
  };

  // Calculate ticket price with extraPrice for VIP and couple seats
  const ticketPrice = useMemo(() => {
    if (!showtime) return 0;

    const basePrice = showtime.price || 0;
    let totalSeatPrice = 0;

    seatDetailsData.forEach((seat: any) => {
      const seatPrice = basePrice + (seat.extraPrice || 0);
      // For couple seats, add extraPrice to each seat
      if (seat.isCoupleSeat) {
        totalSeatPrice += seatPrice * 2;
      } else {
        totalSeatPrice += seatPrice;
      }
    });

    return totalSeatPrice;
  }, [showtime, seatDetailsData]);

  // Calculate food/drinks total
  const foodDrinksTotal = useMemo(() => {
    return selectedFoodDrinks.reduce((sum, fd) => {
      const quantity = foodDrinkQuantities[fd.id] || 0;
      return sum + fd.price * quantity;
    }, 0);
  }, [selectedFoodDrinks, foodDrinkQuantities]);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return ticketPrice + foodDrinksTotal;
  }, [ticketPrice, foodDrinksTotal]);

  const bgColor = isDark ? "bg-slate-950" : "bg-white";
  const cardBg = isDark ? "bg-slate-800" : "bg-slate-100";
  const cardBgSecondary = isDark ? "bg-slate-900" : "bg-slate-50";
  const borderColor = isDark ? "border-slate-800" : "border-slate-200";
  const borderColorLight = isDark ? "border-slate-700" : "border-slate-300";
  const textColor = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-slate-400" : "text-slate-600";
  const iconColor = isDark ? "#fff" : "#0f172a";

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${bgColor}`}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#e11d48" />
          <Text className={`${textMuted} mt-4 text-base`}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`} edges={["top"]}>
      {/* Header */}
      <View
        className={`flex-row items-center justify-between px-4 py-4 border-b ${borderColor}`}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </TouchableOpacity>
        <Text className={`text-lg font-[semibold] ${textColor}`}>
          Thanh toán
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Movie and Order Details */}
        <View className={`mx-4 mt-4 mb-4 ${cardBg} rounded-xl p-4`}>
          <View className="flex-row">
            <View className="flex-1 mr-4">
              <Text className={`${textColor} font-[bold] text-lg mb-2`}>
                {movie?.title}
              </Text>
              <Text className={`${textMuted} text-sm mb-1`}>
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

          <View className={`mt-4 pt-4 border-t ${borderColorLight}`}>
            <View className="flex-row justify-between mb-3">
              <Text className={`${textMuted} text-sm`}>Ghế đã chọn</Text>
              <Text className={`${textColor} font-[semibold]`}>
                {selectedSeats.join(", ")}
              </Text>
            </View>

            {/* Seat breakdown with extraPrice */}
            {seatDetailsData.length > 0 && showtime && (
              <>
                {seatDetailsData.map((seat: any, index: number) => {
                  const basePrice = showtime.price || 0;
                  const extraPrice = seat.extraPrice || 0;
                  const isCouple = seat.isCoupleSeat;

                  const seatPricePerSeat = basePrice + extraPrice;
                  const totalSeatPrice = isCouple
                    ? seatPricePerSeat * 2
                    : seatPricePerSeat;

                  return (
                    <View key={index} className="mb-2">
                      <View className="flex-row justify-between mb-1">
                        <Text className={`${textMuted} text-sm`}>
                          Ghế {seat.seatNumber}
                          {seat.type === "VIP" && " (VIP)"}
                          {isCouple && " (Đôi - 2 ghế)"}
                        </Text>
                        <Text
                          className={`${textColor} font-[semibold] text-sm`}
                        >
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(totalSeatPrice)}
                        </Text>
                      </View>
                      {isCouple ? (
                        <>
                          <View className="flex-row justify-between ml-4 mb-1">
                            <Text className={`${textMuted} text-xs`}>
                              - Giá vé/ghế:{" "}
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(basePrice)}{" "}
                              x 2
                            </Text>
                            <Text className={`${textMuted} text-xs`}>
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(basePrice * 2)}
                            </Text>
                          </View>
                          {extraPrice > 0 && (
                            <View className="flex-row justify-between ml-4 mb-1">
                              <Text className={`${textMuted} text-xs`}>
                                - Phụ thu/ghế:{" "}
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(extraPrice)}{" "}
                                x 2
                              </Text>
                              <Text className={`${textMuted} text-xs`}>
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(extraPrice * 2)}
                              </Text>
                            </View>
                          )}
                        </>
                      ) : (
                        <>
                          <View className="flex-row justify-between ml-4 mb-1">
                            <Text className={`${textMuted} text-xs`}>
                              - Giá vé:{" "}
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(basePrice)}
                            </Text>
                          </View>
                          {extraPrice > 0 && (
                            <View className="flex-row justify-between ml-4 mb-1">
                              <Text className={`${textMuted} text-xs`}>
                                - Phụ thu:{" "}
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(extraPrice)}
                              </Text>
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  );
                })}
                <View className="flex-row justify-between mt-2 mb-3 pt-2 border-t border-slate-600/30">
                  <Text className={`${textMuted} text-sm`}>
                    Tổng vé xem phim ({selectedSeats.length})
                  </Text>
                  <Text className={`${textColor} font-[semibold]`}>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(ticketPrice)}
                  </Text>
                </View>
              </>
            )}

            {/* Food/Drinks section */}
            {selectedFoodDrinks.length > 0 && foodDrinkQuantities && (
              <View className="mb-3 pt-2 border-t border-slate-600/30">
                <Text className={`${textMuted} text-sm mb-2 font-[semibold]`}>
                  Bắp nước
                </Text>
                {selectedFoodDrinks.map((fd) => {
                  const quantity = foodDrinkQuantities[fd.id] || 0;
                  if (quantity === 0) return null;
                  return (
                    <View key={fd.id} className="flex-row items-center mb-2">
                      <Image
                        source={{ uri: fd.image }}
                        className="w-12 h-12 rounded-lg mr-3"
                        resizeMode="cover"
                      />
                      <View className="flex-1">
                        <Text className={`${textColor} text-sm font-[medium]`}>
                          {fd.name}
                        </Text>
                        <Text className={`${textMuted} text-xs`}>
                          {quantity} x{" "}
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(fd.price)}
                        </Text>
                      </View>
                      <Text className={`${textColor} font-[semibold]`}>
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(fd.price * quantity)}
                      </Text>
                    </View>
                  );
                })}
                <View className="flex-row justify-between mt-2 pt-2 border-t border-slate-600/30">
                  <Text className={`${textMuted} text-sm`}>Tổng bắp nước</Text>
                  <Text className={`${textColor} font-[semibold]`}>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(foodDrinksTotal)}
                  </Text>
                </View>
              </View>
            )}

            <View
              className={`flex-row justify-between mt-4 pt-4 border-t ${borderColorLight}`}
            >
              <Text className={`${textColor} font-[bold] text-lg`}>
                Tổng cộng
              </Text>
              <Text className={`${textColor} font-[bold] text-xl`}>
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
          <Text className={`${textColor} font-[bold] text-lg mb-4`}>
            Chọn phương thức thanh toán
          </Text>

          {/* COD */}
          <TouchableOpacity
            className={`flex-row items-center justify-between p-4 mb-3 rounded-xl border-2 ${
              selectedPaymentMethod === "COD"
                ? `${cardBg} border-red-600`
                : `${cardBg} ${isDark ? "border-slate-700" : "border-slate-300"}`
            }`}
            onPress={() => setSelectedPaymentMethod("COD")}
          >
            <View className="flex-row items-center gap-3">
              <View
                className={`w-10 h-10 ${
                  isDark ? "bg-slate-700" : "bg-slate-400"
                } rounded-lg items-center justify-center`}
              >
                <Ionicons name="cash-outline" size={20} color="#fff" />
              </View>
              <View>
                <Text className={`${textColor} font-[semibold]`}>
                  Thanh toán tại quầy (COD)
                </Text>
                <Text className={`${textMuted} text-xs mt-1`}>
                  Thanh toán trực tiếp tại rạp
                </Text>
              </View>
            </View>
            <View
              className={`w-5 h-5 rounded-full border-2 ${
                selectedPaymentMethod === "COD"
                  ? "border-red-600 bg-red-600"
                  : isDark
                    ? "border-slate-600"
                    : "border-slate-400"
              }`}
            >
              {selectedPaymentMethod === "COD" && (
                <View className="w-full h-full rounded-full bg-red-600" />
              )}
            </View>
          </TouchableOpacity>

          {/* MoMo */}
          <TouchableOpacity
            className={`flex-row items-center justify-between p-4 mb-3 rounded-xl border-2 ${
              selectedPaymentMethod === "MOMO"
                ? `${cardBg} border-red-600`
                : `${cardBg} ${isDark ? "border-slate-700" : "border-slate-300"}`
            }`}
            onPress={() => setSelectedPaymentMethod("MOMO")}
          >
            <View className="flex-row items-center gap-3">
              <Image
                source={require("@/assets/images/momo_icon.png")}
                className="w-10 h-10 rounded-lg"
                resizeMode="cover"
              />
              <View>
                <Text className={`${textColor} font-[semibold]`}>Ví MoMo</Text>
                <Text className={`${textMuted} text-xs mt-1`}>
                  Thanh toán nhanh qua ứng dụng MoMo
                </Text>
              </View>
            </View>
            <View
              className={`w-5 h-5 rounded-full border-2 ${
                selectedPaymentMethod === "MOMO"
                  ? "border-red-600 bg-red-600"
                  : isDark
                    ? "border-slate-600"
                    : "border-slate-400"
              }`}
            >
              {selectedPaymentMethod === "MOMO" && (
                <View className="w-full h-full rounded-full bg-red-600" />
              )}
            </View>
          </TouchableOpacity>

          {/* ZaloPay */}
          <TouchableOpacity
            className={`flex-row items-center justify-between p-4 mb-3 rounded-xl border-2 ${
              selectedPaymentMethod === "ZALOPAY"
                ? `${cardBg} border-red-600`
                : `${cardBg} ${isDark ? "border-slate-700" : "border-slate-300"}`
            }`}
            onPress={() => setSelectedPaymentMethod("ZALOPAY")}
          >
            <View className="flex-row items-center gap-3">
              <Image
                source={require("@/assets/images/zalopay_icon.png")}
                className="w-10 h-10 rounded-lg"
                resizeMode="cover"
              />
              <View>
                <Text className={`${textColor} font-[semibold]`}>ZaloPay</Text>
                <Text className={`${textMuted} text-xs mt-1`}>
                  Thanh toán qua ví ZaloPay
                </Text>
              </View>
            </View>
            <View
              className={`w-5 h-5 rounded-full border-2 ${
                selectedPaymentMethod === "ZALOPAY"
                  ? "border-red-600 bg-red-600"
                  : isDark
                    ? "border-slate-600"
                    : "border-slate-400"
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
      <View
        className={`px-4 pb-5 pt-3 ${cardBgSecondary} border-t ${borderColor}`}
      >
        <TouchableOpacity
          className={`py-4 rounded-xl items-center ${
            processing
              ? `${isDark ? "bg-slate-700" : "bg-slate-300"} opacity-50`
              : "bg-red-600"
          }`}
          onPress={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-[bold] text-base">
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
