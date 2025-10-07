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
import { bookingService } from "@/services/booking";
import { Booking } from "@/types/booking";

export default function MyTickets() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
  });

  const fetchBookings = useCallback(
    async (page: number = 1, isRefresh: boolean = false) => {
      try {
        if (page === 1) {
          isRefresh ? setRefreshing(true) : setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await bookingService.getMyBookings(page, 10);

        if (page === 1) {
          setBookings(response.bookings);
        } else {
          setBookings((prev) => [...prev, ...response.bookings]);
        }

        setPagination({
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          hasNextPage: response.pagination.hasNextPage,
        });
      } catch (error: any) {
        showToast(error.message || "Failed to fetch tickets", "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = useCallback(() => {
    fetchBookings(1, true);
  }, [fetchBookings]);

  const loadMore = useCallback(() => {
    if (!loadingMore && pagination.hasNextPage) {
      fetchBookings(pagination.currentPage + 1);
    }
  }, [fetchBookings, loadingMore, pagination]);

  const handleTicketPress = (booking: Booking) => {
    console.log("Ticket pressed:", booking.id);
  };

  const renderTicketItem = ({ item }: { item: Booking }) => (
    <Ticket booking={item} onPress={() => handleTicketPress(item)} />
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
        No Tickets Yet
      </Text>
      <Text className="text-text-muted text-center mb-6 leading-6">
        You haven't booked any movies yet. Start exploring and book your first
        ticket!
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/(app)/(tabs)/home")}
        className="bg-primary px-8 py-3 rounded-xl"
      >
        <Text className="text-white font-[semibold] text-base">
          Browse Movies
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
            My Tickets
          </Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
          <Text className="text-text-muted mt-4">Loading your tickets...</Text>
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
          My Tickets
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
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderLoadingFooter}
      />

      {/* Tickets Summary */}
      {bookings.length > 0 && (
        <View className="bg-card-background border-t border-border p-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-text-muted text-sm font-[medium]">
              Total Tickets
            </Text>
            <Text className="text-foreground text-lg font-[bold]">
              {bookings.length}
            </Text>
          </View>
          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-text-muted text-sm font-[medium]">
              Total Spent
            </Text>
            <Text className="text-primary text-lg font-[bold]">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(
                bookings.reduce(
                  (total, booking) => total + booking.totalPrice,
                  0
                )
              )}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
