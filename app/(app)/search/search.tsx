import { movieService } from "@/services/movie";
import type { Movie } from "@/types/movie";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MovieItem } from "./MovieItem";

// --- CẤU HÌNH DỮ LIỆU FILTER ---
const STATUS_OPTIONS = [
  { id: "all", label: "Tất cả" },
  { id: "now_showing", label: "Đang chiếu" },
  { id: "coming_soon", label: "Sắp chiếu" },
];

// Bạn nên thay ID này bằng ID thật trong database của bạn
const GENRE_OPTIONS = [
  { id: "28", name: "Hành động" },
  { id: "12", name: "Phiêu lưu" },
  { id: "16", name: "Hoạt hình" },
  { id: "35", name: "Hài" },
  { id: "18", name: "Chính kịch" },
  { id: "10751", name: "Gia đình" },
  { id: "14", name: "Giả tưởng" },
  { id: "27", name: "Kinh dị" },
  { id: "10749", name: "Lãng mạn" },
  { id: "878", name: "Viễn tưởng" },
];

export default function SearchScreen() {
  const router = useRouter();

  // State dữ liệu
  const [keyword, setKeyword] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);

  // State Filter
  const [showFilter, setShowFilter] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [minRating, setMinRating] = useState(0); // 0 - 10
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]); // Mảng chứa ID thể loại

  // 1. Lấy dữ liệu thật
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const data = await movieService.getAllMovies();
        setMovies(data.data || []);
      } catch (error) {
        console.error("Lỗi khi tải danh sách phim:", error);
      }
    };
    fetchMovies();
  }, []);

  // 2. Xử lý Logic Lọc (Dùng useMemo để tối ưu hiệu năng)
  const filteredMovies = useMemo(() => {
    return movies.filter((m: Movie) => {
      // A. Lọc theo tên (không phân biệt hoa thường)
      const matchName = m.title?.toLowerCase().includes(keyword.toLowerCase());

      // B. Lọc theo Rating (Lớn hơn hoặc bằng rating đã chọn)
      const currentRating = m.rating || 0;
      const matchRating = currentRating >= minRating;

      // C. Lọc theo Genre (Multi-select)
      // Nếu có chọn genre -> Phim phải có ÍT NHẤT 1 genre nằm trong danh sách đã chọn
      let matchGenre = true;
      if (selectedGenres.length > 0 && m.genres) {
        // Lưu ý: So sánh ID dưới dạng string để an toàn
        matchGenre = m.genres.some(
          (g) => selectedGenres.includes(String(g.id)) // hoặc g._id tuỳ API
        );
      }

      // D. Lọc theo Status
      // *Lưu ý*: Bạn cần map logic này với trường dữ liệu thật (ví dụ: m.status hoặc m.releaseDate)
      let matchStatus = true;
      if (selectedStatus === "now_showing") {
        matchStatus = m.status === "released" || m.status === "Now Showing";
      } else if (selectedStatus === "coming_soon") {
        matchStatus = m.status === "upcoming" || m.status === "Coming Soon";
      }

      return matchName && matchRating && matchGenre && matchStatus;
    });
  }, [movies, keyword, minRating, selectedGenres, selectedStatus]);

  // Helper: Chọn/Bỏ chọn Genre
  const toggleGenre = (id: string) => {
    if (selectedGenres.includes(id)) {
      setSelectedGenres(selectedGenres.filter((gId) => gId !== id));
    } else {
      setSelectedGenres([...selectedGenres, id]);
    }
  };

  // Helper: Reset Filter
  const resetFilters = () => {
    setSelectedStatus("all");
    setMinRating(0);
    setSelectedGenres([]);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView edges={["top"]} className="flex-1 bg-white">
        <View className="flex-1">
          {/* --- HEADER SEARCH --- */}
          <View className="px-4 z-10 bg-white pb-2 shadow-sm">
            <View className="flex-row items-center mt-2 mb-2">
              <TouchableOpacity onPress={() => router.back()} className="mr-3">
                <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>

              <View className="flex-1 bg-gray-100 rounded-xl px-3 py-1 flex-row items-center">
                <Ionicons
                  name="search"
                  size={20}
                  color="#9ca3af"
                  className="mr-2"
                />
                <TextInput
                  placeholder="Tìm phim, rạp..."
                  className="flex-1 py-2 text-[15px] font-[medium] text-black"
                  value={keyword}
                  onChangeText={setKeyword}
                />
                {keyword.length > 0 && (
                  <TouchableOpacity onPress={() => setKeyword("")}>
                    <Ionicons name="close-circle" size={18} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Nút mở Filter */}
              <TouchableOpacity
                onPress={() => setShowFilter(!showFilter)}
                className={`ml-3 p-2 rounded-lg border ${showFilter ? "bg-orange-50 border-orange-500" : "bg-white border-gray-200"}`}
              >
                <Ionicons
                  name="options-outline"
                  size={24}
                  color={showFilter ? "#f97316" : "black"}
                />
              </TouchableOpacity>
            </View>

            {/* --- FILTER PANEL (EXPANDABLE) --- */}
            {showFilter && (
              <View className="mt-2">
                <ScrollView
                  style={{ maxHeight: 450 }}
                  showsVerticalScrollIndicator={false}
                >
                  {/* 1. Status */}
                  <Text className="font-bold text-[14px] mb-2 text-gray-800">
                    Trạng thái
                  </Text>
                  <View className="flex-row mb-4">
                    {STATUS_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => setSelectedStatus(opt.id)}
                        className={`mr-2 px-4 py-2 rounded-full border ${
                          selectedStatus === opt.id
                            ? "bg-orange-500 border-orange-500"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        <Text
                          className={`text-[13px] font-medium ${selectedStatus === opt.id ? "text-white" : "text-gray-600"}`}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* 2. Rating (0-10) */}
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-bold text-[14px] text-gray-800">
                      Điểm đánh giá (tối thiểu)
                    </Text>
                    <Text className="text-orange-500 font-bold">
                      {minRating}/10{" "}
                      <Ionicons name="star" size={14} color="#FFD700" />
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-4"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setMinRating(star)}
                        className={`mr-2 w-10 h-10 rounded-full items-center justify-center border ${
                          minRating === star
                            ? "bg-orange-500 border-orange-500"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <Text
                          className={`font-bold ${minRating === star ? "text-white" : "text-gray-600"}`}
                        >
                          {star}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* 3. Genres (Multi-select) */}
                  <Text className="font-bold text-[14px] mb-2 text-gray-800">
                    Thể loại
                  </Text>
                  <View className="flex-row flex-wrap gap-2 mb-4">
                    {GENRE_OPTIONS.map((g) => {
                      const isSelected = selectedGenres.includes(g.id);
                      return (
                        <TouchableOpacity
                          key={g.id}
                          onPress={() => toggleGenre(g.id)}
                          className={`px-3 py-2 rounded-lg border ${
                            isSelected
                              ? "bg-orange-50 border-orange-500"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <Text
                            className={`text-[12px] font-medium ${isSelected ? "text-orange-600" : "text-gray-600"}`}
                          >
                            {g.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Button Actions */}
                  <View className="flex-row gap-3 mb-2">
                    <TouchableOpacity
                      onPress={resetFilters}
                      className="flex-1 bg-gray-100 py-3 rounded-xl items-center"
                    >
                      <Text className="font-medium text-gray-600">Đặt lại</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowFilter(false)}
                      className="flex-1 bg-orange-500 py-3 rounded-xl items-center"
                    >
                      <Text className="font-bold text-white">
                        Áp dụng ({filteredMovies.length})
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            )}
          </View>

          {/* --- RESULT LIST --- */}
          <View className="flex-1 px-4 bg-gray-50 pt-4">
            <FlatList
              data={filteredMovies}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              keyExtractor={(item) => `movie-${item.id}`}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View className="mt-10 items-center justify-center">
                  <Ionicons name="film-outline" size={48} color="#d1d5db" />
                  <Text className="text-gray-500 mt-2">
                    Không tìm thấy kết quả nào
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <MovieItem
                  id={String(item.id)}
                  title={item.title}
                  poster={item.thumbnail}
                  rating={item.rating || 2}
                  // Truyền mảng genres để MovieItem tự map
                  genres={item.genres}
                  onPress={(id) =>
                    router.push({
                      pathname: "/(app)/movies/[id]",
                      params: { id },
                    })
                  }
                />
              )}
            />
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}
