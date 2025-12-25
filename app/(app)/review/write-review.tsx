import { useTheme } from "@/contexts/themeContext";
import { useToast } from "@/contexts/toastContext";
import { reviewService } from "@/services/review";
import type { CreateReviewInput } from "@/types/review";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MAX_LENGTH = 1000;

const getRatingLabel = (rating: number) => {
  if (rating >= 4.5) return "Tuyệt vời";
  if (rating >= 3.5) return "Rất hay";
  if (rating >= 2.5) return "Ổn";
  if (rating >= 1.5) return "Khá chán";
  if (rating > 0) return "Kém";
  return "Chọn số sao bạn muốn đánh giá";
};

export default function WriteReviewScreen() {
  const { movieId } = useLocalSearchParams<{ movieId?: string }>();
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [rating, setRating] = useState(0); // 0–5, step 0.5
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [helpfulness, setHelpfulness] = useState<number>(1);

  const textColor = isDark ? "text-white" : "text-slate-900";
  const iconColor = isDark ? "#fff" : "#0f172a";

  const handlePressStar = (index: number) => {
    setRating(index + 1);
  };

  const handleSubmit = async () => {
    if (!movieId) {
      showToast("Không xác định được phim để đánh giá.", "error");
      return;
    }

    if (rating <= 0) {
      showToast("Vui lòng chọn số sao trước khi gửi.", "warning");
      return;
    }

    const trimmed = content.trim();

    const payload: CreateReviewInput = {
      movieId: movieId,
      rating,
      content: trimmed || undefined,
    };

    try {
      setSubmitting(true);
      await reviewService.createReview(payload);
      showToast("Cảm ơn bạn đã gửi đánh giá!", "success");
      router.back();
    } catch (e: any) {
      console.log("createReview error:", e);
      showToast(e?.message || "Không gửi được đánh giá, thử lại sau.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const autoLevelFromLength = (len: number) => {
    if (len >= 150) return 3; // Tuyệt vời
    if (len >= 50) return 2; // Tốt
    return 1; // Khá
  };

  const getHelpfulnessLabel = (value: number) => {
    if (value <= 1) return "Khá";
    if (value === 2) return "Tốt";
    return "Tuyệt vời";
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {/* HEADER */}
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: isDark ? "#070f20" : "#fde2e8",
        }}
      >
        <View
          style={{
            height: 52,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ position: "absolute", left: 8 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={iconColor} />
          </TouchableOpacity>

          <Text
            numberOfLines={1}
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: iconColor,
            }}
          >
            Viết đánh giá
          </Text>
        </View>
      </View>

      <View
        style={{ flex: 1 }}
        className={` ${isDark ? "dark" : "light"} bg-muted-background`}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 100 + insets.bottom,
          }}
        >
          <View style={{ alignItems: "center", marginTop: 8 }}>
            <Text
              style={{ fontSize: 18, fontWeight: "700", marginBottom: 4 }}
              className={`${textColor}`}
            >
              {rating > 0 ? `${rating.toFixed(1)}/5.0` : "0/5.0"}
            </Text>
            <Text
              style={{ fontSize: 13, color: isDark ? "#d1d5db" : "#374151" }}
            >
              {getRatingLabel(rating)}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: 12,
              marginBottom: 16,
            }}
          >
            {Array.from({ length: 5 }).map((_, idx) => {
              let icon: "star" | "star-half" | "star-outline" = "star-outline";
              if (rating >= idx + 1) icon = "star";
              else if (rating >= idx + 0.5) icon = "star-half";

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handlePressStar(idx)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ paddingHorizontal: 4 }}
                >
                  <Ionicons
                    name={icon}
                    size={32}
                    color={rating > 0 ? "#f59e0b" : "#d1d5db"}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              marginTop: 4,
              marginBottom: 6,
            }}
            className={`${textColor}`}
          >
            Cảm nhận thêm về bộ phim
          </Text>

          <View
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isDark ? "#e5e7eb" : "#1f2937",
              padding: 10,
              minHeight: 120,
            }}
          >
            <TextInput
              placeholder="Chia sẻ cảm nhận của bạn..."
              placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
              multiline
              value={content}
              onChangeText={(text) => {
                if (text.length <= MAX_LENGTH) setContent(text);

                const len = text.trim().length;
                setHelpfulness(autoLevelFromLength(len));
              }}
              style={{
                fontSize: 14,
                color: textColor === "text-white" ? "#ffffff" : "#0f172a",
                textAlignVertical: "top",
                minHeight: 90,
              }}
            />
            <Text
              style={{
                textAlign: "right",
                fontSize: 11,
                color: "#9ca3af",
                marginTop: 4,
              }}
              className={`${textColor}`}
            >
              {content.length}/{MAX_LENGTH}
            </Text>
          </View>
          <View
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                marginBottom: 4,
              }}
              className={`${textColor}`}
            >
              Mức độ giúp ích người dùng khác:{" "}
              <Text style={{ color: "#ec4899", fontWeight: "700" }}>
                {getHelpfulnessLabel(helpfulness)}
              </Text>
            </Text>

            <View pointerEvents="none">
              <Slider
                style={{ width: "100%", marginTop: 8 }}
                minimumValue={1}
                maximumValue={3}
                step={1}
                value={helpfulness}
                onValueChange={(value) => setHelpfulness(value)}
                minimumTrackTintColor="#ec4899"
                maximumTrackTintColor="#e5e7eb"
                thumbTintColor="#ec4899"
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 4,
              }}
            >
              <Text
                style={{ fontSize: 11, color: isDark ? "#9ca3af" : "#6b7280" }}
              >
                Khá
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: isDark ? "#9ca3af" : "#6b7280",
                  paddingLeft: 20,
                }}
              >
                Tốt
              </Text>
              <Text
                style={{ fontSize: 11, color: isDark ? "#9ca3af" : "#6b7280" }}
              >
                Tuyệt vời
              </Text>
            </View>

            <View style={{ marginTop: 10 }}>
              <Text
                style={{ fontSize: 11, color: isDark ? "#9ca3af" : "#6b7280" }}
              >
                Review của bạn sẽ hữu ích hơn khi 😍
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: isDark ? "#9ca3af" : "#6b7280",
                  marginTop: 2,
                }}
              >
                ✍ Viết ít nhất 50 kí tự
              </Text>
            </View>
          </View>
        </ScrollView>

        {rating > 0 && (
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 8,
              paddingTop: 8,
              backgroundColor: isDark ? "#070f20" : "#fff",
              borderTopWidth: 1,
              borderColor: isDark ? "#1f2937" : "#e5e7eb",
            }}
          >
            <TouchableOpacity
              disabled={submitting}
              onPress={handleSubmit}
              style={{
                backgroundColor: "#ec4899",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text
                  style={{
                    color: "white",
                    fontWeight: "600",
                    fontSize: 16,
                  }}
                >
                  Gửi đánh giá
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
