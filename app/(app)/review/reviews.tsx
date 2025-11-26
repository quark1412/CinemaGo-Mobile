import { ReviewItem } from "@/components/review-item";
import { useTheme } from "@/contexts/themeContext";
import { bookingService } from "@/services/booking";
import { movieService } from "@/services/movie";
import { reviewService } from "@/services/review";
import type { Movie } from "@/types/movie";
import type { Review, ReviewOverview } from "@/types/review";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RATING_LABELS = ["1★", "2★", "3★", "4★", "5★"];

export default function ReviewListScreen() {
  const { movieId } = useLocalSearchParams<{ movieId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [overview, setOverview] = useState<ReviewOverview | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canWriteReview, setCanWriteReview] = useState(false);

  const PAGE_SIZE = 10;

  const iconColor = isDark ? "#fff" : "#0f172a";

  useFocusEffect(
    useCallback(() => {
      if (!movieId) return;

      let cancelled = false;

      (async () => {
        try {
          setLoading(true);
          setError(null);
          setCanWriteReview(false);

          const [mv, ov, listRes] = await Promise.all([
            movieService.getMovieById(movieId as string),
            reviewService.getReviewOverview(movieId as string),
            reviewService.getReviews({
              movieId: movieId as string,
              page: 1,
              limit: PAGE_SIZE,
            }),
          ]);

          if (cancelled) return;

          setMovie(mv);
          setOverview(ov);
          setReviews(listRes.data ?? []);
          setPage(1);
          setHasMore(
            (listRes.pagination?.currentPage ?? 1) <
              (listRes.pagination?.totalPages ?? 1)
          );

          // === CHECK getMyBooking: user đã từng đặt vé phim này chưa? ===
          try {
            const limitBooking = 20;
            let bookingPage = 1;
            let found = false;

            while (!cancelled && !found) {
              const bookingRes = await bookingService.getMyBookings(
                bookingPage,
                limitBooking
              );

              // tuỳ API, chỉnh lại field cho đúng:
              const bookings = bookingRes.bookings || [];

              if (!bookings.length) break;

              if (
                bookings.some((b: any) => {
                  const bookingMovieId = b.movieId ?? b.movie?.id;
                  return bookingMovieId === movieId;
                })
              ) {
                found = true;
                break;
              }

              const hasMoreBookings =
                bookingRes.pagination?.hasNextPage ??
                (typeof bookingRes.pagination?.totalPages === "number"
                  ? bookingPage < bookingRes.pagination.totalPages
                  : bookings.length === limitBooking);

              if (!hasMoreBookings) break;
              bookingPage += 1;
            }

            if (!cancelled) {
              setCanWriteReview(found);
            }
          } catch (e) {
            console.error("getMyBooking for review-list error:", e);
            if (!cancelled) setCanWriteReview(false);
          }
        } catch (e) {
          console.error("load review-list error:", e);
          if (!cancelled) setError("Không tải được danh sách đánh giá.");
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [movieId])
  );

  const handleLoadMore = async () => {
    if (!movieId || loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const res = await reviewService.getReviews({
        movieId: movieId as string,
        page: nextPage,
        limit: PAGE_SIZE,
      });

      setReviews((prev) => [...prev, ...(res.data ?? [])]);
      setPage(nextPage);
      setHasMore(
        (res.pagination?.currentPage ?? nextPage) <
          (res.pagination?.totalPages ?? nextPage)
      );
    } catch (e) {
      console.error("loadMore reviews error:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const avgRating =
    (typeof overview?.averageRating === "number"
      ? overview.averageRating
      : Number(overview?.averageRating)) || 0;

  const totalReviews = overview?.totalReviews ?? reviews.length;

  const dist = overview?.ratingDistribution ?? [];
  const maxLen = Math.min(dist.length, 5);
  const bars = Array.from({ length: maxLen }).map((_, idx) => {
    const count = dist[idx] ?? 0;
    return { label: RATING_LABELS[idx] ?? `${idx + 1}★`, count };
  });

  const high = (dist[3] ?? 0) + (dist[4] ?? 0);
  const medium = dist[2] ?? 0;
  const low = (dist[0] ?? 0) + (dist[1] ?? 0);
  const textColor = isDark ? "text-white" : "text-slate-900";
  if (loading && !movie) {
    return (
      <View
        className={`flex-1 items-center justify-center ${isDark ? "dark" : "light"} bg-muted-background`}
      >
        <ActivityIndicator />
        <Text className="mt-2 text-gray-500 text-sm">
          Đang tải danh sách đánh giá...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        className={`flex-1 items-center justify-center ${isDark ? "dark" : "light"} bg-muted-background`}
      >
        <Text className={`text-sm ${textColor}`}>{error}</Text>
      </View>
    );
  }

  return (
    <>
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: isDark ? "#070f20" : "#fde2e8",
        }}
      >
        <View
          style={{
            height: 52,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ position: "absolute", left: 8 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={iconColor} />
          </TouchableOpacity>

          <Text
            numberOfLines={1}
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: iconColor,
            }}
          >
            Đánh giá
          </Text>

          {canWriteReview && (
            <TouchableOpacity
              style={{ position: "absolute", right: 8 }}
              onPress={() =>
                router.push({
                  pathname: "/(app)/review/write-review",
                  params: { movieId },
                })
              }
            >
              <Text
                style={{ color: "#ec4899", fontWeight: "600", fontSize: 13 }}
              >
                Viết đánh giá
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View
        className={`flex-1  ${isDark ? "dark" : "light"} bg-muted-background`}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            className={`m-4 rounded-2xl ${isDark ? "" : "bg-gray-100"} border border-gray-200 p-4`}
          >
            <Text className={`font-[semibold] text-base mb-3 ${textColor}`}>
              Tổng quan đánh giá
            </Text>

            <View className="flex-row">
              <View className="items-center mr-6">
                <Text className="text-3xl font-[extraBold] text-pink-500">
                  {avgRating.toFixed ? avgRating.toFixed(1) : avgRating}
                </Text>
                <Text
                  className={`text-xs ${isDark ? "text-slate-200" : "text-gray-500"} mb-1`}
                >
                  /5
                </Text>
                <Text
                  className={`text-[11px]  ${isDark ? "text-slate-200" : "text-gray-500"}`}
                >
                  ({totalReviews} đánh giá)
                </Text>
              </View>

              <View className="flex-1 justify-center">
                {bars
                  .slice()
                  .reverse()
                  .map((b, idx) => {
                    const pct =
                      totalReviews > 0
                        ? Math.round((b.count / totalReviews) * 100)
                        : 0;
                    const label =
                      RATING_LABELS[bars.length - 1 - idx] ??
                      `${bars.length - idx}★`;
                    return (
                      <View
                        key={label}
                        className="flex-row items-center mb-1.5"
                      >
                        <Text
                          className={`w-8 text-[11px] ${isDark ? "text-slate-200" : "text-gray-600"}`}
                        >
                          {label}
                        </Text>
                        <View className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden mx-2">
                          <View
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              borderRadius: 9999,
                              backgroundColor: "#fb7185",
                            }}
                          />
                        </View>
                        <Text
                          className={`w-10 text-right text-[11px]  ${isDark ? "text-slate-200" : "text-gray-500"}`}
                        >
                          {b.count}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            </View>

            <View className="flex-row flex-wrap mt-3">
              <Tag label={`Tuyệt vời (${high})`} />
              <Tag label={`Ổn áp (${medium})`} />
              <Tag label={`Bình thường (${low})`} />
            </View>
          </View>

          {/* Danh sách bài viết */}
          <View className="px-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className={`font-[bold] text-base ${textColor}`}>
                Danh sách bài viết
              </Text>
              <Text
                className={`text-xs   ${isDark ? "text-white" : "text-gray-500"} `}
              >
                {totalReviews} bài viết
              </Text>
            </View>

            {reviews.map((rv) => (
              <ReviewItem key={rv.id} data={rv} />
            ))}

            {hasMore && (
              <TouchableOpacity
                className="mt-2 mb-4 self-center px-4 py-2 rounded-full border border-pink-500"
                onPress={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#ec4899" />
                ) : (
                  <Text className="text-pink-600 text-sm font-semibold">
                    Xem thêm
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {!reviews.length && !loading && (
              <Text className="text-center text-gray-500 text-sm mt-8">
                Chưa có đánh giá nào cho phim này.
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

// small chip
function Tag({ label }: { label: string }) {
  return (
    <View className="bg-pink-50 border border-pink-200 rounded-full px-3 py-1 mr-2 mb-2">
      <Text className="text-[11px] text-pink-700 font-medium">{label}</Text>
    </View>
  );
}
