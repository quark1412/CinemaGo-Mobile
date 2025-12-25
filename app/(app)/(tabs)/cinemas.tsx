import { useToast } from "@/contexts/toastContext";
import { cinemaService } from "@/services/cinema";
import type { Cinema } from "@/types/cinema";
import { calculateDistance } from "@/utils/locationUtils";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import { useTheme } from "@/contexts/themeContext";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const DEFAULT_CINEMA_LOGO =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop";

const NEAR_ME = "Gần tôi";

const FALLBACK_CITIES = [
  NEAR_ME,
  "TP.Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Cần Thơ",
  "Quảng Trị",
  "Quảng Bình",
  "Sóc Trăng",
];

export default function Cinemas() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState(NEAR_ME);
  const [data, setData] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const { isDark } = useTheme();
  const router = useRouter();
  const [showCityPicker, setShowCityPicker] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setCity("TP.Hồ Chí Minh");
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
      } catch (error) {
        console.log("Error fetching location:", error);
        setCity("TP.Hồ Chí Minh");
      }
    })();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const fetchCinemas = async () => {
      try {
        setLoading(true);

        const allCinemas: Cinema[] = [];
        let page = 1;
        const limit = 20;
        let hasNextPage = true;

        while (hasNextPage && !isCancelled) {
          const res = await cinemaService.getAllCinemas({
            page,
            limit,
          });

          const data: Cinema[] = res.data ?? [];
          const pagination = res.pagination;

          console.log("Call page:", pagination);
          allCinemas.push(...data);

          if (!pagination || !pagination.hasNextPage) {
            hasNextPage = false;
          } else {
            page = (pagination.currentPage ?? page) + 1;
          }
        }

        if (!isCancelled) {
          const list: Cinema[] = allCinemas.map((c: Cinema) => ({
            ...c,
            brandLogo: DEFAULT_CINEMA_LOGO,
          }));
          setData(list);

          if (
            city !== NEAR_ME &&
            allCinemas.length > 0 &&
            !allCinemas.some((c) => c.city === city)
          ) {
            setCity(allCinemas[0].city);
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.log("Lỗi tải Cinema:", error);
          showToast("Không tải được danh sách rạp", "error");
          setData([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchCinemas();

    return () => {
      isCancelled = true;
    };
  }, [showToast]);

  const cities = useMemo(() => {
    const unique = Array.from(new Set(data.map((d) => d.city)));
    return [
      NEAR_ME,
      ...(unique.length > 0
        ? unique
        : FALLBACK_CITIES.filter((c) => c !== NEAR_ME)),
    ];
  }, [data]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    const normalize = (s: string) => s.trim().toLowerCase();

    // 1. Filter by Query first
    let filtered = data.filter((c) => {
      return (
        q.length === 0 ||
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
      );
    });

    // 2. Filter by City or "Near Me" logic
    if (city === NEAR_ME) {
      if (userLocation) {
        const withDistance = filtered.map((c) => {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            Number(c.latitude),
            Number(c.longitude)
          );
          return { ...c, distance };
        });

        withDistance.sort((a, b) => a.distance - b.distance);

        return withDistance.slice(0, 2);
      } else {
        return filtered;
      }
    } else {
      return filtered.filter((c) => normalize(c.city) === normalize(city));
    }
  }, [data, city, query, userLocation]);

  const iconColor = isDark ? "#fff" : "#0f172a";
  const textColor = isDark ? "text-white" : "text-slate-900";
  return (
    <>
      <Stack.Screen
        options={{
          title: "Danh sách rạp",
          headerShown: true,
          headerBackTitle: "",
          headerStyle: {
            backgroundColor: isDark ? "#070f20" : "#fde2e8",
          },
          headerTitleStyle: {
            color: isDark ? "#f9fafb" : "#0f172a",
            fontWeight: "700",
            fontSize: 16,
          },
          headerTintColor: isDark ? "#f9fafb" : "#0f172a",
          headerTitleAlign: "center",
        }}
      />
      <View
        className={`flex-1  ${isDark ? "dark" : "light"} bg-background px-3`}
      >
        <View
          className={`flex-row items-center  ${isDark ? "dark" : "light"} bg-muted-background rounded-xl h-11 mt-2 mb-3 pr-1 shadow-sm`}
        >
          <Ionicons
            name="search"
            size={18}
            style={{ marginHorizontal: 8 }}
            color={iconColor}
          />
          <TextInput
            placeholder="Tìm rạp phim..."
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            className={`flex-1 text-base py-2  ${textColor}`}
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

        <View className="flex-row items-center justify-between mb-2 px-1">
          <Text
            className={`text-base  ${isDark ? "dark" : "light"} text-text-muted font-[semibold]`}
          >
            {loading ? "Đang tải rạp..." : `Rạp đề xuất (${results.length})`}
          </Text>
          <Pressable
            onPress={() => setShowCityPicker(true)}
            className={`flex-row items-center  ${isDark ? "dark" : "light"} bg-muted-background px-3 h-7 rounded-full border border-gray-200`}
          >
            <Ionicons name="location-outline" size={14} color={iconColor} />
            <Text
              className={`text-xs font-[semibold] ml-1  ${isDark ? "dark" : "light"} text-text-muted`}
            >
              {city}
            </Text>
          </Pressable>
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                router.push({
                  pathname: "/cinemas/[id]",
                  params: {
                    id: item.id,
                    cinemaName: item.name,
                  },
                });
              }}
              className={`${isDark ? "dark" : "light"} bg-muted-background rounded-xl p-3 shadow-sm border`}
            >
              <View className="flex-row items-center mb-1.5">
                <Image
                  source={{ uri: item.brandLogo }}
                  className="w-7 h-10 mr-2 rounded-md"
                  resizeMode="contain"
                />
                <View className="flex-1">
                  <View className="flex-row justify-between items-center">
                    <Text
                      className={`text-[15px] font-[extraBold] ${textColor} flex-1`}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    {/* Show distance if available */}
                    {(item as any).distance !== undefined && (
                      <Text className="text-xs text-pink-500 font-bold ml-2">
                        {(item as any).distance} km
                      </Text>
                    )}
                  </View>

                  <Text
                    className="text-sm text-gray-500 mt-0.5"
                    numberOfLines={2}
                  >
                    {item.address ? `${item.address}  ` : ""}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            !loading ? (
              <View className="mt-6 items-center">
                <Text className="text-sm text-gray-500">
                  Không tìm thấy rạp phù hợp
                </Text>
              </View>
            ) : null
          }
        />

        <Modal
          visible={showCityPicker}
          animationType="slide"
          transparent
          onRequestClose={() => setShowCityPicker(false)}
        >
          <View className="flex-1 bg-black/40 justify-center items-center px-5">
            <View className="bg-white w-full max-h-[70%] rounded-2xl p-5">
              <Text className="text-lg font-bold mb-3 text-center">
                Chọn thành phố
              </Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 12 }}
              >
                {cities.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => {
                      setCity(c);
                      setShowCityPicker(false);
                    }}
                    className={`p-3 rounded-lg mb-2 ${
                      c === city ? "bg-pink-100" : "bg-gray-100"
                    }`}
                  >
                    <Text className="text-center text-base">{c}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable
                onPress={() => setShowCityPicker(false)}
                className="mt-2 bg-gray-300 py-2 rounded-lg"
              >
                <Text className="text-center font-semibold text-gray-700">
                  Đóng
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}
