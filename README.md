# 🎬 CinemaGo Mobile

> Ứng dụng đặt vé xem phim trên Mobile (React Native - Expo).

---

## 🚀 Hướng dẫn Cài đặt & Chạy dự án (Quick Start)

Để chạy dự án này, máy tính cần có sẵn **Node.js** (v20+) và **Git**.

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
