import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
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

export default function MyTickets() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const response = await bookingService.getMyBookings();
      const allBookings = response.data as ServiceBooking[];

      const convertedBookings: Booking[] = allBookings.map((serviceBooking) => {
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
        } as Booking;
      });

      setBookings(convertedBookings);
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

  const renderTicketItem = ({ item }: { item: Booking }) => (
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

      {/* Tickets List */}
      <FlatList
        data={bookings}
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

      {/* Tickets Summary */}
      {loading ? (
        <View className="bg-card-background border-t border-border p-4">
          <ActivityIndicator size="small" color={isDark ? "#fff" : "#000"} />
        </View>
      ) : (
        bookings.length > 0 && (
          <View className="bg-card-background border-t border-border p-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-text-muted text-sm font-[medium]">
                Tổng số vé
              </Text>
              <Text className="text-foreground text-lg font-[bold]">
                {bookings.length}
              </Text>
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-text-muted text-sm font-[medium]">
                Tổng tiền
              </Text>
              <Text className="text-primary text-lg font-[bold]">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(
                  bookings.reduce(
                    (total, booking) => total + booking.totalPrice,
                    0
                  )
                )}
              </Text>
            </View>
          </View>
        )
      )}
    </SafeAreaView>
  );
}
