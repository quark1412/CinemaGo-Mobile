// app/(auth)/sign-in.tsx
import { useTheme } from "@/contexts/themeContext";
import { useToast } from "@/contexts/toastContext";
import { useUser } from "@/contexts/userContext";
import { authService } from "@/services/users/auth";
import {
  disableBiometricLogin,
  signInWithBiometric,
} from "@/services/users/biometric";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  const {
    login,
    refreshUser,
    isAuthenticated,
    isLoading: isSessionLoading,
  } = useUser();

  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const [bioSupported, setBioSupported] = useState(false);
  const [bioLabel, setBioLabel] = useState<
    "Face ID" | "Touch ID" | "Biometric"
  >("Biometric");
  const [checkingBio, setCheckingBio] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (compatible && enrolled) {
          const types =
            await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (
            types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
          ) {
            setBioLabel("Touch ID");
          } else if (
            types.includes(
              LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
            )
          ) {
            setBioLabel("Face ID");
          } else {
            setBioLabel("Biometric");
          }
          setBioSupported(true);
        } else {
          setBioSupported(false);
        }
      } finally {
        setCheckingBio(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isSessionLoading && isAuthenticated) {
      // showToast("Chào mừng bạn quay lại!", "success"); // Optional
      router.replace("/(app)/(tabs)/home");
    }
  }, [isSessionLoading, isAuthenticated]);

  const onSignIn = async () => {
    if (!email || !pwd) return;
    try {
      setLoading(true);
      await login(email, pwd);
      showToast("Đăng nhập thành công", "success");
      router.replace("/(app)/(tabs)/account");
    } catch (err: any) {
      console.log(err.message);
      showToast("Đăng nhập không thành công", "error");
    } finally {
      setLoading(false);
    }
  };

  const onBiometric = async () => {
    try {
      const storedRefreshToken = await signInWithBiometric();
      console.log("Biometric refresh token:", storedRefreshToken);
      if (!storedRefreshToken) {
        showToast(
          "Chưa bật đăng nhập sinh trắc học hoặc phiên đã hết hạn",
          "error"
        );
        return;
      }

      await authService.loginWithRefreshToken(storedRefreshToken);

      await refreshUser();

      router.replace("/(app)/(tabs)/account");
    } catch (e) {
      await disableBiometricLogin();
      await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
      showToast("Phiên sinh trắc học đã hết hạn, hãy đăng nhập lại.", "error");
      router.replace("/(app)/auth/sign-in");
      return;
    }
  };

  if (isSessionLoading) {
    return (
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1600&auto=format&fit=crop",
        }}
        resizeMode="cover"
        className="flex-1 justify-center items-center"
      >
        <View className="absolute inset-0 bg-black/70" />
        <ActivityIndicator size="large" color="#eab308" />
        <Text className="text-white mt-4 font-medium">Đang khởi động...</Text>
      </ImageBackground>
    );
  }

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

      <SafeAreaView className={`flex-1 `}>
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
                <Text className="text-white/95 text-3xl font-extrabold tracking-tight">
                  CinemaGo
                </Text>
                <Text className="text-white/75 mt-1">
                  Đặt vé • Xem phim • Thướng thức
                </Text>
              </View>

              <View
                className={`mt-10  rounded-2xl ${isDark ? "dark" : "light"} bg-background p-5 shadow-2xl border border-yellow-400/40`}
              >
                <Text className="text-2xl font-extrabold text-foreground text-center">
                  Đăng nhập
                </Text>
                <Text className="text-foreground mt-1 text-center">
                  Chào mừng trở lại!
                </Text>

                <View className="mt-6">
                  <Text className="text-[13px] text-foreground mb-2">
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

                <View className="mt-4">
                  <Text className="text-[13px] text-foreground mb-2">
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

                <View className="mt-5 flex-row items-center justify-between">
                  <Link
                    href="/(app)/auth/forgot-password"
                    className="text-[#2563eb] text-[13px]"
                  >
                    Quên mật khẩu?
                  </Link>
                </View>

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

                <View className="flex-row items-center mt-6">
                  <View
                    className={`h-px flex-1 ${isDark ? "dark" : "light"} bg-background`}
                  />
                  <Text className="mx-3 text-foreground text-xs">hoặc</Text>
                  <View
                    className={`h-px flex-1 ${isDark ? "dark" : "light"} bg-background`}
                  />
                </View>

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

                <View className="mt-6 flex-row justify-center">
                  <Text className="text-foreground  mr-1">
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
