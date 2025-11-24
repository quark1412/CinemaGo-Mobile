// app/(app)/showtimes/trailer.tsx
import TrailerScreen from "@/components/showtimes/trailer-screen";
import { useLocalSearchParams } from "expo-router";

export default function TrailerRoute() {
  const { youtubeId, title } = useLocalSearchParams<{
    youtubeId?: string;
    title?: string;
  }>();

  console.log("vào nè");

  return <TrailerScreen youtubeId={youtubeId ?? ""} title={title ?? ""} />;
}
