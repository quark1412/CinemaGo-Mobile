import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function ResetPassword() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onResetPassword = async () => {
    if (!otp || !newPassword) {
      setMessage("Vui lòng nhập đầy đủ OTP và mật khẩu mới.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("http://YOUR_API_URL/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
      setMessage(res.data.message || "Đặt lại mật khẩu thành công!");
      setTimeout(() => router.replace("/auth/sign-in"), 1500);
    } catch (err: any) {
      setMessage(
        err.response?.data?.message || "OTP không hợp lệ hoặc đã hết hạn."
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

              <View className="mt-10 rounded-2xl bg-white/95 p-5 shadow-2xl border border-yellow-400/40">
                <Text className="text-2xl font-extrabold text-black text-center">
                  Đặt lại mật khẩu
                </Text>
                <Text className="text-black/60 mt-1 text-center">
                  Nhập mã OTP và mật khẩu mới
                </Text>

                <View className="mt-6">
                  <Text className="text-[13px] text-black/70 mb-2">Mã OTP</Text>
                  <View className="rounded-xl border border-black/10 bg-white">
                    <TextInput
                      value={otp}
                      onChangeText={setOtp}
                      placeholder="Nhập mã 6 số"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      className="px-4 py-3 text-[15px] text-black text-center"
                    />
                  </View>
                </View>

                <View className="mt-4">
                  <Text className="text-[13px] text-black/70 mb-2">
                    Mật khẩu mới
                  </Text>
                  <View className="rounded-xl border border-black/10 bg-white">
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry
                      className="px-4 py-3 text-[15px] text-black"
                    />
                  </View>
                </View>

                <Pressable
                  onPress={onResetPassword}
                  disabled={loading || !otp || !newPassword}
                  className={`mt-6 rounded-xl px-4 py-3 items-center justify-center ${
                    loading || !otp || !newPassword
                      ? "bg-yellow-300/60"
                      : "bg-[#eab308]"
                  }`}
                >
                  <Text className="text-black font-semibold">
                    {loading ? "Đang xử lý..." : "Xác nhận đặt lại"}
                  </Text>
                </Pressable>

                {message ? (
                  <Text className="text-center text-black/60 mt-4">
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
