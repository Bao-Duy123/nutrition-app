# NutriTrack - Ứng dụng Theo dõi Dinh dưỡng & Sức khỏe

Ứng dụng di động đa nền tảng (Cross-platform Mobile App) hỗ trợ người dùng tính toán calo, theo dõi dinh dưỡng hàng ngày và thiết lập mục tiêu cân nặng. Ứng dụng được xây dựng trên nền tảng React Native và Expo, tích hợp kiến trúc quản lý trạng thái hiện đại, giao diện tối ưu qua Tamagui và backend thời gian thực mạnh mẽ từ Supabase (PostgreSQL).

---

## 1. Công nghệ sử dụng

- **Ngôn ngữ & Framework**: TypeScript, React Native, Expo Project (hỗ trợ Expo Router cho điều hướng).
- **Giao diện & UI Kit**: Tamagui (Design System nhất quán, hiệu suất cao), hỗ trợ Responsive cho cả Tablet/iPad và Animation basic.
- **Quản lý State & Data Fetching**: Redux Toolkit, Axios để gọi API (RESTful) và Supabase Client.
- **Cơ sở dữ liệu & Xác thực**: Supabase (PostgreSQL), hỗ trợ Row Level Security (RLS) bảo mật dữ liệu cá nhân.
- **Tích hợp AI**: Hỗ trợ AI basic trong việc gợi ý thực đơn hoặc phân tích thói quen ăn uống.
- **Nền tảng kiểm thử**: Chạy được trên thiết bị thật (Real device) qua Expo Go.

---

## 2. Hướng dẫn Clone và Cài đặt

```bash
# Clone dự án từ GitHub (Thay link bằng repo thực tế của nhóm)
git clone https://github.com/Bao-Duy123/nutrition-app
cd nutrition-app

# Cài đặt toàn bộ thư viện (Node_modules)
npm install
```

### Bước 1: Khởi tạo Cơ sở dữ liệu (Supabase / PostgreSQL)
Dự án sử dụng Supabase làm Backend-as-a-Service. Vui lòng thiết lập CSDL theo các script SQL được cung cấp sẵn:
1. Đăng nhập Supabase và tạo Project mới.
2. Mở SQL Editor và chạy toàn bộ mã trong file `database/schema.sql` (File này bao gồm các bảng: profiles, weight_history, foods, daily_meals và các Trigger tự động, Policy RLS).
3. *(Tùy chọn)* Chạy file `database/seed.sql` để nạp dữ liệu từ điển các món ăn mẫu (Phở, Cơm tấm, Gạo lứt...) và dữ liệu test.

### Bước 2: Cấu hình biến môi trường (.env)
Tạo một file `.env` ở thư mục gốc của dự án (cùng cấp với `package.json`) và điền thông tin kết nối Supabase của bạn:

