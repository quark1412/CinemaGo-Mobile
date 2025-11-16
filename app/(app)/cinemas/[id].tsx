// app/screens/Showtimes.tsx
import { generateNext7Days } from "@/utils/dayUtils";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

type RouteParams = { cinemaId: string; cinemaName: string };

type ShowTime = {
  id: string;
  time: string;
  end: string;
  left: number;
  total: number;
};
type Movie = {
  id: string;
  title: string;
  subTitle?: string;
  poster: string;
  age: string;
  formats: string[];
  duration: string;
  trailerUrl: string;
  // Mỗi nhãn (label) sẽ có danh sách suất chiếu riêng
  labels: {
    name: string; // ví dụ: "2D Phụ đề · IMAX"
    showtimes: ShowTime[];
  }[];
};

const MOCK_MOVIES: Movie[] = [
  {
    id: "m1",
    title: "G-DRAGON IN CINEMA",
    subTitle: "[Übermensch]",
    poster: "https://i.imgur.com/6vZQF2g.jpeg",
    age: "13+",
    formats: ["Tài Liệu", "Nhạc", "2D", "Dolby Atmos", "ScreenX", "4DX"],
    duration: "1 giờ 46 phút",
    labels: [
      {
        name: "2D Phụ đề · IMAX",
        showtimes: [
          { id: "st1", time: "17:30", end: "19:33", left: 268, total: 278 },
          { id: "st2", time: "19:40", end: "21:43", left: 253, total: 278 },
          { id: "st3", time: "17:30", end: "19:33", left: 268, total: 278 },
          { id: "st4", time: "17:30", end: "19:33", left: 268, total: 278 },
          { id: "st5", time: "17:30", end: "19:33", left: 268, total: 278 },
        ],
      },
      {
        name: "4DX Lồng tiếng",
        showtimes: [
          { id: "st3", time: "20:10", end: "22:15", left: 150, total: 278 },
          { id: "st6", time: "20:10", end: "22:15", left: 150, total: 278 },
          { id: "st7", time: "20:10", end: "22:15", left: 150, total: 278 },
        ],
      },
    ],
    trailerUrl:
      "https://www.youtube.com/watch?v=jPjQJYKhhk4&list=RDMMjPjQJYKhhk4&start_radio=1",
  },
  {
    id: "m2",
    title: "Quái Thú Vô Hình: Vùng Đất Chết Chóc",
    poster: "https://i.imgur.com/Xb4mM8H.jpeg",
    age: "16+",
    formats: ["Khoa Học Viễn Tưởng", "Hành Động", "2D", "3D", "4DX"],
    duration: "1 giờ 46 phút",
    labels: [
      {
        name: "2D Phụ đề · IMAX",
        showtimes: [
          { id: "st1", time: "17:30", end: "19:33", left: 268, total: 278 },
          { id: "st2", time: "19:40", end: "21:43", left: 253, total: 278 },
        ],
      },
      {
        name: "4DX Lồng tiếng",
        showtimes: [
          { id: "st3", time: "20:10", end: "22:15", left: 150, total: 278 },
        ],
      },
    ],
    trailerUrl:
      "https://www.youtube.com/watch?v=jPjQJYKhhk4&list=RDMMjPjQJYKhhk4&start_radio=1",
  },
];

const DAYS = generateNext7Days();

const TIME_FILTERS = [
  { label: "00:00 - 03:00", start: 0, end: 3 },
  { label: "03:00 - 06:00", start: 3, end: 6 },
  { label: "06:00 - 09:00", start: 6, end: 9 },
  { label: "09:00 - 12:00", start: 9, end: 12 },
  { label: "12:00 - 15:00", start: 12, end: 15 },
  { label: "15:00 - 18:00", start: 15, end: 18 },
  { label: "18:00 - 21:00", start: 18, end: 21 },
  { label: "21:00 - 24:00", start: 21, end: 24 },
];

const currentHour = new Date().getHours();

// Lọc ra các khung giờ còn hiệu lực (chưa kết thúc)
const visibleTimeFilters = TIME_FILTERS.filter((t) => t.end >= currentHour);

