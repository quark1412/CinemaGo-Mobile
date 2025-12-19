import { ReviewItem } from "@/components/review-item";
import TrailerModal from "@/components/trailer-modal";
import { useTheme } from "@/contexts/themeContext";
import { movieService } from "@/services/movie";
import { reviewService } from "@/services/review";
import type { Movie } from "@/types/movie";
import type { Review, ReviewOverview } from "@/types/review";
import { handleMovieTrailerPress } from "@/utils/trailerHelper";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const formatDate = (value?: string | Date | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export default function MovieDetail() {
  const { id } = useLocalSearchParams();
  console.log(id);

  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reviewOverview, setReviewOverview] = useState<ReviewOverview | null>(
    null
  );
  // const [canWriteReview, setCanWriteReview] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await movieService.getMovieById(id as string);
        console.log(data);

        if (!cancelled) setMovie(data);
      } catch (e) {
        console.error("getMovieById error:", e);
        if (!cancelled) {
          setError("Không tải được thông tin phim.");
          setMovie(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (!movie?.id) return;

      let cancelled = false;

      (async () => {
        try {
          setLoadingReviews(true);
          const [overviewRes, reviewsRes] = await Promise.all([
            reviewService.getReviewOverview(movie.id),
            reviewService.getReviews({
              movieId: movie.id,
              page: 1,
              limit: 1,
            }),
          ]);

          if (cancelled) return;
          setReviewOverview(overviewRes);
          console.log(overviewRes);

          setReviews(reviewsRes.data ?? []);
        } catch (e) {
          console.error("getReviews error:", e);
          if (!cancelled) {
            setReviewOverview(null);
            setReviews([]);
          }
        } finally {
          if (!cancelled) setLoadingReviews(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [movie?.id])
  );

  // useEffect(() => {
  //   if (!movie?.id) return;

  //   let cancelled = false;

  //   (async () => {
  //     try {
  //       setCanWriteReview(false);

  //       const limit = 20;
  //       let page = 1;
  //       let found = false;

  //       while (!cancelled && !found) {
  //         const res = await bookingService.getMyBookings(page, limit);

  //         const bookings = res.bookings || [];

  //         if (!bookings.length) {
  //           break;
  //         }

  //         if (
  //           bookings.some((b: any) => {
  //             const bookingMovieId = b.movieId ?? b.movie?.id;
  //             return bookingMovieId === movie.id;
  //           })
  //         ) {
  //           found = true;
  //           break;
  //         }

  //         const hasMore =
  //           res.pagination?.hasNextPage ??
  //           (typeof res.pagination?.totalPages === "number"
  //             ? page < res.pagination.totalPages
  //             : bookings.length === limit);

  //         if (!hasMore) break;

  //         page += 1;
  //       }

  //       if (!cancelled) {
  //         setCanWriteReview(found);
  //         // setCheckingBooking(false);
  //       }
  //     } catch (e) {
  //       console.error("getMyBooking error:", e);
  //       if (!cancelled) {
  //         setCanWriteReview(false);
  //         // setCheckingBooking(false);
  //       }
  //     }
  //   })();

  //   return () => {
  //     cancelled = true;
  //   };
  // }, [movie?.id]);

  if (!movie) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Không tìm thấy dữ liệu phim.</Text>
      </View>
    );
  }
  const genreBgClass = isDark ? "bg-slate-700" : "bg-slate-300";
  const genreTextClass = isDark ? "text-slate-100" : "text-slate-800";
  const textColor = isDark ? "text-white" : "text-slate-900";

  const onPressTrailer = () => {
    if (!movie.trailerUrl) return;

    handleMovieTrailerPress(
      { title: movie.title, trailerUrl: movie.trailerUrl },
      (optimizedUrl) => {
        setTrailerUrl(optimizedUrl);
        setShowTrailerModal(true);
      }
    );
  };

  const avgRating =
    (typeof reviewOverview?.averageRating === "number"
      ? reviewOverview.averageRating
      : Number(reviewOverview?.averageRating)) ||
    (movie as any).rating ||
    0;

  const totalReviews =
    reviewOverview?.totalReviews || (movie as any).reviews || 0;

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
            <Ionicons
              name="chevron-back"
              size={24}
              color={isDark ? "#f9fafb" : "#0f172a"}
            />
          </TouchableOpacity>

          <Text
            numberOfLines={1}
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: isDark ? "#f9fafb" : "#0f172a",
            }}
          >
            {movie?.title ?? "Chi tiết phim"}
          </Text>
        </View>
      </View>

      {loading && !movie ? (
        <View
          className={`flex-1 items-center justify-center  ${isDark ? "dark" : "light"} bg-muted-background`}
        >
          <ActivityIndicator />
          <Text className="mt-2 text-gray-500 text-sm">
            Đang tải thông tin phim...
          </Text>
        </View>
      ) : error || !movie ? (
        <View
          className={`flex-1 items-center justify-center  ${isDark ? "dark" : "light"} bg-muted-background`}
        >
          <Text className="text-sm text-gray-600">
            {error || "Không tìm thấy dữ liệu phim."}
          </Text>
        </View>
      ) : (
        <View
          className={`flex-1  ${isDark ? "dark" : "light"} bg-muted-background`}
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingBottom: 80 + insets.bottom,
            }}
          >
            <View className="p-4">
              <View className="flex-row">
                <View className="mr-4">
                  <View className="relative">
                    <Image
                      source={{ uri: movie.thumbnail }}
                      style={{ width: 140, height: 220, borderRadius: 12 }}
                    />
                  </View>
                </View>

                <View className="flex-1">
                  <Text
                    className={`text-lg font-[extraBold] ${textColor}`}
                    numberOfLines={2}
                  >
                    {movie.title}
                  </Text>

                  <View className="flex-row items-center flex-wrap mt-1">
                    {!!movie.genres &&
                      movie.genres.map((g) => (
                        <View
                          key={g.id ?? g.name}
                          className={`px-2 py-0.5 rounded-full ${genreBgClass} mr-1 mb-1`}
                        >
                          <Text className={`text-[10px] ${genreTextClass}`}>
                            {g.name}
                          </Text>
                        </View>
                      ))}
                  </View>

                  {!!movie.description && (
                    <Text
                      className={`mt-2 text-[11px] text-gray-600 ${textColor}`}
                      numberOfLines={2}
                    >
                      {movie.description}
                    </Text>
                  )}

                  <View className="flex-row mt-3">
                    <TouchableOpacity
                      className="flex-row flex-1 items-center justify-center border border-pink-500 rounded-full py-1.5"
                      onPress={onPressTrailer}
                      disabled={!movie.trailerUrl}
                    >
                      <Ionicons
                        name="play-circle-outline"
                        size={16}
                        color="#ec4899"
                      />
                      <Text className="ml-1 text-[12px] font-semibold text-pink-600">
                        Xem Trailer
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="mt-3 pt-2 border-t border-gray-100">
                    <View className="flex-row items-center mb-1.5">
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color="#6b7280"
                      />
                      <Text
                        className={`ml-1 text-[12px] font-semibold  ${isDark ? "text-gray-300" : "text-gray-800"}`}
                      >
                        {formatDate(movie.releaseDate)}
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={14} color="#6b7280" />
                      <Text
                        className={`ml-1 text-[12px] font-semibold ${isDark ? "text-gray-300" : "text-gray-800"}`}
                      >
                        {movie.duration} phút
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View
                className={`mt-6  ${isDark ? "dark" : "light"} bg-card-background rounded-xl p-4 border border-gray-200 flex-row items-center justify-between`}
              >
                <View className="flex-row items-baseline">
                  <Text className={`text-xl font-[bold] ${textColor}`}>
                    ⭐ {avgRating.toFixed ? avgRating.toFixed(1) : avgRating}
                    /5
                  </Text>
                  <Text
                    className={`text-gray-500 ml-2 text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}
                  >
                    ({totalReviews} đánh giá)
                  </Text>
                </View>
                {loadingReviews && (
                  <ActivityIndicator size="small" color="#9CA3AF" />
                )}
              </View>

              <View className="mt-6">
                <Text className={`text-lg font-[bold] mb-1 ${textColor}`}>
                  Nội dung phim
                </Text>
                <Text
                  className={`leading-5 ${isDark ? "text-gray-300" : "text-gray-800"}`}
                >
                  {movie.description}
                </Text>
              </View>

              <View className="mt-8">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className={`text-lg font-[bold] ${textColor}`}>
                    Đánh giá
                  </Text>

                  <TouchableOpacity
                    onPress={() => {
                      router.push({
                        pathname: "/(app)/review/write-review",
                        params: { movieId: movie.id },
                      });
                    }}
                  >
                    <Text className="text-pink-600 font-semibold">
                      Viết đánh giá
                    </Text>
                  </TouchableOpacity>
                </View>

                {loadingReviews ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#9CA3AF" />
                    <Text
                      className={`ml-2 text-xs ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Đang tải bình luận...
                    </Text>
                  </View>
                ) : reviews.length > 0 ? (
                  <>
                    {reviews.map((r) => (
                      <ReviewItem key={r.id} data={r} />
                    ))}

                    {totalReviews > reviews.length && (
                      <TouchableOpacity
                        className="mt-3 self-center"
                        onPress={() =>
                          router.push({
                            pathname: "/(app)/review/reviews",
                            params: { movieId: movie.id },
                          })
                        }
                      >
                        <Text className="text-pink-600 font-semibold text-sm">
                          Xem thêm bình luận
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <Text
                    className={`text-sm italic ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Hiện chưa có bình luận nào.
                  </Text>
                )}
              </View>
            </View>
          </ScrollView>

          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 8,
              paddingTop: 8,
              backgroundColor: isDark ? "#070f20" : "#fff",
              borderTopWidth: 1,
              borderColor: isDark ? "#1f2937" : "#e5e7eb",
            }}
          >
            <TouchableOpacity
              className="bg-pink-600 rounded-xl py-3"
              onPress={() => {
                router.push({
                  pathname: "/movies/[id]/showtime-selection",
                  params: { id: movie.id },
                });
              }}
            >
              <Text className="text-center text-white font-semibold text-[16px]">
                Mua vé
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TrailerModal
        visible={showTrailerModal && !!trailerUrl}
        trailerUrl={trailerUrl}
        onClose={() => setShowTrailerModal(false)}
      />
    </>
  );
}
