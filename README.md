# NutriTrack

Ứng dụng mobile theo dõi dinh dưỡng theo bữa ăn. Người dùng có thể ghi nhật ký món ăn, theo dõi calo/protein và quản lý mục tiêu sức khỏe. Ứng dụng dùng Expo Router, Tamagui, Redux Toolkit và Supabase.

> Trạng thái: dự án đang hoàn thiện. Một số chức năng backend/phân phối cần cấu hình trên Supabase và Expo/EAS trước khi chạy đầy đủ.

## Tính năng hiện có

- Đăng ký, đăng nhập email/mật khẩu và đăng nhập Google qua Supabase Auth.
- Onboarding thu thập thông tin cá nhân sau khi đăng ký hoặc đăng nhập Google lần đầu.
- Dashboard theo dõi tổng calo, protein, carbohydrate, chất béo và các bữa ăn trong ngày.
- Nhật ký món ăn: tìm kiếm, lọc, thêm món, sửa/xóa món đã ghi nhận.
- Mục tiêu cân nặng và tính toán chỉ số dinh dưỡng cơ bản.
- Hồ sơ cá nhân, chỉnh sửa thông tin, đăng xuất và xóa tài khoản.
- Gợi ý món ăn bằng AI: lọc món từ bảng `foods`, gửi danh sách rút gọn cho Gemini, kiểm tra ID và có fallback khi AI lỗi.
- Lưu dữ liệu người dùng trên Supabase PostgreSQL với RLS.

## Công nghệ

- TypeScript, React Native, Expo `~58.0.25`, React `19.3.0`, React Native `0.88.1`.
- Expo Router `~58.0.31`.
- Tamagui `^3.3.0` cho UI và responsive layout.
- Redux Toolkit `^2.14.0` cho state ứng dụng.
- Supabase JS `^2.119.0` cho Auth và PostgreSQL.
- Axios `^1.21.0` cho các request API, bao gồm Gemini AI.
- Expo Secure Store/AsyncStorage và các package Expo được khai báo trong `package.json`.

## Cấu trúc chính

```text
nutrition-app/
├── app/                         # Route và màn hình Expo Router
│   ├── (tabs)/                  # Dashboard, diary, goal, profile
│   ├── _layout.tsx              # Provider và Stack layout gốc
│   ├── index.tsx                # Điều hướng theo trạng thái Auth/onboarding
│   ├── login.tsx
│   ├── register.tsx
│   └── onboarding.tsx
├── src/
│   ├── components/              # Component dùng chung
│   ├── hooks/                   # Hook Auth và meal suggestion
│   ├── services/                # Supabase, Axios, profile và AI service
│   ├── store/                   # Redux store/slice
│   ├── utils/                   # Tính toán và validation thuần
│   └── constants/               # Config và theme
├── database/
│   ├── database.sql             # Schema, trigger, policy và function
│   └── seed.sql                 # Dữ liệu demo tùy chọn
├── assets/
├── app.json
├── eas.json
├── tamagui.config.ts
└── package.json
```

## Các route chính

| Route | Mục đích |
| --- | --- |
| `/` | Kiểm tra session và điều hướng onboarding hoặc app chính |
| `/login` | Đăng nhập email/mật khẩu, Google, quên mật khẩu |
| `/register` | Tạo tài khoản |
| `/onboarding` | Hoàn thiện hồ sơ ban đầu |
| `/(tabs)` | Nhóm màn hình chính |
| `/(tabs)/index` | Dashboard và gợi ý món ăn |
| `/(tabs)/diary` | Nhật ký bữa ăn và tìm món |
| `/(tabs)/goal` | Mục tiêu và lịch sử cân nặng |
| `/(tabs)/profile` | Hồ sơ và cài đặt tài khoản |

## Supabase và dữ liệu

Schema được định nghĩa trong `database/database.sql`, gồm các bảng chính: `profiles`, `foods`, `daily_meals`, `weight_history`, `user_recipes`, `water_logs`, `user_reminders`, `user_favorite_foods`, `ai_nutrition_logs` và `user_devices`.

