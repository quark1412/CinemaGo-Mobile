// components/showtimes/trailer-screen.tsx
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import YoutubePlayer from "react-native-youtube-iframe";

type Props = {
  youtubeId: string;
  title: string;
};

export default function TrailerScreen({ youtubeId, title }: Props) {
  if (!youtubeId) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text>Không tìm thấy trailer</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <YoutubePlayer height={250} play={true} videoId={youtubeId} />
        <Text
          style={{
            color: "white",
            marginTop: 12,
            marginHorizontal: 16,
            fontSize: 14,
            fontWeight: "600",
          }}
        >
          {title}
        </Text>
      </View>
    </SafeAreaView>
  );
}
