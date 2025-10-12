import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function CheckoutScreen() {
  const router = useRouter();
  const { showtimeId, movieId, seats, totalPrice } = useLocalSearchParams<{
    showtimeId: string;
    movieId: string;
    seats: string;
    totalPrice: string;
  }>();

  const selectedSeats = seats ? JSON.parse(seats) : [];
  const price = totalPrice ? parseFloat(totalPrice) : 0;

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-800">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-white">Checkout</Text>
        <View className="w-6" />
      </View>

      {/* Content */}
      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-2xl font-bold text-white mb-6">
            Booking Summary
          </Text>

          {/* Showtime ID */}
          <View className="mb-5 py-4 border-b border-slate-800">
            <Text className="text-sm text-slate-400 mb-2">Showtime ID:</Text>
            <Text className="text-lg font-semibold text-white">
              {showtimeId}
            </Text>
          </View>

          {/* Selected Seats */}
          <View className="mb-5 py-4 border-b border-slate-800">
            <Text className="text-sm text-slate-400 mb-2">Selected Seats:</Text>
            <Text className="text-lg font-semibold text-white">
              {selectedSeats.join(", ")}
            </Text>
          </View>

          {/* Total Price */}
          <View className="mb-5 py-4 border-b border-slate-800">
            <Text className="text-sm text-slate-400 mb-2">Total Price:</Text>
            <Text className="text-3xl font-bold text-rose-600">
              ${price.toFixed(2)}
            </Text>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity className="bg-rose-600 py-4 rounded-xl items-center mt-6">
            <Text className="text-base font-bold text-white">
              Confirm Booking
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
