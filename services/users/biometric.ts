// services/biometric.ts
import * as LocalAuth from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const FLAG = "biometric_enabled";
const SECRET = "refresh_token"; // hoặc session key

export async function canUseBiometric() {
  const hw = await LocalAuth.hasHardwareAsync();
  const enrolled = await LocalAuth.isEnrolledAsync();
  return hw && enrolled;
}

export async function enableBiometricLogin(refreshToken: string) {
  // Xác thực 1 lần để bật
  const ok = await LocalAuth.authenticateAsync({
    promptMessage: "Xác thực để bật đăng nhập vân tay",
    cancelLabel: "Hủy",
  });
  if (!ok.success) return false;

  // Lưu token an toàn, yêu cầu vân tay mỗi lần đọc
  await SecureStore.setItemAsync(SECRET, refreshToken, {
    requireAuthentication: true, // bắt buộc vân tay/FaceID khi đọc
  });
  await SecureStore.setItemAsync(FLAG, "1");
  return true;
}

export async function disableBiometricLogin() {
  await SecureStore.deleteItemAsync(SECRET);
  await SecureStore.deleteItemAsync(FLAG);
}

export async function isBiometricEnabled() {
  return (await SecureStore.getItemAsync(FLAG)) === "1";
}

export async function signInWithBiometric(): Promise<string | null> {
  // Trả về refreshToken nếu xác thực thành công
  const token = await SecureStore.getItemAsync(SECRET, {
    requireAuthentication: true, // hiện prompt vân tay
  });
  return token ?? null;
}
