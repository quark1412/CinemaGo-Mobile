import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { nowShowing } from "./mockdata"; // hoặc đường dẫn bạn đang dùng

type Movie = {
  id: string;
  title: string;
  genres?: string;
  duration?: string;
  releaseDate?: string;
  poster?: string;
  badge?: string; // ví dụ "13+"
  rating?: number; // 9.3
  ratingCount?: number; // 202
  status?: string; // "Đang chiếu"
};

// Lọc phim đang chiếu
const data: Movie[] = nowShowing;

export default function NowShowing() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Phim đang chiếu",
          headerShown: true,
          headerBackTitle: "",
          headerStyle: { backgroundColor: "#fde2e8" },
          headerTitleAlign: "center",
        }}
      />

      {/* <SafeAreaView edges={["top"]} className="flex-1 bg-white"> */}
      <View className="flex-1 bg-white">
        <FlatList
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          data={data}
          keyExtractor={(item) => `nowshow-${item.id}`}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => <MovieRow item={item} />}
        />
      </View>
    </>
  );
}

function MovieRow({ item }: { item: Movie }) {
  return (
    <View className="flex-row p-3 rounded-xl border border-gray-200 bg-white">
      {/* Poster + badge */}
      <View>
        <Image
          source={{
            uri:
              item.poster || "https://via.placeholder.com/100x140?text=Poster",
          }}
          style={{
            width: 78,
            height: 110,
            borderRadius: 8,
            backgroundColor: "#eee",
          }}
        />
        {!!item.badge && (
          <View className="absolute -top-2 -left-2 bg-yellow-400 px-2 py-[2px] rounded-full">
            <Text className="text-[11px] font-semibold">{item.badge}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View className="flex-1 ml-3">
        {/* rating row */}
        <View className="flex-row items-center">
          {!!item.rating && (
            <>
              <Text className="text-[12px] text-orange-500 font-semibold">
                ★ {item.rating}/10
              </Text>
              {!!item.ratingCount && (
                <Text className="text-[12px] text-gray-500 ml-1">
                  ({item.ratingCount} đánh giá)
                </Text>
              )}
            </>
          )}
        </View>

        {/* title */}
        <Text className="text-[15px] font-bold mt-[2px]" numberOfLines={1}>
          {item.title}
        </Text>

        {/* genres */}
        {!!item.genres && (
          <Text className="text-[12px] text-gray-600 mt-1" numberOfLines={1}>
            {item.genres}
          </Text>
        )}

        {/* duration + date */}
        <View className="flex-row items-center mt-2">
          {!!item.duration && (
            <View className="flex-row items-center mr-4">
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text className="text-[12px] text-gray-600 ml-1">
                {item.duration}
              </Text>
            </View>
          )}
          {!!item.releaseDate && (
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={14} color="#6b7280" />
              <Text className="text-[12px] text-gray-600 ml-1">
                {item.releaseDate}
              </Text>
            </View>
          )}
        </View>

        {/* buttons */}
        <View className="flex-row mt-3">
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(app)/movies/[id]",
                params: { id: item.id },
              })
            }
            className="px-3 py-2 rounded-lg border border-gray-300 mr-2"
          >
            <Text className="text-[13px] font-medium">Chi tiết</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(app)/movies/[id]", // hoặc trang chọn suất/ghế của bạn
                params: { id: item.id },
              })
            }
            className="px-3 py-2 rounded-lg bg-pink-600"
          >
            <Text className="text-[13px] font-medium text-white">Mua vé</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
