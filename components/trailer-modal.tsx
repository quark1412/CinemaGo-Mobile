// components/showtimes/TrailerModal.tsx
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

type TrailerModalProps = {
  visible: boolean;
  trailerUrl: string | null;
  onClose: () => void;
};

export default function TrailerModal({
  visible,
  trailerUrl,
  onClose,
}: TrailerModalProps) {
  const [videoLoading, setVideoLoading] = useState(false);

  const player = useVideoPlayer(trailerUrl ?? null, (p) => {
    if (visible && trailerUrl) {
      p.play();
    } else {
      p.pause();
    }
  });

  useEffect(() => {
    if (visible && trailerUrl) {
      setVideoLoading(true);
    } else {
      setVideoLoading(false);
    }
  }, [visible, trailerUrl]);

  useEffect(() => {
    if (!visible) {
      try {
        player.pause();
      } catch {}
    }
  }, [visible, player]);

  const handleClose = () => {
    try {
      player.pause();
    } catch {}
    setVideoLoading(false);
    onClose();
  };

  return (
    <Modal
      visible={visible && !!trailerUrl}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/90 justify-center items-center px-4">
        {trailerUrl ? (
          <View
            className="w-full"
            style={{
              height: 250,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <VideoView
              player={player}
              style={{ width: "100%", height: "100%" }}
              nativeControls
              contentFit="contain"
              onFirstFrameRender={() => setVideoLoading(false)}
            />

            {videoLoading && (
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="mt-2 text-xs text-white">
                  Đang tải trailer...
                </Text>
              </View>
            )}
          </View>
        ) : null}

        <Pressable
          onPress={handleClose}
          className="mt-4 bg-gray-300 px-4 py-2 rounded-lg"
        >
          <Text className="font-semibold text-gray-800">Đóng</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
