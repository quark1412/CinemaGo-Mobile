import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "@/contexts/themeContext";
import { paymentService } from "@/services/payment";
import { bookingService } from "@/services/booking";
import { useToast } from "@/contexts/toastContext";

type Status = "pending" | "success" | "failed";

export default function BookingSuccessScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{
    bookingId?: string;
    amount?: string;
    method?: string;
  }>();

  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState<string>(
    "Đang kiểm tra trạng thái thanh toán..."
  );
  const [bookingId, setBookingId] = useState<string | null>(
    params.bookingId ?? null
  );
  const [amount, setAmount] = useState<number | null>(
    params.amount ? Number(params.amount) : null
  );

  const bgColor = isDark ? "bg-slate-950" : "bg-white";
  const cardBg = isDark ? "bg-slate-900" : "bg-slate-50";
  const textColor = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-slate-400" : "text-slate-600";
  const successColor = "#22c55e";
  const errorColor = "#ef4444";

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (params.method === "COD") {
        setStatus("success");
        setMessage(
          "Đặt vé thành công. Vui lòng thanh toán tại quầy trước khi vào rạp."
        );
        return;
      }

      try {
        const resolvedBookingId =
          (typeof params.bookingId === "string" && params.bookingId) ||
          (await AsyncStorage.getItem("bookingId"));

        if (!resolvedBookingId) {
          setStatus("failed");
          setMessage("Không tìm thấy thông tin thanh toán.");
          return;
        }

        setBookingId(resolvedBookingId);

        if (!amount) {
          const storedAmount = await AsyncStorage.getItem("paymentAmount");
          if (storedAmount) {
            setAmount(Number(storedAmount));
          }
        }

        try {
          const booking =
            await bookingService.getBookingById(resolvedBookingId);
          if ((booking as any)?.status === "Đã thanh toán") {
            setStatus("success");
            setMessage("Thanh toán và đặt vé thành công!");
            await AsyncStorage.multiRemove(["bookingId", "paymentAmount"]);
            return;
          }
        } catch (err) {
          console.warn("Cannot fetch booking before MoMo check", err);
        }

        try {
          await paymentService.checkMoMoStatus(resolvedBookingId);

          const updatedBooking =
            await bookingService.getBookingById(resolvedBookingId);
          setAmount(updatedBooking.totalPrice ?? null);

          setStatus("success");
          setMessage(
            "Thanh toán MoMo thành công. Đặt vé của bạn đã được xác nhận."
          );

          await AsyncStorage.multiRemove(["bookingId", "paymentAmount"]);
        } catch (error: any) {
          setStatus("failed");
          setMessage("Thanh toán không thành công hoặc đã bị hủy.");
        }
      } catch (error: any) {
        console.error("Error while checking payment status:", error);
        showToast(
          error?.message || "Không thể kiểm tra trạng thái thanh toán",
          "error"
        );
        setStatus("failed");
        setMessage("Đã xảy ra lỗi khi kiểm tra thanh toán.");
      }
    };

    checkPaymentStatus();
  }, [params.method, params.bookingId, amount]);

  const handleGoHome = () => {
    router.push("/(app)/(tabs)/home");
  };

  const handleViewTickets = () => {
    router.push("/screens/my-tickets");
  };

  const renderIcon = () => {
    if (status === "pending") {
      return <ActivityIndicator size="large" color="#3b82f6" />;
    }

    if (status === "success") {
      return (
        <Ionicons name="checkmark-circle" size={56} color={successColor} />
      );
    }

    return <Ionicons name="close-circle" size={56} color={errorColor} />;
  };

  return (
    <SafeAreaView
      className={`flex-1 items-center justify-center px-6 ${bgColor}`}
    >
      <View className={`w-full max-w-md rounded-2xl p-6 ${cardBg}`}>
        <View className="items-center mb-4">{renderIcon()}</View>

        <Text className={`text-xl font-bold text-center mb-2 ${textColor}`}>
          {status === "pending"
            ? "Đang xử lý thanh toán..."
            : status === "success"
              ? "Thanh toán và đặt vé thành công!"
              : "Thanh toán không thành công"}
        </Text>

        <Text className={`text-center mb-4 ${textMuted}`}>{message}</Text>

        {(bookingId || amount != null) && (
          <View className="mt-2 mb-4 rounded-xl bg-slate-800/5 dark:bg-slate-800/40 px-4 py-3">
            {bookingId && (
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Mã đặt vé
                </Text>
                <Text className="text-xs font-mono text-slate-700 dark:text-slate-200">
                  {bookingId.slice(0, 8)}...{bookingId.slice(-4)}
                </Text>
              </View>
            )}
            {amount != null && (
              <View className="flex-row justify-between mt-1">
                <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Số tiền
                </Text>
                <Text className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(amount)}
                </Text>
              </View>
            )}
          </View>
        )}

        <View className="flex-row justify-center gap-3 mt-2">
          <TouchableOpacity
            className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-600 items-center"
            onPress={handleGoHome}
          >
            <Text className={`${textColor} font-semibold`}>Về trang chủ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-3 rounded-xl bg-red-600 items-center"
            onPress={handleViewTickets}
          >
            <Text className="text-white font-semibold">Xem vé của tôi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
