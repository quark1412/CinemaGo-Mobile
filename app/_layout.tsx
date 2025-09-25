import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Slot } from "expo-router";

import "../global.css";
import { StatusBar } from "react-native";
import { ToastProvider } from "@/contexts/toastContext";

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

  if (!loaded && !error) {
    return null;
  }

  return (
    // <SessionProvider>
    <ToastProvider>
      <StatusBar barStyle={"dark-content"} />
      <Slot />
    </ToastProvider>
    // </SessionProvider>
  );
}
