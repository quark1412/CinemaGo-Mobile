// services/biometric.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuth from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const BIOMETRIC_ENABLED_USER_ID = "BIOMETRIC_ENABLED_USER_ID";
const BIOMETRIC_REFRESH_TOKEN_PREFIX = "BIOMETRIC_REFRESH_TOKEN_";

const getBiometricTokenKey = (userId: string) =>
  `${BIOMETRIC_REFRESH_TOKEN_PREFIX}${userId}`;

export async function canUseBiometric() {
  const hw = await LocalAuth.hasHardwareAsync();
  const enrolled = await LocalAuth.isEnrolledAsync();
  return hw && enrolled;
}

export async function getBiometricUserId(): Promise<string | null> {
  return await AsyncStorage.getItem(BIOMETRIC_ENABLED_USER_ID);
}

export async function enableBiometricLogin(
  userId: string,
  refreshToken: string
) {
  try {
    const canUse = await canUseBiometric();
    if (!canUse) return false;

    const ok = await LocalAuth.authenticateAsync({
      promptMessage: "Xác thực để bật đăng nhập sinh trắc học",
      cancelLabel: "Hủy",
    });
    if (!ok.success) return false;

    await SecureStore.setItemAsync(getBiometricTokenKey(userId), refreshToken, {});
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_USER_ID, userId);

    return true;
  } catch (e) {
    console.log("enableBiometricLogin error", e);
    return false;
  }
}

export async function disableBiometricLogin(userId: string) {
  try {
    await SecureStore.deleteItemAsync(getBiometricTokenKey(userId));

    const currentEnabledUser = await getBiometricUserId();
    if (currentEnabledUser === userId) {
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_USER_ID);
    }
  } catch (e) {
    console.log("disableBiometricLogin error", e);
  }
}

export async function isBiometricEnabled(userId?: string) {
  const enabledUserId = await getBiometricUserId();
  if (userId) {
    return enabledUserId === userId;
  }
  return !!enabledUserId;
}

export async function signInWithBiometric(): Promise<string | null> {
  const canUse = await canUseBiometric();
  if (!canUse) return null;

  const enabledUserId = await getBiometricUserId();
  if (!enabledUserId) return null;

  const ok = await LocalAuth.authenticateAsync({
    promptMessage: "Đăng nhập bằng sinh trắc học",
    cancelLabel: "Hủy",
  });
  if (!ok.success) return null;

  const token = await SecureStore.getItemAsync(getBiometricTokenKey(enabledUserId));
  return token ?? null;
}

export async function updateBiometricToken(
  userId: string,
  refreshToken: string
) {
  try {
    if (await isBiometricEnabled(userId)) {
      await SecureStore.setItemAsync(
        getBiometricTokenKey(userId),
        refreshToken,
        {}
      );
    }
  } catch (e) {
    console.log("updateBiometricToken error", e);
  }
}

export async function clearBiometricDataForUser(userId: string) {
  await SecureStore.deleteItemAsync(getBiometricTokenKey(userId));
  const currentEnabledUser = await getBiometricUserId();
  if (currentEnabledUser === userId) {
    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_USER_ID);
  }
}
