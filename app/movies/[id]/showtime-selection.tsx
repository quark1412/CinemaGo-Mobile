import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { showtimeSelectionService } from "@/services/showtime-selection";
import { fooddrinkService, FoodDrink } from "@/services/fooddrink";
import {
  Showtime,
  SeatLayout,
  Seat,
  SeatStatus,
  SeatType,
  DateOption,
} from "@/types/showtime";
import { useToast } from "@/contexts/toastContext";
import { useTheme } from "@/contexts/themeContext";
import { generateDateOptions } from "@/utils/dayUtils";

const { width } = Dimensions.get("window");

interface SelectedFoodDrink {
  id: string;
  quantity: number;
  foodDrink: FoodDrink;
}

export default function ShowtimeSelectionScreen() {
  const { id: movieId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { isDark } = useTheme();

  // State management
  const [loading, setLoading] = useState(true);
  const [movieDetails, setMovieDetails] = useState<any>(null);
  const [cinemaDetails, setCinemaDetails] = useState<any>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedDate, setSelectedDate] = useState<DateOption | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(
    null
  );
  const [seatLayout, setSeatLayout] = useState<SeatLayout | null>(null);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [loadingSeatMap, setLoadingSeatMap] = useState(false);
  const [foodDrinks, setFoodDrinks] = useState<FoodDrink[]>([]);
  const [selectedFoodDrinks, setSelectedFoodDrinks] = useState<
    SelectedFoodDrink[]
  >([]);
  const [loadingFoodDrinks, setLoadingFoodDrinks] = useState(false);

  // Generate date options
  const dateOptions = useMemo<DateOption[]>(() => {
    return generateDateOptions();
  }, []);

  // Filter showtimes by selected date
  const filteredShowtimes = useMemo(() => {
    if (!selectedDate || !showtimes.length) return [];

    return showtimes.filter((showtime) => {
      const showtimeDate = new Date(showtime.startTime)
        .toISOString()
        .split("T")[0];
      return showtimeDate === selectedDate.fullDate;
    });
  }, [selectedDate, showtimes]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    const seatsPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
    const foodDrinksPrice = selectedFoodDrinks.reduce(
      (sum, foodDrink) => sum + foodDrink.foodDrink.price * foodDrink.quantity,
      0
    );
    return seatsPrice + foodDrinksPrice;
  }, [selectedSeats, selectedFoodDrinks]);

  // Get selected seat numbers
  const selectedSeatNumbers = useMemo(() => {
    return selectedSeats.map((seat) => seat.seatNumber).join(", ");
  }, [selectedSeats]);

  // Initial data load
  useEffect(() => {
    loadInitialData();
  }, [movieId]);

  // Auto-select today and load showtimes
  useEffect(() => {
    if (dateOptions.length > 0 && !selectedDate) {
      setSelectedDate(dateOptions[0]);
    }
  }, [dateOptions]);

  // Load combos
  useEffect(() => {
    loadFoodDrinks();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load movie details
      const movie = await showtimeSelectionService.getMovieDetails(movieId);
      setMovieDetails(movie);

      // Load showtimes for the next 7 days
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);

      const showtimesData = await showtimeSelectionService.getShowtimesByMovie(
        movieId,
        today.toISOString(),
        endDate.toISOString()
      );
      setShowtimes(showtimesData);

      // Load cinema details from first showtime if available
      if (showtimesData.length > 0) {
        const cinema = await showtimeSelectionService.getCinemaDetails(
          showtimesData[0].cinemaId
        );
        setCinemaDetails(cinema);
      }
    } catch (error: any) {
      showToast(error.message || "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadFoodDrinks = async () => {
    try {
      setLoadingFoodDrinks(true);
      const response = await fooddrinkService.getFoodDrinks({
        isAvailable: true,
        limit: 20,
      });

      setFoodDrinks(response.data);
    } catch (error: any) {
      console.error("Failed to load food drinks:", error);
    } finally {
      setLoadingFoodDrinks(false);
    }
  };

  const handleDateSelect = (date: DateOption) => {
    setSelectedDate(date);
    setSelectedShowtime(null);
    setSeatLayout(null);
    setSelectedSeats([]);
  };

  const handleShowtimeSelect = async (showtime: Showtime) => {
    try {
      setLoadingSeatMap(true);
      setSelectedShowtime(showtime);
      setSelectedSeats([]);

      // Load seat layout
      const layout = await showtimeSelectionService.getRoomSeatLayout(
        showtime.roomId
      );

      // Load booked seats
      const booked = await showtimeSelectionService.getBookedSeats(showtime.id);
      setBookedSeats(booked);

      // Update seat layout with statuses
      const updatedLayout = updateSeatStatuses(layout, booked, showtime.price);
      setSeatLayout(updatedLayout);
    } catch (error: any) {
      showToast(error.message || "Failed to load seat map", "error");
    } finally {
      setLoadingSeatMap(false);
    }
  };

  const updateSeatStatuses = (
    layout: SeatLayout,
    booked: string[],
    basePrice: number
  ): SeatLayout => {
    const updatedSeats = layout.seats.map((row) =>
      row.map((seat) => {
        if (seat.type === SeatType.EMPTY) {
          return seat;
        }

        const isBooked = booked.includes(seat.seatNumber);
        let price = basePrice;

        // Adjust price based on seat type
        if (seat.type === SeatType.VIP) {
          price = basePrice * 1.5;
        } else if (seat.type === SeatType.COUPLE) {
          price = basePrice * 2;
        }

        return {
          ...seat,
          status: isBooked ? SeatStatus.BOOKED : SeatStatus.AVAILABLE,
          price,
        };
      })
    );

    return {
      ...layout,
      seats: updatedSeats,
    };
  };

  const handleSeatToggle = (seat: Seat) => {
    if (seat.status === SeatStatus.BOOKED || seat.type === SeatType.EMPTY) {
      return;
    }

    const isSelected = selectedSeats.some(
      (s) => s.row === seat.row && s.col === seat.col
    );

    if (isSelected) {
      setSelectedSeats(
        selectedSeats.filter((s) => s.row !== seat.row || s.col !== seat.col)
      );
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleFoodDrinkQuantityChange = (
    foodDrink: FoodDrink,
    change: number
  ) => {
    setSelectedFoodDrinks((prev) => {
      const existing = prev.find((fd) => fd.id === foodDrink.id);
      if (existing) {
        const newQuantity = existing.quantity + change;
        if (newQuantity <= 0) {
          return prev.filter((fd) => fd.id !== foodDrink.id);
        }
        return prev.map((fd) =>
          fd.id === foodDrink.id ? { ...fd, quantity: newQuantity } : fd
        );
      } else {
        if (change > 0) {
          return [
            ...prev,
            { id: foodDrink.id, quantity: 1, foodDrink: foodDrink },
          ];
        }
        return prev;
      }
    });
  };

  const getFoodDrinkQuantity = (foodDrinkId: string) => {
    const selected = selectedFoodDrinks.find((fd) => fd.id === foodDrinkId);
    return selected?.quantity || 0;
  };

  const handleProceedToCheckout = () => {
    if (selectedSeats.length === 0 || !selectedShowtime) {
      showToast("Vui lòng chọn ghế ngồi", "error");
      return;
    }

    // Navigate to checkout with booking details
    router.push({
      pathname: "/booking/checkout",
      params: {
        showtimeId: selectedShowtime.id,
        movieId: movieId,
        seats: JSON.stringify(selectedSeats.map((s) => s.seatNumber)),
        seatIds: JSON.stringify(selectedSeats.map((s) => s.seatNumber)),
        combos: JSON.stringify(
          selectedFoodDrinks.map((fd) => ({
            id: fd.id,
            quantity: fd.quantity,
          }))
        ),
        totalPrice: totalPrice.toString(),
      },
    });
  };

  const getSeatStyle = (seat: Seat) => {
    if (seat.type === SeatType.EMPTY) {
      return "w-8 h-8 mx-1";
    }

    const isSelected = selectedSeats.some(
      (s) => s.row === seat.row && s.col === seat.col
    );

    if (isSelected) {
      return "w-8 h-8 mx-1 rounded bg-red-600 border border-red-700";
    }

    if (seat.status === SeatStatus.BOOKED) {
      return isDark
        ? "w-8 h-8 mx-1 rounded bg-gray-600 border border-gray-700 opacity-50"
        : "w-8 h-8 mx-1 rounded bg-gray-400 border border-gray-500 opacity-50";
    }

    if (seat.type === SeatType.VIP) {
      return "w-8 h-8 mx-1 rounded border-2 border-yellow-500 bg-transparent";
    }

    return isDark
      ? "w-8 h-8 mx-1 rounded bg-gray-700 border border-gray-600"
      : "w-8 h-8 mx-1 rounded bg-gray-300 border border-gray-400";
  };

  // Theme-aware colors
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
        <Text className={`text-lg font-semibold ${textColor}`}>Chọn vé</Text>
        <View className="w-6" />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Date Selection Section */}
        <View className={`py-5 border-b ${borderColor}`}>
          <Text className={`text-lg font-semibold ${textColor} px-4 mb-4`}>
            Chọn Suất Chiếu
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4"
          >
            {dateOptions.map((date, index) => (
              <TouchableOpacity
                key={index}
                className={`px-4 py-3 mr-3 rounded-xl border-2 ${
                  selectedDate?.fullDate === date.fullDate
                    ? "bg-red-600 border-red-600"
                    : `${cardBg} ${isDark ? "border-slate-700" : "border-slate-300"}`
                }`}
                onPress={() => handleDateSelect(date)}
              >
                <Text
                  className={`text-sm font-semibold mb-1 ${
                    selectedDate?.fullDate === date.fullDate
                      ? "text-white"
                      : textMuted
                  }`}
                >
                  {date.dayOfWeek}
                </Text>
                <Text
                  className={`text-lg font-bold ${
                    selectedDate?.fullDate === date.fullDate
                      ? "text-white"
                      : textColor
                  }`}
                >
                  {date.dayOfMonth.includes("/")
                    ? date.dayOfMonth.split(", ")[1] || date.dayOfMonth
                    : date.dayOfMonth}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Time Selection */}
          {selectedDate && (
            <View className="px-4 mt-4">
              {filteredShowtimes.length === 0 ? (
                <Text className={`${textMuted} text-center py-4`}>
                  Không có suất chiếu cho ngày này
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row flex-wrap"
                >
                  {filteredShowtimes.map((showtime) => (
                    <TouchableOpacity
                      key={showtime.id}
                      className={`px-5 py-3 mr-3 mb-3 rounded-xl border-2 ${
                        selectedShowtime?.id === showtime.id
                          ? "bg-red-600 border-red-600"
                          : `${cardBg} ${isDark ? "border-slate-700" : "border-slate-300"}`
                      }`}
                      onPress={() => handleShowtimeSelect(showtime)}
                    >
                      <Text
                        className={`text-base font-bold ${
                          selectedShowtime?.id === showtime.id
                            ? "text-white"
                            : textColor
                        }`}
                      >
                        {new Date(showtime.startTime).toLocaleTimeString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          }
                        )}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        </View>

        {/* Seat Selection Section */}
        {selectedShowtime && (
          <View className={`py-5 border-b ${borderColor}`}>
            <Text className={`text-lg font-semibold ${textColor} px-4 mb-4`}>
              Chọn Ghế Ngồi
            </Text>

            {loadingSeatMap ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="large" color="#e11d48" />
              </View>
            ) : seatLayout && seatLayout.seats.length > 0 ? (
              <>
                {/* Screen Indicator */}
                <View className="items-center mb-6 px-4">
                  <View className="w-full h-1 bg-red-600 rounded mb-2" />
                  <Text
                    className={`text-xs font-semibold ${textMuted} tracking-wider`}
                  >
                    MÀN HÌNH
                  </Text>
                </View>

                {/* Seat Grid */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="px-4 items-center">
                    {seatLayout.seats.map((row, rowIndex) => (
                      <View
                        key={rowIndex}
                        className="flex-row mb-2 justify-center"
                      >
                        {row.map((seat, colIndex) => {
                          const seatStyle = getSeatStyle(seat);
                          const isSelected = selectedSeats.some(
                            (s) => s.row === seat.row && s.col === seat.col
                          );

                          return (
                            <TouchableOpacity
                              key={`${rowIndex}-${colIndex}`}
                              className={seatStyle}
                              onPress={() => handleSeatToggle(seat)}
                              disabled={
                                seat.status === SeatStatus.BOOKED ||
                                seat.type === SeatType.EMPTY ||
                                seat.type === SeatType.BLOCKED
                              }
                            >
                              {seat.type !== SeatType.EMPTY && (
                                <View className="flex-1 justify-center items-center">
                                  {seat.type === SeatType.VIP && (
                                    <Text className="text-[8px] text-yellow-500 font-bold">
                                      VIP
                                    </Text>
                                  )}
                                  {!isSelected &&
                                    seat.status === SeatStatus.AVAILABLE && (
                                      <Text
                                        className={`text-[8px] ${isDark ? "text-white" : "text-slate-900"} font-semibold`}
                                      >
                                        {seat.seatNumber}
                                      </Text>
                                    )}
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                </ScrollView>

                {/* Legend */}
                <View className="flex-row flex-wrap justify-center gap-4 mt-6 px-4">
                  <View className="flex-row items-center gap-2">
                    <View
                      className={`w-4 h-4 rounded ${isDark ? "bg-slate-700 border border-slate-600" : "bg-slate-300 border border-slate-400"}`}
                    />
                    <Text className={`text-xs ${textMuted}`}>Trống</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="w-4 h-4 rounded bg-red-600 border border-red-700" />
                    <Text className={`text-xs ${textMuted}`}>Đang chọn</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View
                      className={`w-4 h-4 rounded ${isDark ? "bg-gray-600 border border-gray-700" : "bg-gray-400 border border-gray-500"} opacity-50`}
                    />
                    <Text className={`text-xs ${textMuted}`}>Đã bán</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="w-4 h-4 rounded border-2 border-yellow-500 bg-transparent" />
                    <Text className={`text-xs ${textMuted}`}>VIP</Text>
                  </View>
                </View>
              </>
            ) : (
              <Text className={`${textMuted} text-center py-4`}>
                Không có sơ đồ ghế
              </Text>
            )}
          </View>
        )}

        {/* Combo Selection Section */}
        <View className={`py-5 border-b ${borderColor}`}>
          <Text className={`text-lg font-semibold ${textColor} px-4 mb-4`}>
            Chọn Bắp Nước
          </Text>

          {loadingFoodDrinks ? (
            <View className="py-10 items-center">
              <ActivityIndicator size="large" color="#e11d48" />
            </View>
          ) : (
            <View className="px-4">
              {foodDrinks.map((foodDrink) => {
                const quantity = getFoodDrinkQuantity(foodDrink.id);
                return (
                  <View
                    key={foodDrink.id}
                    className={`flex-row items-center mb-4 p-4 ${cardBg} rounded-xl`}
                  >
                    <Image
                      source={{ uri: foodDrink.image }}
                      className="w-20 h-20 rounded-lg mr-4"
                      resizeMode="cover"
                    />
                    <View className="flex-1">
                      <Text
                        className={`${textColor} font-semibold text-base mb-1`}
                      >
                        {foodDrink.name}
                      </Text>
                      <Text className={`${textMuted} text-sm mb-2`}>
                        {foodDrink.description}
                      </Text>
                      <Text className="text-red-500 font-bold text-base">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(foodDrink.price)}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                      <TouchableOpacity
                        className={`w-8 h-8 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-300"} items-center justify-center`}
                        onPress={() =>
                          handleFoodDrinkQuantityChange(foodDrink, -1)
                        }
                        disabled={quantity === 0}
                      >
                        <Text className={textColor + " font-bold text-lg"}>
                          -
                        </Text>
                      </TouchableOpacity>
                      <Text
                        className={`${textColor} font-semibold text-base w-8 text-center`}
                      >
                        {quantity}
                      </Text>
                      <TouchableOpacity
                        className="w-8 h-8 rounded-full bg-red-600 items-center justify-center"
                        onPress={() =>
                          handleFoodDrinkQuantityChange(foodDrink, 1)
                        }
                      >
                        <Text className="text-white font-bold text-lg">+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
              {foodDrinks.length === 0 && (
                <Text className={`${textMuted} text-center py-4`}>
                  Không có bắp nước nào
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View
        className={`absolute bottom-0 left-0 right-0 ${cardBgSecondary} border-t ${borderColor} pb-5`}
      >
        <View className="px-4 pt-4">
          <View className="mb-3">
            <Text className={`${textMuted} text-sm mb-1`}>
              Ghế: {selectedSeatNumbers || "Chưa chọn"} ({selectedSeats.length})
            </Text>
            {selectedFoodDrinks.length > 0 && (
              <Text className={`${textMuted} text-sm mb-1`}>
                Bắp Nước: x
                {selectedFoodDrinks.reduce((sum, fd) => sum + fd.quantity, 0)}
              </Text>
            )}
          </View>
          <TouchableOpacity
            className={`py-4 rounded-xl items-center ${
              selectedSeats.length === 0
                ? `${isDark ? "bg-slate-700" : "bg-slate-300"} opacity-50`
                : "bg-red-600"
            }`}
            onPress={handleProceedToCheckout}
            disabled={selectedSeats.length === 0}
          >
            <Text className="text-white font-bold text-base">Thanh toán</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
