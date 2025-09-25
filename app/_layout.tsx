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
    regular: require("../assets/fonts/Urbanist-Regular.ttf"),
    medium: require("../assets/fonts/Urbanist-Medium.ttf"),
    semibold: require("../assets/fonts/Urbanist-SemiBold.ttf"),
    light: require("../assets/fonts/Urbanist-Light.ttf"),
    bold: require("../assets/fonts/Urbanist-Bold.ttf"),
    black: require("../assets/fonts/Urbanist-Black.ttf"),
    extraBold: require("../assets/fonts/Urbanist-ExtraBold.ttf"),
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
