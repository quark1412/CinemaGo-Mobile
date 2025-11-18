import { useToast } from "@/contexts/toastContext";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import io, { Socket } from "socket.io-client";

export default function CheckEmail() {
  const { email, userId } = useLocalSearchParams();
  const { showToast } = useToast();

  useEffect(() => {
    let socket: Socket | null = null;

    socket = io("http://192.168.1.7:8001", {
      auth: { userId },
    });

    socket.emit("verify-user", userId);

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("account-verified", () => {
      showToast("Xác minh thành công!");
      router.replace("/(app)/auth/sign-in");
    });

    return () => {
      socket?.disconnect();
    };
  }, []);

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-2xl font-bold mb-4">Kiểm tra email của bạn</Text>

      <Text className="text-center text-black/70 mb-6">
        Chúng tôi đã gửi một liên kết xác minh đến:{"\n"}
        <Text className="font-semibold">{email}</Text>
      </Text>

      <Pressable
        onPress={() => router.replace("/(app)/auth/sign-in")}
        className="bg-yellow-400 px-6 py-3 rounded-xl"
      >
        <Text className="font-semibold text-black">Đến trang đăng nhập</Text>
      </Pressable>
    </View>
  );
}
