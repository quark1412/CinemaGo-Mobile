import { useToast } from "@/contexts/toastContext";
import { useTheme } from "@/contexts/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authService } from "@/services/users/auth";

export default function ChangePassword() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Mật khẩu phải có ít nhất 8 ký tự");
    }

    if (!/(?=.*[0-9])/.test(password)) {
      errors.push("Mật khẩu phải chứa ít nhất một số");
    }

    if (!/(?=.*[!@#$%^&*])/.test(password)) {
      errors.push("Mật khẩu phải chứa ít nhất một ký tự đặc biệt (!@#$%^&*)");
    }

    return errors;
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.oldPassword.trim()) {
      newErrors.oldPassword = "Yêu cầu nhập mật khẩu hiện tại";
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = "Yêu cầu nhập mật khẩu mới";
    } else {
      const passwordErrors = validatePassword(formData.newPassword);
      if (passwordErrors.length > 0) {
        newErrors.newPassword = passwordErrors[0];
      }
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu của bạn";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        showToast(firstError, "error");
      }
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword({
        oldPassword: formData.oldPassword.trim(),
        newPassword: formData.newPassword.trim(),
      });

      showToast("Đổi mật khẩu thành công!", "success");
      router.back();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Không thể đổi mật khẩu";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "dark" : "light"} bg-background`}
    >
      {/* Header */}
      <View className="flex-row p-4 border-b border-border relative">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-lg"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
            }}
            color={isDark ? "#fff" : "#1f2937"}
          />
        </TouchableOpacity>
        <Text className="text-xl w-full text-center font-[bold] text-foreground">
          Đổi mật khẩu
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="flex gap-6">
          {/* Current Password */}
          <View className="flex gap-2">
            <Text className="text-sm font-[medium] text-foreground">
              Mật khẩu hiện tại
            </Text>
            <View className="flex-row items-center flex">
              <TextInput
                value={formData.oldPassword}
                onChangeText={(text) => {
                  setFormData((prev) => ({ ...prev, oldPassword: text }));
                  if (errors.oldPassword) {
                    setErrors((prev) => ({ ...prev, oldPassword: "" }));
                  }
                }}
                placeholder="Nhập mật khẩu hiện tại"
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                secureTextEntry={!showPasswords.oldPassword}
                className={`w-full px-4 py-4 pl-12 pr-12 bg-card-background border ${
                  errors.oldPassword ? "border-red-500" : "border-border"
                } rounded-xl text-foreground font-[medium] ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              />
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={isDark ? "#9ca3af" : "#6b7280"}
                style={{
                  position: "absolute",
                  left: 12,
                  top: 15,
                }}
              />
              <TouchableOpacity
                onPress={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    oldPassword: !prev.oldPassword,
                  }))
                }
                style={{
                  position: "absolute",
                  right: 12,
                  top: 15,
                }}
              >
                <Ionicons
                  name={
                    showPasswords.oldPassword
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={20}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                />
              </TouchableOpacity>
            </View>
            {errors.oldPassword && (
              <Text className="text-xs text-red-500 mt-1">
                {errors.oldPassword}
              </Text>
            )}
          </View>

          {/* New Password */}
          <View className="flex gap-2">
            <Text className="text-sm font-[medium] text-foreground">
              Mật khẩu mới
            </Text>
            <View className="flex-row items-center flex">
              <TextInput
                value={formData.newPassword}
                onChangeText={(text) => {
                  setFormData((prev) => ({ ...prev, newPassword: text }));
                  if (errors.newPassword) {
                    setErrors((prev) => ({ ...prev, newPassword: "" }));
                  }
                }}
                placeholder="Nhập mật khẩu mới"
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                secureTextEntry={!showPasswords.newPassword}
                className={`w-full px-4 py-4 pl-12 pr-12 bg-card-background border ${
                  errors.newPassword ? "border-red-500" : "border-border"
                } rounded-xl text-foreground font-[medium] ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              />
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={isDark ? "#9ca3af" : "#6b7280"}
                style={{
                  position: "absolute",
                  left: 12,
                  top: 15,
                }}
              />
              <TouchableOpacity
                onPress={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    newPassword: !prev.newPassword,
                  }))
                }
                style={{
                  position: "absolute",
                  right: 12,
                  top: 15,
                }}
              >
                <Ionicons
                  name={
                    showPasswords.newPassword
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={20}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                />
              </TouchableOpacity>
            </View>
            {errors.newPassword && (
              <Text className="text-xs text-red-500 mt-1">
                {errors.newPassword}
              </Text>
            )}
          </View>

          {/* Confirm New Password */}
          <View className="flex gap-2">
            <Text className="text-sm font-[medium] text-foreground">
              Xác nhận mật khẩu mới
            </Text>
            <View className="flex-row items-center flex">
              <TextInput
                value={formData.confirmPassword}
                onChangeText={(text) => {
                  setFormData((prev) => ({ ...prev, confirmPassword: text }));
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }
                }}
                placeholder="Xác nhận mật khẩu mới của bạn"
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                secureTextEntry={!showPasswords.confirmPassword}
                className={`w-full px-4 py-4 pl-12 pr-12 bg-card-background border ${
                  errors.confirmPassword ? "border-red-500" : "border-border"
                } rounded-xl text-foreground font-[medium] ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              />
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={isDark ? "#9ca3af" : "#6b7280"}
                style={{
                  position: "absolute",
                  left: 12,
                  top: 15,
                }}
              />
              <TouchableOpacity
                onPress={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    confirmPassword: !prev.confirmPassword,
                  }))
                }
                style={{
                  position: "absolute",
                  right: 12,
                  top: 15,
                }}
              >
                <Ionicons
                  name={
                    showPasswords.confirmPassword
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={20}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text className="text-xs text-red-500 mt-1">
                {errors.confirmPassword}
              </Text>
            )}
          </View>

          {/* Password Requirements */}
          <View className="bg-card-background p-4 rounded-xl border border-border">
            <Text className="text-sm font-[medium] text-foreground mb-2">
              Yêu cầu mật khẩu:
            </Text>
            <View className="flex gap-1">
              <Text className="text-xs text-text-muted">• Ít nhất 8 ký tự</Text>
              <Text className="text-xs text-text-muted">
                • Chứa ít nhất một số
              </Text>
              <Text className="text-xs text-text-muted">
                • Chứa ít nhất một ký tự đặc biệt (!@#$%^&*)
              </Text>
            </View>
          </View>
        </View>

        {/* Change Password Button */}
        <TouchableOpacity
          onPress={handleChangePassword}
          disabled={loading}
          className={`px-4 py-3 rounded-xl mt-8 w-full ${
            loading ? "bg-gray-400" : "bg-primary"
          }`}
        >
          <Text className="text-white text-center text-lg font-[semibold]">
            {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
