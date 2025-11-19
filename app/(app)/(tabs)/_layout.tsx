import { Tabs } from "expo-router";
import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/themeContext";

export default function RootLayout() {
  const { isDark } = useTheme();

  const colors = {
    background: isDark ? "#0f172a" : "#ffffff",
    activeColor: "#e11d48",
    inactiveColor: isDark ? "#94a3b8" : "#64748b",
    border: isDark ? "#334155" : "#e2e8f0",
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          marginBottom: 20,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => {
            return focused ? (
              <Ionicons name="home" size={20} color={colors.activeColor} />
            ) : (
              <Ionicons
                name="home-outline"
                size={20}
                color={colors.inactiveColor}
              />
            );
          },
          tabBarLabel: ({ focused }) => (
            <Text
              className="font-[bold] text-sm -mt-1"
              style={{
                color: focused ? colors.activeColor : colors.inactiveColor,
              }}
            >
              Home
            </Text>
          ),

          tabBarIconStyle: { marginTop: -2 },
        }}
      />

      <Tabs.Screen
        name="cinemas"
        options={{
          title: "Cinemas",
          tabBarIcon: ({ color, focused }) => {
            return focused ? (
              <MaterialCommunityIcons
                name="movie-settings"
                size={20}
                color={colors.activeColor}
              />
            ) : (
              <MaterialCommunityIcons
                name="movie-settings-outline"
                size={20}
                color={colors.inactiveColor}
              />
            );
          },
          tabBarLabel: ({ focused }) => (
            <Text
              className="font-[bold] text-sm -mt-1"
              style={{
                color: focused ? colors.activeColor : colors.inactiveColor,
              }}
            >
              Cinemas
            </Text>
          ),

          tabBarIconStyle: { marginTop: -2 },
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => {
            return focused ? (
              <MaterialCommunityIcons
                name="account-circle"
                size={20}
                color={colors.activeColor}
              />
            ) : (
              <MaterialCommunityIcons
                name="account-circle-outline"
                size={20}
                color={colors.inactiveColor}
              />
            );
          },
          tabBarLabel: ({ focused }) => (
            <Text
              className="font-[bold] text-sm -mt-1"
              style={{
                color: focused ? colors.activeColor : colors.inactiveColor,
              }}
            >
              Account
            </Text>
          ),

          tabBarIconStyle: { marginTop: -2 },
        }}
      />
    </Tabs>
  );
}
