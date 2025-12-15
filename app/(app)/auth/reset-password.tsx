import { useTheme } from "@/contexts/themeContext";
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

export default function ResetPassword() {
  const router = useRouter();
  const { isDark } = useTheme();

  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [expiryTimer, setExpiryTimer] = useState(300);

  const [resendTimer, setResendTimer] = useState(20);

  useEffect(() => {
    const interval = setInterval(() => {
      setExpiryTimer((prev) => (prev > 0 ? prev - 1 : 0));

      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
  };

  const onResetPassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      setMessage("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoading(true);
      const res = await authService.resetPassword({
        email,
        otp,
        newPassword,
      });

      setMessage("Đặt lại mật khẩu thành công!");
      setTimeout(() => router.replace("/(app)/auth/sign-in"), 1500);
    } catch (err: any) {
      setMessage(
        err.response?.data?.message || "OTP không hợp lệ hoặc có lỗi xảy ra."
      );
    } finally {
      setLoading(false);
    }
  };

  const onResendOtp = async () => {
    try {
      setLoading(true);
      setMessage("");

      await authService.forgotPassword(email);

      setExpiryTimer(300);
      setResendTimer(20);
      setMessage("Mã OTP mới đã được gửi!");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Không thể gửi lại mã.");
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
        style={
          {
            backgroundImage:
              "linear-gradient(180deg, rgba(234,179,8,0.25), rgba(17,24,39,0.35))",
          } as any
        }
      />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          className="flex-1 px-6"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 15, flexGrow: 1 }}
            >
              <View className="mt-10 items-center">
                <Text className="text-white/95 text-3xl font-extrabold">
                  CinemaGo
                </Text>
                <Text className="text-white/75 mt-1">
                  Đặt vé • Xem phim • Thưởng thức
                </Text>
              </View>

              <View
                className={`mt-10 rounded-2xl ${isDark ? "dark" : "light"} bg-background p-5 shadow-2xl border border-yellow-400/40`}
              >
                <Text className="text-2xl font-extrabold text-foreground text-center">
                  Đặt lại mật khẩu
                </Text>
                <Text className="text-foreground mt-1 text-center">
                  Nhập mã OTP và thiết lập mật khẩu mới
                </Text>

                <View className="mt-6">
                  <Text className="text-[13px] text-foreground mb-2">
                    Mã OTP
                  </Text>
                  <View className="flex-row items-center rounded-xl border border-foreground bg-white pr-4">
                    <TextInput
                      value={otp}
                      onChangeText={setOtp}
                      placeholder="Nhập mã 6 số"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      maxLength={6}
                      className="flex-1 px-4 py-3 text-[15px] text-black"
                    />
                    <Text
                      className={`font-medium text-base ${expiryTimer > 0 ? "text-yellow-600" : "text-red-500"}`}
                    >
                      {formatTime(expiryTimer)}
                    </Text>
                  </View>
                </View>

                <View className="mt-4">
                  <Text className="text-[13px] text-foreground mb-2">
                    Mật khẩu mới
                  </Text>
                  <View className="flex-row items-center rounded-xl border border-black/10 bg-white pr-4">
                    {" "}
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showNewPass}
                      className="flex-1 px-4 py-3 text-[15px] text-black"
                    />
                    <Pressable
                      onPress={() => setShowNewPass(!showNewPass)}
                      hitSlop={10}
                    >
                      <Text className="text-black/50 text-xs font-medium">
                        {showNewPass ? "Ẩn" : "Hiện"}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View className="mt-4 ">
                  <Text className="text-[13px] text-foreground mb-2">
                    Xác nhận mật khẩu
                  </Text>
                  <View className="flex-row items-center rounded-xl border border-black/10 bg-white pr-4">
                    {" "}
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showConfirmPass}
                      className="flex-1 px-4 py-3 text-[15px] text-black"
                    />
                    <Pressable
                      onPress={() => setShowConfirmPass(!showConfirmPass)}
                      hitSlop={10}
                    >
                      <Text className="text-black/50 text-xs font-medium">
                        {showConfirmPass ? "Ẩn" : "Hiện"}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  onPress={onResetPassword}
                  disabled={
                    loading ||
                    !otp ||
                    !newPassword ||
                    !confirmPassword ||
                    expiryTimer === 0
                  }
                  className={`mt-6 rounded-xl px-4 py-3 items-center justify-center ${
                    loading ||
                    !otp ||
                    !newPassword ||
                    !confirmPassword ||
                    expiryTimer === 0
                      ? "bg-yellow-300/60"
                      : "bg-[#eab308]"
                  }`}
                >
                  <Text className="text-black font-semibold">
                    {loading ? "Đang xử lý..." : "Xác nhận đặt lại"}
                  </Text>
                </Pressable>

                <View className="mt-6 flex-row justify-center items-center">
                  <Text className="text-black/60 text-sm mr-1">
                    Không thấy mã OTP?
                  </Text>
                  <Pressable
                    onPress={onResendOtp}
                    disabled={loading || resendTimer > 0}
                    hitSlop={10}
                  >
                    <Text
                      className={`text-sm font-semibold ${resendTimer > 0 ? "text-gray-400" : "text-[#2563eb]"}`}
                    >
                      {resendTimer > 0
                        ? `Gửi lại sau ${resendTimer}s`
                        : "Gửi lại mã ngay"}
                    </Text>
                  </Pressable>
                </View>

                {message ? (
                  <Text
                    className={`text-center mt-4 text-sm ${message.includes("thành công") ? "text-green-600" : "text-red-500"}`}
                  >
                    {message}
                  </Text>
                ) : null}
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>

          <View className="items-center mt-6">
            <Text className="text-white/75 text-xs">
              © {new Date().getFullYear()} CinemaGo
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
