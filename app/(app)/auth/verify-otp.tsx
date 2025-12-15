// app/(auth)/verify-otp.tsx
import { useTheme } from "@/contexts/themeContext";
import { useToast } from "@/contexts/toastContext";

import { authService } from "@/services/users/auth";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifyOtp() {
  const router = useRouter();
  const { isDark } = useTheme();

  const { email } = useLocalSearchParams<{ email: string }>();
  const { showToast } = useToast();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState(180);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
  };

  const onVerify = async () => {
    if (!otp || otp.length < 6) {
      showToast("Vui lòng nhập mã OTP 6 số.", "error");
      return;
    }

    try {
      setLoading(true);
      await authService.verifyOTP(email, otp);

      showToast("Xác thực thành công! Vui lòng đăng nhập.", "success");

      router.replace("/(app)/auth/sign-in");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Mã OTP không chính xác hoặc đã hết hạn.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1600&auto=format&fit=crop",
      }}
      resizeMode="cover"
      className="flex-1"
    >
      <View className="absolute inset-0 bg-black/60" />
      <View
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(234,179,8,0.25), rgba(17,24,39,0.35))" as any,
        }}
      />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          className="flex-1 px-6"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 15 }}
              keyboardShouldPersistTaps="handled"
            >
              <View className="mt-10 items-center">
                <Text className="text-white/95 text-3xl font-extrabold tracking-tight">
                  CinemaGo
                </Text>
                <Text className="text-white/75 mt-1">Xác thực tài khoản</Text>
              </View>

              <View
                className={`mt-10 rounded-2xl ${isDark ? "dark" : "light"} bg-background p-6 shadow-2xl border border-yellow-400/40`}
              >
                <Text className="text-2xl font-extrabold text-foreground text-center">
                  Nhập mã OTP
                </Text>
                <Text className="text-foreground mt-2 text-center text-sm px-4">
                  Mã xác thực đã được gửi tới email{"\n"}
                  <Text className="font-bold text-black">{email}</Text>
                </Text>

                <View className="mt-8">
                  <View className="flex-row items-center rounded-xl border border-black/10 bg-white pr-4">
                    <TextInput
                      value={otp}
                      onChangeText={setOtp}
                      placeholder="• • • • • •"
                      placeholderTextColor="#9ca3af"
                      keyboardType="number-pad"
                      maxLength={6}
                      className="flex-1 px-4 py-4 text-center text-2xl tracking-[8px] font-bold text-black"
                    />
                  </View>
                </View>

                <View className="mt-4 items-center">
                  <Text
                    className={`font-medium ${timer > 0 ? "text-yellow-600" : "text-red-500"}`}
                  >
                    {timer > 0
                      ? `Mã hết hạn sau ${formatTime(timer)}`
                      : "Mã OTP đã hết hạn"}
                  </Text>
                </View>

                <Pressable
                  onPress={onVerify}
                  disabled={loading || otp.length < 6}
                  className={`mt-6 h-12 rounded-xl items-center justify-center 
                    ${loading || otp.length < 6 ? "bg-yellow-300/60" : "bg-[#eab308]"}`}
                >
                  <Text className="font-semibold text-black">
                    {loading ? "Đang xử lý..." : "Xác thực"}
                  </Text>
                </Pressable>

                <Pressable onPress={() => router.back()} className="mt-4">
                  <Text className="text-center text-sm text-foreground underline">
                    Quay lại đăng ký
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
