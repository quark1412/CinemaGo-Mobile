import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  parseBookingQRData,
  validateBookingQR,
  formatBookingForDisplay,
  BookingQRData,
} from "@/utils/qrCodeHelpers";

interface EmployeeQRScannerProps {
  onBookingVerified?: (bookingData: BookingQRData) => void;
}

export const EmployeeQRScanner = ({
  onBookingVerified,
}: EmployeeQRScannerProps) => {
  const [scannedData, setScannedData] = useState<BookingQRData | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Simulate QR code scanning (in real app, you'd use a camera scanner)
  const simulateQRScan = (qrString: string) => {
    const parsedData = parseBookingQRData(qrString);

    if (!parsedData) {
      Alert.alert(
        "Invalid QR Code",
        "The scanned QR code is not a valid booking code."
      );
      return;
    }

    const validation = validateBookingQR(parsedData);

    if (!validation.isValid) {
      Alert.alert(
        "Invalid Booking",
        validation.reason || "This booking is not valid."
      );
      return;
    }

    setScannedData(parsedData);
    onBookingVerified?.(parsedData);
  };

  const renderBookingDetails = () => {
    if (!scannedData) return null;

    const formatted = formatBookingForDisplay(scannedData);

    return (
      <View className="bg-white p-4 rounded-lg border border-gray-200 mt-4">
        <View className="flex-row items-center mb-3">
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text className="text-lg font-bold text-gray-900 ml-2">
            Valid Booking
          </Text>
        </View>

        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Booking ID:</Text>
            <Text className="font-semibold text-gray-900">
              {formatted.shortBookingId}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-gray-600">Total Price:</Text>
            <Text className="font-semibold text-gray-900">
              {formatted.formattedPrice}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-gray-600">
              Seats ({formatted.seatCount}):
            </Text>
            <Text className="font-semibold text-gray-900">
              {formatted.seatList}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-gray-600">Booked on:</Text>
            <Text className="font-semibold text-gray-900">
              {formatted.bookingDate}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-gray-600">Showtime ID:</Text>
            <Text className="font-semibold text-gray-900">
              {scannedData.showtimeId}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className="bg-green-500 p-3 rounded-lg mt-4"
          onPress={() => {
            Alert.alert(
              "Booking Verified",
              "Customer can proceed to their seats."
            );
            setScannedData(null);
          }}
        >
          <Text className="text-white text-center font-semibold">
            Admit Customer
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className="p-4">
      <Text className="text-xl font-bold text-gray-900 mb-4">
        Employee QR Scanner
      </Text>

      <TouchableOpacity
        className={`p-4 rounded-lg border-2 border-dashed ${
          isScanning
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50"
        } items-center`}
        onPress={() => {
          // In a real app, this would open the camera scanner
          setIsScanning(true);
          // Simulate scanning after a delay
          setTimeout(() => {
            setIsScanning(false);
            // Example QR data (this would come from the camera)
            const mockQRData = JSON.stringify({
              bookingId: "booking-001",
              userId: "user-123",
              showtimeId: "showtime-001",
              totalPrice: 25.5,
              seats: ["seat-a1", "seat-a2"],
              createdAt: new Date().toISOString(),
            });
            simulateQRScan(mockQRData);
          }, 2000);
        }}
        disabled={isScanning}
      >
        <Ionicons
          name={isScanning ? "scan" : "qr-code-outline"}
          size={48}
          color={isScanning ? "#3B82F6" : "#6B7280"}
        />
        <Text
          className={`mt-2 font-medium ${
            isScanning ? "text-blue-600" : "text-gray-600"
          }`}
        >
          {isScanning ? "Scanning..." : "Tap to Scan QR Code"}
        </Text>
      </TouchableOpacity>

      {renderBookingDetails()}

      <View className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <Text className="text-sm text-yellow-800 font-medium mb-1">
          Employee Instructions:
        </Text>
        <Text className="text-xs text-yellow-700">
          1. Ask customer to show their ticket QR code{"\n"}
          2. Tap "Scan QR Code" button above{"\n"}
          3. Point camera at the QR code{"\n"}
          4. Verify booking details match showtime{"\n"}
          5. Click "Admit Customer" if valid
        </Text>
      </View>
    </View>
  );
};

export default EmployeeQRScanner;
