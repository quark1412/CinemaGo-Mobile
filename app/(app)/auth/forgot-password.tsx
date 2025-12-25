import { useTheme } from "@/contexts/themeContext";
import { authService } from "@/services/users/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
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

export default function ForgotPassword() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onSendOtp = async () => {
    if (!email) {
      setMessage("Vui lòng nhập email của bạn.");
      return;
    }

    try {
      setLoading(true);
      const res = await authService.forgotPassword(email);
      setMessage(res.data || "OTP đã được gửi đến email của bạn.");
      router.push({
        pathname: "/auth/reset-password",
        params: { email },
      });
    } catch (err: any) {
      console.log("Full Error:", err);
      console.log("Response:", err.response);
      setMessage(
        err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại."
      );
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
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
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
                  Quên mật khẩu
                </Text>
                <Text className="text-foreground mt-1 text-center">
                  Nhập email để nhận mã OTP
                </Text>

                <View className="mt-6">
                  <Text className="text-[13px] text-foreground mb-2">
                    Email
                  </Text>
                  <View className="rounded-xl border border-black/10 bg-white">
                    <TextInput
                      placeholder="you@example.com"
                      placeholderTextColor="#9ca3af"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      className="px-4 py-3 text-[15px] text-black"
                    />
                  </View>
                </View>

                <Pressable
                  onPress={onSendOtp}
                  disabled={loading || !email}
                  className={`mt-6 rounded-xl px-4 py-3 items-center justify-center ${
                    loading || !email ? "bg-yellow-300/60" : "bg-[#eab308]"
                  }`}
                >
                  <Text className="text-black font-semibold">
                    {loading ? "Đang gửi..." : "Gửi mã OTP"}
                  </Text>
                </Pressable>

                {message ? (
                  <Text className="text-center text-foreground mt-4">
                    {message}
                  </Text>
                ) : null}

                <Pressable onPress={() => router.back()} className="mt-6">
                  <Text className="text-center text-[#2563eb]">
                    Quay lại đăng nhập
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
          <View className="items-center">
            <Text className="text-white/75 text-xs">
              © {new Date().getFullYear()} CinemaGo
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
