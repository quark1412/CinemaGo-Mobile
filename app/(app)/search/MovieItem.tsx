import { memo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export type MovieItemProps = {
  id: string;
  title: string;
  year?: number | string;
  status?: string; // "Đang chiếu" | "Sắp chiếu" | ...
  poster?: string; // URL
  onPress?: (id: string) => void; // click toàn bộ dòng
  onBookPress?: (id: string) => void; // click nút Đặt vé
};

const FALLBACK_POSTER = "https://via.placeholder.com/100x140?text=Poster";

function MovieItemCmp({
  id,
  title,
  year,
  status,
  poster,
  onPress,
  onBookPress,
}: MovieItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className="flex-row items-center mb-4"
      onPress={() => onPress?.(id)}
    >
      <Image
        source={{ uri: poster || FALLBACK_POSTER }}
        style={{
          width: 80,
          height: 120,
          borderRadius: 8,
          backgroundColor: "#eee",
        }}
      />

      <View className="ml-3 flex-1">
        <Text className="font-bold text-[15px]">{title}</Text>
        {!!year && <Text className="text-gray-500 text-[13px]">{year}</Text>}
        {!!status && (
          <Text className="text-purple-600 text-[13px] font-medium">
            {status}
          </Text>
        )}

        <TouchableOpacity
          className="bg-pink-600 rounded-lg mt-2 px-3 py-1 self-start"
          onPress={() => onBookPress?.(id)}
        >
          <Text className="text-white text-[13px] font-medium">Đặt vé</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export const MovieItem = memo(MovieItemCmp);
