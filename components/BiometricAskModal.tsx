import { Ionicons } from "@expo/vector-icons";
import { Modal, Text, TouchableOpacity, View } from "react-native";

interface BiometricAskModalProps {
    visible: boolean;
    onClose: () => void;
    onEnable: () => void;
}

export function BiometricAskModal({ visible, onClose, onEnable }: BiometricAskModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View className="flex-1 justify-center items-center bg-black/60 px-6">
                <View className="w-full bg-white rounded-3xl overflow-hidden shadow-2xl">
                    <View className="bg-[#eab308] py-6 items-center">
                        <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center">
                            <Ionicons name="finger-print" size={32} color="white" />
                        </View>
                    </View>

                    <View className="p-6 items-center">
                        <Text className="text-xl font-bold text-center text-gray-900 mb-2">
                            Đăng nhập nhanh hơn
                        </Text>
                        <Text className="text-gray-500 text-center mb-6 leading-6">
                            Bạn có muốn kích hoạt đăng nhập bằng sinh trắc học (Face ID / Vân tay) cho lần sau không?
                        </Text>

                        <View className="flex-row w-full gap-3">
                            <TouchableOpacity
                                onPress={onClose}
                                className="flex-1 py-3.5 rounded-xl bg-gray-100 items-center"
                            >
                                <Text className="font-semibold text-gray-600">Để sau</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={onEnable}
                                className="flex-1 py-3.5 rounded-xl bg-[#eab308] items-center"
                            >
                                <Text className="font-semibold text-white">Kích hoạt</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
