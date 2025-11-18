import { authService } from "@/services/users/auth";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function VerifyEmail() {
  const { userId, token } = useLocalSearchParams();
  const [message, setMessage] = useState("Đang xác thực tài khoản...");

  useEffect(() => {
    if (!userId || !token) return;

    authService
      .verifyAccountByLink(userId as string, token as string)
      .then(() => {
        setMessage("Xác thực thành công! Bạn có thể đăng nhập.");
        setTimeout(() => router.replace("/auth/sign-in"), 2000);
      })
      .catch(() => {
        setMessage("Link không hợp lệ hoặc đã hết hạn.");
      });
  }, []);

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-xl font-semibold text-center">{message}</Text>
    </View>
  );
}
