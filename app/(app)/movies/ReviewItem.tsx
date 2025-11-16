import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export function ReviewItem({ data }: { data: any }) {
  const [expanded, setExpanded] = useState(false);

  const content = expanded
    ? data.text
    : data.text.length > 80
      ? data.text.slice(0, 80) + "..."
      : data.text;

  return (
    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
      {/* header */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          {/* avatar */}
          <Image
            source={{ uri: data.avatar ?? "https://i.pravatar.cc/100" }}
            style={{ width: 36, height: 36, borderRadius: 18, marginRight: 8 }}
          />
          <View>
            <Text className="font-semibold text-[15px]">{data.user}</Text>
            <Text className="text-[12px] text-gray-500">{data.date}</Text>
          </View>
        </View>

        <View className="items-end">
          <Text className="text-orange-500 font-bold text-[14px]">
            ⭐ {data.rating}/10
          </Text>
          <Text className="text-[11px] text-pink-500">Cực phẩm!</Text>
        </View>
      </View>

      {/* text */}
      <Text className="text-[14px] text-gray-700 mt-3 leading-5">
        {content}

        {data.text.length > 80 && (
          <Text
            className="text-pink-600 font-medium"
            onPress={() => setExpanded((p) => !p)}
          >
            {expanded ? "  thu gọn" : "  xem thêm"}
          </Text>
        )}
      </Text>

      {/* tags */}
      <View className="flex-row flex-wrap gap-2 mt-3">
        {["Tuyệt vời", "Ý nghĩa", "Đáng xem", "Khóc trôi rap", "Hài"].map(
          (tag) => (
            <View
              key={tag}
              className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200"
            >
              <Text className="text-[12px] text-gray-600">{tag}</Text>
            </View>
          )
        )}
      </View>

      {/* images */}
      {data.images?.length > 0 && (
        <View className="flex-row gap-2 mt-3">
          {data.images.map((img: string, index: number) => (
            <Image
              key={index}
              source={{ uri: img }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 8,
              }}
            />
          ))}
        </View>
      )}

      {/* footer buttons */}
      <View className="flex-row items-center justify-between mt-4">
        <Text className="text-[13px] text-gray-500">
          Đánh giá này có hữu ích?
        </Text>

        <View className="flex-row gap-5">
          <TouchableOpacity>
            <Ionicons name="thumbs-up-outline" size={22} color="#444" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="flag-outline" size={22} color="#444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
