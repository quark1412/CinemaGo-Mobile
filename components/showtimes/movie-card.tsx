import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import { useTheme } from "@/contexts/themeContext";
import type { MovieWithLabels } from "@/hook/useCinemaShowtimes";
import type { Showtime } from "@/types/showtime";

type Movie = MovieWithLabels;

type Props = {
  movie: Movie;
  onPressTrailer?: (url: string) => void;
  onPressShowtime?: (showtime: Showtime, movie: Movie) => void;
};

const formatDuration = (minutes?: number) => {
  if (!minutes || minutes <= 0) return "";
  return `${minutes} phút`;
};

const formatTimeHHmm = (iso: string) => {
  if (!iso) return "";
  const m = iso.match(/T(\d{2}:\d{2})/);
  if (m) return m[1];

  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
};

const formatShowDate = (iso: string) => {
  if (!iso) return "";

  const datePart = iso.slice(0, 10);
  const [yearStr, monthStr, dayStr] = datePart.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) return "";

  const d = new Date(year, month - 1, day);

  const weekdays = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const w = weekdays[d.getDay()];
  const dd = day.toString().padStart(2, "0");
  const mm = month.toString().padStart(2, "0");
  const yyyy = year;

  return `${w}, ${dd}/${mm}/${yyyy}`;
};

const buildOptimizedTrailerUrl = (rawUrl?: string | null) => {
  if (!rawUrl) return null;

  const match = rawUrl.match(
    /(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(.*)/
  );
  if (!match) return rawUrl;

  const base = match[1];
  const rest = match[2];

  const transformations = "f_auto,q_auto:eco,vc_auto,w_720,so_0,eo_60";

  return `${base}${transformations}/${rest}`;
};

export default function MovieCard({
  movie,
  onPressTrailer,
  onPressShowtime,
}: Props) {
  const m = movie;
  const genresText = m.genres?.map((g) => g.name).join(", ");

  type DateSection = {
    dateKey: string;
    dateLabel: string;
    formats: {
      name: string;
      showtimes: Showtime[];
    }[];
  };

  const dateMap = new Map<string, DateSection>();

  (m.labels ?? []).forEach((group) => {
    (group.showtimes ?? []).forEach((st) => {
      const iso = st.startTime as string;
      if (!iso) return;

      const dateKey = iso.slice(0, 10);
      let dateSection = dateMap.get(dateKey);

      if (!dateSection) {
        dateSection = {
          dateKey,
          dateLabel: formatShowDate(iso),
          formats: [],
        };
        dateMap.set(dateKey, dateSection);
      }

      let fmt = dateSection.formats.find((f) => f.name === group.name);
      if (!fmt) {
        fmt = { name: group.name, showtimes: [] };
        dateSection.formats.push(fmt);
      }

      fmt.showtimes.push(st);
    });
  });

  const dateSections = Array.from(dateMap.values()).sort((a, b) =>
    a.dateKey.localeCompare(b.dateKey)
  );

  const [descExpanded, setDescExpanded] = useState(false);
  const [descHasMore, setDescHasMore] = useState(false);
  const [descMeasured, setDescMeasured] = useState(false);

  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>(
    {}
  );

  const toggleDesc = () => setDescExpanded((prev) => !prev);

  const { isDark } = useTheme();
  const textColor = isDark ? "text-white" : "text-slate-900";
  const iconColor = isDark ? "#fff" : "#0f172a";
  return (
    <View
      className={`${isDark ? "dark" : "light"} bg-muted-background rounded-2xl p-3 mb-4 shadow-sm`}
    >
      <View className="flex-row">
        <Image
          source={{ uri: m.thumbnail }}
          className="w-36 h-52 rounded-xl mr-3"
        />

        <View className="flex-1">
          <View className="flex-row justify-between items-start mb-1">
            <Text
              className={`flex-1 text-[15px] font-[extraBold] pr-2 leading-tight ${textColor}`}
            >
              {m.title}
            </Text>

            <Pressable
              onPress={() => {
                // TODO: điều hướng sang màn chi tiết phim nếu có
              }}
            >
              <Text className="text-pink-500 font-semibold">Chi tiết</Text>
            </Pressable>
          </View>

          <Text className={`text-[11px] text-gray-600 mb-1 ${textColor}`}>
            {genresText}
            {genresText ? " · " : ""}
            {formatDuration(m.duration)}
          </Text>

          {!!m.description && (
            <View className="mb-1">
              <Text
                className={`text-[11px] text-gray-700 ${textColor}`}
                numberOfLines={
                  descMeasured && descHasMore && !descExpanded ? 2 : undefined
                }
                onTextLayout={(e) => {
                  if (descMeasured) return;
                  const more = e.nativeEvent.lines.length > 2;
                  setDescHasMore(more);
                  setDescMeasured(true);
                }}
              >
                {m.description}
              </Text>

              {descHasMore && (
                <Pressable onPress={toggleDesc}>
                  <Text className="text-[11px] text-pink-500 font-semibold mt-0.5">
                    {descExpanded ? "Thu gọn" : "Xem thêm"}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          <Pressable
            onPress={() => {
              if (!m.trailerUrl || !onPressTrailer) return;
              const optimized = buildOptimizedTrailerUrl(m.trailerUrl);
              if (!optimized) return;
              onPressTrailer(optimized);
            }}
            disabled={!m.trailerUrl || !onPressTrailer}
            className="flex-row items-center mt-1"
          >
            <MaterialIcons
              name="ondemand-video"
              size={16}
              color={m.trailerUrl ? "#E91E63" : "#9CA3AF"}
            />
            <Text
              className={`ml-1 underline font-semibold text-[13px] ${
                m.trailerUrl ? "text-pink-600" : "text-gray-400"
              }`}
            >
              Trailer
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-3">
        {dateSections.map((section) => {
          const dateKey = `${m.id}-${section.dateKey}`;
          const expanded = expandedDates[dateKey] ?? true;

          const toggleDate = () =>
            setExpandedDates((prev) => ({ ...prev, [dateKey]: !expanded }));

          return (
            <View
              key={section.dateKey}
              className="mb-3 rounded-xl border border-gray-200"
            >
              <Pressable
                onPress={toggleDate}
                className="flex-row justify-between items-center px-3 py-2"
              >
                <Text className={`text-[12px] font-[semibold] ${textColor}`}>
                  {section.dateLabel}
                </Text>
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={iconColor}
                />
              </Pressable>

              {expanded && (
                <View className="px-3 pb-2">
                  {section.formats.map((fmt) => (
                    <View key={fmt.name} className="mb-2">
                      <Text
                        className={`text-[11px] font-[semibold] mb-1 uppercase ${textColor}`}
                      >
                        {fmt.name}
                      </Text>

                      <View className="flex-row flex-wrap gap-2">
                        {fmt.showtimes.map((st) => (
                          <Pressable
                            key={st.id}
                            onPress={() =>
                              onPressShowtime && onPressShowtime(st, movie)
                            }
                            className="px-3 py-1.5 rounded-md border border-gray-300"
                          >
                            <Text
                              className={`text-[13px] font-[semibold] ${textColor}`}
                            >
                              {formatTimeHHmm(st.startTime as string)}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