export default function Showtimes() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [showTrailer, setShowTrailer] = useState(false);
  const [currentTrailer, setCurrentTrailer] = useState<string | null>(null);

  const { id, cinemaName } = useLocalSearchParams<{
    id: string;
    cinemaName?: string;
  }>();

  const [dayIdx, setDayIdx] = useState(0);
  const [timeIdx, setTimeIdx] = useState(0);

  const movies = useMemo(() => {
    // TODO: lọc theo dayIdx/timeIdx nếu dữ liệu thật có khung giờ
    return MOCK_MOVIES;
  }, [dayIdx, timeIdx]);

  const pill = (
    label: string,
    active: boolean,
    onPress: () => void,
    small = false
  ) => (
    <Pressable
      key={label}
      onPress={onPress}
      className={`px-3 ${small ? "h-7" : "h-9"} rounded-full border mr-2 items-center justify-center ${
        active ? "bg-pink-100 border-pink-300" : "bg-white border-gray-200"
      }`}
    >
      <Text
        className={`font-semibold ${small ? "text-xs" : "text-sm"} ${active ? "text-pink-600" : "text-gray-700"}`}
      >
        {label}
      </Text>
    </Pressable>
  );

  const showtimeChip = (st: ShowTime) => (
    <Pressable
      key={st.id}
      onPress={() => {
        /* điều hướng chọn ghế */
      }}
      className="border border-gray-200 rounded-xl px-3 py-1.5 mr-2 mb-2"
    >
      <Text className="text-[13px] font-semibold">
        {st.time} - {st.end}
      </Text>
      <Text className="text-[10px] text-gray-500">
        Còn {st.left}/{st.total}
      </Text>
    </Pressable>
  );

  const movieCard = (m: Movie) => (
    <View key={m.id} className="bg-white rounded-2xl p-3 mb-4 shadow-sm">
      {/* ===== Header: Title + Chi tiết ===== */}
      <View className="flex-row justify-between items-start mb-1">
        <Text className="flex-1 text-[15px] font-extrabold pr-2 leading-tight">
          {m.title}
          {m.subTitle ? `\n${m.subTitle}` : ""}
        </Text>

        <Pressable
          onPress={() => {
            /* chuyển sang chi tiết phim */
          }}
        >
          <Text className="text-pink-500 font-semibold">Chi tiết</Text>
        </Pressable>
      </View>

      {/* ===== Info row: Age + Genre + Duration ===== */}
      <View className="flex-row items-center mb-2">
        <View className="bg-yellow-100 px-1.5 py-0.5 rounded-md mr-2">
          <Text className="text-[11px] font-bold text-yellow-700">{m.age}</Text>
        </View>
        <Text className="text-[11px] text-gray-600 flex-1">
          {m.formats.join(", ")} · {m.duration}
        </Text>
      </View>

      {/* ===== Poster + Showtimes layout ===== */}
      <View className="flex-row">
        {/* Poster */}
        <View className="w-[30%] mr-3">
          <Image
            source={{ uri: m.poster }}
            className="w-full aspect-[2/3] rounded-xl"
          />

          {/* Trailer nằm sát poster */}
          <Pressable
            onPress={() => {
              if (m.trailerUrl) {
                setCurrentTrailer(m.trailerUrl);
                setShowTrailer(true);
              } else {
                alert("Trailer hiện chưa có!");
              }
            }}
            className="flex-row items-center mt-2"
          >
            <MaterialIcons name="ondemand-video" size={16} color="#E91E63" />
            <Text className="ml-1 underline font-semibold text-pink-600 text-[13px]">
              Trailer
            </Text>
          </Pressable>
        </View>

        {/* Showtimes */}
        <View className="flex-1">
          {m.labels.map((group, idx) => (
            <View key={group.name + idx} className="mb-3">
              {/* Nhãn nhóm suất chiếu */}
              <View className="bg-gray-100 rounded-md px-2 py-1 mb-2">
                <Text className="text-[12px] font-semibold">{group.name}</Text>
              </View>

              {/* Danh sách suất chiếu */}
              <View className="flex-row flex-wrap gap-2">
                {group.showtimes.map((st) => (
                  <Pressable
                    key={st.id}
                    onPress={() => {
                      // ví dụ router.push(`/booking/${st.id}`)
                    }}
                    className="px-3 py-2 bg-white rounded-lg border border-gray-200 shadow-sm"
                  >
                    <Text className="text-[13px] font-semibold text-gray-800">
                      {st.time} - {st.end}
                    </Text>
                    <Text className="text-[11px] text-gray-500">
                      Còn {st.left}/{st.total}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="px-3 pt-1 pb-3 bg-white">
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={20} />
          </Pressable>
          <Text className="text-[16px] font-extrabold">{cinemaName}</Text>
          <View className="flex-row">
            <Pressable className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center mr-2">
              <Ionicons name="car-outline" size={18} />
            </Pressable>
            <Pressable className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
              <Ionicons name="close" size={18} />
            </Pressable>
          </View>
        </View>

        {/* Day pills */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 px-3"
        >
          {DAYS.map((d, i) => {
            const active = i === dayIdx;
            return (
              <Pressable
                key={d.key}
                onPress={() => setDayIdx(i)}
                className={`mr-2 rounded-full border px-3 py-2 items-center justify-center
          ${active ? "bg-pink-100 border-pink-300" : "bg-white border-gray-200"}`}
                hitSlop={8}
              >
                {/* Dòng 1: Ngày (dd/mm) */}
                <Text
                  className={`text-[12px] font-extrabold leading-4 ${active ? "text-pink-600" : "text-gray-800"}`}
                >
                  {d.key}
                </Text>
                {/* Dòng 2: Thứ / H.nay */}
                <Text
                  className={`text-[11px] font-semibold leading-4 ${active ? "text-pink-600" : "text-gray-600"}`}
                >
                  {d.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Time filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2"
        >
          {visibleTimeFilters.map((t, i) =>
            pill(t.label, i === timeIdx, () => setTimeIdx(i))
          )}
        </ScrollView>
      </View>

      {/* Section Title */}
      <Text className="px-3 pt-3 pb-2 text-[12px] font-extrabold text-gray-500">
        DANH SÁCH PHIM
      </Text>

      {/* Movies */}
      <FlatList
        data={movies}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => movieCard(item)}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
      />

      {/* <Modal
        visible={showTrailer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTrailer(false)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center px-4">
          <VideoView
            source={{ uri: currentTrailer }}
            nativeControls={true}
            resizeMode={ResizeMode.CONTAIN}
            style={{ width: "100%", height: 250, borderRadius: 12 }}
          />
          <Pressable
            onPress={() => setShowTrailer(false)}
            className="mt-4 bg-gray-300 px-4 py-2 rounded-lg"
          >
            <Text className="font-semibold text-gray-800">Đóng</Text>
          </Pressable>
        </View>
      </Modal> */}
    </SafeAreaView>
  );
}