```env
# Lấy các thông tin này trong mục Project Settings -> API của Supabase
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### Bước 3: Chạy ứng dụng trên thiết bị thật

```bash
# Khởi động Expo Server
npx expo start
```
*Để test trên điện thoại (Real device):* Tải ứng dụng Expo Go (iOS/Android), kết nối chung mạng Wi-Fi với máy tính và quét mã QR hiển thị trên Terminal.

---

## 3. Tài khoản kiểm thử

Hệ thống yêu cầu đăng nhập để cá nhân hóa chỉ số. Có thể đăng ký tài khoản mới hoặc dùng tài khoản mẫu (nếu đã chạy `seed.sql`):

| Tài khoản (Email) | Mật khẩu | Dữ liệu mô phỏng |
| :--- | :--- | :--- |
| test@gmail.com | 12345678 | User: Nguyễn Thanh (Nam, 28 tuổi). Có sẵn dữ liệu vòng calo và lịch sử cân nặng. |

> **Lưu ý xác thực:** Dự án đã tắt tính năng "Confirm Email" trên Supabase để tiện cho việc chấm điểm và test luồng. Sinh viên/Giảng viên có thể gõ email bất kỳ để đăng ký và đăng nhập vào luồng chính ngay lập tức.

---

## 4. Danh sách Màn hình (14 Màn hình chính)

Ứng dụng tuân thủ kiến trúc chia nhỏ khoảng 10-15 màn hình, phân luồng thông minh qua Expo Router:

**Luồng Xác thực (Auth)**
- **Màn hình Chào mừng (Onboarding)**: Giới thiệu tính năng ứng dụng.
- **Màn hình Đăng nhập**: Xác thực qua Email/Password kết nối Auth Supabase.
- **Màn hình Đăng ký**: Tạo tài khoản mới, tự động kích hoạt Trigger tạo hồ sơ rỗng trong database.

**Luồng Ứng dụng chính (Bottom Tabs)**
- **Trang chủ (Home)**: Hiển thị vòng tròn đo lượng Calo tiêu thụ/còn lại trong ngày, biểu đồ thanh Macro (Carb, Protein, Fat) và tóm tắt bữa ăn. 
- **Nhật ký (Diary)**: Thanh tìm kiếm món ăn, danh sách món ăn hiển thị linh hoạt (Gần đây, Yêu thích, Tạo món). Hỗ trợ nút (+/-) để tính toán nhanh số lượng. 
- **Mục tiêu (Goals)**: Biểu đồ theo dõi cân nặng (Line Chart), tính toán Calo hàng ngày đề xuất dựa trên mục tiêu giảm/tăng cân. 
- **Cá nhân (Profile)**: Hiển thị thông tin người dùng (Avatar, Chiều cao, Cân nặng, Tuổi, ID), cài đặt nhắc nhở và Đăng xuất. 

**Luồng Tính năng phụ**
- **Màn hình Thêm món mới**: Cho phép tự nhập tên món và chỉ số dinh dưỡng (Tạo custom food bằng API/Basic AI).
- **Màn hình Chi tiết món ăn**: Cung cấp thông tin chi tiết vi chất.
- **Màn hình Cập nhật mục tiêu**: Chỉnh sửa số kg muốn đạt được và thời hạn.
- **Màn hình Thông số cơ thể (Body Stats)**: Chỉnh sửa chiều cao, cân nặng hiện tại.
- **Màn hình Lịch sử ăn uống**: Xem lại nhật ký của các ngày trước đó.
- **Màn hình Cài đặt ứng dụng**: Giao diện, ngôn ngữ.
- **Màn hình Hỗ trợ AI**: Chat/Gợi ý từ AI basic để đạt mục tiêu calo.

---

## 5. Kiến trúc Database & Phân quyền bảo mật (Supabase)

- **PostgreSQL Database**: Sử dụng thiết kế Schema tối ưu với 4 bảng: `profiles`, `weight_history`, `foods`, `daily_meals`.
- **Row Level Security (RLS)**: Bật RLS 100% trên các bảng cá nhân (`profiles`, `daily_meals`). Đảm bảo nguyên tắc: Người dùng chỉ có thể ĐỌC, THÊM, SỬA dữ liệu của chính tài khoản mình đang đăng nhập (`auth.uid() = id`).
- **Database Triggers**: Tự động lắng nghe sự kiện từ `auth.users` của Supabase. Khi một tài khoản mới đăng ký, Trigger `handle_new_user` tự động tạo một record rỗng tương ứng bên bảng `profiles` nhằm chống lỗi bất đồng bộ.

---

## 6. Cấu trúc Thư mục và File chính

```plaintext
nutrition-app/
├── app/                      # Routing tự động của Expo Router
│   ├── (tabs)/               # Nhóm các màn hình có thanh Tab bar (Home, Nhật ký, Mục tiêu, Cá nhân)
│   ├── _layout.tsx           # Layout gốc bọc Redux và Tamagui Provider
│   ├── login.tsx             # Trang Đăng nhập
│   └── register.tsx          # Trang Đăng ký
├── src/                      
│   ├── components/           # UI Components tái sử dụng xây dựng từ Tamagui (FoodCard, MacroRing)
│   ├── store/                # Redux Toolkit Store (authSlice, dietSlice)
│   ├── services/             # Cấu hình API, Supabase Client và Axios
│   ├── utils/                # Các hàm tính toán Calo/TDEE
│   └── constants/            # Các hằng số, theme màu sắc
├── assets/                   # Chứa tài nguyên tĩnh (images, fonts, icons)
├── database/                 # Chứa các file SQL khởi tạo cấu trúc và dữ liệu
├── tamagui.config.ts         # Cấu hình Design System của Tamagui
└── package.json              # Quản lý dependencies
```

---

## 7. Phân phối & Đóng gói (Deployment)

Dự án có thể build thành file cài đặt độc lập (APK/AAB cho Android, IPA cho iOS) và phân phối qua internet (không bắt buộc đưa lên Store). 

Tiến hành build thông qua EAS (Expo Application Services):

```bash
# Cài đặt EAS CLI
npm install -g eas-cli

# Đăng nhập vào Expo
eas login

# Khởi tạo và tiến hành Build file APK cho Android
eas build -p android --profile preview
```

*(Link tải file cài đặt APK sẽ được cung cấp trên Expo Dashboard sau khi quá trình build hoàn tất để chia sẻ qua Internet)*
