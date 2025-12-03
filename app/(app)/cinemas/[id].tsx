import TrailerModal from "@/components/trailer-modal";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useVideoPlayer } from "expo-video";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MovieCard from "@/components/showtimes/movie-card";
import { useTheme } from "@/contexts/themeContext";
import type { MovieWithLabels } from "@/hook/useCinemaShowtimes";
import { useCinemaShowtimes } from "@/hook/useCinemaShowtimes";

export default function Showtimes() {
  const { isDark } = useTheme();
  const navigation = useNavigation<any>();
  const { id, cinemaName } = useLocalSearchParams<{
    id: string;
    cinemaName?: string;
  }>();

  const cinemaId = id as string;

  const { cinema, movies, loadingCinema, loadingMovies } =
    useCinemaShowtimes(cinemaId);

  const [showTrailer, setShowTrailer] = useState(false);
  const [currentTrailer, setCurrentTrailer] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  const player = useVideoPlayer(currentTrailer ?? null, (player) => {
    if (currentTrailer) {
      player.play();
    } else {
      player.pause();
    }
  });

  useEffect(() => {
    if (showTrailer && currentTrailer) {
      setVideoLoading(true);
    } else {
      setVideoLoading(false);
    }
  }, [showTrailer, currentTrailer]);

  useEffect(() => {
    if (!showTrailer) {
      try {
        player.pause();
      } catch {}
    }
  }, [showTrailer, player]);

  const openDirection = () => {
    if (!cinema) return;

    const { latitude, longitude, address } = cinema;
    let url = "";

    if (latitude && longitude) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    } else if (address) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        address
      )}`;
    } else return;

    Linking.openURL(url).catch((err) =>
      console.log("Error opening maps direction:", err)
    );
  };

  const handleOpenTrailer = (url: string) => {
    setCurrentTrailer(url);
    setShowTrailer(true);
  };

  const handleCloseTrailer = () => {
    setShowTrailer(false);
    setCurrentTrailer(null);
  };

  const handlePressShowtime = (st: any, movie: MovieWithLabels) => {
    // navigation.navigate("Booking", { showtimeId: st.id, movieId: movie.id, cinemaId });
    console.log("Chọn suất chiếu:", st.id, "phim:", movie.title);
  };

  const textColor = isDark ? "text-white" : "text-slate-900";
  const iconColor = isDark ? "#fff" : "#0f172a";

  return (
    <SafeAreaView
      className={`flex-1  ${isDark ? "dark" : "light"} bg-background`}
    >
      <View className={`px-3 pt-1 pb-3  ${isDark ? "#070f20" : "#fde2e8"} `}>
        <View className="flex-row items-center ">
          <Pressable
            onPress={() => navigation.goBack()}
            className={`w-9 h-9 rounded-full  ${isDark ? "dark" : "light"} bg-background items-center justify-center`}
          >
            <Ionicons name="chevron-back" size={20} color={iconColor} />
          </Pressable>
          <Text className={`text-[16px] font-[extraBold] ml-3 ${textColor}`}>
            {cinemaName || cinema?.name || (loadingCinema ? "Đang tải..." : "")}
          </Text>
        </View>

        <View className="mt-3 px-3 flex-row items-start justify-between">
          {loadingCinema ? (
            <>
              <View className="flex-1 mr-3">
                <View className="w-24 h-3 rounded-full bg-gray-200 mb-2" />
                <View className="w-44 h-3 rounded-full bg-gray-200" />
              </View>
              <View className="w-20 h-8 rounded-full bg-gray-200" />
            </>
          ) : (
            <>
              <View className="flex-1 mr-3">
                <Text className="text-xs text-text-muted">
                  {cinema?.city || ""}
                </Text>
                <Text
                  className={`mt-1 text-sm font-[semibold] text-text ${textColor}`}
                >
                  {cinema?.address || ""}
                </Text>
              </View>

              <Pressable
                onPress={openDirection}
                className="flex-row items-center px-3 py-2 rounded-full bg-primary/10"
                hitSlop={8}
              >
                <Ionicons name="car-outline" size={16} color={iconColor} />
                <Text className="ml-1 text-xs font-semibold text-primary">
                  Tìm đường
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      <Text className="px-3 pt-3 pb-2 text-[12px] font-extrabold text-gray-500">
        {loadingMovies ? "ĐANG TẢI LỊCH CHIẾU..." : "DANH SÁCH PHIM"}
      </Text>

      {loadingMovies ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" />
          <Text className="mt-2 text-sm text-gray-500">
            Đang tải lịch chiếu...
          </Text>
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              onPressTrailer={handleOpenTrailer}
              onPressShowtime={handlePressShowtime}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="mt-8 items-center">
              <Text className="text-sm text-gray-500">
                Hiện chưa có suất chiếu nào.
              </Text>
            </View>
          }
        />
      )}

      <TrailerModal
        visible={showTrailer}
        trailerUrl={currentTrailer}
        onClose={handleCloseTrailer}
      />
    </SafeAreaView>
  );
}
