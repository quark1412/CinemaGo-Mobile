// app/screens/Cinemas.tsx
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";

import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

type Cinema = {
  id: string;
  name: string;
  brandLogo: string;
  address: string;
  distanceText?: string;
  note?: string;
  city: string;
  isFav?: boolean;
};

const MOCK: Cinema[] = [
  {
    id: "cgv-aeon-bt",
    name: "CGV Aeon Bình Tân",
    brandLogo:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    address: "Tầng 3, Trung tâm thương mại Aeon Mall Bình Tân",
    distanceText: "- km",
    note: "Bạn vừa chọn rạp này",
    city: "TP.HCM",
    isFav: false,
  },
  {
    id: "cgv",
    name: "CGV Aeon Phú thọ",
    brandLogo:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    address: "Tầng 3, Trung tâm thương mại Aeon Mall Bình Tân",
    distanceText: "- km",
    note: "Bạn vừa chọn rạp này",
    city: "TP.HCM",
    isFav: false,
  },
  {
    id: "cgv-aeon-pt",
    name: "CGV Aeon HCM",
    brandLogo:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    address: "Tầng 3, Trung tâm thương mại Aeon Mall Bình Tân",
    distanceText: "- km",
    note: "Bạn vừa chọn rạp này",
    city: "TP.HCM",
    isFav: false,
  },
];

export default function Cinemas() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("TP.HCM");
  const [data, setData] = useState(MOCK);
  const router = useRouter();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter(
      (c) =>
        c.city === city &&
        (q.length === 0 ||
          c.name.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q))
    );
  }, [data, city, query]);

  const toggleFav = (id: string) =>
    setData((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFav: !c.isFav } : c))
    );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Danh sách rạp",
          headerShown: true,
          headerBackTitle: "",
          headerStyle: { backgroundColor: "#fde2e8" },
          headerTitleAlign: "center",
        }}
      />
      <View className="flex-1 bg-gray-100 px-3">
        {/* Search */}
        <View className="flex-row items-center bg-white rounded-xl h-11 mt-2 mb-3 pr-1 shadow-sm">
          <Ionicons name="search" size={18} style={{ marginHorizontal: 8 }} />
          <TextInput
            placeholder="Tìm rạp phim..."
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            className="flex-1 text-base py-2"
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery("")}
              hitSlop={10}
              className="px-2"
            >
              <Ionicons name="close-circle" size={18} />
            </Pressable>
          ) : null}
        </View>

        {/* Section header */}
        <View className="flex-row items-center justify-between mb-2 px-1">
          <Text className="text-base font-semibold">
            Rạp đề xuất ({results.length})
          </Text>
          <Pressable
            onPress={() => {
              // mở modal chọn khu vực nếu cần
            }}
            className="flex-row items-center bg-white px-3 h-7 rounded-full border border-gray-200"
          >
            <Ionicons name="location-outline" size={14} />
            <Text className="text-xs font-semibold ml-1">{city}</Text>
          </Pressable>
        </View>

        {/* List */}
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                router.push({
                  pathname: "/cinemas/[id]",
                  params: {
                    id: item.id, // ví dụ "cgv-aeon-bt"
                    cinemaName: item.name, // "CGV Aeon Bình Tân"
                  },
                });
              }}
              className="bg-white rounded-xl p-3 shadow-sm"
            >
              <View className="flex-row items-center mb-1.5">
                <Image
                  source={{ uri: item.brandLogo }}
                  className="w-7 h-7 mr-2 rounded-md"
                  resizeMode="contain"
                />
                <View className="flex-1">
                  <Text className="text-[15px] font-extrabold">
                    {item.name}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {item.note ? `${item.note}  ` : ""}
                    {item.distanceText ?? ""}
                  </Text>
                </View>

                <Pressable
                  onPress={() => toggleFav(item.id)}
                  hitSlop={8}
                  className="mr-1.5"
                >
                  <Ionicons
                    name={item.isFav ? "heart" : "heart-outline"}
                    size={22}
                  />
                </Pressable>
                <Ionicons name="chevron-forward" size={22} />
              </View>

              <Text numberOfLines={2} className="text-[13px] text-gray-700">
                {item.address}
              </Text>

              <Pressable
                onPress={() => {
                  // Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`)
                }}
                className="flex-row items-center mt-2"
              >
                <MaterialIcons name="directions" size={16} />
                <Text className="text-[13px] underline font-semibold ml-1">
                  Tìm đường
                </Text>
              </Pressable>
            </Pressable>
          )}
        />
      </View>
    </>
  );
}
