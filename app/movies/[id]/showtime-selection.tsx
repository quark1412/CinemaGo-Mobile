import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { showtimeSelectionService } from "@/services/showtime-selection";
import {
  Showtime,
  SeatLayout,
  Seat,
  SeatStatus,
  SeatType,
  DateOption,
} from "@/types/showtime";
import { useToast } from "@/contexts/toastContext";

const { width } = Dimensions.get("window");

export default function ShowtimeSelectionScreen() {
  const { id: movieId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

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

  // Generate date options (today + next 6 days)
  const dateOptions = useMemo<DateOption[]>(() => {
    const options: DateOption[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" });
      const dayOfMonth = date.getDate().toString();
      const fullDate = date.toISOString().split("T")[0];

      options.push({
        date,
        dayOfWeek,
        dayOfMonth,
        fullDate,
      });
    }

    return options;
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
    return selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  }, [selectedSeats]);

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

    // For couple seats, handle both seats together
    if (isCoupleSeatPair(seat) && seat.coupleWith !== undefined && seatLayout) {
      const coupleSeat = seatLayout.seats[seat.row][seat.coupleWith];

      const isBothSelected =
        selectedSeats.some((s) => s.row === seat.row && s.col === seat.col) &&
        selectedSeats.some(
          (s) => s.row === coupleSeat.row && s.col === coupleSeat.col
        );

      if (isBothSelected) {
        // Deselect both couple seats
        setSelectedSeats(
          selectedSeats.filter(
            (s) =>
              !(
                (s.row === seat.row && s.col === seat.col) ||
                (s.row === coupleSeat.row && s.col === coupleSeat.col)
              )
          )
        );
      } else {
        // Select both couple seats
        const newSeats = selectedSeats.filter(
          (s) =>
            !(
              (s.row === seat.row && s.col === seat.col) ||
              (s.row === coupleSeat.row && s.col === coupleSeat.col)
            )
        );
        setSelectedSeats([...newSeats, seat, coupleSeat]);
      }
    } else {
      // Regular single seat
      const isSelected = selectedSeats.some(
        (s) => s.row === seat.row && s.col === seat.col
      );

      if (isSelected) {
        // Deselect seat
        setSelectedSeats(
          selectedSeats.filter((s) => s.row !== seat.row || s.col !== seat.col)
        );
      } else {
        // Select seat
        setSelectedSeats([...selectedSeats, seat]);
      }
    }
  };

  const handleProceedToCheckout = () => {
    if (selectedSeats.length === 0 || !selectedShowtime) {
      return;
    }

    // Navigate to checkout with booking details
    router.push({
      pathname: "/booking/checkout",
      params: {
        showtimeId: selectedShowtime.id,
        movieId: movieId,
        seats: JSON.stringify(selectedSeats.map((s) => s.seatNumber)),
        totalPrice: totalPrice.toString(),
      },
    });
  };

  const getSeatIcon = (type: SeatType) => {
    switch (type) {
      case SeatType.NORMAL:
        return "🪑";
      case SeatType.VIP:
        return "👑";
      case SeatType.COUPLE:
        return "🛋️";
      case SeatType.BLOCKED:
        return "🚫";
      default:
        return "";
    }
  };

  const isCoupleSeatPair = (seat: Seat): boolean => {
    return seat.type === SeatType.COUPLE && seat.isCoupleSeat === true;
  };

  const isLeftCoupleSet = (seat: Seat, seatLayout: SeatLayout): boolean => {
    if (!isCoupleSeatPair(seat)) return false;
    if (seat.coupleWith === undefined) return false;
    return seat.col < seat.coupleWith;
  };

  const getSeatStyle = (seat: Seat) => {
    if (seat.type === SeatType.EMPTY) {
      return styles.seatEmpty;
    }

    const isSelected = selectedSeats.some(
      (s) => s.row === seat.row && s.col === seat.col
    );

    // Handle couple seats - render only the left seat
    if (isCoupleSeatPair(seat)) {
      const isLeft = seatLayout ? isLeftCoupleSet(seat, seatLayout) : true;

      if (!isLeft) {
        // Right seat of couple - hide it
        return styles.seatHidden;
      }

      // Left seat of couple - wider style
      if (isSelected) {
        return [styles.seatCouple, styles.coupleSeatWide, styles.seatSelected];
      }
      if (seat.status === SeatStatus.BOOKED) {
        return [styles.seatCouple, styles.coupleSeatWide, styles.seatBooked];
      }
      return [styles.seatCouple, styles.coupleSeatWide];
    }

    // Regular single seats
    if (isSelected) {
      return [styles.seat, styles.seatSelected];
    }

    if (seat.status === SeatStatus.BOOKED) {
      return [styles.seat, styles.seatBooked];
    }

    // Available seats with type-based colors
    switch (seat.type) {
      case SeatType.VIP:
        return [styles.seat, styles.seatVip];
      case SeatType.BLOCKED:
        return [styles.seat, styles.seatBlocked];
      default:
        return [styles.seat, styles.seatAvailable];
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e11d48" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Showtime & Seats</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Movie Information */}
        {movieDetails && (
          <View style={styles.movieInfo}>
            <Text style={styles.movieTitle}>{movieDetails.title}</Text>
            {cinemaDetails && (
              <Text style={styles.cinemaName}>
                {cinemaDetails.name} • {cinemaDetails.address}
              </Text>
            )}
          </View>
        )}

        {/* Date Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dateScroller}
          >
            {dateOptions.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateItem,
                  selectedDate?.fullDate === date.fullDate &&
                    styles.dateItemSelected,
                ]}
                onPress={() => handleDateSelect(date)}
              >
                <Text
                  style={[
                    styles.dayOfWeek,
                    selectedDate?.fullDate === date.fullDate &&
                      styles.dateTextSelected,
                  ]}
                >
                  {date.dayOfWeek}
                </Text>
                <Text
                  style={[
                    styles.dayOfMonth,
                    selectedDate?.fullDate === date.fullDate &&
                      styles.dateTextSelected,
                  ]}
                >
                  {date.dayOfMonth}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Showtime Selector */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Showtime</Text>
            {filteredShowtimes.length === 0 ? (
              <Text style={styles.noShowtimes}>
                No showtimes available for this date
              </Text>
            ) : (
              <View style={styles.showtimeGrid}>
                {filteredShowtimes.map((showtime) => (
                  <TouchableOpacity
                    key={showtime.id}
                    style={[
                      styles.showtimeItem,
                      selectedShowtime?.id === showtime.id &&
                        styles.showtimeItemSelected,
                    ]}
                    onPress={() => handleShowtimeSelect(showtime)}
                  >
                    <Text
                      style={[
                        styles.showtimeText,
                        selectedShowtime?.id === showtime.id &&
                          styles.showtimeTextSelected,
                      ]}
                    >
                      {new Date(showtime.startTime).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        }
                      )}
                    </Text>
                    <Text
                      style={[
                        styles.showtimeFormat,
                        selectedShowtime?.id === showtime.id &&
                          styles.showtimeTextSelected,
                      ]}
                    >
                      {showtime.format} • {showtime.language}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Seat Map */}
        {selectedShowtime && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Seats</Text>

            {loadingSeatMap ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#e11d48" />
              </View>
            ) : seatLayout && seatLayout.seats.length > 0 ? (
              <>
                {/* Screen Indicator */}
                <View style={styles.screenContainer}>
                  <View style={styles.screen} />
                  <Text style={styles.screenText}>SCREEN</Text>
                </View>

                {/* Seat Grid */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.seatMapContainer}>
                    {seatLayout.seats.map((row, rowIndex) => (
                      <View key={rowIndex} style={styles.seatRow}>
                        {row.map((seat, colIndex) => {
                          const seatStyle = getSeatStyle(seat);

                          // Skip rendering right seat of couple pair
                          if (
                            Array.isArray(seatStyle) &&
                            seatStyle.some((s) => s === styles.seatHidden)
                          ) {
                            return null;
                          }

                          const isCouple = isCoupleSeatPair(seat);
                          const isSelected = selectedSeats.some(
                            (s) => s.row === seat.row && s.col === seat.col
                          );

                          return (
                            <TouchableOpacity
                              key={`${rowIndex}-${colIndex}`}
                              style={seatStyle}
                              onPress={() => handleSeatToggle(seat)}
                              disabled={
                                seat.status === SeatStatus.BOOKED ||
                                seat.type === SeatType.EMPTY ||
                                seat.type === SeatType.BLOCKED
                              }
                            >
                              {seat.type !== SeatType.EMPTY && (
                                <View style={styles.seatContent}>
                                  {isCouple ? (
                                    <>
                                      <Text style={styles.seatIcon}>🛋️</Text>
                                      <Text style={styles.seatNumber}>
                                        {seat.seatNumber}
                                      </Text>
                                    </>
                                  ) : (
                                    <Text style={styles.seatNumber}>
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
                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendBox, styles.seatAvailable]} />
                    <Text style={styles.legendText}>Available</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendBox, styles.seatSelected]} />
                    <Text style={styles.legendText}>Selected</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendBox, styles.seatBooked]} />
                    <Text style={styles.legendText}>Booked</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendBox, styles.seatVip]} />
                    <Text style={styles.legendText}>VIP</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendBox, styles.seatCouple]} />
                    <Text style={styles.legendText}>Couple</Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.noSeats}>No seat layout available</Text>
            )}
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Checkout Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.selectionSummary}>
            <Text style={styles.selectedSeatsLabel}>
              {selectedSeats.length === 0
                ? "Select your seats"
                : `Seats: ${selectedSeatNumbers}`}
            </Text>
            <Text style={styles.totalPrice}>
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(totalPrice)}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.checkoutButton,
              selectedSeats.length === 0 && styles.checkoutButtonDisabled,
            ]}
            onPress={handleProceedToCheckout}
            disabled={selectedSeats.length === 0}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#94a3b8",
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  movieInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  movieTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  cinemaName: {
    fontSize: 14,
    color: "#94a3b8",
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dateScroller: {
    paddingHorizontal: 16,
  },
  dateItem: {
    width: 70,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#334155",
    alignItems: "center",
    backgroundColor: "#1e293b",
  },
  dateItemSelected: {
    backgroundColor: "#e11d48",
    borderColor: "#e11d48",
  },
  dayOfWeek: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 4,
  },
  dayOfMonth: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  dateTextSelected: {
    color: "#fff",
  },
  showtimeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  showtimeItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#334155",
    backgroundColor: "#1e293b",
    minWidth: 100,
    alignItems: "center",
  },
  showtimeItemSelected: {
    backgroundColor: "#e11d48",
    borderColor: "#e11d48",
  },
  showtimeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  showtimeFormat: {
    fontSize: 12,
    color: "#94a3b8",
  },
  showtimeTextSelected: {
    color: "#fff",
  },
  noShowtimes: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
    paddingVertical: 20,
  },
  screenContainer: {
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  screen: {
    width: width - 64,
    height: 4,
    backgroundColor: "#e11d48",
    borderRadius: 2,
    marginBottom: 8,
  },
  screenText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    letterSpacing: 2,
  },
  seatMapContainer: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  seatRow: {
    flexDirection: "row",
    marginBottom: 8,
    justifyContent: "center",
  },
  seat: {
    width: 32,
    height: 32,
    marginHorizontal: 4,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  seatEmpty: {
    width: 32,
    height: 32,
    marginHorizontal: 4,
  },
  seatHidden: {
    width: 0,
    height: 0,
    margin: 0,
    opacity: 0,
  },
  coupleSeatWide: {
    width: 68, // 32 * 2 + 4 (margin between)
  },
  seatAvailable: {
    backgroundColor: "#334155",
    borderColor: "#475569",
  },
  seatSelected: {
    backgroundColor: "#e11d48",
    borderColor: "#be123c",
  },
  seatBooked: {
    backgroundColor: "#64748b",
    borderColor: "#475569",
    opacity: 0.5,
  },
  seatVip: {
    backgroundColor: "#f59e0b",
    borderColor: "#d97706",
  },
  seatCouple: {
    backgroundColor: "#ec4899",
    borderColor: "#db2777",
  },
  seatBlocked: {
    backgroundColor: "#ef4444",
    borderColor: "#dc2626",
    opacity: 0.5,
  },
  seatContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  seatIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  seatNumber: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  noSeats: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
    paddingVertical: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1e293b",
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingBottom: 20,
  },
  footerContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  selectionSummary: {
    marginBottom: 12,
  },
  selectedSeatsLabel: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 4,
  },
  totalPrice: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  checkoutButton: {
    backgroundColor: "#e11d48",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  checkoutButtonDisabled: {
    backgroundColor: "#64748b",
    opacity: 0.5,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