- `profiles` lưu thông tin và mục tiêu của người dùng.
- `foods` lưu món ăn cùng `id`, tên, calo, protein và các macro liên quan.
- `daily_meals` liên kết người dùng với món ăn theo ngày/bữa và khối lượng.
- RLS được cấu hình trong script SQL để giới hạn dữ liệu theo `auth.uid()`.
- Trigger `handle_new_user` tạo hồ sơ khi có user mới. Cần chạy script trên đúng Supabase project trước khi test.
- Chức năng xóa tài khoản gọi RPC `delete_user_account`; function này phải tồn tại trên Supabase.

## Gợi ý món ăn bằng AI

Luồng được triển khai trong `src/services/aiSuggestion.ts`, `src/utils/mealSuggestion.ts`, `src/hooks/useMealSuggestion.ts` và `src/components/MealSuggestionList.tsx`:

1. Lấy bữa ăn hôm nay và mục tiêu từ Redux/Supabase.
2. Tính calo/protein đã dùng và còn lại.
3. Loại món đã ăn hoặc vượt calo còn lại, xếp hạng theo protein còn thiếu và giới hạn danh sách ứng viên.
4. Gửi cho Gemini các trường tối thiểu `id`, tên, calo, protein.
5. Yêu cầu AI trả JSON `{"picks":[{"id":"...","reason":"..."}]}`.
6. Chỉ nhận ID có trong danh sách ứng viên; thông tin dinh dưỡng hiển thị luôn lấy lại từ CSDL.
7. Nếu AI lỗi, sai JSON hoặc hết quota, hiển thị tối đa 3 món đầu với ghi chú “gợi ý tự động”.

Model AI được đặt trong hằng số để dễ thay đổi. Tên model hiện tại: `gemini-3.8-flash` trong `src/services/aiSuggestion.ts`.

## Cấu hình môi trường

Tạo `.env` ở thư mục `nutrition-app/`, không commit file này:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
EXPO_PUBLIC_API_BASE_URL=<api-base-url-neu-co>
EXPO_PUBLIC_GEMINI_API_KEY=<gemini-api-key>
```

Các biến được đọc qua `src/constants/config.ts`, `src/services/supabase.ts` và service AI. `.gitignore` đã bỏ qua `.env` và `.env*.local`. Không đưa giá trị thật của key vào source code, README hoặc commit.

## Cài đặt và chạy

```bash
npm install
npm run start
```

Các script hiện có trong `package.json`:

```bash
npm run android
npm run ios
npm run web
```

Để chạy trên thiết bị thật, cài Expo Go, kết nối cùng mạng với máy phát triển và quét QR từ Expo CLI. Khi thay đổi biến môi trường, khởi động lại Expo bundler.

## Kiểm tra kiểu và build

```bash
npx tsc --noEmit
npm run web
```

Dự án hiện không khai báo script `lint` hoặc `test` riêng trong `package.json`; cần bổ sung quy trình kiểm thử nếu môn học yêu cầu.

Build EAS tham khảo:

```bash
npx eas build -p android --profile preview
npx eas build -p android --profile production
```

Chi tiết profile nằm trong `eas.json`. Repository GitHub chính thức: **CẦN XÁC NHẬN**.

## Lưu ý phát triển

- Không đổi schema hoặc policy Supabase khi chưa cập nhật `database/database.sql`.
- Không để AI trả thông tin dinh dưỡng làm nguồn dữ liệu chính; chỉ dùng ID hợp lệ rồi đọc món thật từ Supabase.
- `app.json` đang khai báo orientation `portrait`; tablet iOS được bật, còn hỗ trợ xoay ngang đầy đủ cần kiểm tra thêm trên thiết bị thật.
- `GeminiTestBox` hiện là thành phần kiểm tra được render trong luồng đăng nhập; cần xác nhận có muốn ẩn khi phát hành production hay không.
- Function `email_exists` được client sử dụng trong luồng quên mật khẩu nhưng cần xác nhận đã được tạo trên Supabase project.

## Tài liệu liên quan

- `database/database.sql`: schema, trigger và RLS.
- `database/seed.sql`: dữ liệu demo tùy chọn.
- `app.json`, `eas.json`: cấu hình Expo/EAS.
- `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/RULES.md`, `docs/TASKS.md`, `docs/PROGRESS.md`: tài liệu dự án và kế hoạch còn lại.
