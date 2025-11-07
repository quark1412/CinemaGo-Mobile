// app/(auth)/sign-in.tsx
import { Link, useRouter } from "expo-router";
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

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // Biometrics state
  const [bioSupported, setBioSupported] = useState(false);
  const [bioLabel, setBioLabel] = useState<
    "Face ID" | "Touch ID" | "Biometric"
  >("Biometric");
  const [checkingBio, setCheckingBio] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // const compatible = await LocalAuthentication.hasHardwareAsync();
        // const enrolled = await LocalAuthentication.isEnrolledAsync();
        // if (compatible && enrolled) {
        //   const types =
        //     await LocalAuthentication.supportedAuthenticationTypesAsync();
        //   // Ưu tiên Face ID nếu có, nếu không thì Touch ID
        //   if (
        //     types.includes(
        //       LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        //     )
        //   ) {
        //     setBioLabel("Face ID");
        //   } else if (
        //     types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        //   ) {
        //     setBioLabel("Touch ID");
        //   } else {
        //     setBioLabel("Biometric");
        //   }
        //   setBioSupported(true);
        // } else {
        //   setBioSupported(false);
        // }
      } finally {
        setCheckingBio(false);
      }
    })();
  }, []);

  const onSignIn = async () => {
    if (!email || !pwd) return;
    try {
      setLoading(true);
      // TODO: call your auth API here
      router.replace("/(app)/(tabs)/account");
    } finally {
      setLoading(false);
    }
  };

  const onBiometric = async () => {
    try {
      // Lưu ý: bạn có thể combine với email đã nhập (nếu cần xác định account)
      // const result = await LocalAuthentication.authenticateAsync({
      //   promptMessage: `Đăng nhập bằng ${bioLabel}`,
      //   cancelLabel: "Hủy",
      //   fallbackEnabled: true, // cho phép PIN/Pattern nếu được hệ thống hỗ trợ
      // });
      // if (result.success) {
      //   // TODO: xác thực session với server nếu cần (ví dụ exchange 1 token trusted)
      //   router.replace("/(app)/(tabs)/account");
      // }
    } catch (e) {
      // có thể hiển thị toast lỗi nhẹ nhàng
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
              {/* Logo */}
              <View className="mt-10 items-center">
                <Text className="text-white/95 text-3xl font-extrabold tracking-tight">
                  CinemaGo
                </Text>
                <Text className="text-white/75 mt-1">
                  Đặt vé • Xem phim • Thướng thức
                </Text>
              </View>

              {/* Card */}
              <View className="mt-10  rounded-2xl bg-white/95 p-5 shadow-2xl border border-yellow-400/40">
                {/* Title center */}
                <Text className="text-2xl font-extrabold text-black text-center">
                  Đăng nhập
                </Text>
                <Text className="text-black/60 mt-1 text-center">
                  Chào mừng trở lại!
                </Text>

                {/* Email */}
                <View className="mt-6">
                  <Text className="text-[13px] text-black/70 mb-2">
                    Tên đăng nhập
                  </Text>
                  <View className="rounded-xl border border-black/10 bg-white">
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      placeholderTextColor="#9ca3af"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      className="px-4 py-3 text-[15px] text-black"
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* Password */}
                <View className="mt-4">
                  <Text className="text-[13px] text-black/70 mb-2">
                    Mật khẩu
                  </Text>
                  <View className="flex-row items-center rounded-xl border border-black/10 bg-white">
                    <TextInput
                      value={pwd}
                      onChangeText={setPwd}
                      placeholder="••••••••"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPwd}
                      autoCapitalize="none"
                      className="flex-1 px-4 py-3 text-[15px] text-black"
                      returnKeyType="done"
                      onSubmitEditing={onSignIn}
                      blurOnSubmit={true}
                    />
                    <Pressable
                      onPress={() => setShowPwd(!showPwd)}
                      className="px-4 py-3"
                      accessibilityRole="button"
                    >
                      <Text className="text-black/60 text-[13px]">
                        {showPwd ? "Ẩn" : "Hiện"}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Actions */}
                <View className="mt-5 flex-row items-center justify-between">
                  <Link
                    href="/(app)/auth/forgot-password"
                    className="text-[#2563eb] text-[13px]"
                  >
                    Quên mật khẩu?
                  </Link>
                </View>

                {/* Nút đăng nhập chính */}
                <Pressable
                  onPress={onSignIn}
                  disabled={loading || !email || !pwd}
                  className={`mt-6 rounded-xl px-4 py-3 items-center justify-center overflow-hidden ${
                    loading || !email || !pwd
                      ? "bg-yellow-300/60"
                      : "bg-[#eab308]"
                  }`}
                >
                  <Text className="text-black font-semibold">
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                  </Text>
                </Pressable>

                {/* Divider */}
                <View className="flex-row items-center mt-6">
                  <View className="h-px flex-1 bg-black/10" />
                  <Text className="mx-3 text-black/40 text-xs">hoặc</Text>
                  <View className="h-px flex-1 bg-black/10" />
                </View>

                {/* Biometric sign-in */}
                {!checkingBio && bioSupported && (
                  <Pressable
                    onPress={onBiometric}
                    className="mt-4 rounded-xl border border-black/15 bg-white px-4 py-3 items-center active:opacity-80"
                  >
                    <Text className="text-black font-medium">
                      Đăng nhập bằng {bioLabel}
                    </Text>
                  </Pressable>
                )}
                {!checkingBio && !bioSupported && (
                  <Text className="mt-3 text-center text-black/50 text-xs">
                    Thiết bị chưa hỗ trợ/đăng ký Face/Touch ID
                  </Text>
                )}

                {/* Đăng ký */}
                <View className="mt-6 flex-row justify-center">
                  <Text className="text-black/60 mr-1">
                    Bạn chưa có tài khoản?
                  </Text>
                  <Link
                    href="/(app)/auth/sign-up"
                    className="text-[#2563eb] font-medium"
                  >
                    Tạo tài khoản
                  </Link>
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
          {/* Footer */}
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
