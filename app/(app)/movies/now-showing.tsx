import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Import các service và component của bạn
import { MovieItem } from "@/components/movie-item"; // Hãy sửa đường dẫn import cho đúng
import { useTheme } from "@/contexts/themeContext"; // Nếu có dùng theme
import { movieService } from "@/services/movie";
import { Movie } from "@/types/movie";

export default function NowShowingScreen() {
  const router = useRouter();
  // Nếu bạn có context theme, nếu không thì cứ hardcode màu
  const { isDark } = useTheme();

  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Hàm gọi API lấy phim
  const fetchMovies = async (pageNum: number) => {
    try {
      const res = await movieService.getAllMovies({
        page: pageNum,
        limit: 10, // Lấy 10 phim mỗi lần
        status: "NOW_SHOWING", // <--- QUAN TRỌNG: Chỉ lấy phim đang chiếu
      });

      const newMovies = res.data ?? [];
      const pagination = res.pagination;

      if (pageNum === 1) {
        setMovies(newMovies);
      } else {
        setMovies((prev) => [...prev, ...newMovies]);
      }

      // Kiểm tra xem còn trang sau không
      if (!pagination || !pagination.hasNextPage) {
        setHasNextPage(false);
      }
    } catch (error) {
      console.log("Lỗi tải phim đang chiếu:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Gọi lần đầu khi vào màn hình
  useEffect(() => {
    fetchMovies(1);
  }, []);

  // Hàm load thêm khi lướt xuống cuối (Infinite Scroll)
  const loadMore = () => {
    if (!isLoadingMore && hasNextPage) {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMovies(nextPage);
    }
  };

  // Màu sắc theo theme
  const bgColor = isDark ? "bg-slate-950" : "bg-gray-50";
  const textColor = isDark ? "text-white" : "text-slate-900";
  const iconColor = isDark ? "#fff" : "#000";

  return (
    <SafeAreaView edges={["top"]} className={`flex-1 ${bgColor}`}>
      {/* Ẩn header mặc định của Expo Router */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header tùy chỉnh */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </TouchableOpacity>
        <Text className={`text-lg font-bold ${textColor}`}>
          Phim đang chiếu
        </Text>
      </View>

      {/* Nội dung chính */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : (
        <FlatList
          data={movies}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyExtractor={(item, index) => `now-showing-${item.id}-${index}`}
          showsVerticalScrollIndicator={false}
          // Render item giống hệt code bạn đưa
          renderItem={({ item }) => (
            <MovieItem
              id={String(item.id)}
              title={item.title}
              poster={item.thumbnail}
              rating={item.rating || 0}
              genres={item.genres}
              onPress={(id) =>
                router.push({
                  pathname: "/(app)/movies/[id]",
                  params: { id },
                })
              }
            />
          )}
          // Xử lý khi danh sách trống
          ListEmptyComponent={
            <View className="mt-20 items-center justify-center">
              <Ionicons name="film-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-500 mt-2">
                Không tìm thấy phim nào đang chiếu
              </Text>
            </View>
          }
          // Xử lý load thêm khi cuộn xuống đáy
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#f97316" />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
