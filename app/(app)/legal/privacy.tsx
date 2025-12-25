import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyScreen() {
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
          Chính sách quyền riêng tư
        </Text>
        <Text className="text-black/50 text-xs text-center mt-1">
          Cập nhật lần cuối: {updated}
        </Text>

        <View className="mt-6 space-y-4">
          <View>
            <Text className="text-lg font-bold text-black">1. Phạm vi</Text>
            <Text className="text-black/80 mt-1">
              Chính sách này giải thích cách{" "}
              <Text className="font-semibold">CinemaGo</Text> thu thập, sử dụng,
              chia sẻ và bảo vệ dữ liệu cá nhân khi bạn dùng ứng dụng và dịch vụ
              đặt vé.
            </Text>
          </View>

          <View>
            <Text className="text-lg font-bold text-black">
              2. Dữ liệu thu thập
            </Text>
            <Text className="text-black/80 mt-1">
              • Thông tin tài khoản: họ tên, email, số điện thoại.{"\n"}• Dữ
              liệu giao dịch: lịch sử đặt vé, rạp, suất, ghế, phương thức thanh
              toán.*{"\n"}• Dữ liệu thiết bị & sử dụng: model, OS, IP gần đúng,
              log sự kiện, cookie/ID quảng cáo.{"\n"}
              *Lưu ý: thông tin thẻ thanh toán được xử lý bởi cổng thanh toán,
              chúng tôi không lưu trữ PAN/CSC.
            </Text>
          </View>

          <View>
            <Text className="text-lg font-bold text-black">
              3. Mục đích sử dụng
            </Text>
            <Text className="text-black/80 mt-1">
              Cung cấp dịch vụ đặt vé; hỗ trợ khách hàng; phòng chống gian lận;
              cải thiện tính năng; gửi thông báo liên quan giao dịch; tiếp thị
              (khi bạn đồng ý).
            </Text>
          </View>

          <View>
            <Text className="text-lg font-bold text-black">
              4. Cơ sở pháp lý xử lý
            </Text>
            <Text className="text-black/80 mt-1">
              Thực hiện hợp đồng (cung cấp dịch vụ), tuân thủ pháp luật, lợi ích
              hợp pháp (bảo mật, vận hành), và/hoặc theo sự đồng ý của bạn cho
              các mục đích tiếp thị.
            </Text>
          </View>

          <View>
            <Text className="text-lg font-bold text-black">
              5. Chia sẻ với bên thứ ba
            </Text>
            <Text className="text-black/80 mt-1">
              Chúng tôi có thể chia sẻ dữ liệu cần thiết với: đối tác rạp chiếu,
              cổng thanh toán, nhà cung cấp analytics, dịch vụ lưu trữ, và cơ
              quan nhà nước theo yêu cầu pháp luật — theo thỏa thuận bảo mật phù
              hợp.
            </Text>
          </View>

          <View>
            <Text className="text-lg font-bold text-black">
              6. Lưu trữ & Bảo mật
            </Text>
            <Text className="text-black/80 mt-1">
              Dữ liệu được lưu trữ trên hạ tầng an toàn và chỉ giữ trong thời
              gian cần thiết cho mục đích đã nêu (hoặc theo yêu cầu pháp luật).
              Áp dụng biện pháp kỹ thuật và tổ chức để bảo vệ thông tin.
            </Text>
          </View>

          <View>
            <Text className="text-lg font-bold text-black">
              7. Quyền của bạn
            </Text>
            <Text className="text-black/80 mt-1">
              Bạn có quyền truy cập, cập nhật, xóa, hạn chế xử lý dữ liệu cá
              nhân, rút lại đồng ý (không ảnh hưởng hiệu lực trước đó), và khiếu
              nại đến cơ quan có thẩm quyền theo quy định pháp luật.
            </Text>
          </View>

          <View>
            <Text className="text-lg font-bold text-black">
              8. Trẻ vị thành niên
            </Text>
            <Text className="text-black/80 mt-1">
              Ứng dụng không hướng tới người dùng dưới 16 tuổi. Nếu phát hiện
              thu thập dữ liệu từ đối tượng này, chúng tôi sẽ xóa thông tin khỏi
              hệ thống trong khả năng hợp lý.
            </Text>
          </View>

          <View>
            <Text className="text-lg font-bold text-black">
              9. Chuyển dữ liệu ra nước ngoài
            </Text>
            <Text className="text-black/80 mt-1">
              Trong trường hợp cần thiết (ví dụ dùng dịch vụ đám mây), dữ liệu
              có thể được xử lý tại quốc gia khác với biện pháp bảo vệ phù hợp
              theo luật hiện hành.
            </Text>
          </View>

          <View>
            <Text className="text-lg font-bold text-black">
              10. Thay đổi chính sách
            </Text>
            <Text className="text-black/80 mt-1">
              Khi cập nhật chính sách, chúng tôi sẽ thay đổi ngày “Cập nhật lần
              cuối”. Một số thay đổi quan trọng có thể yêu cầu bạn đồng ý lại
              trong ứng dụng.
            </Text>
          </View>

          <View className="mt-2">
            <Text className="text-lg font-bold text-black">11. Liên hệ</Text>
            <Text className="text-black/80 mt-1">
              Email: privacy@cinemago.example • DPO (nếu có):
              dpo@cinemago.example
            </Text>
          </View>

          <Text className="text-black/50 text-xs mt-6">
            *Tài liệu này nhằm mục đích thông tin, không phải tư vấn pháp lý.
            Hãy tham khảo luật sư trước khi áp dụng chính thức.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
