import { Tabs } from "expo-router";
import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          borderWidth: 0,
          marginBottom: 20,
          backgroundColor: "#fff",
          boxShadow: "0 0 8 rgba(0,0,0,.1)",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => {
            return focused ? (
              <Ionicons name="home" size={20} color={"#fc6a19"} />
            ) : (
              <Ionicons name="home-outline" size={20} />
            );
          },
          tabBarLabel: ({ focused }) => (
            <Text
              className="font-[bold] text-sm -mt-1"
              style={{ color: focused ? "#fc6a19" : "#1e1b1b" }}
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
                color={"#fc6a19"}
              />
            ) : (
              <MaterialCommunityIcons name="movie-settings-outline" size={20} />
            );
          },
          tabBarLabel: ({ focused }) => (
            <Text
              className="font-[bold] text-sm -mt-1"
              style={{ color: focused ? "#fc6a19" : "#1e1b1b" }}
            >
              Cinemas
            </Text>
          ),

          tabBarIconStyle: { marginTop: -2 },
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => {
            return focused ? (
              <MaterialCommunityIcons
                name="account-circle"
                size={20}
                color={"#fc6a19"}
              />
            ) : (
              <MaterialCommunityIcons name="account-circle-outline" size={20} />
            );
          },
          tabBarLabel: ({ focused }) => (
            <Text
              className="font-[bold] text-sm -mt-1"
              style={{ color: focused ? "#fc6a19" : "#1e1b1b" }}
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
