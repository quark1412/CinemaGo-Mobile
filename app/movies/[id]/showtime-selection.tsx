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
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  const [room, setRoom] = useState<any>(null);
  const [seatMap, setSeatMap] = useState<Map<string, any>>(new Map());
  const [seatPriceMap, setSeatPriceMap] = useState<Map<string, number>>(
    new Map()
  );
  const [bookedSeatIds, setBookedSeatIds] = useState<string[]>([]);
  const [heldSeatIds, setHeldSeatIds] = useState<string[]>([]);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [heldSeatNumbers, setHeldSeatNumbers] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [loadingSeatMap, setLoadingSeatMap] = useState(false);
  const [foodDrinks, setFoodDrinks] = useState<FoodDrink[]>([]);
  const [selectedFoodDrinks, setSelectedFoodDrinks] = useState<
    SelectedFoodDrink[]
  >([]);
  const [loadingFoodDrinks, setLoadingFoodDrinks] = useState(false);

  // Timer state
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
    if (!selectedShowtime) return 0;

    const basePrice = selectedShowtime.price || 0;
    const seatsPrice = selectedSeats.reduce((sum, seat) => {
      const extraPrice =
        seat.extraPrice || seatPriceMap.get(seat.seatNumber) || 0;
      const seatPrice = basePrice + extraPrice;
      const finalPrice = seat.isCoupleSeat ? seatPrice * 2 : seatPrice;
      return sum + finalPrice;
    }, 0);

    const foodDrinksPrice = selectedFoodDrinks.reduce(
      (sum, foodDrink) => sum + foodDrink.foodDrink.price * foodDrink.quantity,
      0
    );

    return seatsPrice + foodDrinksPrice;
  }, [selectedSeats, selectedFoodDrinks, selectedShowtime, seatPriceMap]);

  // Calculate remaining time
  const calculateRemainingTime = useCallback((startTime: number) => {
    const now = Date.now();
    const elapsed = Math.floor((now - startTime) / 1000);
    const totalSeconds = SEAT_HOLD_TIMEOUT_MINUTES * 60 - elapsed;

    if (totalSeconds <= 0) {
      return { minutes: 0, seconds: 0 };
    }

    return {
      minutes: Math.floor(totalSeconds / 60),
      seconds: totalSeconds % 60,
    };
  }, []);

  // Handle timer expiration
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
            .catch(() => {})
        )
      );

      setSelectedSeats([]);
      setHeldSeatIds([]);
      setHeldSeatNumbers([]);
      setTimerActive(false);
      timerStartTimeRef.current = null;

      showToast("Hết thời gian giữ ghế.", "error");
    } catch (error) {
      console.error("Failed to release seats on timer expiration:", error);
    }
  }, [selectedShowtime, selectedSeats, showToast]);

  // Start timer when seats are selected
  useEffect(() => {
    if (selectedSeats.length > 0 && !timerActive) {
      timerStartTimeRef.current = Date.now();
      setTimerActive(true);
    } else if (selectedSeats.length === 0 && timerActive) {
      setTimerActive(false);
      timerStartTimeRef.current = null;
      setTimeRemaining({
        minutes: SEAT_HOLD_TIMEOUT_MINUTES,
        seconds: 0,
      });
    }
  }, [selectedSeats.length, timerActive]);

  // AppState listener to handle background/foreground transitions
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        timerActive &&
        timerStartTimeRef.current
      ) {
        // Recalculate remaining time when app comes to foreground
        const remaining = calculateRemainingTime(timerStartTimeRef.current);
        setTimeRemaining(remaining);

        // Check if expired while in background
        if (remaining.minutes === 0 && remaining.seconds === 0) {
          handleTimerExpired();
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [timerActive, calculateRemainingTime, handleTimerExpired]);

  // Countdown timer effect
  useEffect(() => {
    if (!timerActive || !timerStartTimeRef.current) return;

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
  }, [timerActive, calculateRemainingTime, handleTimerExpired]);

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

      // Load cinema details
      if (showtimesData.length > 0) {
        const cinema = await showtimeSelectionService.getCinemaDetails(
          showtimesData[0].cinemaId
        );
        setCinemaDetails(cinema);
      }

      // Set default date to today
      const todayOption = dateOptions.find(
        (opt) => opt.fullDate === today.toISOString().split("T")[0]
      );
      if (todayOption) {
        setSelectedDate(todayOption);
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

  useEffect(() => {
    loadInitialData();
    loadFoodDrinks();
  }, []);

  const handleDateSelect = (date: DateOption) => {
    setSelectedDate(date);
    setSelectedShowtime(null);
    setSeatLayout(null);
    setRawSeatLayout(null);
    setRoom(null);
    setSeatMap(new Map());
    setSeatPriceMap(new Map());
    setBookedSeatIds([]);
    setHeldSeatIds([]);
    setBookedSeats([]);
    setHeldSeatNumbers([]);
    setSelectedSeats([]);
  };

  const handleShowtimeSelect = async (showtime: Showtime) => {
    try {
      setLoadingSeatMap(true);
      setSelectedShowtime(showtime);
      setSelectedSeats([]);

      // Load room details with seat layout
      const roomData = await showtimeSelectionService.getRoomById(
        showtime.roomId
      );
      setRoom(roomData);

      // Create seat map from room.seats array
      const newSeatMap = new Map<string, any>();
      const newSeatPriceMap = new Map<string, number>();

      // Get seat type prices
      const seatTypePrices: Record<string, number> = {};
      if (roomData.seats && Array.isArray(roomData.seats)) {
        roomData.seats.forEach((seat: any) => {
          newSeatMap.set(seat.seatNumber, seat);
          const extraPrice =
            seat.extraPrice || (roomData as any)[seat.seatType] || 0;
          newSeatPriceMap.set(seat.seatNumber, extraPrice);

          if (!seatTypePrices[seat.seatType]) {
            seatTypePrices[seat.seatType] = extraPrice;
          }
        });
      }
      setSeatMap(newSeatMap);
      setSeatPriceMap(newSeatPriceMap);

      // Convert seatLayout array to SeatLayout
      if (roomData.seatLayout && Array.isArray(roomData.seatLayout)) {
        let maxRow = 0;
        let maxCol = 0;

        roomData.seatLayout.forEach((seat: any) => {
          const rowIndex = seat.row.charCodeAt(0) - 65;
          const colIndex = seat.col - 1;

          if (rowIndex > maxRow) maxRow = rowIndex;
          if (colIndex > maxCol) maxCol = colIndex;
        });

        // Create empty layout
        const rows = maxRow + 1;
        const cols = maxCol + 1;
        const seats: Seat[][] = Array.from({ length: rows }, (_, rowIndex) =>
          Array.from({ length: cols }, (_, colIndex) => ({
            row: rowIndex,
            col: colIndex,
            seatNumber: "",
            type: SeatType.EMPTY,
            status: SeatStatus.AVAILABLE,
            price: 0,
          }))
        );

        // Fill in seats from seatLayout
        roomData.seatLayout.forEach((seat: any) => {
          const rowIndex = seat.row.charCodeAt(0) - 65;
          const colIndex = seat.col - 1;

          if (rowIndex < rows && colIndex < cols) {
            const seatNumber = `${seat.row}${seat.col}`;
            const seatData = newSeatMap.get(seatNumber);
            const extraPrice =
              seatData?.extraPrice ||
              (roomData as any)[seat.type] ||
              seatTypePrices[seat.type] ||
              0;

            let type: SeatType;
            switch (seat.type) {
              case "VIP":
                type = SeatType.VIP;
                break;
              case "COUPLE":
                type = SeatType.COUPLE;
                break;
              case "BLOCKED":
                type = SeatType.BLOCKED;
                break;
              case "EMPTY":
                type = SeatType.EMPTY;
                break;
              default:
                type = SeatType.NORMAL;
            }

            seats[rowIndex][colIndex] = {
              row: rowIndex,
              col: colIndex,
              seatNumber: seatNumber,
              type: type,
              status:
                type === SeatType.BLOCKED
                  ? SeatStatus.BOOKED
                  : SeatStatus.AVAILABLE,
              price: 0,
              id: seatData?.id,
              extraPrice: extraPrice,
            };
          }
        });

        // Merge adjacent couple seats
        for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
          for (let colIndex = 0; colIndex < cols - 1; colIndex++) {
            const currentSeat = seats[rowIndex][colIndex];
            const nextSeat = seats[rowIndex][colIndex + 1];

            if (
              currentSeat.type === SeatType.COUPLE &&
              nextSeat.type === SeatType.COUPLE &&
              !currentSeat.isCoupleSeat &&
              !nextSeat.isCoupleSeat
            ) {
              const rowLetter = String.fromCharCode(65 + rowIndex);
              const coupleSeatNumber = `${rowLetter}${colIndex + 1}-${
                colIndex + 2
              }`;

              seats[rowIndex][colIndex] = {
                ...currentSeat,
                seatNumber: coupleSeatNumber,
                isCoupleSeat: true,
                coupleWith: colIndex + 1,
              };

              seats[rowIndex][colIndex + 1] = {
                ...nextSeat,
                seatNumber: coupleSeatNumber,
                isCoupleSeat: true,
                coupleWith: colIndex,
              };
            }
          }
        }

        const layout: SeatLayout = { rows, cols, seats };
        setRawSeatLayout(layout);

        // Load booked seats
        try {
          const bookedSeatsResponse = await bookingService.getBookedSeats(
            showtime.id
          );

          const bookedIds: string[] = Array.isArray(bookedSeatsResponse.data)
            ? bookedSeatsResponse.data
                .map((booking: any) => booking.seatId)
                .filter((id: any) => Boolean(id))
            : [];
          setBookedSeatIds(bookedIds);

          // Get booked seat numbers
          const bookedNumbers: string[] = [];
          bookedIds.forEach((seatId) => {
            let seat = Array.from(newSeatMap.values()).find(
              (s) => s.id === seatId
            );

            if (!seat) {
              const layoutSeat = layout.seats
                .flat()
                .find((s: Seat) => s.id === seatId);
              if (layoutSeat && layoutSeat.seatNumber) {
                bookedNumbers.push(layoutSeat.seatNumber);
                return;
              }
            }

            if (seat && seat.seatNumber) {
              bookedNumbers.push(seat.seatNumber);
            }
          });
          setBookedSeats(bookedNumbers);
        } catch (error: any) {
          if (error.response?.status === 404) {
            setBookedSeatIds([]);
            setBookedSeats([]);
          } else {
            setBookedSeatIds([]);
            setBookedSeats([]);
          }
        }

        // Load held seats
        try {
          const heldSeatsResponse = await bookingService.getHeldSeats(
            showtime.id
          );

          const heldIds = heldSeatsResponse.data.map((h) => h.seatId);
          setHeldSeatIds(heldIds);

          // Get held seat numbers
          const heldNumbers: string[] = [];
          heldIds.forEach((seatId) => {
            let seat = Array.from(newSeatMap.values()).find(
              (s) => s.id === seatId
            );

            if (!seat && seats) {
              const layoutSeat = seats
                .flat()
                .find((s: Seat) => s.id === seatId);
              if (layoutSeat && layoutSeat.seatNumber) {
                heldNumbers.push(layoutSeat.seatNumber);
                return;
              }
            }

            if (seat && seat.seatNumber) {
              heldNumbers.push(seat.seatNumber);
            }
          });
          setHeldSeatNumbers(heldNumbers);
        } catch (err) {
          setHeldSeatIds([]);
          setHeldSeatNumbers([]);
        }
      }

      // If no seatLayout, still try to load booked/held seats
      if (!roomData.seatLayout || !Array.isArray(roomData.seatLayout)) {
        // Load booked seats even if no layout
        try {
          const bookedSeatsResponse = await bookingService.getBookedSeats(
            showtime.id
          );
          const bookedIds: string[] = Array.isArray(bookedSeatsResponse.data)
            ? bookedSeatsResponse.data
                .map((booking: any) => booking.seatId)
                .filter((id: any) => Boolean(id))
            : [];
          setBookedSeatIds(bookedIds);

          const bookedNumbers: string[] = [];
          bookedIds.forEach((seatId) => {
            const seat = Array.from(newSeatMap.values()).find(
              (s) => s.id === seatId
            );
            if (seat && seat.seatNumber) {
              bookedNumbers.push(seat.seatNumber);
            }
          });
          setBookedSeats(bookedNumbers);
        } catch (error: any) {
          setBookedSeatIds([]);
          setBookedSeats([]);
        }

        // Load held seats even if no layout
        try {
          const heldSeatsResponse = await bookingService.getHeldSeats(
            showtime.id
          );
          const heldIds = heldSeatsResponse.data.map((h) => h.seatId);
          setHeldSeatIds(heldIds);

          const heldNumbers: string[] = [];
          heldIds.forEach((seatId) => {
            const seat = Array.from(newSeatMap.values()).find(
              (s) => s.id === seatId
            );
            if (seat && seat.seatNumber) {
              heldNumbers.push(seat.seatNumber);
            }
          });
          setHeldSeatNumbers(heldNumbers);
        } catch (err) {
          setHeldSeatIds([]);
          setHeldSeatNumbers([]);
        }
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

        const isBooked = booked.includes(seat.seatNumber);
        // Calculate price using seatPriceMap if available, otherwise use seat.extraPrice
        const extraPrice =
          seatPriceMap.get(seat.seatNumber) || seat.extraPrice || 0;
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
    if (!selectedShowtime || !seat.seatNumber) {
      return;
    }

    // Handle couple seats (like POS)
    let seatsToProcess: any[] = [];

    if (seat.isCoupleSeat && seat.seatNumber.includes("-")) {
      // Extract individual seat numbers from couple seat number
      const [start, end] = seat.seatNumber.split("-");
      const rowLetter = start[0];
      const startNum = parseInt(start.slice(1));
      const endNum = parseInt(end);

      // Find both seats in the couple
      for (let num = startNum; num <= endNum; num++) {
        const individualSeatNumber = `${rowLetter}${num}`;
        const seatData = seatMap.get(individualSeatNumber);
        if (seatData) {
          seatsToProcess.push(seatData);
        }
      }
    } else {
      // Regular seat
      const seatData = seatMap.get(seat.seatNumber);
      if (seatData) {
        seatsToProcess.push(seatData);
      }
    }

    if (seatsToProcess.length === 0) {
      return;
    }

    // Check if any seat is already booked
    const bookedSeats = seatsToProcess.filter((seatData) =>
      bookedSeatIds.includes(seatData.id)
    );
    if (bookedSeats.length > 0) {
      showToast("Một hoặc nhiều ghế đã được đặt", "error");
      return;
    }

    // Check if all seats are already selected
    const allSelected = seatsToProcess.every((seatData) =>
      selectedSeats.some((s) => s.id === seatData.id)
    );

    try {
      if (allSelected) {
        // Deselect and release all seats
        const seatIdsToRemove = seatsToProcess.map((s) => s.id);
        setSelectedSeats(
          selectedSeats.filter((s) => !seatIdsToRemove.includes(s.id))
        );
        setHeldSeatIds(
          heldSeatIds.filter((id) => !seatIdsToRemove.includes(id))
        );

        // Update held seat numbers for display
        const seatNumbersToRemove = seatsToProcess.map((s) => s.seatNumber);
        setHeldSeatNumbers((prev) =>
          prev.filter((num) => !seatNumbersToRemove.includes(num))
        );

        // Release all seats
        await Promise.all(
          seatsToProcess.map((seatData) =>
            bookingService
              .releaseSeat({
                showtimeId: selectedShowtime.id,
                seatId: seatData.id,
              })
              .catch(() => {})
          )
        );
      } else {
        // Select and hold all seats
        try {
          await Promise.all(
            seatsToProcess.map((seatData) =>
              bookingService.holdSeat({
                showtimeId: selectedShowtime.id,
                seatId: seatData.id,
              })
            )
          );

          // Add seats to selected (convert seatData to Seat format)
          const newSeats: Seat[] = seatsToProcess.map((seatData) => {
            // Find the seat in the layout
            const layoutSeat = rawSeatLayout?.seats
              .flat()
              .find((s) => s.seatNumber === seatData.seatNumber);

            // Calculate seat price: basePrice + extraPrice
            const basePrice = selectedShowtime?.price || 0;
            const extraPrice =
              seatData.extraPrice ||
              seatPriceMap.get(seatData.seatNumber) ||
              layoutSeat?.extraPrice ||
              0;
            const seatPrice = basePrice + extraPrice;

            return {
              row: layoutSeat?.row ?? 0,
              col: layoutSeat?.col ?? 0,
              seatNumber: seatData.seatNumber,
              type: layoutSeat?.type ?? SeatType.NORMAL,
              status: SeatStatus.SELECTED,
              price: seatPrice, // Use calculated price
              id: seatData.id,
              extraPrice: extraPrice,
              isCoupleSeat: layoutSeat?.isCoupleSeat,
              coupleWith: layoutSeat?.coupleWith,
            };
          });

          setSelectedSeats([...selectedSeats, ...newSeats]);
          setHeldSeatIds([...heldSeatIds, ...seatsToProcess.map((s) => s.id)]);

          // Update held seat numbers for display
          const newHeldNumbers = seatsToProcess.map((s) => s.seatNumber);
          setHeldSeatNumbers((prev) => {
            const updated = [...prev, ...newHeldNumbers];
            return [...new Set(updated)];
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

    // Update seat statuses with both booked and held seats
    const updated = updateSeatStatuses(
      rawSeatLayout,
      bookedSeats,
      selectedShowtime.price
    );

    // Also mark held seats in the layout
    const updatedWithHeld = {
      ...updated,
      seats: updated.seats.map((row) =>
        row.map((seat) => {
          if (seat.type === SeatType.EMPTY || seat.type === SeatType.BLOCKED) {
            return seat;
          }

          // Check if seat is held
          const isHeld = heldSeatNumbers.includes(seat.seatNumber);
          const isSelected = selectedSeats.some(
            (s) => s.seatNumber === seat.seatNumber
          );

          return {
            ...seat,
          };
        })
      ),
    };

    setSeatLayout(updatedWithHeld);
  }, [
    rawSeatLayout,
    bookedSeats,
    heldSeatNumbers,
    selectedSeats,
    selectedShowtime,
    seatPriceMap,
  ]);

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

    // Validate that all selected seats have IDs
    const seatsWithIds = selectedSeats.filter((s) => s.id);
    if (seatsWithIds.length !== selectedSeats.length) {
      showToast(
        "Một số ghế không có ID hợp lệ. Vui lòng chọn lại ghế.",
        "error"
      );
      return;
    }

    // Navigate to checkout with booking details
    router.push({
      pathname: "/booking/checkout",
      params: {
        showtimeId: selectedShowtime.id,
        movieId: movieId,
        seats: JSON.stringify(selectedSeats.map((s) => s.seatNumber)),
        seatIds: JSON.stringify(seatsWithIds.map((s) => s.id!)),
        seatDetails: JSON.stringify(
          selectedSeats.map((s) => ({
            seatNumber: s.seatNumber,
            type: s.type,
            extraPrice: s.extraPrice || 0,
            isCoupleSeat: s.isCoupleSeat || false,
          }))
        ),
        combos: JSON.stringify(
          selectedFoodDrinks.map((fd) => ({
            id: fd.id,
            quantity: fd.quantity,
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

  // Get seat status and styling
  const getSeatStatus = useCallback(
    (seat: Seat): "available" | "booked" | "held" | "selected" => {
      if (!seat.seatNumber || seat.type === SeatType.EMPTY) return "available";

      // Check if seat is selected by current user
      const isSelected = selectedSeats.some(
        (s) => s.seatNumber === seat.seatNumber || s.id === seat.id
      );
      if (isSelected) return "selected";

      // For couple seats, check all individual seats
      if (seat.isCoupleSeat && seat.seatNumber.includes("-")) {
        const [start, end] = seat.seatNumber.split("-");
        const rowLetter = start[0];
        const startNum = parseInt(start.slice(1));
        const endNum = parseInt(end);

        for (let num = startNum; num <= endNum; num++) {
          const individualSeatNumber = `${rowLetter}${num}`;
          // Check booked first
          if (bookedSeats.includes(individualSeatNumber)) return "booked";
          // Check held
          if (heldSeatNumbers.includes(individualSeatNumber)) return "held";
        }
      } else {
        // Regular seat
        if (bookedSeats.includes(seat.seatNumber)) return "booked";
        if (heldSeatNumbers.includes(seat.seatNumber)) return "held";
      }

      return "available";
    },
    [bookedSeats, heldSeatNumbers, selectedSeats]
  );

  const getSeatStyle = (
    seat: Seat,
    status: "available" | "booked" | "held" | "selected"
  ) => {
    if (seat.type === SeatType.EMPTY) {
      return isDark
        ? "bg-slate-800/30 border-slate-700/30"
        : "bg-slate-100/50 border-slate-200/50";
    }

    if (seat.type === SeatType.BLOCKED) {
      return "bg-slate-400 border-slate-500 opacity-50";
    }

    switch (status) {
      case "booked":
        return "bg-red-100 border-red-500 opacity-75";
      case "held":
        return "bg-yellow-100 border-yellow-500";
      case "selected":
        return "bg-blue-100 border-blue-500";
      default:
        return isDark
          ? "bg-white border-slate-800"
          : "bg-white border-slate-800";
    }
  };

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

  // Listen for real-time seat updates from server (socket.io) - fetch held and booked seats
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
        // Always re-fetch both held and booked seats on any seat-update event
        const [heldSeatsResponse, bookedSeatsResponse] = await Promise.all([
          bookingService.getHeldSeats(data.showtimeId),
          bookingService.getBookedSeats(data.showtimeId),
        ]);

        // Update held seats
        const newHeldSeatIds = heldSeatsResponse.data.map((h) => h.seatId);
        setHeldSeatIds(newHeldSeatIds);

        // Update held seat numbers for display
        const newHeldNumbers: string[] = [];
        newHeldSeatIds.forEach((seatId) => {
          const seat = Array.from(seatMap.values()).find(
            (s) => s.id === seatId
          );
          if (seat && seat.seatNumber) {
            newHeldNumbers.push(seat.seatNumber);
          }
        });
        setHeldSeatNumbers(newHeldNumbers);

        // Update booked seats
        const bookedIds: string[] = Array.isArray(bookedSeatsResponse.data)
          ? bookedSeatsResponse.data
              .map((booking: any) => booking.seatId)
              .filter((id: any) => Boolean(id))
          : [];
        setBookedSeatIds(bookedIds);

        // Update booked seat numbers for display
        const bookedNumbers: string[] = [];
        bookedIds.forEach((seatId) => {
          const seat = Array.from(seatMap.values()).find(
            (s) => s.id === seatId
          );
          if (seat && seat.seatNumber) {
            bookedNumbers.push(seat.seatNumber);
          }
        });
        setBookedSeats(bookedNumbers);

        // Handle specific status changes
        if (data.status === "booked") {
          // Remove from selected seats if it was selected
          setSelectedSeats((prev) =>
            prev.filter((seat) => seat.id !== data.seatId)
          );
        } else if (data.status === "released") {
          // Check if the seat is no longer held
          if (!newHeldSeatIds.includes(data.seatId)) {
            // Remove from selected seats only if it's no longer held
            setSelectedSeats((prev) => {
              const seat = prev.find((s) => s.id === data.seatId);
              // Only remove if the seat exists and is no longer held
              if (seat && !newHeldSeatIds.includes(data.seatId)) {
                return prev.filter((s) => s.id !== data.seatId);
              }
              return prev;
            });
          }
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
        } catch {
          // ignore cleanup errors
        }
      })();
    };
  }, [selectedShowtime, seatMap]);

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
      {/* Timer in top right corner - shows when timer is active */}
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
                    ? "border-red-600 bg-red-50 dark:bg-red-900/20"
                    : `${borderColor} ${cardBg}`
                }`}
                onPress={() => handleDateSelect(date)}
              >
                <Text
                  className={`text-center ${
                    selectedDate?.fullDate === date.fullDate
                      ? "text-red-600 font-bold"
                      : textMuted
                  }`}
                >
                  {date.dayOfWeek}
                </Text>
                <Text
                  className={`text-center text-lg font-bold ${
                    selectedDate?.fullDate === date.fullDate
                      ? "text-red-600"
                      : textColor
                  }`}
                >
                  {date.dayOfMonth}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Showtime Selection */}
        {selectedDate && (
          <View className={`py-5 border-b ${borderColor}`}>
            <Text className={`text-lg font-semibold ${textColor} px-4 mb-4`}>
              Chọn Giờ Chiếu
            </Text>
            {filteredShowtimes.length === 0 ? (
              <Text className={`${textMuted} text-center py-4`}>
                Không có suất chiếu cho ngày đã chọn
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="px-4"
              >
                {filteredShowtimes.map((showtime) => {
                  const isSelected = selectedShowtime?.id === showtime.id;
                  const startTime = new Date(showtime.startTime);
                  const endTime = new Date(showtime.endTime);

                  return (
                    <TouchableOpacity
                      key={showtime.id}
                      className={`px-4 py-3 mr-3 rounded-xl border-2 ${
                        isSelected
                          ? "border-red-600 bg-red-50 dark:bg-red-900/20"
                          : `${borderColor} ${cardBg}`
                      }`}
                      onPress={() => handleShowtimeSelect(showtime)}
                    >
                      <Text
                        className={`text-center font-bold ${
                          isSelected ? "text-red-600" : textColor
                        }`}
                      >
                        {startTime.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </Text>
                      <Text
                        className={`text-center text-xs mt-1 ${
                          isSelected ? "text-red-600/80" : textMuted
                        }`}
                      >
                        {showtime.language} • {showtime.format}
                      </Text>
                      <Text
                        className={`text-center text-xs mt-1 font-semibold ${
                          isSelected ? "text-red-600" : textColor
                        }`}
                      >
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(showtime.price)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}

        {/* Seat Selection */}
        {selectedShowtime && (
          <View className={`py-5 border-b ${borderColor}`}>
            <Text className={`text-lg font-semibold ${textColor} px-4 mb-4`}>
              Chọn Ghế {room?.name && `- ${room.name}`}
            </Text>
            {loadingSeatMap ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color="#e11d48" />
                <Text className={`${textMuted} mt-4`}>
                  Đang tải sơ đồ ghế...
                </Text>
              </View>
            ) : seatLayout ? (
              <View className="px-4">
                {/* Legend */}
                <View className="flex-row flex-wrap justify-center gap-4 mb-4">
                  <View className="flex-row items-center gap-2">
                    <View className="w-4 h-4 bg-white border-2 border-slate-800 rounded" />
                    <Text className={`${textMuted} text-xs`}>Còn trống</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="w-4 h-4 bg-blue-900 border-2 border-blue-500 rounded" />
                    <Text className={`${textMuted} text-xs`}>Đang chọn</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="w-4 h-4 bg-yellow-700 border-2 border-yellow-500 rounded" />
                    <Text className={`${textMuted} text-xs`}>Đã giữ</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="w-4 h-4 bg-red-900 border-2 border-red-500 rounded" />
                    <Text className={`${textMuted} text-xs`}>Đã đặt</Text>
                  </View>
                </View>

                {/* Screen indicator */}
                <View className="mb-6 items-center">
                  <View
                    className={`px-6 py-2 rounded-full ${
                      isDark ? "bg-slate-800" : "bg-slate-800"
                    }`}
                  >
                    <Text className="text-white text-sm font-semibold">
                      MÀN HÌNH
                    </Text>
                  </View>
                </View>

                {/* Seat Grid Container */}
                <View
                  className={`rounded-lg border-2 border-dashed ${
                    isDark
                      ? "border-slate-700 bg-slate-900/50"
                      : "border-slate-300 bg-slate-50"
                  } p-4`}
                >
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                      {/* Seat rows */}
                      {seatLayout.seats.map((row, rowIndex) => {
                        const rowLetter = String.fromCharCode(65 + rowIndex);
                        return (
                          <View
                            key={rowIndex}
                            className="flex-row items-center mb-1"
                          >
                            {/* Row label (left) */}
                            <View className="w-8 h-12 items-center justify-center mr-2">
                              <Text
                                className={`${textMuted} text-sm font-bold`}
                              >
                                {rowLetter}
                              </Text>
                            </View>

                            {/* Seats in row */}
                            <View className="flex-row gap-1">
                              {row.map((seat, colIndex) => {
                                // Skip rendering the right seat of a couple
                                if (
                                  seat.isCoupleSeat &&
                                  seat.coupleWith !== undefined &&
                                  seat.col > seat.coupleWith
                                ) {
                                  return null;
                                }

                                const isCoupleLeft =
                                  seat.isCoupleSeat &&
                                  seat.coupleWith !== undefined &&
                                  seat.col < seat.coupleWith;

                                const status = getSeatStatus(seat);
                                const seatStyle = getSeatStyle(seat, status);
                                const disabled =
                                  seat.type === SeatType.EMPTY ||
                                  seat.type === SeatType.BLOCKED ||
                                  status === "booked";

                                let iconColor = "#1f2937";
                                let textColor = "#1f2937";

                                if (isCoupleLeft) {
                                  return (
                                    <TouchableOpacity
                                      key={`${rowIndex}-${colIndex}`}
                                      className={`h-12 rounded-lg border-2 ${seatStyle} ${
                                        disabled ? "opacity-75" : ""
                                      }`}
                                      style={{ width: 100 }}
                                      onPress={() => handleSeatToggle(seat)}
                                      disabled={disabled}
                                    >
                                      <View className="flex-1 items-center justify-center">
                                        <MaterialCommunityIcons
                                          name="sofa"
                                          size={16}
                                          color={iconColor}
                                        />
                                        <Text
                                          className={`text-[10px] font-bold mt-0.5`}
                                          style={{ color: textColor }}
                                        >
                                          {seat.seatNumber}
                                        </Text>
                                      </View>
                                    </TouchableOpacity>
                                  );
                                }

                                // Regular seat or empty cell
                                return (
                                  <TouchableOpacity
                                    key={`${rowIndex}-${colIndex}`}
                                    className={`w-12 h-12 rounded-lg border-2 ${seatStyle} ${
                                      disabled ? "opacity-75" : ""
                                    }`}
                                    onPress={() =>
                                      !disabled && handleSeatToggle(seat)
                                    }
                                    disabled={disabled}
                                  >
                                    {seat.type === SeatType.EMPTY ? (
                                      <View className="flex-1 items-center justify-center">
                                        <Text
                                          className={`text-[10px] font-mono ${
                                            isDark
                                              ? "text-slate-500"
                                              : "text-slate-400"
                                          }`}
                                        >
                                          {rowLetter}
                                          {colIndex + 1}
                                        </Text>
                                      </View>
                                    ) : seat.type === SeatType.BLOCKED ? (
                                      <View className="flex-1 items-center justify-center">
                                        <Ionicons
                                          name="close"
                                          size={16}
                                          color={iconColor}
                                        />
                                      </View>
                                    ) : (
                                      <View className="flex-1 items-center justify-center">
                                        {seat.type === SeatType.VIP && (
                                          <FontAwesome6
                                            name="crown"
                                            size={14}
                                            color={iconColor}
                                            style={{ marginBottom: 2 }}
                                          />
                                        )}
                                        {seat.type === SeatType.NORMAL && (
                                          <MaterialCommunityIcons
                                            name="sofa-single"
                                            size={16}
                                            color={iconColor}
                                            style={{ marginBottom: 2 }}
                                          />
                                        )}
                                        {seat.seatNumber && (
                                          <Text
                                            className={`text-[10px] font-bold leading-none mt-0.5`}
                                            style={{ color: textColor }}
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

                            {/* Row label (right) */}
                            <View className="w-8 h-12 items-center justify-center ml-2">
                              <Text
                                className={`${textMuted} text-sm font-bold`}
                              >
                                {rowLetter}
                              </Text>
                            </View>
                          </View>
                        );
                      })}

                      {/* Column numbers */}
                      <View className="flex-row items-center mt-2">
                        <View className="w-8 mr-2" />
                        {Array.from({ length: seatLayout.cols }, (_, index) => (
                          <View
                            key={index}
                            className="w-12 h-6 items-center justify-center"
                          >
                            <Text className={`${textMuted} text-xs font-bold`}>
                              {index + 1}
                            </Text>
                          </View>
                        ))}
                        <View className="w-8 ml-2" />
                      </View>
                    </View>
                  </ScrollView>
                </View>
              </View>
            ) : (
              <Text className={`${textMuted} text-center py-4`}>
                Chưa có sơ đồ ghế
              </Text>
            )}
          </View>
        )}

        {/* Food/Drinks Selection */}
        {selectedShowtime && foodDrinks.length > 0 && (
          <View className={`py-5 border-b ${borderColor}`}>
            <Text className={`text-lg font-semibold ${textColor} px-4 mb-4`}>
              Đồ Ăn & Nước Uống
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-4"
            >
              {foodDrinks.map((foodDrink) => {
                const quantity = getFoodDrinkQuantity(foodDrink.id);
                return (
                  <View
                    key={foodDrink.id}
                    className={`mr-4 ${cardBg} rounded-xl justify-between p-3 border ${borderColor}`}
                    style={{ width: 140 }}
                  >
                    <View>
                      {foodDrink.image && (
                        <Image
                          source={{ uri: foodDrink.image }}
                          className="w-full h-24 rounded-lg mb-2"
                          resizeMode="cover"
                        />
                      )}
                      <Text
                        className={`${textColor} font-semibold text-sm mb-1`}
                        numberOfLines={2}
                      >
                        {foodDrink.name}
                      </Text>
                      <Text className={`${textMuted} text-xs mb-2`}>
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(foodDrink.price)}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <TouchableOpacity
                        className={`w-8 h-8 rounded-lg items-center justify-center ${
                          quantity > 0
                            ? "bg-red-600"
                            : isDark
                              ? "bg-slate-700"
                              : "bg-slate-300"
                        }`}
                        onPress={() =>
                          handleFoodDrinkQuantityChange(foodDrink, -1)
                        }
                        disabled={quantity === 0}
                      >
                        <Ionicons
                          name="remove"
                          size={16}
                          color={quantity > 0 ? "#fff" : iconColor}
                        />
                      </TouchableOpacity>
                      <Text className={`${textColor} font-bold mx-2`}>
                        {quantity}
                      </Text>
                      <TouchableOpacity
                        className="w-8 h-8 bg-red-600 rounded-lg items-center justify-center"
                        onPress={() =>
                          handleFoodDrinkQuantityChange(foodDrink, 1)
                        }
                      >
                        <Ionicons name="add" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Summary */}
        {(selectedSeats.length > 0 || selectedFoodDrinks.length > 0) && (
          <View className={`mx-4 mt-4 mb-4 ${cardBg} rounded-xl p-4`}>
            <Text className={`${textColor} font-bold text-lg mb-3`}>
              Tóm Tắt
            </Text>
            {selectedSeats.length > 0 && (
              <View className="mb-3">
                <Text className={`${textMuted} text-sm mb-2`}>
                  Ghế đã chọn:
                </Text>
                <Text className={`${textColor} font-semibold`}>
                  {selectedSeats.map((s) => s.seatNumber).join(", ")}
                </Text>
              </View>
            )}
            {selectedFoodDrinks.length > 0 && (
              <View className="mb-3">
                <Text className={`${textMuted} text-sm mb-2`}>Đồ ăn/uống:</Text>
                {selectedFoodDrinks.map((fd) => (
                  <Text key={fd.id} className={`${textColor} text-sm`}>
                    {fd.foodDrink.name} x {fd.quantity}
                  </Text>
                ))}
              </View>
            )}
            <View className="flex-row justify-between mt-3 pt-3 border-t border-slate-600/30">
              <Text className={`${textColor} font-bold text-lg`}>Tổng:</Text>
              <Text className={`${textColor} font-bold text-lg`}>
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(totalPrice)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Proceed to Checkout Button */}
      {selectedSeats.length > 0 && (
        <View
          className={`absolute bottom-0 left-0 right-0 px-4 pb-5 pt-3 ${cardBgSecondary} border-t ${borderColor}`}
        >
          <TouchableOpacity
            className="bg-red-600 py-4 rounded-xl items-center"
            onPress={handleProceedToCheckout}
          >
            <Text className="text-white font-bold text-base">
              Tiếp Tục -{" "}
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(totalPrice)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
