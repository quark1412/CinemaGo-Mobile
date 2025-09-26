import { Link } from "expo-router";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignIn() {
  return (
    <SafeAreaView className="flex-1 justify-center items-center">
      <Text className="text-2xl">Sign In</Text>
      <Link href="/(app)/(tabs)/account" className="text-blue-500 mt-4">
        <Text>Account</Text>
      </Link>
    </SafeAreaView>
  );
}
