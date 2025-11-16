// app/(app)/(tabs)/account.tsx (ví dụ)
import { useTheme } from "@/contexts/themeContext";
import { useToast } from "@/contexts/toastContext";
import { useUser } from "@/contexts/userContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ⬇️ các hàm sinh trắc học bạn đã tạo
import {
  canUseBiometric,
  disableBiometricLogin,
  enableBiometricLogin,
  isBiometricEnabled,
} from "@/services/users/biometric";

export default function Account() {
  const { showToast } = useToast();
  const { toggleTheme, isDark } = useTheme();
  const { user } = useUser();

  // Biometric state
  const [bioSupported, setBioSupported] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [checkingBio, setCheckingBio] = useState(true);

  useEffect(() => {
    console.log(user);
  }, [user]);

  // Kiểm tra thiết bị & trạng thái bật/tắt
  useEffect(() => {
    (async () => {
      try {
        setCheckingBio(true);
        const supported = await canUseBiometric();
        setBioSupported(supported);
        setBioEnabled(await isBiometricEnabled());
      } finally {
        setCheckingBio(false);
      }
    })();
  }, []);

  // Bật/tắt sinh trắc học
  const onToggleBiometric = async () => {
    try {
      if (bioEnabled) {
        await disableBiometricLogin();
        setBioEnabled(false);
        showToast("Đã tắt đăng nhập sinh trắc học");
        return;
      }

      if (!bioSupported) {
        showToast("Thiết bị chưa sẵn sàng cho Face/Touch ID");
        return;
      }

      // Lấy refresh_token hiện tại (hoặc từ session của bạn)
      const currentRefreshToken =
        (await AsyncStorage.getItem("refreshToken")) || "";
      if (!currentRefreshToken) {
        showToast("Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.");
        return;
      }

      const ok = await enableBiometricLogin(currentRefreshToken);
      setBioEnabled(!!ok);
      showToast(ok ? "Đã bật đăng nhập sinh trắc học" : "Không thể bật");
    } catch {
      showToast("Có lỗi xảy ra. Thử lại sau.");
    }
  };

  // Đăng xuất
  const handleSignOut = async () => {
    await AsyncStorage.multiRemove(["user", "accessToken", "refreshToken"]);
    // Nếu muốn tắt luôn sinh trắc học khi logout:
    await disableBiometricLogin().catch(() => {});
    router.replace("/auth/sign-in"); // nếu (auth) là group
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "dark" : "light"} bg-background`}
    >
      {/* Header */}
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

      {/* Profile */}
      <View className="items-center gap-2 p-4">
        <Image
          source={{
            uri:
              user?.avatarUrl ||
              "https://ui-avatars.com/api/?background=111827&color=fff&name=CinemaGo",
          }}
          className="w-24 h-24 rounded-full"
        />
        <Text className="text-lg font-[semibold] text-center text-foreground">
          {user?.fullname || "User"}
        </Text>
      </View>

      {/* Actions */}
      <View className="flex-1 p-4">
        <View className="gap-2">
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

          {/* Biometric toggle row */}
          {bioSupported && (
            <View className="flex-row items-center justify-between p-4 bg-card-background rounded-xl border border-border">
              <View className="flex-row items-center">
                <Ionicons
                  name="finger-print-outline"
                  size={24}
                  color={isDark ? "#fff" : "#1f2937"}
                />
                <View className="ml-3">
                  <Text className="font-[semibold] text-foreground">
                    Đăng nhập sinh trắc học
                  </Text>
                </View>
              </View>
              <Switch
                value={bioEnabled}
                onValueChange={onToggleBiometric}
                disabled={!bioSupported || checkingBio}
              />
            </View>
          )}
        </View>

        {/* Sign out */}
        <TouchableOpacity
          className={`flex-row items-center p-4 ${
            isDark
              ? "bg-red-900/20 border-red-800/50"
              : "bg-red-50 border-red-200"
          } rounded-xl border mt-auto`}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text className="ml-3 font-[semibold] text-red-500">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
