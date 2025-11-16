import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { mockMovies } from "./mockdata";
import { ReviewItem } from "./ReviewItem";

export default function MovieDetail() {
  const { id } = useLocalSearchParams();
  const movie = mockMovies;
  const router = useRouter();

  if (!movie) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Không tìm thấy dữ liệu phim.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          // Tiêu đề (có thể cắt bớt cho gọn)
          title: movie?.title ?? "Chi tiết phim",
          headerTitleAlign: "center", // iOS center, Android cũng sẽ center
          // Nút back tuỳ biến (mặc định có sẵn nếu không muốn custom thì bỏ block này)
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingHorizontal: 8 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView className="flex-1 bg-white mb-5">
        <Image
          source={{ uri: movie.poster }}
          style={{
            width: "100%",
            height: 250,
          }}
        />

        <View className="p-4">
          {/* Title */}
          <Text className="text-2xl font-bold">{movie.title}</Text>

          {/* Info tags */}
          <View className="flex-row items-center mt-2">
            <Text className="bg-yellow-200 text-yellow-600 px-2 py-[2px] rounded mr-2">
              {movie.age}
            </Text>
            <Text className="text-gray-600">{movie.description}</Text>
          </View>

          {/* 3 columns */}
          <View className="flex-row justify-between mt-5">
            <View className="items-center">
              <Text className="text-[12px] text-gray-500">Ngày khởi chiếu</Text>
              <Text className="font-semibold">{movie.releaseDate}</Text>
            </View>

            <View className="items-center">
              <Text className="text-[12px] text-gray-500">Thời lượng</Text>
              <Text className="font-semibold">{movie.duration}</Text>
            </View>

            <View className="items-center">
              <Text className="text-[12px] text-gray-500">Ngôn ngữ</Text>
              <Text className="font-semibold">{movie.language}</Text>
            </View>
          </View>

          {/* Rating */}
          <View className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
            <Text className="text-xl font-bold">⭐ {movie.rating}/10</Text>
            <Text className="text-gray-500">({movie.reviews} đánh giá)</Text>
          </View>

          {/* Content */}
          <View className="mt-6">
            <Text className="text-lg font-bold mb-1">Nội dung phim</Text>
            <Text className="text-gray-700 leading-5">{movie.content}</Text>
          </View>

          {movie.comments?.length > 0 && (
            <View className="mt-8">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-bold">Đánh giá</Text>
                <TouchableOpacity>
                  <Text className="text-pink-600 font-semibold">
                    Viết đánh giá
                  </Text>
                </TouchableOpacity>
              </View>

              {movie.comments.map((c, i) => (
                <ReviewItem key={i} data={c} />
              ))}
            </View>
          )}

          {/* Button */}
          <TouchableOpacity className="bg-pink-600 rounded-xl py-3 mt-8 mb-10 ">
            <Text className="text-center text-white font-semibold text-[16px]">
              Mua vé
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}
