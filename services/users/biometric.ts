// services/biometric.ts
import * as LocalAuth from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const FLAG = "biometric_enabled";
const SECRET = "BIOMETRIC_REFRESH_TOKEN";

export async function canUseBiometric() {
  const hw = await LocalAuth.hasHardwareAsync();
  const enrolled = await LocalAuth.isEnrolledAsync();
  return hw && enrolled;
}

export async function enableBiometricLogin(refreshToken: string) {
  try {
    const canUse = await canUseBiometric();
    if (!canUse) return false;

    const ok = await LocalAuth.authenticateAsync({
      promptMessage: "Xác thực để bật đăng nhập sinh trắc học",
      cancelLabel: "Hủy",
    });
    if (!ok.success) return false;

    console.log("refreshtoken nè: ", refreshToken);

    await SecureStore.setItemAsync(SECRET, refreshToken, {});
    await SecureStore.setItemAsync(FLAG, "1");
    return true;
  } catch (e) {
    console.log("enableBiometricLogin error", e);
    return false;
  }
}

export async function disableBiometricLogin() {
  await SecureStore.deleteItemAsync(SECRET);
  await SecureStore.deleteItemAsync(FLAG);
}

export async function isBiometricEnabled() {
  return (await SecureStore.getItemAsync(FLAG)) === "1";
}

export async function signInWithBiometric(): Promise<string | null> {
  const canUse = await canUseBiometric();
  if (!canUse) return null;

  const ok = await LocalAuth.authenticateAsync({
    promptMessage: "Đăng nhập bằng sinh trắc học",
    cancelLabel: "Hủy",
  });
  if (!ok.success) return null;

  const token = await SecureStore.getItemAsync(SECRET);
  return token ?? null;
}

export async function updateBiometricToken(refreshToken: string) {
  try {
    await SecureStore.setItemAsync(SECRET, refreshToken, {});
  } catch (e) {
    console.log("updateBiometricToken error", e);
  }
}
