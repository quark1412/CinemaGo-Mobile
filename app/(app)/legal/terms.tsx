import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermsScreen() {
  const updated = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-extrabold text-black text-center">
          Điều khoản sử dụng
        </Text>
        <Text className="text-black/50 text-xs text-center mt-1">
          Cập nhật lần cuối: {updated}
        </Text>

        <View className="mt-6 space-y-4">
          <View>
            <Text className="text-lg font-bold text-black">
              1. Chấp nhận điều khoản
            </Text>
            <Text className="text-black/80 mt-1">
              Khi tạo tài khoản hoặc tiếp tục sử dụng ứng dụng{" "}
              <Text className="font-semibold">CinemaGo</Text>, bạn xác nhận đã
              đọc, hiểu và đồng ý bị ràng buộc bởi các điều khoản này.
            </Text>
          </View>

          <View>
            <Text className="text-lg font-bold text-black">
              2. Tài khoản & Bảo mật
            </Text>
            <Text className="text-black/80 mt-1">
              Bạn chịu trách nhiệm giữ bí mật thông tin đăng nhập, hạn chế truy
              cập trái phép và chịu trách nhiệm cho mọi hoạt động diễn ra trong
              tài khoản của mình.
            </Text>
          </View>

          <View>
            <Text className="text-lg font-bold text-black">
              3. Đặt vé & Thanh toán
            </Text>
            <Text className="text-black/80 mt-1">
              Mọi đặt vé chỉ được xác nhận sau khi thanh toán thành công. Chi
              tiết vé (rạp, suất chiếu, ghế ngồi) sẽ hiển thị trong phần Lịch
              sử/Account. Hãy kiểm tra kỹ trước khi xác nhận.
            </Text>
            <Text className="text-black/80 mt-2">
              Chính sách hủy/đổi vé (nếu có) phụ thuộc vào rạp và thời điểm suất
              chiếu. Một số vé có thể{" "}
              <Text className="font-semibold">không hỗ trợ hoàn/hủy</Text>. Phí
              dịch vụ (nếu có) sẽ được hiển thị trước khi thanh toán.
            </Text>
          </View>

          <View>
            <Text className="text-lg font-bold text-black">
              4. Hành vi bị cấm
            </Text>
            <Text className="text-black/80 mt-1">
              Không được: (i) sử dụng trái pháp luật; (ii) can thiệp, dò tìm
              lỗi, đảo ngược mã; (iii) dùng bot/auto để đặt vé; (iv) xâm phạm
              quyền riêng tư hoặc quyền sở hữu trí tuệ của bên thứ ba.
            </Text>
          </View>

          <View>
            <Text className="text-lg font-bold text-black">
              5. Quyền sở hữu trí tuệ
            </Text>
            <Text className="text-black/80 mt-1">
              Thương hiệu, logo, nội dung hiển thị trong ứng dụng thuộc sở hữu
              của <Text className="font-semibold">CinemaGo</Text> hoặc các bên
              cấp phép. Bạn không được sử dụng ngoài phạm vi cho phép theo luật
              định.
            </Text>
          </View>

          <View>
            <Text className="text-lg font-bold text-black">
              6. Trách nhiệm & Giới hạn trách nhiệm
            </Text>
            <Text className="text-black/80 mt-1">
              Ứng dụng cung cấp thông tin và dịch vụ “như hiện có”. Trong phạm
              vi pháp luật cho phép, chúng tôi không chịu trách nhiệm đối với
              các thiệt hại gián tiếp, ngẫu nhiên, đặc biệt phát sinh từ việc sử
              dụng ứng dụng.
            </Text>
          </View>

          <View>
            <Text className="text-lg font-bold text-black">
              7. Sửa đổi điều khoản
            </Text>
            <Text className="text-black/80 mt-1">
              Chúng tôi có thể cập nhật điều khoản theo thời gian. Khi thay đổi
              có hiệu lực, ngày “Cập nhật lần cuối” sẽ được điều chỉnh và bạn có
              thể cần đồng ý lại trước khi tiếp tục sử dụng.
            </Text>
          </View>

          <View>
            <Text className="text-lg font-bold text-black">
              8. Luật áp dụng & Giải quyết tranh chấp
            </Text>
            <Text className="text-black/80 mt-1">
              Điều khoản chịu sự điều chỉnh của pháp luật Việt Nam. Mọi tranh
              chấp sẽ được ưu tiên giải quyết thông qua thương lượng; nếu không
              thành, chuyển cơ quan có thẩm quyền theo quy định pháp luật.
            </Text>
          </View>

          <View className="mt-2">
            <Text className="text-lg font-bold text-black">9. Liên hệ</Text>
            <Text className="text-black/80 mt-1">
              Email hỗ trợ: support@cinemago.example • Điện thoại: (+84)
              000-000-000
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
