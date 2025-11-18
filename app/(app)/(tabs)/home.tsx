import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
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

const featured = [
  {
    id: "1",
    title: "G-DRAGON IN CINEMA",
    description: "Tài liệu, Nhạc",
    thumbnail:
      "https://images.unsplash.com/photo-1516280030429-27679b3dc9cf?q=80&w=1200&auto=format&fit=crop",
    rank: 1,
  },
  {
    id: "2",
    title: "Ngôi Làng Cổ Thụ",
    description: "Kinh dị",
    thumbnail:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    rank: 2,
  },
  {
    id: "3",
    title: "Kẻ Săn Bóng Đêm",
    description: "Hành động",
    thumbnail:
      "https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?q=80&w=1200&auto=format&fit=crop",
    rank: 3,
  },
  {
    id: "4",
    title: "Ngọn Đồi Im Lặng",
    description: "Tâm lý",
    thumbnail:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1200&auto=format&fit=crop",
    rank: 4,
  },
  {
    id: "5",
    title: "Thành Phố Đom Đóm",
    description: "Hoạt hình",
    thumbnail:
      "https://images.unsplash.com/photo-1503437313881-503a91226402?q=80&w=1200&auto=format&fit=crop",
    rank: 5,
  },
];

const nowShowing = [
  {
    id: "11",
    title: "Phá Đám: Sinh Nhật Mẹ",
    genre: "Chính Kịch, Gia Đình",
    rating: 7.6,
    reviews: 297,
    thumbnail:
      "https://images.unsplash.com/photo-1542202229-7d93c33f5d07?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "12",
    title: "Mục Sư, Thầy Đỡ Đẻ & Con Quỷ Ám Trì",
    genre: "Kinh Dị, Hành Động",
    rating: 8.7,
    reviews: 173,
    thumbnail:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "13",
    title: "Bịt Mắt Ngủ Dưới Mồ",
    genre: "Hành động",
    rating: 7.1,
    reviews: 110,
    thumbnail:
      "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "14",
    title: "Mục Sư, Thầy Đỡ Đẻ & Con Quỷ Ám Trì",
    genre: "Kinh Dị, Hành Động",
    rating: 8.7,
    reviews: 173,
    thumbnail:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "15",
    title: "Bịt Mắt Ngủ Dưới Mồ",
    genre: "Hành động",
    rating: 7.1,
    reviews: 110,
    thumbnail:
      "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "16",
    title: "Mục Sư, Thầy Đỡ Đẻ & Con Quỷ Ám Trì",
    genre: "Kinh Dị, Hành Động",
    rating: 8.7,
    reviews: 173,
    thumbnail:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "17",
    title: "Bịt Mắt Ngủ Dưới Mồ",
    genre: "Hành động",
    rating: 7.1,
    reviews: 110,
    thumbnail:
      "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function Home() {
  const router = useRouter();

  const x = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  //  tạo loop data
  const LOOP_DATA = [...featured, ...featured, ...featured];
  const START_INDEX = featured.length;
  const ITEM_SIZE = CARD_W + SPACING;

  const indexRef = useRef(START_INDEX);

  function goSearch() {
    router.push("/(app)/search/search");
  }

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: START_INDEX * ITEM_SIZE,
        animated: false,
      });
    }, 0);
  }, []);

  const onMomentumScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;

    // Tính index mới
    let index = Math.round(offsetX / ITEM_SIZE);
    indexRef.current = index;

    // Snap về index đúng
    flatListRef.current?.scrollToOffset({
      offset: index * ITEM_SIZE,
      animated: true,
    });

    // Xử lý loop
    setTimeout(() => {
      // Lấy về index gốc trong mảng featured (0-4)
      const baseIndex =
        ((index % featured.length) + featured.length) % featured.length;
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

  const scrollToMiddle = () => {
    flatListRef.current?.scrollToOffset({
      offset: START_INDEX * ITEM_SIZE,
      animated: false,
    });
  };

  const renderFeatured = ({ item, index }: any) => {
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

    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/(app)/movies/[id]",
            params: {
              id: item.id,
              title: item.title,
              thumbnail: item.thumbnail,
              description: item.description,
              rating: item.rank,
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
              source={{ uri: item.thumbnail }}
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
              {item.rank}
            </Text>
          </View>

          <View className="mt-2 items-center justify-center">
            <Text className="text-lg font-bold text-black text-center">
              {item.title}
            </Text>
            <Text className="text-sm text-gray-500 text-center">
              {item.description}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderNowShowing = ({ item }: any) => {
    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/(app)/movies/[id]",
            params: {
              id: item.id,
              title: item.title,
              thumbnail: item.thumbnail,
              description: item.description,
              rating: item.rank,
            },
          })
        }
      >
        <View className="mr-4" style={{ width: 140 }}>
          {/* Poster */}
          <Image
            source={{ uri: item.thumbnail }}
            style={{
              width: "100%",
              height: 200,
              borderRadius: 12,
            }}
            resizeMode="cover"
          />

          {/* Rating */}
          <View className="flex-row items-center mt-1">
            <Text className="text-[13px] font-semibold text-orange-500">
              ⭐ {item.rating}
            </Text>
            <Text className="text-[12px] text-gray-500 ml-1">
              ({item.reviews})
            </Text>
          </View>

          {/* Title */}
          <Text
            className="text-[14px] font-bold text-black mt-1"
            numberOfLines={1}
          >
            {item.title}
          </Text>

          {/* Genre */}
          <Text className="text-[12px] text-gray-500" numberOfLines={1}>
            {item.genre}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View>
          {/* Header */}
          <View className="px-4 pt-2 pb-1">
            <Text className="text-[22px] font-bold">Mua vé xem phim</Text>
          </View>

          <View className="px-4 mt-3">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={goSearch}
              className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2"
            >
              <Ionicons name="search-outline" size={20} color="#555" />
              <TextInput
                editable={false}
                placeholder="Tìm kiếm phim hoặc rạp…"
                className="ml-2 flex-1 text-[15px]"
                pointerEvents="none"
              />
            </TouchableOpacity>
          </View>

          {/* Phim nổi bật */}
          <View className="px-4 mb-2">
            <Text className="text-[20px] font-bold">Phim nổi bật</Text>
          </View>

          {/* Carousel */}
          <Animated.FlatList
            ref={flatListRef}
            onLayout={scrollToMiddle}
            data={LOOP_DATA}
            // keyExtractor={(item, index) => `featured-${item.id}-${index}`}
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

          {/* Section khác */}
          <View className="px-4 mt-5 mb-3 flex-row justify-between items-center">
            <Text className="text-[20px] font-bold">Phim hay đang chiếu</Text>
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
            data={nowShowing}
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
