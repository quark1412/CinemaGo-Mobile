import { useTheme } from "@/contexts/themeContext";
import { useToast } from "@/contexts/toastContext";
import { useUser } from "@/contexts/userContext";
import { movieService } from "@/services/movie";
import { reviewService } from "@/services/review";
import { Movie } from "@/types/movie";
import { Review } from "@/types/review";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

const ExpandableText = ({
  content,
  isDark,
}: {
  content: string;
  isDark: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);

  // Giới hạn ký tự, ví dụ 120 ký tự
  const LENGTH_THRESHOLD = 120;
  const isLongText = content.length > LENGTH_THRESHOLD;

  const bgColor = isDark ? "bg-gray-700" : "bg-gray-100";
  const contentColor = isDark ? "text-slate-300" : "text-gray-900";

  return (
    <View className={`px-3 py-2 rounded-2xl ${bgColor}`}>
      <Text className={`text-[14px] ${contentColor}`}>
        {expanded || !isLongText
          ? content
          : content.slice(0, LENGTH_THRESHOLD) + "..."}
      </Text>

      {isLongText && (
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          className="mt-1"
        >
          <Text className="text-[12px] font-semibold text-gray-500">
            {expanded ? "Thu gọn" : "Xem thêm"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const formatReviewDate = (value?: string | null) => {
  if (!value) return "";

  if (/^\d+$/.test(value)) {
    const ms = Number(value);
    if (!Number.isNaN(ms)) {
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
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
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatReplyTime = (value?: string | null) => {
  if (!value) return "";

  let d: Date | null = null;

  if (/^\d+$/.test(value)) {
    const ms = Number(value);
    if (!Number.isNaN(ms)) d = new Date(ms);
  } else {
    const tmp = new Date(value);
    if (!Number.isNaN(tmp.getTime())) d = tmp;
  }

  if (!d) return "";

  const now = new Date().getTime();
  const diff = Math.max(0, now - d.getTime()); // ms

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (seconds < 60) return "Vài giây trước";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
};

const getRatingLabel = (rating: number) =>
  rating >= 4 ? "Cực phẩm!" : rating >= 3 ? "Ổn áp" : "Có thể bỏ qua";

export default function ReplyReviewScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = insets.top + 52;

  const [commentText, setCommentText] = useState("");
  const { reviewId } = useLocalSearchParams<{ reviewId: string }>();

  const [review, setReview] = useState<Review | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commentInputRef = useRef<TextInput | null>(null);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!reviewId) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const rv = await reviewService.getReviewById(reviewId as string);
        if (cancelled) return;
        setReview(rv);
        console.log(rv);

        if (rv.movieId) {
          const mv = await movieService.getMovieById(rv.movieId);
          if (!cancelled) setMovie(mv);
        }
      } catch (e) {
        console.error("load reply-review error:", e);
        if (!cancelled) setError("Không tải được bài đánh giá.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reviewId]);

  const handleSendReply = async () => {
    const text = commentText.trim();
    if (!text || !review) return;

    try {
      setSending(true);
      const updated = await reviewService.replyToReview({
        reviewId: review.id,
        content: text,
      });

      setReview(updated);
      setCommentText("");
      Keyboard.dismiss();
      showToast("Đăng reply thành công", "success");
    } catch (e) {
      console.error("replyToReview error:", e);
      showToast("Đăng reply thất bại", "error");
    } finally {
      setSending(false);
    }
  };

  const textColor = isDark ? "text-white" : "text-slate-900";

  if (loading && !review) {
    return (
      <View
        className={`flex-1 items-center justify-center ${isDark ? "dark" : "light"} bg-muted-background`}
      >
        <ActivityIndicator />
        <Text className={`mt-2 ${textColor} text-sm`}>
          Đang tải bài đánh giá...
        </Text>
      </View>
    );
  }

  if (error || !review) {
    return (
      <View
        className={`flex-1 items-center justify-center ${isDark ? "dark" : "light"} bg-muted-background`}
      >
        <Text className={`text-sm ${textColor}`}>
          {error || "Không tìm thấy bài đánh giá."}
        </Text>
      </View>
    );
  }
  const iconColor = isDark ? "#fff" : "#0f172a";

  return (
    <View
      style={{ flex: 1 }}
      className={`${isDark ? "dark" : "light"} bg-muted-background`}
    >
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
            Bài viết chi tiết
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className={`flex-1 ${isDark ? "dark" : "light"} bg-muted-background`}
        enabled={isKeyboardVisible}
        behavior={"padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? HEADER_HEIGHT : 0}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            className={`p-4 ${isDark ? "dark" : "light"} bg-muted-background`}
          >
            <View className="flex-row mb-3">
              <Image
                source={{
                  uri:
                    review.userDetail?.avatarUrl || "https://i.pravatar.cc/100",
                }}
                className="w-10 h-10 rounded-full mr-3"
              />
              <View className="flex-1">
                <View className="flex-row flex-wrap items-center">
                  <Text
                    className={`${isDark ? "text-slate-100" : "text-slate-600"} text-sm`}
                  >
                    Đánh giá{" "}
                  </Text>
                  <Text
                    className={`font-[bold] ${isDark ? "text-white" : "text-slate-900"} text-sm`}
                  >
                    {movie?.title}
                  </Text>
                </View>
                <View className="flex-row items-center mt-0.5">
                  <Text
                    className={`font-[bold] ${isDark ? "text-slate-100" : "text-slate-900"} text-sm mr-2`}
                  >
                    {review.userDetail?.fullname || "Người dùng"}
                  </Text>

                  <Text
                    className={`text-xs ${isDark ? "text-slate-400" : "text-gray-400"} pt-1`}
                  >
                    • {formatReviewDate(review.createdAt)} •
                  </Text>
                  <Ionicons
                    name="earth"
                    size={12}
                    color="#9ca3af"
                    style={{ marginLeft: 4, marginTop: 1 }}
                  />
                </View>
              </View>
              {/* <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={20} color="#6b7280" />
            </TouchableOpacity> */}
            </View>

            <View className="mb-2">
              <View className="flex-row items-center mb-1">
                <Ionicons name="star" size={16} color="#f59e0b" />
                <Text
                  className={`ml-1 font-[bold] text-base ${isDark ? "text-slate-100" : "text-gray-800"}`}
                >
                  {review.rating ?? 0}/5 - {getRatingLabel(review.rating ?? "")}
                </Text>
              </View>

              <Text
                className={`text-[15px] leading-6 mb-3 ${isDark ? "text-slate-100" : "text-gray-800"}`}
              >
                {review.content}
              </Text>
            </View>
          </View>

          {movie && (
            <View
              className={`px-4 pb-4 ${isDark ? "dark" : "light"} bg-card-secondary border-b border-gray-100`}
            >
              <View className="flex-row items-center border border-gray-200 rounded-lg p-3">
                <Image
                  source={{ uri: movie.thumbnail }}
                  className="w-12 h-16 rounded-md mr-3 bg-gray-200"
                />
                <View className="flex-1">
                  <Text
                    className={`font-[bold] text-base ${isDark ? "text-slate-100" : "text-gray-800"}`}
                    numberOfLines={1}
                  >
                    {movie.title}
                  </Text>
                  {movie.genres?.length ? (
                    <Text
                      className="text-[12px] text-gray-500 mt-1"
                      numberOfLines={1}
                    >
                      {movie.genres.map((g) => g.name).join(", ")}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  className="bg-pink-500 px-4 py-2 rounded-lg"
                  onPress={() => {
                    // TODO: điều hướng sang màn đặt vé
                  }}
                >
                  <Text className="text-white font-bold text-sm">Đặt vé</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View
            className={`flex-row border-gray-100 border-b py-3 ${isDark ? "dark" : "light"} bg-muted-background`}
          >
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-2 border-l border-gray-100"
              onPress={() => commentInputRef.current?.focus()}
            >
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color={isDark ? "#ffff" : "#4b5563"}
              />
              <Text
                className={` ${isDark ? "text-slate-200" : "text-gray-600"} font-[medium]`}
              >
                Bình luận
              </Text>
            </TouchableOpacity>
          </View>

          {review.response && review.response.length > 0 && (
            <View
              className={`mt-2 ${isDark ? "dark" : "light"} bg-card-background`}
            >
              <Text
                className={`text-[13px] font-[semibold] mb-2 ml-2 ${textColor}`}
              >
                Phản hồi ({review.response.length})
              </Text>

              {review.response.map((rep, idx) => {
                const avatarUrl =
                  rep.userDetail?.avatarUrl || "https://i.pravatar.cc/100";
                const displayName =
                  rep.userDetail?.fullname || "Người phản hồi";

                return (
                  <View key={idx} className="flex-row mb-3 ml-3">
                    <Image
                      source={{ uri: avatarUrl }}
                      className="w-8 h-8 rounded-full mr-2 bg-gray-200"
                    />

                    <View className="flex-1">
                      <Text
                        className={`text-[13px] font-[semibold] ${textColor}`}
                      >
                        {displayName}
                      </Text>

                      <View className="mt-1 max-w-[80%]">
                        {/* <Text
                          className={` ${isDark ? "bg-gray-500" : "bg-gray-100"} px-3 py-2 rounded-2xl text-[14px] ${isDark ? "text-slate-300" : "text-gray-900"} `}
                        >
                          {rep.content}
                        </Text> */}
                        <ExpandableText content={rep.content} isDark={isDark} />
                      </View>

                      <View className="flex-row items-center mt-1">
                        <Text className="text-[11px] text-gray-400">
                          {formatReplyTime(rep.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {review.response && review.response.length === 0 && (
            <View
              className={`py-8 items-center justify-center  ${isDark ? "dark" : "light"} bg-muted-background min-h-[200px]`}
            >
              <View className="bg-gray-100 p-4 rounded-full mb-3">
                <Ionicons name="chatbox-ellipses" size={32} color="#9ca3af" />
              </View>
              <Text className="text-gray-500 text-sm mb-4">
                Trở thành người đầu tiên bình luận
              </Text>
              {/* <TouchableOpacity>
                <Text className="text-pink-500 font-medium text-sm">
                  Xem thêm bình luận ▼
                </Text>
              </TouchableOpacity> */}
            </View>
          )}
        </ScrollView>

        <View
          style={{
            paddingBottom: 8 + (isKeyboardVisible ? 0 : insets.bottom),
            paddingTop: 8,

            borderTopWidth: 1,
            borderColor: isDark ? "#1e293b" : "#f3f4f6",
          }}
          className={`px-3 flex-row items-center ${isDark ? "dark" : "light"} bg-background`}
        >
          <Image
            source={{ uri: user?.avatarUrl }}
            className="w-8 h-8 rounded-full mr-2"
          />

          <View
            className={`flex-1 flex-row items-center ${isDark ? "bg-gray-300" : "bg-gray-100"}  rounded-full px-4 py-2 mr-2`}
          >
            <TextInput
              ref={commentInputRef}
              multiline
              placeholder="Để lại bình luận của bạn..."
              className="flex-1 text-sm text-gray-800 py-1"
              value={commentText}
              onChangeText={setCommentText}
              style={{
                maxHeight: 50,
                paddingTop: 0,
                paddingBottom: 0,
              }}
            />
          </View>

          {commentText.length > 0 && (
            <TouchableOpacity onPress={handleSendReply} disabled={sending}>
              <Ionicons name="send" size={24} color="#ec4899" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
