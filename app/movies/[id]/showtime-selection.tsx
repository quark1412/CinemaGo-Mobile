import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
  AppState,
  AppStateStatus,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome, FontAwesome6, Ionicons } from "@expo/vector-icons";
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
import { bookingService } from "@/services/booking";
import { getSocket } from "@/services/socket";

const { width } = Dimensions.get("window");
const SEAT_HOLD_TIMEOUT_MINUTES = 5;

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
  const [rawSeatLayout, setRawSeatLayout] = useState<SeatLayout | null>(null);
  const [seatLayout, setSeatLayout] = useState<SeatLayout | null>(null);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [heldSeatNumbers, setHeldSeatNumbers] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [loadingSeatMap, setLoadingSeatMap] = useState(false);
  const [foodDrinks, setFoodDrinks] = useState<FoodDrink[]>([]);
  const [selectedFoodDrinks, setSelectedFoodDrinks] = useState<
    SelectedFoodDrink[]
  >([]);
  const [loadingFoodDrinks, setLoadingFoodDrinks] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({
    minutes: SEAT_HOLD_TIMEOUT_MINUTES,
    seconds: 0,
  });
  const [timerActive, setTimerActive] = useState(false);
  const timerStartTimeRef = useRef<number | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

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
    const seatsPrice = selectedSeats.reduce((sum, seat) => {
      const seatPrice = seat.isCoupleSeat ? seat.price * 2 : seat.price;
      return sum + seatPrice;
    }, 0);
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

  useEffect(() => {
    if (dateOptions.length > 0 && !selectedDate) {
      setSelectedDate(dateOptions[0]);
    }
  }, [dateOptions]);

  useEffect(() => {
    loadFoodDrinks();
  }, []);

  // Calculate remaining time from start timestamp
  const calculateRemainingTime = (
    startTime: number
  ): { minutes: number; seconds: number } => {
    const now = Date.now();
    const elapsed = Math.floor((now - startTime) / 1000); // elapsed in seconds
    const totalSeconds = SEAT_HOLD_TIMEOUT_MINUTES * 60;
    const remaining = Math.max(0, totalSeconds - elapsed);

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    return { minutes, seconds };
  };

  // Release all seats when timer expires
  const handleTimerExpired = useCallback(async () => {
    if (!selectedShowtime || selectedSeats.length === 0) return;

    try {
      // Release all selected seats
      await Promise.all(
        selectedSeats.map((seat) =>
          bookingService
            .releaseSeat({
              showtimeId: selectedShowtime.id,
              seatId: seat.id ?? seat.seatNumber,
            })
            .catch((err) => {
              console.error("Failed to release seat:", err);
            })
        )
      );

      setSelectedSeats([]);
      setHeldSeatNumbers([]);
      setTimerActive(false);
      timerStartTimeRef.current = null;
      showToast(
        "Thời gian giữ ghế đã hết hạn. Vui lòng chọn lại ghế.",
        "error"
      );
    } catch (error: any) {
      console.error("Failed to release seats on timer expiry:", error);
    }
  }, [selectedShowtime, selectedSeats, showToast]);

  // Start timer when first seat is selected
  useEffect(() => {
    if (selectedSeats.length > 0 && selectedShowtime) {
      if (!timerActive && !timerStartTimeRef.current) {
        const startTime = Date.now();
        timerStartTimeRef.current = startTime;
        setTimerActive(true);
        setTimeRemaining({
          minutes: SEAT_HOLD_TIMEOUT_MINUTES,
          seconds: 0,
        });
      }
    } else if (selectedSeats.length === 0) {
      setTimerActive(false);
      timerStartTimeRef.current = null;
      setTimeRemaining({
        minutes: SEAT_HOLD_TIMEOUT_MINUTES,
        seconds: 0,
      });
    }
  }, [selectedSeats.length, selectedShowtime, timerActive]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        timerActive &&
        timerStartTimeRef.current
      ) {
        const remaining = calculateRemainingTime(timerStartTimeRef.current);
        setTimeRemaining(remaining);

        // Check if expired
        if (remaining.minutes === 0 && remaining.seconds === 0) {
          handleTimerExpired();
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [timerActive, handleTimerExpired]);

  // Countdown timer use timestamp-based
  useEffect(() => {
    if (!timerActive || !selectedShowtime || !timerStartTimeRef.current) return;

    const interval = setInterval(() => {
      if (!timerStartTimeRef.current) return;

      const remaining = calculateRemainingTime(timerStartTimeRef.current);
      setTimeRemaining(remaining);

      // Check if expired
      if (remaining.minutes === 0 && remaining.seconds === 0) {
        clearInterval(interval);
        handleTimerExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, selectedShowtime, handleTimerExpired]);

  // Handle timer expiration
  useEffect(() => {
    if (
      timerActive &&
      timeRemaining.minutes === 0 &&
      timeRemaining.seconds === 0 &&
      selectedSeats.length > 0 &&
      selectedShowtime
    ) {
      handleTimerExpired();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining.minutes, timeRemaining.seconds]);

  const formatTime = (minutes: number, seconds: number) => {
    return {
      minutes: minutes.toString().padStart(2, "0"),
      seconds: seconds.toString().padStart(2, "0"),
    };
  };

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
      setRawSeatLayout(layout);

      // Load booked seats
      const booked = await showtimeSelectionService.getBookedSeats(showtime.id);
      console.log("booked", booked);
      setBookedSeats(booked);

      // Load currently held seats
      try {
        const held = await bookingService.getHeldSeats(showtime.id);
        setHeldSeatNumbers(held.map((h) => h.seatId));
      } catch (err) {
        console.warn("Failed to load held seats:", err);
        setHeldSeatNumbers([]);
      }
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

        const isBooked = booked.includes(seat.id ?? seat.seatNumber);
        // Calculate price
        const extraPrice = seat.extraPrice || 0;
        let price = basePrice + extraPrice;

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

  const handleSeatToggle = async (seat: Seat) => {
    if (!selectedShowtime) return;

    if (seat.status === SeatStatus.BOOKED || seat.type === SeatType.EMPTY) {
      return;
    }

    const seatId = seat.id ?? seat.seatNumber;

    const isSelected = selectedSeats.some(
      (s) => s.row === seat.row && s.col === seat.col
    );

    try {
      if (isSelected) {
        // Release seat for current user
        await bookingService.releaseSeat({
          showtimeId: selectedShowtime.id,
          seatId: seat.id ?? seatId,
        });

        setSelectedSeats(
          selectedSeats.filter((s) => s.row !== seat.row || s.col !== seat.col)
        );
        setHeldSeatNumbers((prev) =>
          prev.filter((num) => num !== (seat.id ?? seatId))
        );
      } else {
        try {
          await bookingService.holdSeat({
            showtimeId: selectedShowtime.id,
            seatId: seat.id ?? seatId,
          });

          setSelectedSeats([...selectedSeats, seat]);
          setHeldSeatNumbers((prev) => {
            const idToUse = seat.id ?? seatId;
            return prev.includes(idToUse) ? prev : [...prev, idToUse];
          });
        } catch (error: any) {
          if (error?.response?.status === 409) {
            showToast("Ghế này vừa được giữ bởi người khác", "error");
          } else {
            showToast("Không thể giữ ghế, vui lòng thử lại", "error");
          }
        }
      }
    } catch (error: any) {
      console.error("Seat toggle failed:", error);
    }
  };

  // Recompute seat layout
  useEffect(() => {
    if (!rawSeatLayout || !selectedShowtime) return;

    const updated = updateSeatStatuses(
      rawSeatLayout,
      bookedSeats,
      selectedShowtime.price
    );
    setSeatLayout(updated);
  }, [rawSeatLayout, bookedSeats, heldSeatNumbers, selectedShowtime]);

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
        seatIds: JSON.stringify(selectedSeats.map((s) => s.id ?? s.seatNumber)),
        seatDetails: JSON.stringify(
          selectedSeats.map((s) => ({
            seatNumber: s.seatNumber,
            type: s.type,
            extraPrice: s.extraPrice || 0,
            isCoupleSeat: s.isCoupleSeat || false,
          }))
        ),
        foodDrinks: JSON.stringify(
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
      return "";
    }

    const isSelected = selectedSeats.some(
      (s) => s.row === seat.row && s.col === seat.col
    );

    const isBooked = bookedSeats.includes(seat.id ?? seat.seatNumber);
    const isHeldByOther =
      (seat.id ? heldSeatNumbers.includes(seat.id) : false) && !isSelected;

    if (isSelected) {
      return "bg-blue-900 border-blue-500";
    }

    if (isHeldByOther) {
      return "bg-yellow-700 border-yellow-500";
    }

    if (isBooked) {
      return "bg-red-900 border-red-500";
    }

    return isDark
      ? "bg-slate-950 border-slate-600"
      : "bg-white border-slate-800";
  };

  useEffect(() => {
    let isSubscribed = true;

    const handler = async (data: {
      showtimeId: string;
      seatId: string;
      status: "held" | "booked" | "released";
      expiresAt: number | null;
    }) => {
      if (!selectedShowtime || data.showtimeId !== selectedShowtime.id) return;

      try {
        // Refresh held seats
        const held = await bookingService.getHeldSeats(data.showtimeId);
        const newHeldSeatNumbers = held.map((h) => h.seatId);
        setHeldSeatNumbers(newHeldSeatNumbers);

        if (data.status === "booked") {
          const booked = await showtimeSelectionService.getBookedSeats(
            data.showtimeId
          );
          setBookedSeats(booked);

          setSelectedSeats((prev) =>
            prev.filter((s) => s.seatNumber !== data.seatId)
          );
        }

        if (data.status === "released") {
          setSelectedSeats((prev) =>
            prev.filter((s) => s.seatNumber !== data.seatId)
          );
        }
      } catch (error) {
        console.error(
          "Failed to refresh seat data after socket update:",
          error
        );
      }
    };

    (async () => {
      const socket = await getSocket();
      if (!isSubscribed) return;
      socket.on("seat-update", handler);
    })();

    return () => {
      isSubscribed = false;
      (async () => {
        try {
          const socket = await getSocket();
          socket.off("seat-update", handler);
        } catch {}
      })();
    };
  }, [selectedShowtime]);

  // Join/leave showtime room when selection changes
  useEffect(() => {
    let isActive = true;

    (async () => {
      const socket = await getSocket();
      if (!isActive) return;

      if (selectedShowtime) {
        socket.emit("join-showtime", selectedShowtime.id);
        console.log("Joined showtime room (mobile):", selectedShowtime.id);
      }
    })();

    return () => {
      isActive = false;
      if (selectedShowtime) {
        (async () => {
          try {
            const socket = await getSocket();
            socket.emit("leave-showtime", selectedShowtime.id);
            console.log("Left showtime room (mobile):", selectedShowtime.id);
          } catch {}
        })();
      }
    };
  }, [selectedShowtime]);

  // Release seats when switching showtime
  useEffect(() => {
    return () => {
      if (!selectedShowtime || selectedSeats.length === 0) return;

      (async () => {
        try {
          await Promise.all(
            selectedSeats.map((seat) =>
              bookingService
                .releaseSeat({
                  showtimeId: selectedShowtime.id,
                  seatId: seat.id ?? seat.seatNumber,
                })
                .catch(() => {})
            )
          );
        } catch {}
      })();
    };
  }, [selectedShowtime, selectedSeats]);

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

  const timeDisplay = formatTime(timeRemaining.minutes, timeRemaining.seconds);

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`} edges={["top"]}>
      {/* Timer*/}
      {timerActive && (
        <View
          className="absolute top-16 right-4 z-50"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <View
            className={`${cardBg} rounded-xl p-3 items-center border-2 border-red-500`}
          >
            <Text className={`${textMuted} text-xs mb-1`}>
              Thời gian giữ ghế
            </Text>
            <View className="flex-row items-center gap-1">
              <View
                className={`${cardBgSecondary} rounded-lg px-2 py-1 items-center`}
              >
                <Text className={`${textColor} text-lg font-bold`}>
                  {timeDisplay.minutes}
                </Text>
                <Text className={`${textMuted} text-[10px]`}>Phút</Text>
              </View>
              <Text className={`${textColor} text-lg font-bold`}>:</Text>
              <View
                className={`${cardBgSecondary} rounded-lg px-2 py-1 items-center`}
              >
                <Text className={`${textColor} text-lg font-bold`}>
                  {timeDisplay.seconds}
                </Text>
                <Text className={`${textMuted} text-[10px]`}>Giây</Text>
              </View>
            </View>
          </View>
        </View>
      )}

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
                <View className="flex items-center justify-center h-64">
                  <Text className={`${textMuted} text-center py-4`}>
                    Không có suất chiếu cho ngày này
                  </Text>
                </View>
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
                {/* Legend */}
                <View className="flex flex-row flex-wrap justify-center mt-2 px-8 items-center mb-4">
                  <View className="w-1/2 flex-row items-center gap-2 mb-2 px-1">
                    <View className="w-4 h-4 bg-white-900 border-2 border-slate-600 rounded" />
                    <Text className={`text-xs ${textMuted}`}>Còn trống</Text>
                  </View>
                  <View className="w-1/2 flex-row items-center gap-2 mb-2 px-1">
                    <View className="w-4 h-4 bg-blue-900 border-2 border-blue-500 rounded" />
                    <Text className={`text-xs ${textMuted}`}>Đã chọn</Text>
                  </View>
                  <View className="w-1/2 flex-row items-center gap-2 mb-2 px-1">
                    <View className="w-4 h-4 bg-yellow-700 border-2 border-yellow-500 rounded" />
                    <Text className={`text-xs ${textMuted}`}>
                      Đã giữ bởi người khác
                    </Text>
                  </View>
                  <View className="w-1/2 flex-row items-center gap-2 mb-2 px-1">
                    <View className="w-4 h-4 bg-red-900 border-2 border-red-500 rounded" />
                    <Text className={`text-xs ${textMuted}`}>Đã đặt</Text>
                  </View>
                </View>

                {/* Screen Indicator */}
                <View className="items-center mb-6 px-4">
                  <View className="w-full h-1 bg-slate-700 rounded mb-2" />
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
                          // For couple seats, render a single wide button for the pair,
                          // skipping the secondary cell
                          const isCoupleSeat =
                            seat.type === SeatType.COUPLE && seat.isCoupleSeat;
                          const isCoupleSecondary =
                            isCoupleSeat &&
                            typeof seat.coupleWith === "number" &&
                            seat.coupleWith < colIndex;
                          const isCouplePrimary =
                            isCoupleSeat &&
                            typeof seat.coupleWith === "number" &&
                            seat.coupleWith > colIndex;

                          if (isCoupleSecondary) {
                            return null;
                          }

                          const seatStyle = getSeatStyle(seat);
                          const isSelected = selectedSeats.some(
                            (s) => s.row === seat.row && s.col === seat.col
                          );

                          const isBooked = bookedSeats.includes(
                            seat.id ?? seat.seatNumber
                          );
                          const isHeldByOther =
                            (seat.id
                              ? heldSeatNumbers.includes(seat.id)
                              : false) && !isSelected;

                          const disabled =
                            seat.type === SeatType.EMPTY ||
                            seat.type === SeatType.BLOCKED ||
                            isBooked ||
                            isHeldByOther;

                          const baseWidth = isCouplePrimary ? "w-16" : "w-8";
                          const iconColor = isDark ? "#e5e7eb" : "#0f172a";
                          const textColorClass = isDark
                            ? "text-slate-50"
                            : "text-slate-900";

                          return (
                            <TouchableOpacity
                              key={`${rowIndex}-${colIndex}`}
                              className={`h-8 mx-1 rounded border ${baseWidth} ${seatStyle}`}
                              onPress={() => handleSeatToggle(seat)}
                              disabled={disabled}
                            >
                              {seat.type !== SeatType.EMPTY && (
                                <View className="flex-1 flex-col items-center p-1 justify-center">
                                  {seat.type === SeatType.VIP && (
                                    <FontAwesome6
                                      name="crown"
                                      size={10}
                                      color={iconColor}
                                    />
                                  )}
                                  {seat.type === SeatType.COUPLE && (
                                    <FontAwesome
                                      name="heart"
                                      size={10}
                                      color={iconColor}
                                    />
                                  )}
                                  <Text
                                    className={`text-[10px] font-semibold ${textColorClass}`}
                                  >
                                    {seat.seatNumber}
                                  </Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                </ScrollView>
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
