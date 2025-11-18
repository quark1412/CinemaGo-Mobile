import { ThemeProvider } from "@/contexts/themeContext";
import { ToastProvider } from "@/contexts/toastContext";
import { UserProvider } from "@/contexts/userContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "react-native";
import "../global.css";

import {
  disableBiometricLogin,
  isBiometricEnabled,
} from "@/services/users/biometric";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    regular: require("../assets/fonts/Manrope-Regular.ttf"),
    medium: require("../assets/fonts/Manrope-Medium.ttf"),
    semibold: require("../assets/fonts/Manrope-SemiBold.ttf"),
    light: require("../assets/fonts/Manrope-Light.ttf"),
    extraLight: require("../assets/fonts/Manrope-ExtraLight.ttf"),
    bold: require("../assets/fonts/Manrope-Bold.ttf"),
    extraBold: require("../assets/fonts/Manrope-ExtraBold.ttf"),
  });

  useEffect(() => {
    if (loaded && !error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    (async () => {
      try {
        const enabled = await isBiometricEnabled();
        if (!enabled) return;

        const currentRefreshToken = await AsyncStorage.getItem("refreshToken");

        if (!currentRefreshToken) {
          await disableBiometricLogin();
        }
      } catch (e) {
        console.log("Biometric init sync error:", e);
      }
    })();
  }, []);

  if (!loaded && !error) {
    return null;
  }

  return (
    // <SessionProvider>
    <ThemeProvider>
      <ToastProvider>
        <UserProvider>
          <StatusBar />
          <Slot />
        </UserProvider>
      </ToastProvider>
    </ThemeProvider>
    // </SessionProvider>
  );
}
