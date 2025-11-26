import { useTheme } from "@/contexts/themeContext";
import { movieService } from "@/services/movie";
import type { Movie } from "@/types/movie";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const SPACING = 16;
const CARD_W = width * 0.72;
const CARD_H = CARD_W * 1.45;

export default function Home() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [nowShowingMovies, setNowShowingMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const fetchNowShowingMovies = async () => {
      try {
        setIsLoading(true);

        const all: Movie[] = [];
        let page = 1;
        const limit = 20;
        let hasNextPage = true;

        while (hasNextPage && !isCancelled) {
          const res = await movieService.getAllMovies({
            page,
            limit,
            status: "NOW_SHOWING",
          });

          const data = (res.data ?? []) as Movie[];
          const pagination = res.pagination;

          all.push(...data);

          if (!pagination || !pagination.hasNextPage) {
            hasNextPage = false;
          } else {
            page = (pagination.currentPage ?? page) + 1;
          }
        }

        if (isCancelled) return;

        const sorted = [...all].sort(
          (a, b) => (b.rating ?? 0) - (a.rating ?? 0)
        );

        const featured = sorted.slice(0, 5);
        let remaining = sorted.slice(5);

        if (remaining.length === 0) {
          remaining = featured;
        }

        setFeaturedMovies(featured);
        setNowShowingMovies(remaining);
      } catch (e) {
        console.error("Lỗi tải phim NOW_SHOWING:", e);
        if (!isCancelled) {
          setFeaturedMovies([]);
          setNowShowingMovies([]);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchNowShowingMovies();

    return () => {
      isCancelled = true;
    };
  }, []);

  const x = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const LOOP_DATA = featuredMovies.length
    ? [...featuredMovies, ...featuredMovies, ...featuredMovies]
    : [];
  const START_INDEX = featuredMovies.length;
  const ITEM_SIZE = CARD_W + SPACING;

  const indexRef = useRef(START_INDEX);

  function goSearch() {
    router.push("/(app)/search/search");
  }

  const scrollToMiddle = useCallback(() => {
    if (!featuredMovies.length) return;

    flatListRef.current?.scrollToOffset({
      offset: START_INDEX * ITEM_SIZE,
      animated: false,
    });
  }, [ITEM_SIZE, START_INDEX, featuredMovies.length]);

  useEffect(() => {
    scrollToMiddle();
  }, [scrollToMiddle]);

  const onMomentumScrollEnd = (event: any) => {
    if (!featuredMovies.length) return;
    const offsetX = event.nativeEvent.contentOffset.x;

    let index = Math.round(offsetX / ITEM_SIZE);
    indexRef.current = index;

    flatListRef.current?.scrollToOffset({
      offset: index * ITEM_SIZE,
      animated: true,
    });

    setTimeout(() => {
      const baseIndex =
        ((index % featuredMovies.length) + featuredMovies.length) %
        featuredMovies.length;
      const newIndex = START_INDEX + baseIndex;

      if (newIndex !== index) {
        flatListRef.current?.scrollToOffset({
          offset: newIndex * ITEM_SIZE,
          animated: false,
        });
        indexRef.current = newIndex;
      }
    }, 50);
  };

  const renderFeatured = ({ item, index }: { item: Movie; index: number }) => {
    const inputRange = [
      (index - 1) * ITEM_SIZE,
      index * ITEM_SIZE,
      (index + 1) * ITEM_SIZE,
    ];

    const scale = x.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: "clamp",
    });

    const isEmpty = featuredMovies.length === 0;
    const baseIndex = isEmpty
      ? 0
      : ((index % featuredMovies.length) + featuredMovies.length) %
        featuredMovies.length;
    const rank = baseIndex + 1;

    const thumbnail = (item as any).poster ?? (item as any).thumbnail;
    const genreText = Array.isArray((item as any).genres)
      ? (item as any).genres.map((g: any) => g.name).join(", ")
      : (item as any).genre ?? "";
    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/(app)/movies/[id]",
            params: {
              id: item.id,
              title: item.title,
              thumbnail,
              description: (item as any).description ?? "",
              rating: item.rating ?? 0,
            },
          })
        }
      >
        <Animated.View
          className="items-center"
          style={{
            width: CARD_W,
            transform: [{ scale }],
            marginRight: SPACING,
          }}
        >
          <View
            className="rounded-2xl overflow-hidden bg-gray-200"
            style={{ width: "100%", height: CARD_H * 0.85 }}
          >
            <Image
              source={{ uri: thumbnail }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />

            <Text
              className="absolute bottom-2 left-3 text-white font-extrabold"
              style={{
                fontSize: 64,
                textShadowColor: "#000",
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 3,
              }}
            >
              {rank}
            </Text>
          </View>

          <View className="mt-2 items-center justify-center">
            <Text className={`text-lg font-[bold] ${textColor} text-center`}>
              {item.title}
            </Text>
            {genreText && (
              <Text
                className="text-sm text-gray-500 text-center"
                numberOfLines={1}
              >
                {genreText}
              </Text>
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderNowShowing = ({ item }: { item: Movie }) => {
    const rating = item.rating ?? 0;
    const reviews = (item as any).reviewCount ?? (item as any).reviews ?? 0;
    const thumbnail = (item as any).poster ?? (item as any).thumbnail;
    const genreText = Array.isArray((item as any).genres)
      ? (item as any).genres.map((g: any) => g.name).join(", ")
      : (item as any).genre ?? "";

    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/(app)/movies/[id]",
            params: {
              id: item.id,
              title: item.title,
              thumbnail,
              description: (item as any).description ?? "",
              rating,
            },
          })
        }
      >
        <View className="mr-4" style={{ width: 140 }}>
          <Image
            source={{ uri: thumbnail }}
            style={{
              width: "100%",
              height: 200,
              borderRadius: 12,
            }}
            resizeMode="cover"
          />

          <View className="flex-row items-center mt-1">
            <Text className="text-[13px] font-semibold text-orange-500">
              ⭐ {rating.toFixed(1)}
            </Text>
            <Text className="text-[12px] text-gray-500 ml-1">({reviews})</Text>
          </View>

          <Text
            className={`text-[14px] font-[bold] ${textColor} mt-1`}
            numberOfLines={1}
          >
            {item.title}
          </Text>

          {!!genreText && (
            <Text className="text-[12px] text-gray-500" numberOfLines={1}>
              {genreText}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const textColor = isDark ? "text-white" : "text-slate-900";
  const iconColor = isDark ? "#fff" : "#0f172a";

  if (
    isLoading &&
    featuredMovies.length === 0 &&
    nowShowingMovies.length === 0
  ) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={{ flex: 1 }}
        className={`flex-1 ${isDark ? "dark" : "light"} bg-background`}
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
          <Text className={`mt-2 text-[14px] ${textColor}`}>
            Đang tải phim...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1 }}
      className={`flex-1 ${isDark ? "dark" : "light"} bg-background`}
    >
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View>
          <View className="px-4 pt-2 pb-1">
            <Text
              className={`text-[22px] font-[bold]  ${
                isDark ? "dark" : "light"
              } text-text-muted`}
            >
              Mua vé xem phim
            </Text>
          </View>

          <View className="px-4 mt-3">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={goSearch}
              className={`flex-row items-center  ${
                isDark ? "dark" : "light"
              } bg-muted-background rounded-xl px-3 py-2`}
            >
              <Ionicons name="search-outline" size={20} color={iconColor} />
              <TextInput
                editable={false}
                placeholder="Tìm kiếm phim hoặc rạp…"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                className={`ml-2 flex-1 text-[15px] ${textColor}`}
                pointerEvents="none"
              />
            </TouchableOpacity>
          </View>

          <View className="px-4 mb-2">
            <Text
              className={`text-[20px] font-[bold]  ${
                isDark ? "dark" : "light"
              } text-text-muted`}
            >
              Phim nổi bật
            </Text>
          </View>

          <Animated.FlatList
            ref={flatListRef}
            onLayout={scrollToMiddle}
            data={LOOP_DATA}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderFeatured}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate={0.9}
            snapToInterval={ITEM_SIZE}
            snapToAlignment="center"
            bounces={false}
            contentContainerStyle={{
              paddingHorizontal: (width - CARD_W) / 2,
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x } } }],
              { useNativeDriver: true }
            )}
            onMomentumScrollEnd={onMomentumScrollEnd}
            scrollEventThrottle={16}
          />

          <View className="px-4 mt-5 mb-3 flex-row justify-between items-center">
            <Text
              className={`text-[20px] font-[bold]  ${
                isDark ? "dark" : "light"
              } text-text-muted`}
            >
              Phim hay đang chiếu
            </Text>
            <TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/(app)/movies/now-showing")}
              >
                <Text className="text-purple-700 font-semibold">
                  Xem tất cả ›
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          <FlatList
            data={nowShowingMovies}
            keyExtractor={(item) => item.id}
            renderItem={renderNowShowing}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingLeft: 16,
              paddingRight: 4,
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
