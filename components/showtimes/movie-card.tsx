import { useTheme } from "@/contexts/themeContext";
import type { MovieWithLabels } from "@/hook/useCinemaShowtimes";
import type { Showtime } from "@/types/showtime";
import { handleMovieTrailerPress } from "@/utils/trailerHelper";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

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

const VN_TZ = "Asia/Ho_Chi_Minh";

const getVietnamDateKeyAndLabel = (iso?: string | null) => {
  if (!iso) return null;

  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;

  const dateKey = d.toLocaleDateString("en-CA", {
    timeZone: VN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const weekday = d.toLocaleDateString("vi-VN", {
    timeZone: VN_TZ,
    weekday: "long",
  });
  const datePart = d.toLocaleDateString("vi-VN", {
    timeZone: VN_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const dateLabel = `${weekday}, ${datePart}`;

  return { dateKey, dateLabel };
};

const formatVNTime = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("vi-VN", {
    timeZone: VN_TZ,
    hour: "2-digit",
    minute: "2-digit",
  }); // ví dụ: "19:30"
};

const isYoutubeUrl = (url: string) => {
  const lower = url.toLowerCase();
  return lower.includes("youtube.com") || lower.includes("youtu.be");
};

const getYoutubeId = (url: string) => {
  try {
    const u = new URL(url);

    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) {
        return u.pathname.split("/embed/")[1];
      }

      const v = u.searchParams.get("v");
      if (v) return v;
    }

    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "");
    }
  } catch (e) {
    console.log("parse youtube url error", e);
  }
  return null;
};

const buildOptimizedTrailerUrl = (rawUrl?: string | null) => {
  if (!rawUrl) return null;

  const match = rawUrl.match(
    /(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(.*)/
  );
  if (!match) return rawUrl;

  const base = match[1];
  const rest = match[2];

  const transformations = "c_limit,w_480,f_auto,q_auto:eco,so_0,d_30";

  return `${base}${transformations}/${rest}`;
};

export default function MovieCard({
  movie,
  onPressTrailer,
  onPressShowtime,
}: Props) {
  const m = movie;
  console.log(m);

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
      const iso = st.startTime as string | undefined;
      if (!iso) return;

      const info = getVietnamDateKeyAndLabel(iso);
      if (!info) return;
      const { dateKey, dateLabel } = info;

      let dateSection = dateMap.get(dateKey);

      if (!dateSection) {
        dateSection = {
          dateKey,
          dateLabel,
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
  const navigation = useNavigation<any>();

  const toggleDesc = () => setDescExpanded((prev) => !prev);

  const { isDark } = useTheme();
  const textColor = isDark ? "text-white" : "text-slate-900";
  const iconColor = isDark ? "#fff" : "#0f172a";

  const genreBgClass = isDark ? "bg-slate-700" : "bg-slate-300";
  const genreTextClass = isDark ? "text-slate-100" : "text-slate-800";
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
                router.push({
                  pathname: "/(app)/movies/[id]",
                  params: {
                    id: m.id,
                  },
                });
              }}
            >
              <Text className="text-pink-500 font-semibold">Chi tiết</Text>
            </Pressable>
          </View>

          <View className="flex-col items-start mb-2 mt-1">
            {!!m.genres?.length && (
              <View className="flex-row items-start  mr-3">
                <Ionicons name="pricetag-outline" size={12} color={iconColor} />

                <View className="flex-row flex-wrap ml-1 gap-1 flex-1">
                  {m.genres.map((g) => (
                    <View
                      key={g.id ?? g.name}
                      className={`px-2 py-0.5 rounded-full ${genreBgClass}`}
                    >
                      <Text className={`text-xs ${genreTextClass}`}>
                        {g.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {m.duration ? (
              <View className="flex-row items-center mt-1">
                <Ionicons name="time-outline" size={12} color={iconColor} />
                <Text className={`ml-1 text-xs ${textColor}`}>
                  {formatDuration(m.duration)}
                </Text>
              </View>
            ) : null}
          </View>

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
            // onPress={() => {
            //   if (!m.trailerUrl) return;

            //   const url = m.trailerUrl.trim();

            //   if (isYoutubeUrl(url)) {
            //     const id = getYoutubeId(url);

            //     if (!id) return;

            //     router.push({
            //       pathname: "/showtimes/trailer",
            //       params: {
            //         youtubeId: id,
            //         title: m.title ?? "",
            //       },
            //     });
            //     return;
            //   }

            //   if (!onPressTrailer) return;

            //   console.log("cloudinary");

            //   const optimized = buildOptimizedTrailerUrl(m.trailerUrl);
            //   if (!optimized) return;

            //   onPressTrailer(optimized);
            // }}
            onPress={() => handleMovieTrailerPress(m, onPressTrailer)}
            disabled={!m.trailerUrl}
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
                              {formatVNTime(st.startTime as string)}
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
