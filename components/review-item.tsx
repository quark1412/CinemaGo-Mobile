// app/(app)/movies/ReviewItem.tsx
import { useTheme } from "@/contexts/themeContext";
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
  const { isDark } = useTheme();

  const [expanded, setExpanded] = useState(false);

  const rawText = data.content ?? "";
  const avatarUrl = data.userDetail?.avatarUrl || "https://i.pravatar.cc/100";
  const userName = data.userDetail?.fullname || "Người dùng";
  const rating = data.rating ?? 0;

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

  const textColor = isDark ? "text-white" : "text-slate-900";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handleGoToReply}
      className={` rounded-xl p-4 mb-4 border border-gray-200 relative ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
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
            <Text className={`font-[semibold] text-[15px] ${textColor}`}>
              {userName}
            </Text>
            {!!createdAtText && (
              <Text
                className={`text-[12px] ${isDark ? "text-gray-300" : "text-gray-800"}`}
              >
                {createdAtText}
              </Text>
            )}
          </View>
        </View>

        <View className="items-end">
          <Text className="text-orange-500 font-bold text-[14px]">
            ⭐ {rating}/5
          </Text>
        </View>
      </View>

      {/* text */}
      <View className="mt-3">
        <Text
          className={`text-[14px] leading-5 ${isDark ? "text-gray-300" : "text-gray-800"}`}
        >
          {content}
        </Text>

        {canToggle && (
          <Text
            className="text-pink-600 font-medium text-[13px] mt-1"
            onPress={(e) => {
              e.stopPropagation();
              setExpanded((p) => !p);
            }}
          >
            {expanded ? "Thu gọn" : "Xem thêm"}
          </Text>
        )}
      </View>

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
