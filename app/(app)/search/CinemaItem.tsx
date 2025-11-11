import { memo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export type CinemaItemProps = {
  id: string;
  name: string;
  address?: string;
  image?: string; // optional, mặc định dùng fallback
  onPress?: (id: string) => void; // click toàn bộ dòng
  onShowtimePress?: (id: string) => void; // click nút Suất chiếu
};

const FALLBACK_CINEMA_IMG = "https://via.placeholder.com/100x100?text=Cinema";

function CinemaItemCmp({
  id,
  name,
  address,
  image,
  onPress,
  onShowtimePress,
}: CinemaItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className="flex-row items-center mb-4"
      onPress={() => onPress?.(id)}
    >
      <Image
        source={{ uri: image || FALLBACK_CINEMA_IMG }}
        style={{
          width: 80,
          height: 80,
          borderRadius: 8,
          backgroundColor: "#eee",
        }}
      />

      <View className="ml-3 flex-1">
        <Text className="font-bold text-[15px]">{name}</Text>
        {!!address && (
          <Text className="text-gray-500 text-[13px]">{address}</Text>
        )}

        <TouchableOpacity
          className="bg-purple-600 rounded-lg mt-2 px-3 py-1 self-start"
          onPress={() => onShowtimePress?.(id)}
        >
          <Text className="text-white text-[13px] font-medium">Suất chiếu</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export const CinemaItem = memo(CinemaItemCmp);
