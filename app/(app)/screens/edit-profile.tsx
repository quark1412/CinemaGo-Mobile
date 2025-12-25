import { useTheme } from "@/contexts/themeContext";
import { useToast } from "@/contexts/toastContext";
import { useUser } from "@/contexts/userContext";
import { authService } from "@/services/users/auth";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditProfile() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const { user, setUser, refreshUser } = useUser();
  const [fullname, setFullname] = useState("");
  const [avatarUri, setAvatarUri] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullname(user.fullname || "");
      setAvatarUri(user.avatarUrl || "");
    }
  }, [user]);

  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: galleryStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== "granted" || galleryStatus !== "granted") {
      showToast("Cần quyền truy cập camera và thư viện ảnh", "error");
      return false;
    }
    return true;
  };

  const pickImageFromCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      showToast("Không thể tải ảnh", "error");
    }
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      showToast("Không thể tải hình ảnh", "error");
    }
  };

  const removeAvatar = async () => {
    setAvatarUri("");
  };

  const handleImagePicker = () => {
    const options: {
      text: string;
      onPress?: () => Promise<void>;
      style?: "default" | "cancel" | "destructive";
    }[] = [
      {
        text: "Máy ảnh",
        onPress: pickImageFromCamera,
      },
      {
        text: "Thư viện",
        onPress: pickImageFromGallery,
      },
    ];

    if (avatarUri) {
      options.push({
        text: "Xóa ảnh đại diện",
        onPress: removeAvatar,
        style: "destructive",
      });
    }

    options.push({
      text: "Hủy",
      style: "cancel",
    });

    Alert.alert(
      "Chọn ảnh đại diện",
      "Chọn cách bạn muốn chọn ảnh đại diện",
      options
    );
  };

  const handleSave = async () => {
    if (!fullname.trim()) {
      showToast("Vui lòng nhập họ tên của bạn", "error");
      return;
    }

    setLoading(true);
    try {
      if (avatarUri) {
        const formData = new FormData();
        formData.append("avatar", {
          uri: avatarUri,
          type: "image/jpeg", // hoặc suy luận từ đuôi file
          name: "avatar.jpg",
        } as any);
        formData.append("fullname", fullname.trim());
        formData.append("gender", user?.gender || "");

        await authService.updateProfile(formData);
      } else {
        await authService.updateProfile({
          fullname: fullname.trim(),
          gender: user?.gender || "",
        });
      }

      await refreshUser();

      // if (user) {
      //   const updatedUser = {
      //     ...user,
      //     fullname: fullname.trim(),
      //     avatarUrl: avatarUri,
      //   };
      //   await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      //   setUser(updatedUser);
      // }

      showToast("Cập nhật hồ sơ thành công!", "success");
      router.back();
    } catch (error) {
      showToast("Không thể cập nhật hồ sơ", "error");
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
          Chỉnh sửa hồ sơ
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Avatar Section */}
        <View className="items-center mb-8">
          <View className="relative">
            <Image
              source={{
                uri:
                  avatarUri ||
                  "https://via.placeholder.com/120x120/cccccc/666666?text=Avatar",
              }}
              className="w-32 h-32 rounded-full bg-gray-200"
            />
            <TouchableOpacity
              onPress={handleImagePicker}
              className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full items-center justify-center border-4 border-background"
            >
              <Ionicons name="camera" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Section */}
        <View className="flex gap-4">
          {/* Full Name */}
          <View className="flex gap-2">
            <Text className="text-sm font-[medium] text-foreground">
              Họ tên
            </Text>
            <View className="flex-row items-center flex">
              <TextInput
                value={fullname}
                onChangeText={setFullname}
                placeholder="Nhập họ tên của bạn"
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                className={`w-full px-4 py-4 pl-12 bg-card-background border border-border rounded-xl text-foreground font-[medium] ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              />
              <Ionicons
                name="person-outline"
                size={20}
                color={isDark ? "#9ca3af" : "#6b7280"}
                style={{
                  position: "absolute",
                  left: 12,
                  top: 15,
                }}
              />
            </View>
          </View>

          {/* Email */}
          <View className="flex gap-2">
            <Text className="text-sm font-[medium] text-foreground">Email</Text>
            <View className="flex-row items-center flex opacity-60">
              <TextInput
                value={user?.email || ""}
                editable={false}
                placeholder="Địa chỉ email"
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                className={`w-full px-4 py-4 pl-12 bg-muted-background border border-border rounded-xl text-text-muted font-[medium]`}
              />
              <Ionicons
                name="mail-outline"
                size={20}
                color={isDark ? "#9ca3af" : "#6b7280"}
                style={{
                  position: "absolute",
                  left: 12,
                  top: 15,
                }}
              />
            </View>
          </View>

          {/* Gender */}
          <View className="flex gap-2">
            <Text className="text-sm font-[medium] text-foreground">
              Giới tính
            </Text>
            <View className="flex-row items-center flex opacity-60">
              <TextInput
                value={user?.gender || ""}
                editable={false}
                placeholder="Giới tính"
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                className={`w-full px-4 py-4 pl-12 bg-muted-background border border-border rounded-xl text-text-muted font-[medium]`}
              />
              <Ionicons
                name="person-outline"
                size={20}
                color={isDark ? "#9ca3af" : "#6b7280"}
                style={{
                  position: "absolute",
                  left: 12,
                  top: 15,
                }}
              />
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          className={`px-4 py-3 rounded-lg mt-8 w-full ${
            loading ? "bg-gray-400" : "bg-primary"
          }`}
        >
          <Text className="text-foreground text-center text-lg font-[semibold]">
            {loading ? "Đang lưu..." : "Lưu"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
