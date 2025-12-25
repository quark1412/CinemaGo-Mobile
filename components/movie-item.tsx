import { useTheme } from "@/contexts/themeContext";
import type { Genre } from "@/types/movie";
import { Ionicons } from "@expo/vector-icons";
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
  const { isDark } = useTheme();
  // Theme-aware colors
  const cardBg = isDark ? "bg-slate-800" : "bg-slate-100";
  const textColor = isDark ? "text-white" : "text-slate-900";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className={`mb-4 w-[48%] }`}
      onPress={() => onPress?.(id)}
    >
      <View className={`rounded-xl overflow-hidden shadow-sm `}>
        <Image
          source={{ uri: poster || FALLBACK_POSTER }}
          style={{
            width: "100%",
            height: 220,
            backgroundColor: "#eee",
          }}
          className="rounded-t-xl"
        />

        <View className={`p-2 ${cardBg}`}>
          {(rating ?? 0) >= 0 && (
            <View className="flex-row items-center mb-1">
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text className="ml-1 text-[13px] font-[bold] text-orange-500">
                {(rating ?? 0).toFixed(1)}
              </Text>
              {!!reviewCount && (
                <Text className="text-gray-500 text-[12px]">
                  {" "}
                  ({reviewCount})
                </Text>
              )}
            </View>
          )}

          <Text
            className={`font-[bold] text-[15px] leading-tight ${textColor}`}
            numberOfLines={1}
          >
            {title}
          </Text>

          {!!genres && (
            <Text
              className="text-gray-400 text-[13px] mt-0.5 font-[medium]"
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
