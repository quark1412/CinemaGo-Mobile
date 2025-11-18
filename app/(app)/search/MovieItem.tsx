import type { Genre } from "@/types/movie";
import { Ionicons } from "@expo/vector-icons"; // Để dùng icon ngôi sao
import { memo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export type MovieItemProps = {
  id: string;
  title: string;
  year?: number | string;
  status?: string;
  poster?: string;
  onPress?: (id: string) => void;
  rating?: number;
  reviewCount?: number;
  genres?: Genre[];
};

const FALLBACK_POSTER = "https://via.placeholder.com/150x220?text=Poster";

function MovieItemCmp({
  id,
  title,
  poster,
  onPress,
  rating,
  reviewCount,
  genres,
}: MovieItemProps) {
  const genreText = genres?.map((g) => g.name).join(", ");
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className="mb-4 ml-2 w-[48%]"
      onPress={() => onPress?.(id)}
    >
      <View className="rounded-xl overflow-hidden shadow-sm bg-white">
        <Image
          source={{ uri: poster || FALLBACK_POSTER }}
          style={{
            width: "95%",
            height: 220,
            backgroundColor: "#eee",
          }}
          className="rounded-xl"
        />

        <View className="p-2">
          {!!rating && (
            <View className="flex-row items-center mb-1">
              <Ionicons name="star" size={14} color="#FFD700" />{" "}
              <Text className="ml-1 text-[13px] font-bold text-orange-500">
                {rating.toFixed(1)}
              </Text>
              {!!reviewCount && (
                <Text className="text-gray-500 text-[12px]">
                  {" "}
                  ({reviewCount})
                </Text>
              )}
            </View>
          )}

          {/* Tên phim */}
          <Text
            className="font-[bold] text-[15px] leading-tight"
            numberOfLines={2}
          >
            {title}
          </Text>

          {/* Thể loại */}
          {!!genres && (
            <Text
              className="text-gray-500 text-[13px] mt-0.5 font-[medium]"
              numberOfLines={1}
            >
              {genreText}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const MovieItem = memo(MovieItemCmp);
