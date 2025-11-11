// app/screens/Showtimes.tsx
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

type Showtime = {
  id: string;
  time: string;
  end: string;
  left: number;
  total: number;
  tag?: string;
};
type Movie = {
  id: string;
  title: string;
  subTitle?: string;
  poster: string;
  age: string; // "13+"
  formats: string[]; // ["2D", "Dolby Atmos", "4DX"]
  duration: string; // "1 giờ 46 phút"
  label?: string; // "2D Phụ đề", "IMAX"
  showtimes: Showtime[];
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
    label: "2D Phụ đề · IMAX",
    showtimes: [
      { id: "st1", time: "17:30", end: "19:33", left: 268, total: 278 },
      { id: "st2", time: "19:40", end: "21:43", left: 253, total: 278 },
    ],
  },
  {
    id: "m2",
    title: "Quái Thú Vô Hình: Vùng Đất Chết Chóc",
    poster: "https://i.imgur.com/Xb4mM8H.jpeg",
    age: "16+",
    formats: ["Khoa Học Viễn Tưởng", "Hành Động", "2D", "3D", "4DX"],
    duration: "1 giờ 46 phút",
    label: "2D Phụ đề",
    showtimes: [
      { id: "st3", time: "16:30", end: "18:37", left: 162, total: 162 },
      { id: "st4", time: "19:00", end: "21:07", left: 81, total: 91 },
    ],
  },
];

const DAYS = Array.from({ length: 7 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  const dd = d.getDate().toString().padStart(2, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dow = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][
    d.getDay()
  ];
  return {
    key: `${dd}/${mm}`,
    label: i === 0 ? "H.nay" : dow,
    isToday: i === 0,
  };
});

const TIME_FILTERS = [
  "Tất cả",
  "15:00 - 18:00",
  "18:00 - 21:00",
  "21:00 - 24:00",
];

export default function Showtimes() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

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

  const showtimeChip = (s: Showtime) => (
    <Pressable
      key={s.id}
      onPress={() => {
        // điều hướng chọn ghế
        navigation.navigate("SeatPicker", { showtimeId: s.id });
      }}
      className="bg-white border border-gray-200 rounded-xl px-3 h-10 items-center justify-center mr-2 mb-2"
    >
      <Text className="text-sm font-bold">
        {s.time}
        <Text className="text-gray-400 font-normal">–{s.end}</Text>
      </Text>
      <Text className="text-[11px] text-gray-500 mt-0.5">
        Còn {s.left}/{s.total}
      </Text>
    </Pressable>
  );

  const movieCard = (m: Movie) => (
    <View key={m.id} className="bg-white rounded-2xl p-3 mb-4">
      <View className="flex-row items-start">
        <Image
          source={{ uri: m.poster }}
          className="w-20 h-28 rounded-xl mr-3"
        />
        <View className="flex-1">
          <View className="flex-row items-start justify-between">
            <Text className="flex-1 text-[16px] font-extrabold pr-2">
              {m.title} {m.subTitle ? `\n${m.subTitle}` : ""}
            </Text>
            <Pressable
              onPress={() => {
                /* điều hướng chi tiết phim */
              }}
            >
              <Text className="text-pink-500 font-semibold">Chi tiết</Text>
            </Pressable>
          </View>

          <View className="flex-row items-center mt-1">
            <View className="bg-yellow-100 px-1.5 py-0.5 rounded-md mr-2">
              <Text className="text-[11px] font-bold text-yellow-700">
                {m.age}
              </Text>
            </View>
            <Text className="text-[11px] text-gray-500 flex-1">
              {m.formats.join(", ")} · {m.duration}
            </Text>
          </View>

          {m.label ? (
            <View className="flex-row items-center mt-2">
              <Text className="text-[12px] font-semibold bg-gray-100 rounded-md px-2 py-1">
                {m.label}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className="flex-row flex-wrap mt-3">
        {m.showtimes.map(showtimeChip)}
      </View>

      <Pressable
        onPress={() => {
          /* mở trailer */
        }}
        className="flex-row items-center mt-2"
      >
        <MaterialIcons name="ondemand-video" size={16} />
        <Text className="ml-1 underline font-semibold">Trailer</Text>
      </Pressable>
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
          {TIME_FILTERS.map((t, i) =>
            pill(t, i === timeIdx, () => setTimeIdx(i))
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
    </SafeAreaView>
  );
}
