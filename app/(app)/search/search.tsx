import { useTheme } from "@/contexts/themeContext";
import { genreService } from "@/services/genre";
import { movieService } from "@/services/movie";
import type { Genre, GetMoviesParams, Movie } from "@/types/movie";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MovieItem } from "./MovieItem";

const STATUS_OPTIONS = [
  { id: "all", label: "Tất cả" },
  { id: "NOW_SHOWING", label: "Đang chiếu" },
  { id: "COMING_SOON", label: "Sắp chiếu" },
];

export default function SearchScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [movies, setMovies] = useState<Movie[]>([]);
  const [genreOptions, setGenreOptions] = useState<Genre[]>([]); // Data Genre từ API
  const [isLoading, setIsLoading] = useState(false);

  // --- STATE FILTER ---
  const [keyword, setKeyword] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const [appliedStatus, setAppliedStatus] = useState("all");
  const [appliedRating, setAppliedRating] = useState(0);
  const [appliedGenres, setAppliedGenres] = useState<string[]>([]);

  //genre
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await genreService.getAllGenres({ page: 1, limit: 100 });

        setGenreOptions(res.data || []);
      } catch (error) {
        console.error("Lỗi tải Genre:", error);
      }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
    // Hàm gọi API
    const fetchMovies = async () => {
      setIsLoading(true);
      try {
        // Chuẩn bị params gửi lên Backend khớp với req.query
        const params: GetMoviesParams = {
          page: 1,
          limit: 20, // Lấy 20 phim
          search: keyword.trim(),
        };

        if (appliedRating > 0) {
          params.rating = appliedRating;
        }

        if (appliedStatus !== "all") {
          params.status = appliedStatus;
        }

        if (appliedGenres.length > 0) {
          params.genreQuery = appliedGenres.join(",");
        }

        console.log(params);

        const res = await movieService.getAllMovies(params);

        setMovies(res.data || []);
      } catch (error) {
        console.error("Lỗi tìm kiếm phim:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchMovies();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [keyword, appliedStatus, appliedRating, appliedGenres]);

  const toggleFilterPanel = () => {
    if (!showFilter) {
      setSelectedStatus(appliedStatus);
      setMinRating(appliedRating);
      setSelectedGenres(appliedGenres);
    }
    setShowFilter(!showFilter);
  };

  const toggleGenre = (id: string) => {
    if (selectedGenres.includes(id)) {
      setSelectedGenres(selectedGenres.filter((gId) => gId !== id));
    } else {
      setSelectedGenres([...selectedGenres, id]);
    }
  };

  const resetFilters = () => {
    setSelectedStatus("all");
    setMinRating(0);
    setSelectedGenres([]);
    setKeyword("");
  };

  const applyFilters = () => {
    setAppliedStatus(selectedStatus);
    setAppliedRating(minRating);
    setAppliedGenres(selectedGenres);
    setShowFilter(false); // Đóng panel
  };

  // Theme-aware colors
  const bgColor = isDark ? "bg-slate-950" : "bg-white";
  const cardBg = isDark ? "bg-slate-800" : "bg-slate-100";
  const cardBgSecondary = isDark ? "bg-slate-900" : "bg-slate-50";
  const borderColor = isDark ? "border-slate-800" : "border-slate-200";
  const borderColorLight = isDark ? "border-slate-700" : "border-slate-300";
  const textColor = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-slate-400" : "text-slate-600";
  const iconColor = isDark ? "#fff" : "#0f172a";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView edges={["top"]} className={`flex-1  ${bgColor}`}>
        <View className="flex-1">
          {/* --- HEADER SEARCH --- */}
          <View className={`px-4 z-10  ${bgColor} pb-2 shadow-sm`}>
            <View className="flex-row items-center mt-2 mb-2">
              <TouchableOpacity onPress={() => router.back()} className="mr-3">
                <Ionicons name="arrow-back" size={24} color={iconColor} />
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
                  className="flex-1 py-2 text-[15px] font-medium text-black"
                  value={keyword}
                  onChangeText={setKeyword}
                  returnKeyType="search"
                />
                {keyword.length > 0 && (
                  <TouchableOpacity onPress={() => setKeyword("")}>
                    <Ionicons name="close-circle" size={18} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Toggle Filter Button */}
              <TouchableOpacity
                onPress={toggleFilterPanel}
                className={`ml-3 p-2 rounded-lg border ${
                  showFilter
                    ? "bg-orange-50 border-orange-500"
                    : "bg-white border-gray-200"
                }`}
              >
                <Ionicons
                  name="options-outline"
                  size={24}
                  color={showFilter ? "#f97316" : "black"}
                />
              </TouchableOpacity>
            </View>

            {/* --- FILTER PANEL --- */}
            {showFilter && (
              <View className="mt-2">
                <ScrollView
                  style={{ maxHeight: 450 }}
                  showsVerticalScrollIndicator={false}
                >
                  {/* 1. Status Filter */}
                  <Text className={`font-[bold] text-[14px] mb-2 ${textColor}`}>
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

                  {/* 2. Rating Filter */}
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className={`font-[bold] text-[14px] ${textColor}`}>
                      Điểm đánh giá
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

                  {/* 3. Genres Filter */}
                  <Text className={`font-[bold] text-[14px] mb-2 ${textColor}`}>
                    Thể loại
                  </Text>
                  <View className="flex-row flex-wrap gap-2 mb-4">
                    {genreOptions.length > 0 ? (
                      genreOptions.map((g) => {
                        const gId = String(g.id);
                        const isSelected = selectedGenres.includes(gId);
                        return (
                          <TouchableOpacity
                            key={gId}
                            onPress={() => toggleGenre(gId)}
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
                      })
                    ) : (
                      <Text className="text-gray-400 italic text-sm">
                        Đang tải thể loại...
                      </Text>
                    )}
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-3 mb-2">
                    <TouchableOpacity
                      onPress={resetFilters}
                      className="flex-1 bg-gray-100 py-3 rounded-xl items-center"
                    >
                      <Text className="font-medium text-gray-600">Đặt lại</Text>
                    </TouchableOpacity>

                    {/* Nút Áp dụng gọi hàm applyFilters */}
                    <TouchableOpacity
                      onPress={applyFilters}
                      className="flex-1 bg-orange-500 py-3 rounded-xl items-center"
                    >
                      <Text className="font-bold text-white">Áp dụng</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            )}
          </View>

          {/* --- RESULT LIST --- */}
          <View className={`flex-1 px-4 ${bgColor} pt-4`}>
            {isLoading ? (
              <View className="mt-20 items-center">
                <ActivityIndicator size="large" color="#f97316" />
                <Text className="text-gray-400 mt-2 text-xs">
                  Đang tìm kiếm...
                </Text>
              </View>
            ) : (
              <FlatList
                data={movies}
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
                    rating={item.rating || 1}
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
            )}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}
