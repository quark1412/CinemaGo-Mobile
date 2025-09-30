import { useToast } from "@/contexts/toastContext";
import { useTheme } from "@/contexts/themeContext";
import { User } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Account() {
  const { showToast } = useToast();
  const { theme, toggleTheme, isDark } = useTheme();
  const [user, setUser] = useState<User | null>(null);

  const loadUserData = useCallback(async () => {
    const userData = await AsyncStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "dark" : "light"} bg-background`}
    >
      <View className="flex-row items-center justify-between p-4">
        <Text className="text-2xl text-center font-[bold] text-foreground">
          Account
        </Text>
        <TouchableOpacity
          onPress={toggleTheme}
          className="p-2 bg-card-background rounded-lg"
        >
          <Ionicons
            name={isDark ? "sunny" : "moon"}
            size={24}
            color={isDark ? "#fff" : "#1f2937"}
          />
        </TouchableOpacity>
      </View>

      <View className="items-center gap-2 p-4 flex flex-col">
        <Image
          source={{ uri: user?.avatarUrl }}
          className="w-24 h-24 rounded-full bg-red-500"
        />
        <Text className="text-lg font-[semibold] text-center text-foreground">
          {user?.fullname || "User"}
        </Text>
      </View>

      <View className="flex-1 p-4">
        <View className="flex gap-2">
          <TouchableOpacity
            className="flex-row items-center p-4 bg-card-background rounded-xl border border-border"
            onPress={() => router.push("/screens/edit-profile")}
          >
            <Ionicons
              name="person-outline"
              size={24}
              color={isDark ? "#fff" : "#1f2937"}
            />
            <Text className="ml-3 font-[semibold] text-foreground">
              Edit Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4 bg-card-background rounded-xl border border-border"
            onPress={() => router.push("/screens/change-password")}
          >
            <Ionicons
              name="lock-closed-outline"
              size={24}
              color={isDark ? "#fff" : "#1f2937"}
            />
            <Text className="ml-3 font-[semibold] text-foreground">
              Change Password
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4 bg-card-background rounded-xl border border-border"
            onPress={() => router.push("/screens/my-tickets")}
          >
            <Ionicons
              name="list-outline"
              size={24}
              color={isDark ? "#fff" : "#1f2937"}
            />
            <Text className="ml-3 font-[semibold] text-foreground">
              My Tickets
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className={`flex-row items-center p-4 ${isDark ? "bg-red-900/20 border-red-800/50" : "bg-red-50 border-red-200"}  rounded-xl border  mt-auto`}
          // onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text className="ml-3 font-[semibold] text-red-500">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
