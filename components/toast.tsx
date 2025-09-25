import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { Animated, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ToastProps {
  duration?: number;
  animationDuration?: number;
}

const toastStyles = {
  success: {
    backgroundColor: "#4caf50",
    icon: "checkmark-circle-outline",
  },
  error: {
    backgroundColor: "#f44336",
    icon: "close-circle-outline",
  },
  info: {
    backgroundColor: "#2196f3",
    icon: "information-circle-outline",
  },
  warning: {
    backgroundColor: "#ff9800",
    icon: "warning-outline",
  },
};

export const Toast = forwardRef(
  ({ duration = 2000, animationDuration = 300 }: ToastProps, ref) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const timeoutRef = useRef<number | null>(null);
    const [message, setMessage] = useState("");
    const [icon, setIcon] = useState<string>("information-circle-outline");
    const [backgroundColor, setBackgroundColor] = useState("#2196f3");

    useImperativeHandle(ref, () => ({
      show: (
        message: string,
        type: "success" | "error" | "info" | "warning" = "info"
      ) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        setMessage(message);
        const { backgroundColor, icon } = toastStyles[type] || toastStyles.info;
        setIcon(icon);
        setBackgroundColor(backgroundColor);

        translateY.setValue(-100);
        opacity.setValue(0);

        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: animationDuration,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: animationDuration,
            useNativeDriver: true,
          }),
        ]).start();

        timeoutRef.current = setTimeout(() => {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -100,
              duration: animationDuration,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: animationDuration,
              useNativeDriver: true,
            }),
          ]).start();
        }, duration);
      },
    }));

    return (
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 999,
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <View
          className="mx-4 mt-8"
          style={{
            backgroundColor,
            paddingHorizontal: 16,
            paddingVertical: 8,
            alignSelf: "center",
            borderRadius: 40,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons name={icon as any} size={24} color="white" />

          <Text className="text-white text-center font-[medium] ml-2">
            {message}
          </Text>
        </View>
      </Animated.View>
    );
  }
);
