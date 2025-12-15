// app/(auth)/sign-up.tsx
import { useTheme } from "@/contexts/themeContext";
import { useToast } from "@/contexts/toastContext";
import { authService } from "@/services/users/auth";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUp() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isDark } = useTheme();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [acceptTos, setAcceptTos] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errName, setErrName] = useState<string | null>(null);
  const [errEmail, setErrEmail] = useState<string | null>(null);
  const [gender, setGender] = useState<"male" | "female" | "other">("male");

  const [errPwd, setErrPwd] = useState<string | null>(null);
  const [errPwd2, setErrPwd2] = useState<string | null>(null);

  const validate = () => {
    let ok = true;

    if (!fullName.trim()) {
      setErrName("Vui lòng nhập họ tên.");
      ok = false;
    } else setErrName(null);

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      setErrEmail("Email không hợp lệ.");
      ok = false;
    } else setErrEmail(null);

    if (pwd.length < 6) {
      setErrPwd("Mật khẩu tối thiểu 6 ký tự.");
      ok = false;
    } else setErrPwd(null);

    if (pwd2 !== pwd) {
      setErrPwd2("Mật khẩu xác nhận không khớp.");
      ok = false;
    } else setErrPwd2(null);

    if (!acceptTos) ok = false;

    return ok;
  };

  const onSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const payload = {
        email,
        fullname: fullName,
        password: pwd,
        gender: gender,
        device: "mobile",
      };

      await authService.signup(
        payload.email,
        payload.fullname,
        payload.password,
        payload.gender,
        payload.device
      );

      showToast("Đã gửi mã OTP. Mã có hiệu lực trong 3 phút.", "success");

      router.push({
        pathname: "/(app)/auth/verify-otp",
        params: { email },
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Đăng ký thất bại";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    fullName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    pwd.length >= 6 &&
    pwd2 === pwd &&
    gender !== null &&
    acceptTos &&
    !loading;

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
          className="flex-1"
        >
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <KeyboardAwareScrollView
              enableOnAndroid
              keyboardShouldPersistTaps="handled"
              extraScrollHeight={80}
              contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
            >
              <View className="mt-6 items-center">
                <Text className="text-white/95 text-3xl font-extrabold tracking-tight">
                  CinemaGo
                </Text>
              </View>

              <View
                className={`mt-5 w-full max-w-[560px] self-center rounded-2xl ${isDark ? "dark" : "light"} bg-background p-6 shadow-2xl border border-yellow-400/40`}
              >
                <Text className="text-2xl font-extrabold text-foreground text-center">
                  Đăng ký
                </Text>
                <Text className="text-foreground mt-1 text-center">
                  Chỉ mất một phút để bắt đầu đặt vé!
                </Text>

                <View className="mt-6">
                  <Text className="text-[14px] text-foreground mb-2">
                    Họ và tên
                  </Text>
                  <View className="rounded-xl border border-foreground bg-white">
                    <TextInput
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Nguyễn Văn A"
                      placeholderTextColor="#9ca3af"
                      className="px-4 h-12 text-[16px] text-black"
                    />
                  </View>
                  {!!errName && (
                    <Text className="text-red-500 text-xs mt-1">{errName}</Text>
                  )}
                </View>

                <View className="mt-4">
                  <Text className="text-[14px] text-foreground mb-2">
                    Email
                  </Text>
                  <View className="rounded-xl border border-foreground bg-white">
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      placeholderTextColor="#9ca3af"
                      keyboardType="email-address"
                      className="px-4 h-12 text-[16px] text-black"
                      autoCapitalize="none"
                    />
                  </View>
                  {!!errEmail && (
                    <Text className="text-red-500 text-xs mt-1">
                      {errEmail}
                    </Text>
                  )}
                </View>

                <View className="mt-4">
                  <Text className="text-[14px] text-foreground mb-2">
                    Giới tính
                  </Text>

                  <View className="flex-row justify-between">
                    {[
                      { label: "Nam", value: "male" },
                      { label: "Nữ", value: "female" },
                      { label: "Khác", value: "other" },
                    ].map((g) => (
                      <Pressable
                        key={g.value}
                        onPress={() => setGender(g.value as any)}
                        className={`px-4 py-3 rounded-xl border flex-1 mx-1 
                              ${gender === g.value ? "bg-yellow-400 border-yellow-500" : "bg-white border-black/20"}`}
                      >
                        <Text
                          className={`text-center font-medium 
                            ${gender === g.value ? "text-black" : "text-black/60"}`}
                        >
                          {g.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View className="mt-4">
                  <Text className="text-[14px] text-foreground mb-2">
                    Mật khẩu
                  </Text>
                  <View className="flex-row items-center rounded-xl border border-black/10 bg-white">
                    <TextInput
                      value={pwd}
                      onChangeText={setPwd}
                      placeholder="Tối thiểu 6 ký tự"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPwd}
                      className="flex-1 px-4 h-12 text-[16px] text-black"
                    />
                    <Pressable
                      onPress={() => setShowPwd(!showPwd)}
                      className="px-4 py-3"
                    >
                      <Text className="text-black/60 text-[14px]">
                        {showPwd ? "Ẩn" : "Hiện"}
                      </Text>
                    </Pressable>
                  </View>
                  {!!errPwd && (
                    <Text className="text-red-500 text-xs mt-1">{errPwd}</Text>
                  )}
                </View>

                <View className="mt-4">
                  <Text className="text-[14px] text-foreground mb-2">
                    Xác nhận mật khẩu
                  </Text>
                  <View className="flex-row items-center rounded-xl border border-black/10 bg-white">
                    <TextInput
                      value={pwd2}
                      onChangeText={setPwd2}
                      placeholder="Nhập lại mật khẩu"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPwd2}
                      className="flex-1 px-4 h-12 text-[16px] text-black"
                    />
                    <Pressable
                      onPress={() => setShowPwd2(!showPwd2)}
                      className="px-4 py-3"
                    >
                      <Text className="text-black/60 text-[14px]">
                        {showPwd2 ? "Ẩn" : "Hiện"}
                      </Text>
                    </Pressable>
                  </View>
                  {!!errPwd2 && (
                    <Text className="text-red-500 text-xs mt-1">{errPwd2}</Text>
                  )}
                </View>

                <Pressable
                  onPress={() => setAcceptTos(!acceptTos)}
                  className="mt-5 flex-row items-center"
                >
                  <View
                    className={`w-5 h-5 mr-2 rounded border items-center justify-center
                  ${acceptTos ? "bg-[#eab308] border-[#eab308]" : "bg-white border-black/30"}`}
                  >
                    {acceptTos && (
                      <Text className="text-foreground text-[12px] leading-4">
                        ✓
                      </Text>
                    )}
                  </View>

                  <Text className="text-foreground text-[13px]">
                    Tôi đồng ý với{" "}
                    <Link href="/legal/terms" className="text-[#2563eb]">
                      Điều khoản
                    </Link>{" "}
                    &
                    <Link href="/legal/privacy" className="text-[#2563eb]">
                      {" "}
                      Chính sách
                    </Link>
                  </Text>
                </Pressable>

                <Pressable
                  onPress={onSubmit}
                  disabled={!canSubmit}
                  className={`mt-6 h-12 rounded-xl items-center justify-center 
      ${canSubmit ? "bg-[#eab308]" : "bg-yellow-300/60"}`}
                >
                  <Text
                    className={`font-semibold ${canSubmit ? "text-black" : "text-black/60"}`}
                  >
                    {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                  </Text>
                </Pressable>

                <View className="mt-6 flex-row justify-center">
                  <Text className="text-foreground mr-1">Đã có tài khoản?</Text>
                  <Link
                    href="/(app)/auth/sign-in"
                    className="text-[#2563eb] font-medium"
                  >
                    Đăng nhập
                  </Link>
                </View>
              </View>

              <View className="items-center mt-3">
                <Text className="text-white/75 text-xs">
                  © {new Date().getFullYear()} CinemaGo
                </Text>
              </View>
            </KeyboardAwareScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
