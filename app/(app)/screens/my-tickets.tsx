import { useCallback, useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/contexts/themeContext";
import { useToast } from "@/contexts/toastContext";
import { Ticket } from "@/components/ticket";
import { bookingService, Booking as ServiceBooking } from "@/services/booking";
import { Booking } from "@/types/booking";
import { generateBookingQRData } from "@/utils/qrCodeHelpers";
import { showtimeSelectionService } from "@/services/showtime-selection";
import { formatDate } from "@/utils/dayUtils";

interface BookingWithDate extends Booking {
  showtimeDate?: string;
}

export default function MyTickets() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<BookingWithDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const response = await bookingService.getMyBookings();
      const allBookings = response.data as ServiceBooking[];

      // Fetch showtime details
      const bookingsWithDates = await Promise.all(
        allBookings.map(async (serviceBooking) => {
          let showtimeDate: string | undefined;
          try {
            const showtimeDetails =
              await showtimeSelectionService.getShowtimeById(
                serviceBooking.showtimeId
              );
            const showtimeDateObj = new Date(showtimeDetails.startTime);
            showtimeDate = showtimeDateObj.toISOString().split("T")[0];
          } catch (error) {
            console.warn(
              `Failed to fetch showtime for booking ${serviceBooking.id}:`,
              error
            );
          }

          // Generate QR code data
          try {
            generateBookingQRData({
              id: serviceBooking.id,
              userId: serviceBooking.userId,
              showtimeId: serviceBooking.showtimeId,
              totalPrice: serviceBooking.totalPrice,
              bookingSeats: serviceBooking.bookingSeats.map((seat) => ({
                seatId: seat.seatId,
              })),
              createdAt:
                serviceBooking.createdAt instanceof Date
                  ? serviceBooking.createdAt
                  : new Date(serviceBooking.createdAt),
            });
          } catch (error) {
            console.error(
              `Failed to generate QR code for booking ${serviceBooking.id}:`,
              error
            );
          }

          return {
            id: serviceBooking.id,
            userId: serviceBooking.userId,
            showtimeId: serviceBooking.showtimeId,
            totalPrice: serviceBooking.totalPrice,
            bookingSeats: serviceBooking.bookingSeats.map((seat) => ({
              id: seat.id,
              bookingId: serviceBooking.id,
              booking: {} as Booking,
              seatId: seat.seatId,
              showtimeId: seat.showtimeId,
              createdAt: serviceBooking.createdAt,
              updatedAt: serviceBooking.updatedAt,
            })),
            createdAt:
              serviceBooking.createdAt instanceof Date
                ? serviceBooking.createdAt
                : new Date(serviceBooking.createdAt),
            updatedAt:
              serviceBooking.updatedAt instanceof Date
                ? serviceBooking.updatedAt
                : new Date(serviceBooking.updatedAt),
            showtimeDate,
            ...(serviceBooking.bookingFoodDrinks && {
              bookingFoodDrinks: serviceBooking.bookingFoodDrinks,
            }),
          } as BookingWithDate;
        })
      );

      bookingsWithDates.sort((a, b) => {
        if (!a.showtimeDate && !b.showtimeDate) return 0;
        if (!a.showtimeDate) return 1;
        if (!b.showtimeDate) return -1;
        return b.showtimeDate.localeCompare(a.showtimeDate);
      });

      setBookings(bookingsWithDates);
    } catch (error: any) {
      showToast(error.message || "Failed to fetch tickets", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = useCallback(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Group bookings by date
  const groupedBookings = useMemo(() => {
    const groups: Record<string, BookingWithDate[]> = {};
    bookings.forEach((booking) => {
      const date = booking.showtimeDate || "Không xác định";
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(booking);
    });
    return groups;
  }, [bookings]);

  // Get available dates
  const availableDates = useMemo(() => {
    return Object.keys(groupedBookings).sort((a, b) => {
      if (a === "Không xác định") return 1;
      if (b === "Không xác định") return -1;
      return b.localeCompare(a);
    });
  }, [groupedBookings]);

  // Filtered bookings based on selected date
  const filteredBookings = useMemo(() => {
    if (!selectedDate) return bookings;
    return groupedBookings[selectedDate] || [];
  }, [selectedDate, groupedBookings, bookings]);

  // Set default selected date
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  const renderTicketItem = ({ item }: { item: BookingWithDate }) => (
    <Ticket booking={item} />
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-8 py-16">
      <View className="bg-muted-background w-32 h-32 rounded-full items-center justify-center mb-6">
        <Ionicons
          name="ticket-outline"
          size={64}
          color={isDark ? "#9ca3af" : "#6b7280"}
        />
      </View>
      <Text className="text-xl font-[bold] text-foreground text-center mb-2">
        Bạn chưa có vé nào
      </Text>
      <Text className="text-text-muted text-center mb-6 leading-6">
        Bạn chưa có vé nào. Bắt đầu khám phá và đặt vé của bạn!
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/(app)/(tabs)/home")}
        className="bg-primary px-8 py-3 rounded-xl"
      >
        <Text className="text-white font-[semibold] text-base">
          Khám phá phim
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={isDark ? "#fff" : "#000"} />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        className={`flex-1 ${isDark ? "dark" : "light"} bg-background`}
      >
        <View className="flex-row p-4 border-b border-border">
          <Text className="text-xl ml-4 w-full text-center font-[bold] text-foreground">
            Vé của tôi
          </Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
          <Text className="text-text-muted mt-4">Đang tải vé của bạn...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "dark" : "light"} bg-background`}
    >
      {/* Header */}
      <View className="flex-row p-4 border-b border-border relative">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-lg"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
            }}
            color={isDark ? "#fff" : "#1f2937"}
          />
        </TouchableOpacity>
        <Text className="text-xl w-full text-center font-[bold] text-foreground">
          Vé của tôi
        </Text>
      </View>

      {/* Date Selector */}
      {availableDates.length > 0 && (
        <View
          className={`px-4 py-3 border-b ${
            isDark
              ? "border-slate-700 bg-slate-900"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {availableDates.map((date: string) => {
              const isSelected = selectedDate === date;
              const ticketCount = groupedBookings[date]?.length || 0;
              const dateObj = date !== "Không xác định" ? new Date(date) : null;
              const displayDate = dateObj
                ? formatDate(dateObj)
                : "Không xác định";

              return (
                <TouchableOpacity
                  key={date}
                  onPress={() => setSelectedDate(date)}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    isSelected
                      ? isDark
                        ? "bg-red-600 border-red-600"
                        : "bg-red-600 border-red-600"
                      : isDark
                        ? "bg-slate-800 border-slate-600"
                        : "bg-white border-gray-300"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isSelected
                        ? "text-white"
                        : isDark
                          ? "text-slate-300"
                          : "text-gray-700"
                    }`}
                  >
                    {displayDate}
                  </Text>
                  <Text
                    className={`text-xs mt-1 ${
                      isSelected
                        ? "text-white/80"
                        : isDark
                          ? "text-slate-400"
                          : "text-gray-500"
                    }`}
                  >
                    {ticketCount} vé
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Tickets List */}
      <FlatList
        data={filteredBookings}
        renderItem={renderTicketItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 16,
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "#fff" : "#000"}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderLoadingFooter}
      />
    </SafeAreaView>
  );
}
