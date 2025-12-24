import { useTheme } from "@/contexts/themeContext";
import { genreService } from "@/services/genre";
import { movieService } from "@/services/movie";
import type { Genre, GetMoviesParams, Movie } from "@/types/movie";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

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
import { MovieItem } from "../../../components/movie-item";

const STATUS_OPTIONS = [
  { id: "all", label: "Tất cả" },
  { id: "NOW_SHOWING", label: "Đang chiếu" },
  { id: "COMING_SOON", label: "Sắp chiếu" },
];

export default function SearchScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [movies, setMovies] = useState<Movie[]>([]);
  const [genreOptions, setGenreOptions] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const [appliedStatus, setAppliedStatus] = useState("all");
  const [appliedRating, setAppliedRating] = useState(0);
  const [appliedGenres, setAppliedGenres] = useState<string[]>([]);

  useEffect(() => {
    let isCancelled = false;

    const fetchGenres = async () => {
      try {
        const allGenres: Genre[] = [];
        let page = 1;
        const limit = 10;
        let hasNextPage = true;

        while (hasNextPage && !isCancelled) {
          const res = await genreService.getAllGenres({ page, limit });

          const data = res.data ?? [];
          const pagination = res.pagination;

          console.log("Call page:", pagination);
          allGenres.push(...data);

          if (!pagination || !pagination.hasNextPage) {
            hasNextPage = false;
          } else {
            page = (pagination.currentPage ?? page) + 1;
          }
        }
        if (!isCancelled) {
          setGenreOptions(allGenres);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Lỗi tải Genre:", error);
          setGenreOptions([]);
        }
      }
    };
    fetchGenres();
    return () => {
      isCancelled = true;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isCancelled = false;
      let timeoutId: NodeJS.Timeout | number;

      const fetchMovies = async () => {
        setIsLoading(true);
        try {
          const allMovies: Movie[] = [];
          let page = 1;
          let hasNextPage = true;

          // Logic gọi API giữ nguyên
          while (hasNextPage && !isCancelled) {
            const params: GetMoviesParams = {
              page,
              limit: 5,
              search: keyword.trim() || undefined,
            };

            if (appliedRating > 0) params.rating = appliedRating;
            if (appliedStatus !== "all") params.status = appliedStatus;
            if (appliedGenres.length > 0)
              params.genreQuery = appliedGenres.join(",");

            console.log("Call page:", page, params);

            const res = await movieService.getAllMovies(params);
            const data = res.data ?? [];
            const pagination = res.pagination;

            allMovies.push(...data);

            if (!pagination || !pagination.hasNextPage) {
              hasNextPage = false;
            } else {
              page = (pagination.currentPage ?? page) + 1;
            }
          }

          if (!isCancelled) {
            setMovies(allMovies);
          }
        } catch (error) {
          console.error("Lỗi tìm kiếm phim:", error);
          if (!isCancelled) setMovies([]);
        } finally {
          if (!isCancelled) setIsLoading(false);
        }
      };

      // Debounce logic
      timeoutId = setTimeout(() => {
        fetchMovies();
      }, 500);

      // Cleanup function
      return () => {
        isCancelled = true;
        clearTimeout(timeoutId);
      };
    }, [keyword, appliedStatus, appliedRating, appliedGenres])
  );

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
    setShowFilter(false);
  };

  const bgColor = isDark ? "bg-slate-950" : "bg-white";
  const textColor = isDark ? "text-white" : "text-slate-900";
  const iconColor = isDark ? "#fff" : "#0f172a";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView edges={["top"]} className={`flex-1  ${bgColor}`}>
        <View className="flex-1">
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

              <TouchableOpacity
                onPress={toggleFilterPanel}
                className={`ml-3 p-2 rounded-lg border ${showFilter
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

            {showFilter && (
              <View className="mt-2">
                <ScrollView
                  style={{ maxHeight: 450 }}
                  showsVerticalScrollIndicator={false}
                >
                  <Text className={`font-[bold] text-[14px] mb-2 ${textColor}`}>
                    Trạng thái
                  </Text>
                  <View className="flex-row mb-4">
                    {STATUS_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => setSelectedStatus(opt.id)}
                        className={`mr-2 px-4 py-2 rounded-full border ${selectedStatus === opt.id
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

                  <View className="flex-row justify-between items-center mb-2">
                    <Text className={`font-[bold] text-[14px] ${textColor}`}>
                      Điểm đánh giá
                    </Text>
                    <Text className="text-orange-500 font-bold">
                      ≥ {minRating}/5{" "}
                      <Ionicons name="star" size={14} color="#FFD700" />
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-4"
                  >
                    {[0, 1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setMinRating(star)}
                        className={`mr-2 w-10 h-10 rounded-full items-center justify-center border ${minRating === star
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
                            className={`px-3 py-2 rounded-lg border ${isSelected
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

                  <View className="flex-row gap-3 mb-2">
                    <TouchableOpacity
                      onPress={resetFilters}
                      className="flex-1 bg-gray-100 py-3 rounded-xl items-center"
                    >
                      <Text className="font-medium text-gray-600">Đặt lại</Text>
                    </TouchableOpacity>

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
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}
