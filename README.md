# 🎬 CinemaGo Mobile

> Ứng dụng đặt vé xem phim trên Mobile (React Native - Expo).

---

## 🚀 Hướng dẫn Cài đặt & Chạy dự án (Quick Start)

Nếu bạn đã là lập trình viên (đã có Node.js), hãy bỏ qua bước này và xuống phần 2. Nếu chưa, hãy làm theo từng bước:

###Cài đặt Node.js (Bắt buộc)
Ứng dụng chạy trên nền tảng JavaScript, cần Node.js phiên bản ổn định (LTS).
1.  Truy cập: [https://nodejs.org/](https://nodejs.org/)
2.  Tải phiên bản **LTS** (Recommended for Most Users) - *Khuyên dùng v20.x hoặc v22.x*.
3.  Cài đặt: Nhấn Next liên tục (Mặc định).
4.  Kiểm tra: Mở **Command Prompt (CMD)** hoặc Terminal và gõ:
    ```bash
    node -v
    # Kết quả hiện ra vd: v20.11.0 là thành công
    ```

### 1. Cài đặt môi trường (Setup)

Mở Terminal (hoặc CMD) tại thư mục muốn lưu dự án và chạy lần lượt các bước sau:

**Bước A: Tải code & Cài thư viện**

```bash
# 1. Clone dự án về máy
git clone <LINK_GIT_REPO_CUA_BAN>

# 2. Di chuyển vào thư mục dự án
cd cinemago-mobile

# 3. Cài đặt toàn bộ thư viện (Node modules)
npm install
```

**Bước B: Cấu hình IP & Biến môi trường (.env)**

Vì ứng dụng chạy trên điện thoại, bạn cần cung cấp **địa chỉ IP mạng LAN** của máy tính để điện thoại có thể kết nối được (không dùng `localhost`).

1. **Lấy địa chỉ IP:**
   - **Windows:** Mở CMD gõ lệnh `ipconfig`. Tìm dòng **IPv4 Address** (Ví dụ: `192.168.1.10`).
   - **Mac/Linux:** Mở Terminal gõ lệnh `ifconfig` (hoặc `ipconfig getifaddr en0`).

2. **Tạo file cấu hình:**
   - Tại thư mục gốc dự án, tạo một file mới tên là `.env`.
   - Copy nội dung dưới đây dán vào file `.env` và **thay số IP** bạn vừa tìm được:

```env
# Thay 192.168.1.X bằng IP máy tính của bạn
EXPO_PUBLIC_API_URL=(http://192.168.1):8000
```

**Bước C: Chạy dự án**

npx expo start

1. **Màn hình sẽ hiện ra QR code**
   - **Android**: Mở app Expo Go, chọn "Scan QR Code" và quét mã.
   - **iOS**: Mở Camera, quét mã và chọn mở bằng Expo Go.
