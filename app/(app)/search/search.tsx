import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { mockCinemas, mockMovies } from "./mockdata";
import { MovieItem } from "./MovieItem";

export default function SearchScreen() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [tab, setTab] = useState<"phim" | "rap">("phim");

  const filteredMovies = mockMovies.filter((m) =>
    m.title.toLowerCase().includes(keyword.toLowerCase())
  );

  const filteredCinemas = mockCinemas.filter((c) =>
    c.name.toLowerCase().includes(keyword.toLowerCase())
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Tìm kiếm",
          // headerShown: true, //
          headerBackTitle: "",
        }}
      />

      <SafeAreaView edges={["top"]} className="flex-1 bg-white">
        <View className="px-4">
          {/* Search bar */}
          <View className="flex-row items-center mt-4 mb-3">
            <View className="flex-1 bg-gray-100 rounded-xl px-3 py-1 flex-row items-center">
              <TextInput
                placeholder="Nhập tên phim hoặc rạp…"
                className="flex-1 py-2 text-[15px]"
                value={keyword}
                onChangeText={setKeyword}
              />
            </View>

            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-[15px] text-blue-600 font-medium ml-3">
                Huỷ
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View className="flex-row gap-4 mb-4">
            <TouchableOpacity onPress={() => setTab("phim")}>
              <Text
                className={`text-[16px] font-semibold ${
                  tab === "phim" ? "text-purple-600" : "text-gray-600"
                }`}
              >
                Phim
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setTab("rap")}>
              <Text
                className={`text-[16px] font-semibold ${
                  tab === "rap" ? "text-purple-600" : "text-gray-600"
                }`}
              >
                Rạp
              </Text>
            </TouchableOpacity>
          </View>

          {/* Result */}

          <FlatList
            data={filteredMovies}
            keyExtractor={(item) => `movie-${item.id}`}
            renderItem={({ item }) => (
              <MovieItem
                id={item.id}
                title={item.title}
                year={item.year}
                status={item.status}
                poster={item.poster}
                onPress={(id) =>
                  router.push({
                    pathname: "/(app)/movies/[id]",
                    params: { id },
                  })
                }
                onBookPress={(id) =>
                  router.push({
                    pathname: "/(app)/movies/[id]",
                    params: { id },
                  })
                }
              />
            )}
          />
        </View>
      </SafeAreaView>
    </>
  );
}
