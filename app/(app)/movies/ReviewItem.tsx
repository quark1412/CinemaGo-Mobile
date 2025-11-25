// app/(app)/movies/ReviewItem.tsx
import type { Review } from "@/types/review";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

type Props = {
  data: Review;
};

const formatReviewDate = (value?: string | null) => {
  if (!value) return "";

  if (/^\d+$/.test(value)) {
    const ms = Number(value);
    if (!Number.isNaN(ms)) {
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }
    }
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export function ReviewItem({ data }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const rawText = data.content ?? "";
  const avatarUrl = data.userDetail?.avatarUrl || "https://i.pravatar.cc/100";
  const userName = data.userDetail?.fullname || "Người dùng";
  const rating = data.rating ?? 0;
  const ratingLabel =
    rating >= 4 ? "Cực phẩm!" : rating >= 3 ? "Ổn áp" : "Có thể bỏ qua";

  const createdAtText = formatReviewDate(data.createdAt);

  const content = expanded
    ? rawText
    : rawText.length > 80
      ? rawText.slice(0, 80) + "..."
      : rawText;

  const canToggle = rawText.length > 80;

  const handleGoToReply = () => {
    router.push({
      pathname: "/(app)/review/reply-review",
      params: { reviewId: data.id },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handleGoToReply}
      className="bg-white rounded-xl p-4 mb-4 border border-gray-200 relative"
    >
      {/* header */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          {/* avatar */}
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 36, height: 36, borderRadius: 18, marginRight: 8 }}
          />
          <View>
            <Text className="font-semibold text-[15px]">{userName}</Text>
            {!!createdAtText && (
              <Text className="text-[12px] text-gray-500">{createdAtText}</Text>
            )}
          </View>
        </View>

        <View className="items-end">
          <Text className="text-orange-500 font-bold text-[14px]">
            ⭐ {rating}/5
          </Text>
          <Text className="text-[11px] text-pink-500">{ratingLabel}</Text>
        </View>
      </View>

      {/* text */}
      <Text className="text-[14px] text-gray-700 mt-3 leading-5">
        {content}
        {canToggle && (
          <Text
            className="text-pink-600 font-medium"
            onPress={(e) => {
              e.stopPropagation(); // tránh bấm "xem thêm" lại navigate
              setExpanded((p) => !p);
            }}
          >
            {expanded ? "  thu gọn" : "  xem thêm"}
          </Text>
        )}
      </Text>

      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          handleGoToReply();
        }}
        style={{
          position: "absolute",
          right: 10,
          bottom: 10,
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chatbox-ellipses-outline" size={18} color="#ec4899" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
