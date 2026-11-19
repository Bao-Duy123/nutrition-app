-- ==================================================================================
-- NUTRITRACK - SEED SCRIPT NẠP DỮ LIỆU KIỂM THỬ (SEED.SQL)
-- Dùng để nạp/re-seed dữ liệu mẫu cho tài khoản test@gmail.com và các tài khoản demo
-- Không xóa cấu trúc bảng (DROP TABLE), có thể chạy lại nhiều lần an toàn (Idempotent)
-- ==================================================================================

-- ==================================================================================
-- PHẦN 4: SEED KHO 166 MÓN ĂN QUÁN VIỆT & NGUYÊN LIỆU THÔ CÂN TIỂU LY
-- ==================================================================================
INSERT INTO public.foods (name, food_type, category, region, serving_size, calories, protein, carbs, fat, fiber, sodium, special_label, special_calories, special_protein, special_carbs, special_fat, icon, image_url, toppings)
VALUES
  ('Phở Bò Tái Nạm', 'restaurant_dish', 'pho', 'Miền Bắc', '1 Tô tiêu chuẩn (Hà Nội)', 520, 32.0, 58.0, 16.0, 2.5, 1850, 'Tô Lớn / Đặc Biệt (Nhiều thịt)', 730, 44.0, 80.0, 22.0, '🍜', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&q=80', '[{"id": "trung_tran", "name": "Trứng trần lòng đào (1 quả)", "calories": 75, "protein": 6.0, "carbs": 0.5, "fat": 5.0, "icon": "💧", "subtitle": "+6g protein lòng đào", "colorType": "peach"}, {"id": "quay_gion", "name": "Quẩy giòn giòn (2 chiếc)", "calories": 120, "protein": 2.5, "carbs": 16.0, "fat": 5.5, "icon": "🥐", "subtitle": "+16g carb giòn tan", "colorType": "purple"}, {"id": "nuoc_beo", "name": "Nước béo hành hoa / Chén tiết", "calories": 110, "protein": 2.0, "carbs": 0.0, "fat": 11.0, "icon": "🥣", "subtitle": "+11g chất béo tự nhiên", "colorType": "pink"}, {"id": "thit_them", "name": "Thịt bò tái / nạm thêm (50g)", "calories": 105, "protein": 16.0, "carbs": 0.0, "fat": 4.5, "icon": "🥩", "subtitle": "+16g protein nạc thơm", "colorType": "mint"}, {"id": "banh_them", "name": "Bánh phở thêm (100g)", "calories": 140, "protein": 2.5, "carbs": 31.0, "fat": 0.3, "icon": "🍜", "subtitle": "+31g carb năng lượng", "colorType": "blue"}]'::jsonb),
  ('Phở Bò Tái Nạm (Đặc biệt)', 'restaurant_dish', 'pho', 'Miền Bắc', '1 Tô lớn nhiều thịt nạc', 730, 44.0, 80.0, 22.0, 3.0, 2200, 'Tô Siêu Đặc Biệt + Xí quách', 920, 58.0, 85.0, 32.0, '🍜', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&q=80', '[{"id": "trung_tran", "name": "Trứng trần (1 quả)", "calories": 75, "protein": 6.0, "carbs": 0.5, "fat": 5.0, "icon": "💧", "subtitle": "+6g protein lòng đào", "colorType": "peach"}, {"id": "quay_gion", "name": "Quẩy giòn (2 chiếc)", "calories": 120, "protein": 2.5, "carbs": 16.0, "fat": 5.5, "icon": "🥐", "subtitle": "+16g carb giòn tan", "colorType": "purple"}, {"id": "thit_them", "name": "Bò tái thêm (50g)", "calories": 105, "protein": 16.0, "carbs": 0.0, "fat": 4.5, "icon": "🥩", "subtitle": "+16g protein nạc", "colorType": "mint"}]'::jsonb),
  ('Phở Bò Tái Lăn', 'restaurant_dish', 'pho', 'Miền Bắc', '1 Tô chuẩn thơm tỏi xào', 620, 34.0, 60.0, 26.0, 2.2, 1980, 'Tô Lớn Gấp Đôi Bò Lăn', 840, 48.0, 78.0, 34.0, '🍜', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&q=80', '[]'::jsonb),
  ('Phở Bò Tái Gầu Giòn', 'restaurant_dish', 'pho', 'Miền Bắc', '1 Tô tiêu chuẩn', 580, 30.0, 58.0, 22.0, 2.0, 1820, 'Tô Lớn Nhiều Gầu', 780, 40.0, 76.0, 32.0, '🍜', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&q=80', '[]'::jsonb),
  ('Phở Bò Bắp Hoa', 'restaurant_dish', 'pho', 'Miền Bắc', '1 Tô chuẩn bắp giòn', 540, 35.0, 58.0, 14.0, 2.1, 1780, 'Tô Đặc Biệt Bắp Hoa', 720, 46.0, 75.0, 19.0, '🍜', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&q=80', '[]'::jsonb),
  ('Phở Gà Ta Lá Chanh', 'restaurant_dish', 'pho', 'Miền Bắc', '1 Tô chuẩn thanh ngọt', 460, 30.0, 56.0, 12.0, 1.8, 1650, 'Tô Gà Đùi Đặc Biệt', 630, 42.0, 72.0, 18.0, '🍜', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&q=80', '[]'::jsonb),
  ('Phở Gà Đùi Rút Xương', 'restaurant_dish', 'pho', 'Toàn quốc', '1 Tô thịt đùi da giòn', 520, 34.0, 56.0, 16.0, 1.8, 1720, 'Tô Lớn Kèm Lòng Mề Trứng Non', 710, 46.0, 74.0, 24.0, '🍜', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&q=80', '[]'::jsonb),
  ('Phở Bò Sốt Vang', 'restaurant_dish', 'pho', 'Miền Bắc', '1 Tô chuẩn sốt vang đỏ', 610, 34.0, 62.0, 24.0, 2.6, 1950, 'Tô Lớn Nhiều Bò Gân', 820, 46.0, 82.0, 32.0, '🍜', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&q=80', '[]'::jsonb),
  ('Phở Cuốn Bò Hà Nội', 'restaurant_dish', 'pho', 'Miền Bắc', '1 Đĩa (8 cuốn)', 510, 26.0, 60.0, 17.0, 3.2, 1420, 'Đĩa Lớn (12 cuốn)', 760, 38.0, 88.0, 25.0, '🥟', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Phở Xào Bò Rau Cải', 'restaurant_dish', 'pho', 'Miền Bắc', '1 Đĩa xào mềm thơm tỏi', 680, 32.0, 74.0, 26.0, 3.5, 1890, 'Đĩa Lớn Đặc Biệt Thêm Bò', 890, 44.0, 92.0, 35.0, '🍲', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&q=80', '[]'::jsonb),
  ('Phở Trộn Gà Xé Chua Ngọt', 'restaurant_dish', 'pho', 'Miền Bắc', '1 Tô trộn kèm lạc rang', 530, 29.0, 68.0, 15.0, 2.4, 1540, 'Tô Lớn Gà Đùi Da Giòn', 710, 39.0, 84.0, 22.0, '🥗', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&q=80', '[]'::jsonb),
  ('Phở Khô Gia Lai (Phở Hai Tô)', 'restaurant_dish', 'pho', 'Tây Nguyên', '1 Khẩu phần (Tô khô + Tô súp)', 590, 33.0, 70.0, 18.0, 2.6, 1920, 'Suất Lớn Bò Viên & Tái', 790, 44.0, 86.0, 25.0, '🍜', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&q=80', '[]'::jsonb),
  ('Cơm Tấm Sườn Bì Chả', 'restaurant_dish', 'com', 'Miền Nam', '1 Dĩa chuẩn (Sài Gòn)', 650, 34.0, 75.0, 22.0, 2.8, 1640, 'Cơm Tấm Sườn Cây Đặc Biệt + Ốp la', 880, 48.0, 95.0, 32.0, '🍱', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[{"id": "op_la", "name": "Trứng ốp la lòng đào (1 quả)", "calories": 90, "protein": 6.5, "carbs": 0.5, "fat": 7.0, "icon": "🍳", "subtitle": "+6.5g protein lòng đào", "colorType": "peach"}, {"id": "cha_trung", "name": "Chả trứng hấp thịt (1 miếng)", "calories": 130, "protein": 8.0, "carbs": 4.0, "fat": 9.0, "icon": "🥮", "subtitle": "+8g protein • béo ngậy", "colorType": "purple"}, {"id": "suon_them", "name": "Sườn nướng thêm (1 miếng)", "calories": 240, "protein": 22.0, "carbs": 5.0, "fat": 15.0, "icon": "🥩", "subtitle": "+22g protein nạc thơm", "colorType": "mint"}, {"id": "bi_them", "name": "Bì heo trộn thính (30g)", "calories": 85, "protein": 10.0, "carbs": 1.0, "fat": 4.5, "icon": "🥓", "subtitle": "+10g protein giòn dai", "colorType": "pink"}, {"id": "com_them", "name": "Cơm thêm (1 chén)", "calories": 130, "protein": 2.7, "carbs": 28.0, "fat": 0.3, "icon": "🍚", "subtitle": "+28g carb", "colorType": "blue"}, {"id": "canh_them", "name": "Canh súp canh rong biển / khổ qua", "calories": 45, "protein": 2.0, "carbs": 4.0, "fat": 2.0, "icon": "🥣", "subtitle": "Thanh nhiệt ít calo", "colorType": "mint"}]'::jsonb),
  ('Cơm Tấm Sườn Cây Đặc Biệt', 'restaurant_dish', 'com', 'Miền Nam', '1 Dĩa lớn sườn cây nướng than hoa', 880, 48.0, 95.0, 32.0, 3.0, 1950, 'Combo Khổng Lồ Sườn Cây + Chả Cua', 1080, 59.0, 110.0, 42.0, '🍱', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Cơm Gà Xối Mỡ Da Giòn', 'restaurant_dish', 'com', 'Miền Nam', '1 Dĩa góc tư đùi gà giòn rụm', 740, 38.0, 82.0, 28.0, 2.0, 1820, 'Dĩa Đùi Lớn Thêm Canh Rong Biển', 920, 46.0, 96.0, 36.0, '🍗', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Cơm Rang Dưa Bò Hà Nội', 'restaurant_dish', 'com', 'Miền Bắc', '1 Dĩa rang giòn dưa chua bò mềm', 680, 28.0, 85.0, 24.0, 3.2, 1940, 'Dĩa Lớn Thêm Bò Xào', 880, 42.0, 98.0, 32.0, '🍚', 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=500&q=80', '[]'::jsonb),
  ('Cơm Sườn Nướng Mật Ong', 'restaurant_dish', 'com', 'Toàn quốc', '1 Dĩa chuẩn sườn óng mật', 620, 32.0, 74.0, 20.0, 2.4, 1580, 'Dĩa 2 Sườn Nướng Cỡ Lớn', 840, 48.0, 85.0, 31.0, '🍱', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Cơm Gà Hải Nam Luộc', 'restaurant_dish', 'com', 'Toàn quốc', '1 Dĩa cơm dẻo nấu nước luộc gà', 590, 36.0, 76.0, 15.0, 1.8, 1490, 'Dĩa Lớn Thịt Gà Đùi', 760, 46.0, 88.0, 22.0, '🍗', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Cơm Gà Hội An Xé Phay', 'restaurant_dish', 'com', 'Miền Trung', '1 Dĩa chuẩn hành tây rau răm', 560, 35.0, 74.0, 13.0, 2.5, 1420, 'Dĩa Đặc Biệt Thêm Lòng Mề', 730, 45.0, 85.0, 20.0, '🍗', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Cơm Chiên Dương Châu', 'restaurant_dish', 'com', 'Toàn quốc', '1 Dĩa lạp xưởng tôm đậu hà lan', 640, 25.0, 82.0, 23.0, 3.0, 1780, 'Dĩa Lớn Nhiều Tôm Thịt', 830, 35.0, 96.0, 31.0, '🍚', 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=500&q=80', '[]'::jsonb),
  ('Cơm Thố Bò Xào Cần Tỏi', 'restaurant_dish', 'com', 'Miền Bắc', '1 Thố gang giữ nhiệt', 630, 33.0, 78.0, 19.0, 3.2, 1690, 'Thố Lớn Thêm Bắp Bò', 820, 45.0, 90.0, 28.0, '🍲', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Cơm Niêu Cá Kho Tộ Nam Bộ', 'restaurant_dish', 'com', 'Miền Nam', '1 Niêu cơm cháy + 1 Tộ cá kho', 610, 30.0, 80.0, 18.0, 2.2, 1880, 'Set Đặc Biệt Kèm Canh Chua Cá', 790, 40.0, 92.0, 26.0, '🐟', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Cơm Tấm Ba Chỉ Nướng Sả', 'restaurant_dish', 'com', 'Miền Nam', '1 Dĩa chuẩn thịt ba chỉ giòn rụm', 690, 28.0, 75.0, 29.0, 2.2, 1650, 'Dĩa Lớn Kèm Ốp La + Chả', 910, 40.0, 92.0, 41.0, '🍱', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Cơm Chiên Hải Sản Trứng Muối', 'restaurant_dish', 'com', 'Toàn quốc', '1 Dĩa tôm mực sốt trứng muối bùi béo', 670, 30.0, 84.0, 22.0, 2.5, 1820, 'Dĩa Lớn Nhiều Hải Sản', 860, 42.0, 96.0, 31.0, '🦐', 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=500&q=80', '[]'::jsonb),
  ('Cơm Cháy Kho Quẹt Nam Bộ', 'restaurant_dish', 'com', 'Miền Nam', '1 Mẹt cơm cháy đáy nồi + rau luộc', 580, 18.0, 86.0, 18.0, 5.4, 1920, 'Mẹt Lớn Thêm Tóp Mỡ Tôm Khô', 780, 28.0, 98.0, 29.0, '🍚', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Cơm Bò Lúc Lắc Khoai Tây Chiên', 'restaurant_dish', 'com', 'Toàn quốc', '1 Dĩa bò mềm bơ tỏi + khoai chiên', 760, 38.0, 78.0, 31.0, 3.8, 1750, 'Dĩa Lớn 200g Bò Thăn Úc', 980, 52.0, 88.0, 42.0, '🥩', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Bún Chả Hà Nội', 'restaurant_dish', 'bun', 'Miền Bắc', '1 Suất tiêu chuẩn (Chả viên + Chả miếng)', 580, 28.0, 70.0, 20.0, 3.4, 1680, 'Suất Lớn Kèm 2 Nem Rán Giòn', 780, 38.0, 88.0, 28.0, '🍲', 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&q=80', '[{"id": "nem_ran", "name": "Nem rán giòn thịt nấm (1 chiếc)", "calories": 140, "protein": 7.0, "carbs": 10.0, "fat": 8.5, "icon": "🥟", "subtitle": "+7g protein nem cuốn", "colorType": "peach"}, {"id": "cha_vien", "name": "Chả viên nướng than thêm (3 viên)", "calories": 150, "protein": 12.0, "carbs": 2.0, "fat": 10.0, "icon": "🍢", "subtitle": "+12g protein nướng than", "colorType": "mint"}, {"id": "cha_mieng", "name": "Chả ba chỉ nướng thêm (50g)", "calories": 180, "protein": 10.0, "carbs": 1.0, "fat": 15.0, "icon": "🥩", "subtitle": "Đậm đà béo ngậy", "colorType": "pink"}, {"id": "bun_them", "name": "Bún tươi thêm (1 đĩa)", "calories": 120, "protein": 2.5, "carbs": 28.0, "fat": 0.3, "icon": "🍜", "subtitle": "+28g carb thanh mát", "colorType": "blue"}]'::jsonb),
  ('Bún Bò Huế Chuẩn Vị', 'restaurant_dish', 'bun', 'Miền Trung', '1 Tô nạm chả cua tiết heo', 560, 32.0, 64.0, 18.0, 3.0, 2100, 'Tô Lớn Đầy Đủ Giò Heo & Gân', 780, 44.0, 76.0, 30.0, '🍲', 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&q=80', '[]'::jsonb),
  ('Bún Bò Huế Đặc Biệt', 'restaurant_dish', 'bun', 'Miền Trung', '1 Tô lớn bắp bò móng giò chả cua', 780, 44.0, 76.0, 30.0, 3.5, 2350, 'Tô Khổng Lồ Kèm Chén Tiết Huyết', 950, 56.0, 85.0, 38.0, '🍲', 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&q=80', '[]'::jsonb),
  ('Bún Đậu Mắm Tôm Mẹt Tiêu Chuẩn', 'restaurant_dish', 'bun', 'Miền Bắc', '1 Mẹt đậu rán giòn thịt chân giò', 650, 32.0, 68.0, 26.0, 3.2, 1850, 'Mẹt Thập Cẩm Đầy Đủ Dồi Sụn Nem Rán', 890, 44.0, 80.0, 42.0, '🥢', 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&q=80', '[{"id": "doi_sun", "name": "Dồi sụn rán giòn (4 miếng)", "calories": 165, "protein": 9.0, "carbs": 6.0, "fat": 11.0, "icon": "🌭", "subtitle": "+9g protein • sụn giòn", "colorType": "purple"}, {"id": "nem_ran", "name": "Nem rán giòn rụm (2 chiếc)", "calories": 180, "protein": 7.0, "carbs": 12.0, "fat": 11.0, "icon": "🥟", "subtitle": "+12g carb giòn tan", "colorType": "peach"}, {"id": "cha_com", "name": "Chả cốm chiên thơm (2 miếng)", "calories": 145, "protein": 8.0, "carbs": 10.0, "fat": 7.5, "icon": "🍘", "subtitle": "+8g protein dẻo thơm", "colorType": "mint"}, {"id": "thit_luoc", "name": "Thịt chân giò luộc (50g)", "calories": 125, "protein": 11.0, "carbs": 0.0, "fat": 9.0, "icon": "🥩", "subtitle": "+11g protein nạc mỡ", "colorType": "pink"}, {"id": "dau_ran", "name": "Đậu phụ rán giòn lướt ván (4 miếng)", "calories": 110, "protein": 8.0, "carbs": 2.0, "fat": 7.5, "icon": "🧈", "subtitle": "+8g đạm thực vật", "colorType": "blue"}]'::jsonb),
  ('Bún Đậu Thập Cẩm Đầy Đủ', 'restaurant_dish', 'bun', 'Miền Bắc', '1 Mẹt lớn đầy đủ chả cốm nem dồi', 890, 44.0, 80.0, 42.0, 4.0, 2200, 'Mẹt Đôi Siêu To Khổng Lồ', 1250, 62.0, 115.0, 58.0, '🥢', 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&q=80', '[]'::jsonb),
  ('Bún Riêu Cua Bắp Bò Giò Heo', 'restaurant_dish', 'bun', 'Miền Bắc', '1 Tô đầy đủ riêu cua đậu rán', 540, 29.0, 62.0, 17.0, 3.6, 1890, 'Tô Lớn Thêm Bắp Bò & Móng Giò', 740, 42.0, 74.0, 28.0, '🍲', 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&q=80', '[]'::jsonb),
  ('Bún Thịt Nướng Chả Giò', 'restaurant_dish', 'bun', 'Miền Nam', '1 Tô bún thịt nướng than hoa', 570, 28.0, 72.0, 18.0, 3.8, 1560, 'Tô Lớn 2 Chả Giò + Nem Nướng', 780, 38.0, 88.0, 28.0, '🥗', 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&q=80', '[]'::jsonb),
  ('Bún Mắm Miền Tây Hải Sản Heo Quay', 'restaurant_dish', 'bun', 'Miền Nam', '1 Tô nước lèo mắm cá linh tôm mực', 630, 36.0, 68.0, 21.0, 4.5, 2400, 'Tô Lớn Thêm Heo Quay Giòn Bì', 840, 48.0, 80.0, 32.0, '🐟', 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&q=80', '[]'::jsonb),
  ('Bún Cá Cay Hải Phòng', 'restaurant_dish', 'bun', 'Miền Bắc', '1 Tô cá rán giòn lòng cá chả cá', 510, 31.0, 65.0, 13.0, 2.8, 1820, 'Tô Lớn Thêm Dạ Dày Cá Giòn', 690, 42.0, 78.0, 19.0, '🐟', 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&q=80', '[]'::jsonb),
  ('Bún Chả Cá Quy Nhơn', 'restaurant_dish', 'bun', 'Miền Trung', '1 Tô chả cá hấp & chiên thanh ngọt', 480, 28.0, 66.0, 12.0, 2.5, 1750, 'Tô Lớn Thêm Đầu Cá Thu', 660, 39.0, 78.0, 18.0, '🍲', 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&q=80', '[]'::jsonb),
  ('Bún Thang Phố Cổ Hà Nội', 'restaurant_dish', 'bun', 'Miền Bắc', '1 Tô gà xé giò lụa trứng chỉ củ cải', 450, 29.0, 60.0, 10.0, 2.1, 1620, 'Tô Lớn Nhiều Gà Ta & Giò', 610, 39.0, 72.0, 15.0, '🍲', 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&q=80', '[]'::jsonb),
  ('Bún Bò Nam Bộ Trộn Chua Ngọt', 'restaurant_dish', 'bun', 'Miền Nam', '1 Tô bún trộn bò xào tỏi đậu phộng', 520, 30.0, 72.0, 12.0, 3.5, 1450, 'Tô Lớn Thêm Bò Nạc', 710, 42.0, 86.0, 18.0, '🥗', 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&q=80', '[]'::jsonb),
  ('Bún Ốc Chuối Đậu Nóng Hổi', 'restaurant_dish', 'bun', 'Miền Bắc', '1 Tô ốc nhồi chuối xanh đậu rán', 490, 24.0, 65.0, 14.0, 4.2, 1780, 'Tô Lớn Thêm Giò Tai Giòn', 680, 34.0, 78.0, 22.0, '🍲', 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&q=80', '[]'::jsonb),
  ('Bún Mọc Dọc Mùng Sườn Non', 'restaurant_dish', 'bun', 'Miền Bắc', '1 Tô mọc nấm hương sườn heo mềm', 520, 31.0, 64.0, 14.0, 3.0, 1690, 'Tô Lớn Thêm Chả Quế', 710, 42.0, 76.0, 22.0, '🍲', 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&q=80', '[]'::jsonb),
  ('Hủ Tiếu Nam Vang Chuẩn Vị', 'restaurant_dish', 'mi_hu_tieu', 'Miền Nam', '1 Tô nước tôm thịt bằm gan cật', 490, 26.0, 65.0, 14.0, 2.4, 1820, 'Tô Lớn Thêm Xí Quách & Tôm Càng', 750, 42.0, 85.0, 25.0, '🥣', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80', '[{"id": "trung_cut", "name": "Trứng cút luộc (3 quả)", "calories": 48, "protein": 4.0, "carbs": 0.2, "fat": 3.5, "icon": "🥚", "subtitle": "+4g protein bùi béo", "colorType": "peach"}, {"id": "tom_them", "name": "Tôm tươi thêm (3 con)", "calories": 65, "protein": 13.0, "carbs": 0.5, "fat": 0.8, "icon": "🦐", "subtitle": "+13g protein thuần khiết", "colorType": "mint"}, {"id": "hoanh_thanh", "name": "Hoành thánh chiên giòn (2 cái)", "calories": 120, "protein": 4.0, "carbs": 12.0, "fat": 6.5, "icon": "🥟", "subtitle": "+12g carb giòn rụm", "colorType": "purple"}, {"id": "xa_xiu", "name": "Xá xíu nạc thêm (50g)", "calories": 130, "protein": 14.0, "carbs": 2.0, "fat": 7.5, "icon": "🥩", "subtitle": "+14g protein đậm đà", "colorType": "pink"}, {"id": "hu_tieu_them", "name": "Hủ tiếu thêm (1 vắt)", "calories": 140, "protein": 3.0, "carbs": 32.0, "fat": 0.5, "icon": "🥣", "subtitle": "+32g carb năng lượng", "colorType": "blue"}]'::jsonb),
  ('Hủ Tiếu Nam Vang Khô Sốt Đặc Biệt', 'restaurant_dish', 'mi_hu_tieu', 'Miền Nam', '1 Tô khô trộn sốt kèm chén súp tôm', 540, 30.0, 68.0, 16.0, 2.5, 1890, 'Tô Khô Đặc Biệt Gấp Đôi Thịt Bằm', 780, 44.0, 86.0, 26.0, '🥣', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80', '[]'::jsonb),
  ('Bánh Canh Cua Giò Heo', 'restaurant_dish', 'mi_hu_tieu', 'Miền Nam', '1 Tô nước súp sệt thịt cua móng giò', 580, 35.0, 62.0, 21.0, 2.2, 1960, 'Tô Lớn Cua Nguyên Càng', 810, 48.0, 76.0, 29.0, '🦀', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80', '[]'::jsonb),
  ('Bánh Canh Cá Lóc Bột Gạo Huế', 'restaurant_dish', 'mi_hu_tieu', 'Miền Trung', '1 Tô cá lóc rim cay bột gạo dẻo', 460, 28.0, 64.0, 10.0, 2.0, 1680, 'Tô Lớn Thêm Đầu Cá Lóc', 640, 38.0, 78.0, 16.0, '🐟', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80', '[]'::jsonb),
  ('Bánh Canh Ghẹ Nha Trang', 'restaurant_dish', 'mi_hu_tieu', 'Miền Trung', '1 Tô ghẹ tươi bóc vỏ nước dùng ngọt', 520, 32.0, 60.0, 14.0, 2.0, 1790, 'Tô Nguyên Con Ghẹ Biển', 730, 46.0, 72.0, 20.0, '🦀', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80', '[]'::jsonb),
  ('Hủ Tiếu Mực Vũng Tàu Tươi Giòn', 'restaurant_dish', 'mi_hu_tieu', 'Miền Nam', '1 Tô mực tươi luộc ngọt nước lèo', 450, 28.0, 62.0, 9.0, 2.2, 1640, 'Tô Lớn Mực Trứng Cỡ Đại', 630, 40.0, 74.0, 15.0, '🦑', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80', '[]'::jsonb),
  ('Hủ Tiếu Bò Kho Sài Gòn', 'restaurant_dish', 'mi_hu_tieu', 'Miền Nam', '1 Tô bò kho sánh thơm hoa hồi', 620, 35.0, 70.0, 20.0, 3.5, 2100, 'Tô Lớn Gân Bò Giòn & Nạm', 840, 48.0, 85.0, 29.0, '🥣', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80', '[]'::jsonb),
  ('Mì Hoành Thánh Xá Xíu Tôm Thịt', 'restaurant_dish', 'mi_hu_tieu', 'Toàn quốc', '1 Tô mì trứng sợi dai viên hoành thánh', 510, 27.0, 66.0, 14.0, 2.6, 1780, 'Tô Lớn 8 Viên Hoành Thánh', 710, 38.0, 82.0, 22.0, '🥟', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80', '[]'::jsonb),
  ('Mì Quảng Tôm Thịt Trứng Cút', 'restaurant_dish', 'mi_hu_tieu', 'Miền Trung', '1 Tô sợi mì vàng nước xăm xắp', 530, 31.0, 64.0, 15.0, 3.4, 1690, 'Tô Lớn Thêm Gà Ta Rút Xương', 730, 43.0, 78.0, 23.0, '🍲', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80', '[]'::jsonb),
  ('Miến Gà Ta Nấm Hương Phố Cổ', 'restaurant_dish', 'mi_hu_tieu', 'Miền Bắc', '1 Tô miến dong trong suốt gà ngọt', 440, 30.0, 58.0, 9.0, 2.2, 1580, 'Tô Lớn Đùi Gà & Mọc Nấm', 620, 42.0, 72.0, 16.0, '🍲', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80', '[]'::jsonb),
  ('Miến Lươn Xào Giòn Nghệ An', 'restaurant_dish', 'mi_hu_tieu', 'Miền Trung', '1 Đĩa lươn chiên giòn xào miến dong', 550, 27.0, 65.0, 19.0, 3.0, 1720, 'Đĩa Lớn Gấp Đôi Lươn Giòn', 760, 39.0, 80.0, 27.0, '🍲', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80', '[]'::jsonb),
  ('Mì Vịt Tiềm Thuốc Bắc Gia Truyền', 'restaurant_dish', 'mi_hu_tieu', 'Miền Nam', '1 Tô đùi vịt tiềm thảo mộc nấm đông cô', 710, 42.0, 68.0, 28.0, 3.8, 1980, 'Tô Đại Đùi Vịt Góc Tư Chiên Giòn', 940, 54.0, 82.0, 38.0, '🍗', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80', '[]'::jsonb),
  ('Bánh Mì Thịt Nguội Pate Truyền Thống', 'restaurant_dish', 'banh_mi', 'Toàn quốc', '1 Ổ chuẩn truyền thống (Pate, Bơ, Chả lụa)', 430, 18.0, 48.0, 19.0, 2.5, 1280, 'Ổ Đặc Biệt Gấp Đôi Pate & Thịt', 610, 28.0, 55.0, 28.0, '🥖', 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=500&q=80', '[{"id": "pate_them", "name": "Pate gan heo béo thêm (30g)", "calories": 115, "protein": 4.5, "carbs": 2.0, "fat": 10.0, "icon": "🥫", "subtitle": "+10g chất béo thơm bùi", "colorType": "pink"}, {"id": "op_la", "name": "Trứng ốp la (1 quả)", "calories": 90, "protein": 6.5, "carbs": 0.5, "fat": 7.0, "icon": "🍳", "subtitle": "+6.5g protein lòng đào", "colorType": "peach"}, {"id": "cha_lua", "name": "Chả lụa / Xúc xích nạc (40g)", "calories": 95, "protein": 7.5, "carbs": 1.5, "fat": 6.5, "icon": "🥓", "subtitle": "+7.5g protein nạc", "colorType": "mint"}, {"id": "bo_thom", "name": "Bơ trứng gà thơm (15g)", "calories": 90, "protein": 0.3, "carbs": 0.5, "fat": 10.0, "icon": "🧈", "subtitle": "Tăng độ béo ngậy mềm vỏ", "colorType": "purple"}, {"id": "pho_mai", "name": "Phô mai lát Cheddar", "calories": 75, "protein": 5.0, "carbs": 0.3, "fat": 6.0, "icon": "🧀", "subtitle": "+5g protein canxi", "colorType": "blue"}]'::jsonb),
  ('Bánh Mì Chảo Đầy Đủ (Pate, Bò, Trứng)', 'restaurant_dish', 'banh_mi', 'Toàn quốc', '1 Chảo nóng xèo xèo + 1 Bánh mì', 670, 34.0, 56.0, 34.0, 3.0, 1820, 'Chảo Lớn Thêm Bò Né & Xúc Xích Phô Mai', 890, 46.0, 68.0, 46.0, '🍳', 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=500&q=80', '[]'::jsonb),
  ('Bánh Mì Xíu Mại Sốt Cà Chua (Đà Lạt)', 'restaurant_dish', 'banh_mi', 'Tây Nguyên', '1 Chén xíu mại nóng + 1 Bánh mì giòn', 480, 22.0, 52.0, 20.0, 2.8, 1450, 'Chén Lớn Thêm Da Heo & Chả Lụa', 660, 32.0, 62.0, 29.0, '🥖', 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=500&q=80', '[]'::jsonb),
  ('Bánh Mì Thịt Nướng Bơ Sả Sa Tế', 'restaurant_dish', 'banh_mi', 'Toàn quốc', '1 Ổ thịt xiên nướng than hoa', 460, 23.0, 50.0, 18.0, 2.6, 1390, 'Ổ Lớn 3 Xiên Thịt Nướng', 640, 33.0, 58.0, 26.0, '🥖', 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=500&q=80', '[]'::jsonb),
  ('Bánh Mì Heo Quay Giòn Bì Dưa Chua', 'restaurant_dish', 'banh_mi', 'Miền Nam', '1 Ổ thịt heo quay nổ bì rụm rụm', 520, 22.0, 49.0, 25.0, 2.4, 1520, 'Ổ Lớn Heo Quay Ba Chỉ Thêm Sốt Nâu', 720, 32.0, 58.0, 36.0, '🥖', 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=500&q=80', '[]'::jsonb),
  ('Bánh Mì Trứng Ốp La Pa Tê Nóng', 'restaurant_dish', 'banh_mi', 'Toàn quốc', '1 Ổ 2 trứng ốp la kẹp pate', 410, 17.0, 47.0, 17.0, 2.2, 1180, 'Ổ 3 Trứng + Phô Mai Lát', 580, 25.0, 52.0, 26.0, '🍳', 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=500&q=80', '[]'::jsonb),
  ('Bánh Mì Chả Lụa Giò Thủ Dưa Leo', 'restaurant_dish', 'banh_mi', 'Miền Bắc', '1 Ổ chuẩn chả lụa giò thủ sần sật', 390, 19.0, 48.0, 14.0, 2.3, 1290, 'Ổ Lớn Đầy Đủ Giò Chả Xúc Xích', 560, 29.0, 56.0, 22.0, '🥖', 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=500&q=80', '[]'::jsonb),
  ('Bánh Mì Gà Xé Bơ Cay', 'restaurant_dish', 'banh_mi', 'Miền Nam', '1 Ổ ức gà xé sốt bơ cay xé lưỡi', 440, 24.0, 49.0, 16.0, 2.5, 1380, 'Ổ Lớn Thêm Trứng Non Béo', 620, 34.0, 56.0, 24.0, '🥖', 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=500&q=80', '[]'::jsonb),
  ('Bánh Mì Que Hải Phòng Pate Cay', 'restaurant_dish', 'banh_mi', 'Miền Bắc', '1 Suất (3 chiếc que giòn cay)', 360, 12.0, 46.0, 14.0, 2.0, 1100, 'Suất Lớn (5 chiếc que)', 590, 20.0, 75.0, 23.0, '🥖', 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=500&q=80', '[]'::jsonb),
  ('Bánh Mì Bò Né Chảo Gang Ốp La', 'restaurant_dish', 'banh_mi', 'Miền Nam', '1 Chảo gang bò thăn mềm + 1 Bánh mì', 680, 36.0, 54.0, 33.0, 2.8, 1780, 'Chảo Đại 2 Trứng + Pate Cột Đèn', 910, 48.0, 65.0, 45.0, '🍳', 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=500&q=80', '[]'::jsonb),
  ('Xôi Xéo Mỡ Hành Đậu Xanh Ruốc Thịt', 'restaurant_dish', 'xoi_khac', 'Miền Bắc', '1 Gói lá chuối truyền thống', 540, 16.0, 82.0, 16.0, 4.5, 1120, 'Gói Lớn Thêm Thịt Kho & Trứng Cút', 780, 28.0, 95.0, 28.0, '🍚', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[{"id": "ruoc_them", "name": "Ruốc heo thơm thêm (20g)", "calories": 75, "protein": 9.0, "carbs": 1.0, "fat": 3.0, "icon": "🥩", "subtitle": "+9g đạm ruốc nạc", "colorType": "peach"}, {"id": "hanh_phi", "name": "Hành phi mỡ hành giòn", "calories": 65, "protein": 0.8, "carbs": 4.0, "fat": 5.0, "icon": "🧅", "subtitle": "Giòn rụm thơm lừng", "colorType": "mint"}, {"id": "thit_kho", "name": "Thịt kho tàu kèm trứng (1 miếng)", "calories": 160, "protein": 11.0, "carbs": 3.0, "fat": 12.0, "icon": "🍲", "subtitle": "Mềm đậm đà", "colorType": "purple"}]'::jsonb),
  ('Xôi Gà Xé Nấm Hương Hạt Sen', 'restaurant_dish', 'xoi_khac', 'Miền Bắc', '1 Hộp xôi gà ta thơm nấm hương', 560, 27.0, 78.0, 14.0, 3.2, 1340, 'Hộp Lớn Kèm Đùi Gà Rô Ti', 790, 42.0, 90.0, 25.0, '🍗', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Xôi Khúc Lá Khúc Nhân Thịt Đậu', 'restaurant_dish', 'xoi_khac', 'Miền Bắc', '1 Chiếc bánh xôi khúc dẻo thơm', 480, 15.0, 74.0, 13.0, 4.0, 980, 'Suất 2 Chiếc Kèm Chả Lụa', 820, 30.0, 110.0, 24.0, '🥟', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Xôi Mặn Thập Cẩm (Lạp xưởng, chà bông)', 'restaurant_dish', 'xoi_khac', 'Miền Nam', '1 Hộp chuẩn lạp xưởng đậu phộng', 610, 22.0, 80.0, 21.0, 3.0, 1560, 'Hộp Đặc Biệt Thêm Trứng Cút Rán', 810, 31.0, 92.0, 30.0, '🍚', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Bánh Cuốn Nóng Thịt Băm Nấm Mèo', 'restaurant_dish', 'xoi_khac', 'Miền Bắc', '1 Đĩa bánh tráng tay + Chả quế + Nước mắm', 460, 21.0, 62.0, 13.0, 2.5, 1520, 'Đĩa Lớn Kèm Trứng Hấp Lòng Đào', 640, 31.0, 72.0, 20.0, '🥢', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Bánh Cuốn Trứng Lòng Đào Lạng Sơn', 'restaurant_dish', 'xoi_khac', 'Miền Bắc', '1 Đĩa 2 trứng tráng chín tới nước hầm xương', 420, 18.0, 56.0, 14.0, 1.8, 1420, 'Đĩa 3 Trứng Lòng Đào', 590, 26.0, 64.0, 21.0, '🍳', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Bánh Giò Nóng Thịt Băm Nấm Hương', 'restaurant_dish', 'xoi_khac', 'Miền Bắc', '1 Chiếc bánh giò bột gạo mềm mịn', 390, 16.0, 48.0, 14.0, 2.2, 1220, 'Suất Đầy Đủ Giò Lụa Nem Chua Dưa Góp', 620, 28.0, 58.0, 26.0, '🥟', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Bánh Bao Nhân Thịt Trứng Cút', 'restaurant_dish', 'xoi_khac', 'Toàn quốc', '1 Chiếc bánh bao hấp nóng (2 trứng cút)', 380, 15.0, 52.0, 12.0, 2.0, 890, 'Bánh Bao Xá Xíu Cỡ Lớn', 510, 22.0, 68.0, 16.0, '🥟', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Bánh Ướt Lòng Gà Trứng Non Đà Lạt', 'restaurant_dish', 'xoi_khac', 'Tây Nguyên', '1 Dĩa bánh ướt lòng mề gà trứng non', 490, 28.0, 60.0, 14.0, 2.5, 1580, 'Dĩa Lớn Nhiều Trứng Non Béo', 680, 39.0, 70.0, 22.0, '🍲', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Bánh Xèo Miền Tây Tôm Nhảy Thịt Ba Rọi', 'restaurant_dish', 'xoi_khac', 'Miền Nam', '1 Cái lớn vàng ươm kèm rổ rau rừng', 580, 24.0, 65.0, 24.0, 5.2, 1680, 'Suất 2 Cái Kèm Chả Giò', 980, 42.0, 110.0, 42.0, '🥞', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Bánh Khọt Vũng Tàu Tôm Tươi Giòn Rụm', 'restaurant_dish', 'xoi_khac', 'Miền Nam', '1 Đĩa (8 chiếc bánh khọt tôm)', 520, 22.0, 62.0, 19.0, 3.8, 1490, 'Đĩa Lớn 12 Chiếc', 770, 32.0, 92.0, 28.0, '🥞', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Bánh Bèo Chén Miền Trung Tôm Chấy', 'restaurant_dish', 'xoi_khac', 'Miền Trung', '1 Khay (6 chén bánh bèo tóp mỡ)', 340, 14.0, 54.0, 6.0, 1.5, 1280, 'Khay Lớn 10 Chén Kèm Nem Lụi', 560, 24.0, 80.0, 14.0, '🥣', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Gỏi Cuốn Tôm Thịt Nước Tương Đậu', 'restaurant_dish', 'lau_an_vat', 'Miền Nam', '1 Đĩa (3 cuốn tôm thịt rau sống)', 270, 18.0, 35.0, 5.0, 3.5, 890, 'Đĩa Lớn (5 cuốn)', 440, 29.0, 56.0, 8.0, '🥟', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Nem Rán Hà Nội / Chả Giò Chiên Giòn', 'restaurant_dish', 'lau_an_vat', 'Miền Bắc', '1 Đĩa (4 cuốn nem thịt mộc nhĩ)', 380, 16.0, 28.0, 22.0, 2.2, 1120, 'Đĩa Lớn (8 cuốn nem)', 720, 30.0, 52.0, 42.0, '🥢', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Nem Chua Rán Phố Cổ', 'restaurant_dish', 'lau_an_vat', 'Miền Bắc', '1 Đĩa (5 chiếc que nem chua lăn bột)', 350, 15.0, 22.0, 21.0, 1.0, 1280, 'Đĩa Lớn 10 Chiếc', 680, 29.0, 42.0, 40.0, '🍢', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Cá Viên Chiên Thập Cẩm Chợ Đêm', 'restaurant_dish', 'lau_an_vat', 'Toàn quốc', '1 Hộp cá tôm bò viên rau củ chiên', 420, 18.0, 34.0, 22.0, 2.0, 1450, 'Mẹt Xiên Bẩn Chiên Ngập Đậu Bắp', 680, 28.0, 54.0, 36.0, '🍢', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Bánh Tráng Trộn Bò Khô Trứng Cút', 'restaurant_dish', 'lau_an_vat', 'Miền Nam', '1 Bịch bánh tráng muối tôm rau răm xoài', 330, 12.0, 45.0, 11.0, 2.8, 1550, 'Bịch Lớn Thêm Bơ & Khô Mực', 510, 18.0, 62.0, 20.0, '🥡', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Bánh Bột Lọc Huế Nhân Tôm Thịt', 'restaurant_dish', 'lau_an_vat', 'Miền Trung', '1 Đĩa (8 chiếc bột lọc lá chuối)', 320, 14.0, 52.0, 5.0, 1.2, 1100, 'Đĩa Lớn (15 chiếc)', 590, 26.0, 95.0, 9.0, '🥟', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Bắp Xào Tôm Bơ Hành', 'restaurant_dish', 'lau_an_vat', 'Miền Nam', '1 Hộp bắp ngọt xào bơ tép ruốc', 310, 9.0, 42.0, 12.0, 4.0, 920, 'Hộp Lớn Thêm Trứng Muối Bùi', 460, 14.0, 50.0, 21.0, '🌽', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Súp Cua Trứng Bắc Thảo Gà Xé', 'restaurant_dish', 'lau_an_vat', 'Miền Nam', '1 Chén súp cua sánh đậm đà', 260, 19.0, 22.0, 8.0, 1.5, 1350, 'Tô Lớn Óc Heo Trứng Bắc Thảo', 420, 28.0, 30.0, 18.0, '🥣', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Salad Ức Gà Sốt Mè Rang', 'restaurant_dish', 'lau_an_vat', 'Toàn quốc', '1 Dĩa lớn ức gà áp chảo xà lách sốt mè', 320, 28.0, 14.0, 15.0, 4.8, 780, 'Dĩa Siêu Đạm Kèm Trứng Lòng Đào', 430, 36.0, 16.0, 21.0, '🥗', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', '[]'::jsonb),
  ('Trà Sữa Trân Châu Đường Đen Size M', 'restaurant_dish', 'lau_an_vat', 'Toàn quốc', '1 Ly 500ml 50% đường', 360, 4.0, 65.0, 8.0, 0.5, 160, 'Ly Size L 700ml Full Topping', 550, 6.5, 98.0, 13.0, '🧋', 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&q=80', '[]'::jsonb),
  ('Trà Đào Cam Sả Thanh Mát', 'restaurant_dish', 'lau_an_vat', 'Toàn quốc', '1 Ly 500ml thơm mùi sả đào miếng', 130, 1.0, 30.0, 0.0, 1.2, 25, 'Ly Lớn 700ml Ít Ngọt', 180, 1.5, 42.0, 0.0, '🍹', 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&q=80', '[]'::jsonb),
  ('Cà Phê Sữa Đá Sài Gòn', 'restaurant_dish', 'lau_an_vat', 'Miền Nam', '1 Ly pha phin truyền thống sữa đặc', 180, 3.0, 26.0, 6.0, 0.2, 65, 'Ly Cà Phê Muối Béo Bùi', 240, 4.0, 28.0, 11.0, '☕', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80', '[]'::jsonb),
  ('Cà Phê Đen Đá Không Đường', 'restaurant_dish', 'lau_an_vat', 'Toàn quốc', '1 Ly cà phê nguyên chất đốt mỡ', 5, 0.5, 1.0, 0.0, 0.0, 5, 'Ly Espresso Double Shot', 10, 1.0, 2.0, 0.0, '☕', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80', '[]'::jsonb),
  ('Nước Mía Tươi Cốt Tắc Ép', 'restaurant_dish', 'lau_an_vat', 'Toàn quốc', '1 Ly 500ml giải nhiệt tức thì', 160, 0.5, 38.0, 0.0, 0.8, 15, 'Ly Lớn 700ml Thêm Sầu Riêng', 280, 2.0, 58.0, 4.5, '🥤', 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&q=80', '[]'::jsonb),
  ('Chè Bưởi An Giang Nước Cốt Dừa', 'restaurant_dish', 'lau_an_vat', 'Miền Nam', '1 Ly cùi bưởi giòn sần sật đậu xanh', 310, 4.0, 58.0, 6.0, 2.6, 45, 'Ly Lớn Thêm Hạt Sen & Thạch', 440, 7.0, 78.0, 9.0, '🍧', 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&q=80', '[]'::jsonb),
  ('Sữa Chua Trân Châu Hạ Long', 'restaurant_dish', 'lau_an_vat', 'Miền Bắc', '1 Cốc sữa chua dẻo + chén trân châu cốt dừa', 240, 6.0, 38.0, 5.0, 1.0, 75, 'Suất Thập Cẩm Hoa Quả Dầm', 360, 8.0, 56.0, 8.0, '🍨', 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&q=80', '[]'::jsonb),
  ('Ức gà phi lê tươi (sống)', 'raw_ingredient', 'meat', 'Toàn quốc', '100g', 120, 23.0, 0.0, 2.6, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🍗', 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&q=80', '[]'::jsonb),
  ('Đùi gà tháo xương bỏ da', 'raw_ingredient', 'meat', 'Toàn quốc', '100g', 140, 21.0, 0.0, 5.8, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🍗', 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&q=80', '[]'::jsonb),
  ('Cánh gà tươi làm sạch', 'raw_ingredient', 'meat', 'Toàn quốc', '100g', 215, 19.0, 0.0, 15.0, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🍗', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Thịt thăn bò tươi nạc (sống)', 'raw_ingredient', 'meat', 'Toàn quốc', '100g', 142, 26.0, 0.0, 3.5, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥩', 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=300&q=80', '[]'::jsonb),
  ('Thịt bắp bò hoa tươi (sống)', 'raw_ingredient', 'meat', 'Toàn quốc', '100g', 130, 24.5, 0.0, 3.2, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥩', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Thịt bò xay nạc (Ground Beef)', 'raw_ingredient', 'meat', 'Toàn quốc', '100g', 175, 20.0, 0.0, 10.5, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥩', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Thịt thăn heo nạc (sống)', 'raw_ingredient', 'meat', 'Toàn quốc', '100g', 135, 24.0, 0.0, 4.0, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥩', 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=300&q=80', '[]'::jsonb),
  ('Thịt nạc dăm heo tươi', 'raw_ingredient', 'meat', 'Toàn quốc', '100g', 165, 19.0, 0.0, 9.8, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥩', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Thịt ba chỉ heo tươi', 'raw_ingredient', 'meat', 'Toàn quốc', '100g', 260, 16.5, 0.0, 21.5, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥩', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Sườn non heo tươi', 'raw_ingredient', 'meat', 'Toàn quốc', '100g', 210, 18.0, 0.0, 15.0, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🍖', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Thịt vịt cỏ tươi làm sạch', 'raw_ingredient', 'meat', 'Toàn quốc', '100g', 180, 18.5, 0.0, 11.5, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🍗', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Gan heo tươi làm sạch', 'raw_ingredient', 'meat', 'Toàn quốc', '100g', 134, 21.3, 3.0, 3.6, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥩', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Cá hồi phi lê tươi Na Uy', 'raw_ingredient', 'seafood', 'Toàn quốc', '100g', 208, 20.4, 0.0, 13.4, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🐟', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&q=80', '[]'::jsonb),
  ('Tôm sú tươi lột vỏ', 'raw_ingredient', 'seafood', 'Toàn quốc', '100g', 85, 18.2, 0.9, 0.9, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🦐', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Tôm thẻ chân trắng tươi', 'raw_ingredient', 'seafood', 'Toàn quốc', '100g', 80, 17.5, 0.8, 0.8, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🦐', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Mực ống tươi làm sạch', 'raw_ingredient', 'seafood', 'Toàn quốc', '100g', 92, 16.0, 3.1, 1.4, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🦑', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Bạch tuộc tươi sống', 'raw_ingredient', 'seafood', 'Toàn quốc', '100g', 82, 14.9, 2.2, 1.0, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🐙', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Cá basa phi lê tươi', 'raw_ingredient', 'seafood', 'Toàn quốc', '100g', 125, 15.0, 0.0, 7.0, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🐟', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Cá lóc đồng tươi nạo thịt', 'raw_ingredient', 'seafood', 'Toàn quốc', '100g', 97, 18.2, 0.0, 2.7, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🐟', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Cá thu tươi cắt khúc', 'raw_ingredient', 'seafood', 'Toàn quốc', '100g', 168, 19.5, 0.0, 9.8, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🐟', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Thịt cua biển tươi gỡ nõn', 'raw_ingredient', 'seafood', 'Toàn quốc', '100g', 87, 17.9, 0.0, 1.5, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🦀', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Hàu sữa tươi bóc vỏ', 'raw_ingredient', 'seafood', 'Toàn quốc', '100g', 68, 7.0, 3.9, 2.5, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🦪', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Nghêu tươi làm sạch vỏ', 'raw_ingredient', 'seafood', 'Toàn quốc', '100g', 48, 8.5, 2.0, 0.5, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🐚', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Cá rô phi phi lê tươi', 'raw_ingredient', 'seafood', 'Toàn quốc', '100g', 96, 20.1, 0.0, 1.7, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🐟', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Cơm trắng nấu chín', 'raw_ingredient', 'carb', 'Toàn quốc', '100g', 130, 2.7, 28.0, 0.3, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🍚', 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=300&q=80', '[]'::jsonb),
  ('Cơm gạo lứt huyết rồng chín', 'raw_ingredient', 'carb', 'Toàn quốc', '100g', 110, 2.6, 23.0, 0.8, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🍚', 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=300&q=80', '[]'::jsonb),
  ('Bún tươi gạo tẻ sợi nhỏ', 'raw_ingredient', 'carb', 'Toàn quốc', '100g', 110, 1.7, 25.7, 0.1, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🍜', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Bánh phở tươi mềm', 'raw_ingredient', 'carb', 'Toàn quốc', '100g', 140, 2.5, 31.0, 0.3, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🍜', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Khoai lang mật luộc / hấp', 'raw_ingredient', 'carb', 'Toàn quốc', '100g', 86, 1.6, 20.1, 0.1, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🍠', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Khoai tây tươi gọt vỏ luộc', 'raw_ingredient', 'carb', 'Toàn quốc', '100g', 77, 2.0, 17.5, 0.1, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥔', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Yến mạch nguyên chất cán dẹt', 'raw_ingredient', 'carb', 'Toàn quốc', '100g', 389, 16.9, 66.3, 6.9, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥣', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Bánh mì nguyên cám lát', 'raw_ingredient', 'carb', 'Toàn quốc', '100g', 247, 13.0, 41.0, 3.4, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🍞', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Miến dong tươi sợi trong', 'raw_ingredient', 'carb', 'Toàn quốc', '100g', 120, 0.5, 29.5, 0.1, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🍜', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Ngô ngọt hạt luộc', 'raw_ingredient', 'carb', 'Toàn quốc', '100g', 96, 3.4, 21.0, 1.5, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🌽', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Khoai môn / Khoai sọ luộc', 'raw_ingredient', 'carb', 'Toàn quốc', '100g', 112, 1.5, 26.5, 0.2, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥔', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Hạt quinoa (diêm mạch) nấu chín', 'raw_ingredient', 'carb', 'Toàn quốc', '100g', 120, 4.4, 21.3, 1.9, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🌾', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Bông cải xanh luộc chín (Broccoli)', 'raw_ingredient', 'veggie', 'Toàn quốc', '100g', 34, 2.8, 6.7, 0.4, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥦', 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=300&q=80', '[]'::jsonb),
  ('Bông cải trắng hấp (Cauliflower)', 'raw_ingredient', 'veggie', 'Toàn quốc', '100g', 25, 1.9, 5.0, 0.3, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥦', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Rau muống luộc tươi', 'raw_ingredient', 'veggie', 'Toàn quốc', '100g', 20, 2.6, 3.1, 0.2, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥗', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Cải thìa luộc chín', 'raw_ingredient', 'veggie', 'Toàn quốc', '100g', 13, 1.5, 2.2, 0.2, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥬', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Cải ngọt tươi', 'raw_ingredient', 'veggie', 'Toàn quốc', '100g', 16, 1.7, 2.5, 0.2, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥬', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Rau mồng tơi tươi', 'raw_ingredient', 'veggie', 'Toàn quốc', '100g', 19, 1.8, 3.4, 0.3, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥬', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Cà chua chín đỏ tươi', 'raw_ingredient', 'veggie', 'Toàn quốc', '100g', 18, 0.9, 3.9, 0.2, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🍅', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Dưa chuột tươi giòn gọt vỏ', 'raw_ingredient', 'veggie', 'Toàn quốc', '100g', 15, 0.7, 3.6, 0.1, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥒', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Măng tây xanh non', 'raw_ingredient', 'veggie', 'Toàn quốc', '100g', 20, 2.2, 3.9, 0.1, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🎋', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Cà rốt tươi thái sợi', 'raw_ingredient', 'veggie', 'Toàn quốc', '100g', 41, 0.9, 9.6, 0.2, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥕', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Nấm kim châm tươi', 'raw_ingredient', 'veggie', 'Toàn quốc', '100g', 37, 2.7, 7.8, 0.3, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🍄', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Nấm đùi gà tươi', 'raw_ingredient', 'veggie', 'Toàn quốc', '100g', 35, 3.1, 6.5, 0.4, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🍄', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Ớt chuông đỏ ngọt', 'raw_ingredient', 'veggie', 'Toàn quốc', '100g', 31, 1.0, 6.0, 0.3, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🫑', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Xà lách búp mỡ tươi', 'raw_ingredient', 'veggie', 'Toàn quốc', '100g', 15, 1.4, 2.9, 0.2, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥬', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Trứng gà ta nguyên quả', 'raw_ingredient', 'egg_dairy', 'Toàn quốc', '100g', 143, 12.6, 0.7, 9.5, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥚', 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=300&q=80', '[]'::jsonb),
  ('Lòng trắng trứng gà tươi', 'raw_ingredient', 'egg_dairy', 'Toàn quốc', '100g', 52, 11.0, 0.7, 0.2, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥚', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Trứng vịt nguyên quả', 'raw_ingredient', 'egg_dairy', 'Toàn quốc', '100g', 185, 13.0, 1.5, 14.0, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥚', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Trứng cút luộc bóc vỏ', 'raw_ingredient', 'egg_dairy', 'Toàn quốc', '100g', 158, 13.0, 0.4, 11.0, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥚', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Sữa chua Hy Lạp không đường', 'raw_ingredient', 'egg_dairy', 'Toàn quốc', '100g', 65, 10.0, 4.0, 0.5, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥛', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Sữa tươi tiệt trùng không đường', 'raw_ingredient', 'egg_dairy', 'Toàn quốc', '100g', 62, 3.1, 4.7, 3.5, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥛', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Phô mai lát Cheddar', 'raw_ingredient', 'egg_dairy', 'Toàn quốc', '100g', 402, 25.0, 1.3, 33.0, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🧀', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Bột Whey Protein Isolate', 'raw_ingredient', 'egg_dairy', 'Toàn quốc', '100g', 370, 85.0, 3.0, 1.5, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥤', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Đậu phụ trắng truyền thống', 'raw_ingredient', 'tofu_bean', 'Toàn quốc', '100g', 76, 8.0, 1.9, 4.8, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🧈', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Đậu hũ non Nhật Bản mềm mịn', 'raw_ingredient', 'tofu_bean', 'Toàn quốc', '100g', 55, 5.0, 1.5, 3.0, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🧈', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Đậu nành luộc Edamame', 'raw_ingredient', 'tofu_bean', 'Toàn quốc', '100g', 121, 11.9, 8.9, 5.2, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🫘', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Đậu đen xanh lòng luộc chín', 'raw_ingredient', 'tofu_bean', 'Toàn quốc', '100g', 132, 8.9, 23.7, 0.5, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🫘', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Đậu xanh bóc vỏ luộc chín', 'raw_ingredient', 'tofu_bean', 'Toàn quốc', '100g', 105, 7.0, 19.1, 0.4, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🫘', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Đậu đỏ luộc chín mềm', 'raw_ingredient', 'tofu_bean', 'Toàn quốc', '100g', 127, 8.7, 22.8, 0.5, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🫘', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Hạt điều rang sấy không muối', 'raw_ingredient', 'tofu_bean', 'Toàn quốc', '100g', 553, 18.2, 30.2, 43.8, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥜', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Hạt hạnh nhân nguyên hạt sấy', 'raw_ingredient', 'tofu_bean', 'Toàn quốc', '100g', 579, 21.2, 21.6, 49.9, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥜', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Hạt chia hữu cơ nguyên hạt', 'raw_ingredient', 'tofu_bean', 'Toàn quốc', '100g', 486, 16.5, 42.1, 30.7, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🌱', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Lạc (đậu phộng) rang mộc', 'raw_ingredient', 'tofu_bean', 'Toàn quốc', '100g', 567, 25.8, 16.1, 49.2, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥜', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Dầu ô liu Extra Virgin', 'raw_ingredient', 'fat_seasoning', 'Toàn quốc', '100g', 884, 0.0, 0.0, 100.0, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🫒', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Dầu thực vật ăn gia đình', 'raw_ingredient', 'fat_seasoning', 'Toàn quốc', '100g', 884, 0.0, 0.0, 100.0, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🫗', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Dầu mè thơm nguyên chất', 'raw_ingredient', 'fat_seasoning', 'Toàn quốc', '100g', 884, 0.0, 0.0, 100.0, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🫗', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Bơ thực vật / Bơ lạt động vật', 'raw_ingredient', 'fat_seasoning', 'Toàn quốc', '100g', 717, 0.9, 0.1, 81.0, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🧈', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Nước mắm cá cơm truyền thống', 'raw_ingredient', 'fat_seasoning', 'Toàn quốc', '100g', 40, 7.5, 2.0, 0.0, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🍶', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Nước tương đậu nành (Xì dầu)', 'raw_ingredient', 'fat_seasoning', 'Toàn quốc', '100g', 53, 8.0, 4.9, 0.1, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🍶', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Xốt Mayonnaise ít béo', 'raw_ingredient', 'fat_seasoning', 'Toàn quốc', '100g', 260, 1.0, 8.0, 25.0, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🥣', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb),
  ('Mật ong nguyên chất', 'raw_ingredient', 'fat_seasoning', 'Toàn quốc', '100g', 304, 0.3, 82.4, 0.0, 1.0, 50, NULL, NULL, NULL, NULL, NULL, '🍯', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', '[]'::jsonb)
ON CONFLICT (name, serving_size) DO UPDATE SET
  food_type = EXCLUDED.food_type,
  category = EXCLUDED.category,
  region = EXCLUDED.region,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  special_label = EXCLUDED.special_label,
  special_calories = EXCLUDED.special_calories,
  special_protein = EXCLUDED.special_protein,
  special_carbs = EXCLUDED.special_carbs,
  special_fat = EXCLUDED.special_fat,
  icon = EXCLUDED.icon,
  image_url = EXCLUDED.image_url;

-- ==================================================================================
-- PHẦN 5: CẬP NHẬT TOPPING CHUYÊN BIỆT THEO TỪNG NHÓM MÓN ĂN QUÁN VIỆT
-- ==================================================================================
-- 5.1 Topping cho tất cả các món Phở bò / Phở gà
UPDATE public.foods
SET toppings = '[
  {"id": "trung_tran", "name": "Trứng trần lòng đào (1 quả)", "calories": 75, "protein": 6.0, "carbs": 0.5, "fat": 5.0, "icon": "💧", "subtitle": "+6g protein lòng đào", "colorType": "peach"},
  {"id": "quay_gion", "name": "Quẩy giòn giòn (2 chiếc)", "calories": 120, "protein": 2.5, "carbs": 16.0, "fat": 5.5, "icon": "🥐", "subtitle": "+16g carb giòn tan", "colorType": "purple"},
  {"id": "nuoc_beo", "name": "Nước béo hành hoa / Chén tiết", "calories": 110, "protein": 2.0, "carbs": 0.0, "fat": 11.0, "icon": "🥣", "subtitle": "+11g chất béo tự nhiên", "colorType": "pink"},
  {"id": "thit_them", "name": "Thịt bò tái / nạm thêm (50g)", "calories": 105, "protein": 16.0, "carbs": 0.0, "fat": 4.5, "icon": "🥩", "subtitle": "+16g protein nạc thơm", "colorType": "mint"},
  {"id": "banh_them", "name": "Bánh phở thêm (100g)", "calories": 140, "protein": 2.5, "carbs": 31.0, "fat": 0.3, "icon": "🍜", "subtitle": "+31g carb năng lượng", "colorType": "blue"}
]'::jsonb
WHERE category = 'pho' AND (toppings IS NULL OR toppings = '[]'::jsonb);

-- 5.2 Topping cho tất cả các món Cơm (Cơm tấm, cơm gà, cơm sườn...)
UPDATE public.foods
SET toppings = '[
  {"id": "op_la", "name": "Trứng ốp la lòng đào (1 quả)", "calories": 90, "protein": 6.5, "carbs": 0.5, "fat": 7.0, "icon": "🍳", "subtitle": "+6.5g protein lòng đào", "colorType": "peach"},
  {"id": "cha_trung", "name": "Chả trứng hấp thịt (1 miếng)", "calories": 130, "protein": 8.0, "carbs": 4.0, "fat": 9.0, "icon": "🥮", "subtitle": "+8g protein • béo bùi", "colorType": "purple"},
  {"id": "suon_them", "name": "Sườn nướng thêm (1 miếng)", "calories": 240, "protein": 22.0, "carbs": 5.0, "fat": 15.0, "icon": "🥩", "subtitle": "+22g protein nạc thơm", "colorType": "mint"},
  {"id": "bi_them", "name": "Bì heo trộn thính (30g)", "calories": 85, "protein": 10.0, "carbs": 1.0, "fat": 4.5, "icon": "🥓", "subtitle": "+10g protein giòn dai", "colorType": "pink"},
  {"id": "com_them", "name": "Cơm thêm (1 chén)", "calories": 130, "protein": 2.7, "carbs": 28.0, "fat": 0.3, "icon": "🍚", "subtitle": "+28g carb", "colorType": "blue"},
  {"id": "canh_them", "name": "Canh súp rong biển / khổ qua", "calories": 45, "protein": 2.0, "carbs": 4.0, "fat": 2.0, "icon": "🥣", "subtitle": "Thanh nhiệt ít calo", "colorType": "mint"}
]'::jsonb
WHERE category = 'com' AND (toppings IS NULL OR toppings = '[]'::jsonb);

-- 5.3 Topping cho các món Bún đậu mắm tôm
UPDATE public.foods
SET toppings = '[
  {"id": "doi_sun", "name": "Dồi sụn rán giòn (4 miếng)", "calories": 165, "protein": 9.0, "carbs": 6.0, "fat": 11.0, "icon": "🌭", "subtitle": "+9g protein • sụn giòn", "colorType": "purple"},
  {"id": "nem_ran", "name": "Nem rán giòn rụm (2 chiếc)", "calories": 180, "protein": 7.0, "carbs": 12.0, "fat": 11.0, "icon": "🥟", "subtitle": "+12g carb giòn tan", "colorType": "peach"},
  {"id": "cha_com", "name": "Chả cốm chiên thơm (2 miếng)", "calories": 145, "protein": 8.0, "carbs": 10.0, "fat": 7.5, "icon": "🍘", "subtitle": "+8g protein dẻo thơm", "colorType": "mint"},
  {"id": "thit_luoc", "name": "Thịt chân giò luộc (50g)", "calories": 125, "protein": 11.0, "carbs": 0.0, "fat": 9.0, "icon": "🥩", "subtitle": "+11g protein nạc mỡ", "colorType": "pink"},
  {"id": "dau_ran", "name": "Đậu phụ rán giòn lướt ván (4 miếng)", "calories": 110, "protein": 8.0, "carbs": 2.0, "fat": 7.5, "icon": "🧈", "subtitle": "+8g đạm thực vật", "colorType": "blue"}
]'::jsonb
WHERE category = 'bun' AND name ILIKE '%bún đậu%' AND (toppings IS NULL OR toppings = '[]'::jsonb);

-- 5.4 Topping cho các món Bún bò Huế & Bún riêu & Bún nước
UPDATE public.foods
SET toppings = '[
  {"id": "cha_cua", "name": "Chả cua / Chả bò Huế (2 viên)", "calories": 120, "protein": 9.0, "carbs": 3.0, "fat": 8.0, "icon": "🦀", "subtitle": "+9g protein thơm ngọt", "colorType": "peach"},
  {"id": "thit_bo_them", "name": "Bắp bò / Nạm bò thêm (50g)", "calories": 110, "protein": 15.0, "carbs": 0.0, "fat": 5.5, "icon": "🥩", "subtitle": "+15g protein nạc", "colorType": "mint"},
  {"id": "tiet_luoc", "name": "Tiết heo luộc mềm (1 miếng)", "calories": 45, "protein": 8.0, "carbs": 0.5, "fat": 1.0, "icon": "🩸", "subtitle": "+8g protein giàu sắt", "colorType": "pink"},
  {"id": "gio_heo", "name": "Móng giò heo thêm (1 khoanh)", "calories": 210, "protein": 16.0, "carbs": 0.0, "fat": 16.0, "icon": "🍖", "subtitle": "+16g protein & collagen", "colorType": "purple"},
  {"id": "quay_gion", "name": "Quẩy giòn giòn (2 chiếc)", "calories": 120, "protein": 2.5, "carbs": 16.0, "fat": 5.5, "icon": "🥐", "subtitle": "+16g carb giòn tan", "colorType": "blue"}
]'::jsonb
WHERE category = 'bun' AND (toppings IS NULL OR toppings = '[]'::jsonb);

-- 5.5 Topping cho các món Bánh mì
UPDATE public.foods
SET toppings = '[
  {"id": "pate_them", "name": "Pate gan heo béo thêm (30g)", "calories": 115, "protein": 4.5, "carbs": 2.0, "fat": 10.0, "icon": "🥫", "subtitle": "+10g chất béo thơm bùi", "colorType": "pink"},
  {"id": "op_la", "name": "Trứng ốp la (1 quả)", "calories": 90, "protein": 6.5, "carbs": 0.5, "fat": 7.0, "icon": "🍳", "subtitle": "+6.5g protein lòng đào", "colorType": "peach"},
  {"id": "cha_lua", "name": "Chả lụa / Xúc xích nạc (40g)", "calories": 95, "protein": 7.5, "carbs": 1.5, "fat": 6.5, "icon": "🥓", "subtitle": "+7.5g protein nạc", "colorType": "mint"},
  {"id": "bo_thom", "name": "Bơ trứng gà thơm (15g)", "calories": 90, "protein": 0.3, "carbs": 0.5, "fat": 10.0, "icon": "🧈", "subtitle": "Tăng độ béo ngậy mềm vỏ", "colorType": "purple"},
  {"id": "pho_mai", "name": "Phô mai lát Cheddar", "calories": 75, "protein": 5.0, "carbs": 0.3, "fat": 6.0, "icon": "🧀", "subtitle": "+5g protein canxi", "colorType": "blue"}
]'::jsonb
WHERE category = 'banh_mi' AND (toppings IS NULL OR toppings = '[]'::jsonb);

-- 5.6 Topping cho các món Mì & Hủ tiếu & Bánh canh
UPDATE public.foods
SET toppings = '[
  {"id": "trung_cut", "name": "Trứng cút luộc (3 quả)", "calories": 48, "protein": 4.0, "carbs": 0.2, "fat": 3.5, "icon": "🥚", "subtitle": "+4g protein bùi béo", "colorType": "peach"},
  {"id": "tom_them", "name": "Tôm tươi thêm (3 con)", "calories": 65, "protein": 13.0, "carbs": 0.5, "fat": 0.8, "icon": "🦐", "subtitle": "+13g protein thuần khiết", "colorType": "mint"},
  {"id": "hoanh_thanh", "name": "Hoành thánh chiên giòn (2 cái)", "calories": 120, "protein": 4.0, "carbs": 12.0, "fat": 6.5, "icon": "🥟", "subtitle": "+12g carb giòn rụm", "colorType": "purple"},
  {"id": "xa_xiu", "name": "Xá xíu nạc thêm (50g)", "calories": 130, "protein": 14.0, "carbs": 2.0, "fat": 7.5, "icon": "🥩", "subtitle": "+14g protein đậm đà", "colorType": "pink"},
  {"id": "hu_tieu_them", "name": "Hủ tiếu / Mì thêm (1 vắt)", "calories": 140, "protein": 3.0, "carbs": 32.0, "fat": 0.5, "icon": "🥣", "subtitle": "+32g carb năng lượng", "colorType": "blue"}
]'::jsonb
WHERE category = 'mi_hu_tieu' AND (toppings IS NULL OR toppings = '[]'::jsonb);


-- ==================================================================================
-- PHẦN 6: KHỞI TẠO CÁC TÀI KHOẢN GỐC (ROOT TEST USERS) VÀO auth.users & public.profiles
-- Mật khẩu mặc định của tất cả tài khoản test: 12345678
-- ==================================================================================
DO $$
DECLARE
  v_pwd_hash TEXT;
  v_test_id UUID;
  v_gain_id UUID;
  v_maintain_id UUID;
  v_admin_id UUID;
BEGIN
  -- 1. Tạo chuỗi hash bcrypt bảo mật cho mật khẩu '12345678'
  BEGIN
    v_pwd_hash := extensions.crypt('12345678', extensions.gen_salt('bf'));
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      v_pwd_hash := crypt('12345678', gen_salt('bf'));
    EXCEPTION WHEN OTHERS THEN
      v_pwd_hash := '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa';
    END;
  END;

  -- 2. Tài khoản 1: test@gmail.com (User mục tiêu Giảm Cân - Persona: Nguyễn Thanh)
  SELECT id INTO v_test_id FROM auth.users WHERE email = 'test@gmail.com' LIMIT 1;
  IF v_test_id IS NULL THEN
    v_test_id := 'a0000000-0000-0000-0000-000000000001'::uuid;
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      v_test_id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated',
      'test@gmail.com', v_pwd_hash, NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Nguyễn Thanh"}'::jsonb,
      NOW(), NOW(), '', ''
    );
  END IF;

  INSERT INTO public.profiles (
    id, full_name, avatar_url, gender, age, height, current_weight, target_weight,
    activity_level, bmr, tdee, daily_calorie_goal, goal_type, target_days, subscription_tier
  ) VALUES (
    v_test_id, 'Nguyễn Thanh', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
    'Nam', 28, 172.0, 71.5, 66.0, 'light', 1650.0, 2268.0, 1768.0, 'Giảm cân', 60, 'Pro'
  ) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    gender = EXCLUDED.gender,
    age = EXCLUDED.age,
    height = EXCLUDED.height,
    current_weight = EXCLUDED.current_weight,
    target_weight = EXCLUDED.target_weight,
    activity_level = EXCLUDED.activity_level,
    bmr = EXCLUDED.bmr,
    tdee = EXCLUDED.tdee,
    daily_calorie_goal = EXCLUDED.daily_calorie_goal,
    goal_type = EXCLUDED.goal_type,
    target_days = EXCLUDED.target_days,
    subscription_tier = EXCLUDED.subscription_tier;

  INSERT INTO public.user_reminders (user_id) VALUES (v_test_id) ON CONFLICT DO NOTHING;

  -- 3. Tài khoản 2: user_gain_weight@gmail.com (User mục tiêu Tăng Cân - Persona: Trần Minh Khang)
  SELECT id INTO v_gain_id FROM auth.users WHERE email = 'user_gain_weight@gmail.com' LIMIT 1;
  IF v_gain_id IS NULL THEN
    v_gain_id := 'a0000000-0000-0000-0000-000000000002'::uuid;
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      v_gain_id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated',
      'user_gain_weight@gmail.com', v_pwd_hash, NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Trần Minh Khang"}'::jsonb,
      NOW(), NOW(), '', ''
    );
  END IF;

  INSERT INTO public.profiles (
    id, full_name, avatar_url, gender, age, height, current_weight, target_weight,
    activity_level, bmr, tdee, daily_calorie_goal, goal_type, target_days, subscription_tier
  ) VALUES (
    v_gain_id, 'Trần Minh Khang', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&q=80',
    'Nam', 23, 178.0, 61.2, 68.0, 'moderate', 1620.0, 2227.0, 2627.0, 'Tăng cân', 90, 'Pro'
  ) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    gender = EXCLUDED.gender,
    age = EXCLUDED.age,
    height = EXCLUDED.height,
    current_weight = EXCLUDED.current_weight,
    target_weight = EXCLUDED.target_weight,
    daily_calorie_goal = EXCLUDED.daily_calorie_goal,
    goal_type = EXCLUDED.goal_type;

  INSERT INTO public.user_reminders (user_id) VALUES (v_gain_id) ON CONFLICT DO NOTHING;

  -- 4. Tài khoản 3: user_maintain@gmail.com (User mục tiêu Giữ Cân - Persona: Lê Thị Thảo)
  SELECT id INTO v_maintain_id FROM auth.users WHERE email = 'user_maintain@gmail.com' LIMIT 1;
  IF v_maintain_id IS NULL THEN
    v_maintain_id := 'a0000000-0000-0000-0000-000000000003'::uuid;
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      v_maintain_id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated',
      'user_maintain@gmail.com', v_pwd_hash, NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Lê Thị Thảo"}'::jsonb,
      NOW(), NOW(), '', ''
    );
  END IF;

  INSERT INTO public.profiles (
    id, full_name, avatar_url, gender, age, height, current_weight, target_weight,
    activity_level, bmr, tdee, daily_calorie_goal, goal_type, target_days, subscription_tier
  ) VALUES (
    v_maintain_id, 'Lê Thị Thảo', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    'Nữ', 25, 162.0, 50.5, 50.0, 'light', 1280.0, 1760.0, 1760.0, 'Giữ cân', 30, 'Free'
  ) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    daily_calorie_goal = EXCLUDED.daily_calorie_goal,
    goal_type = EXCLUDED.goal_type;

  INSERT INTO public.user_reminders (user_id) VALUES (v_maintain_id) ON CONFLICT DO NOTHING;

  -- 5. Tài khoản 4: admin@gmail.com (Quản Trị Viên)
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@gmail.com' LIMIT 1;
  IF v_admin_id IS NULL THEN
    v_admin_id := 'a0000000-0000-0000-0000-000000000004'::uuid;
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      v_admin_id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated',
      'admin@gmail.com', v_pwd_hash, NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Quản Trị Viên (Admin)"}'::jsonb,
      NOW(), NOW(), '', ''
    );
  END IF;

  INSERT INTO public.profiles (
    id, full_name, avatar_url, gender, age, height, current_weight, target_weight,
    activity_level, bmr, tdee, daily_calorie_goal, goal_type, target_days, subscription_tier
  ) VALUES (
    v_admin_id, 'Quản Trị Viên (Admin)', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    'Nam', 30, 175.0, 68.0, 68.0, 'moderate', 1660.0, 2282.0, 2000.0, 'Giữ cân', 60, 'Pro'
  ) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    subscription_tier = 'Pro';

  INSERT INTO public.user_reminders (user_id) VALUES (v_admin_id) ON CONFLICT DO NOTHING;
END $$;

-- ==================================================================================
-- PHẦN 7: NẠP DỮ LIỆU TIẾN TRÌNH CÂN NẶNG (14 NGÀY LIÊN TIẾP ĐỂ VẼ BIỂU ĐỒ)
-- ==================================================================================
-- 7.1 Lịch sử 14 ngày cho test@gmail.com: Giảm đều đặn từ 74.2kg xuống 71.5kg
DO $$
DECLARE
  v_uid UUID;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'test@gmail.com' LIMIT 1;
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.weight_history (user_id, weight, recorded_date, notes)
    VALUES
      (v_uid, 74.2, CURRENT_DATE - 13, 'Bắt đầu lộ trình giảm cân cùng NutriTrack'),
      (v_uid, 74.0, CURRENT_DATE - 12, 'Tập gym 45 phút, uống 2L nước'),
      (v_uid, 73.8, CURRENT_DATE - 11, 'Ăn thanh đạm, cắt giảm nước ngọt'),
      (v_uid, 73.7, CURRENT_DATE - 10, 'Cân sáng sớm lúc bụng rỗng'),
      (v_uid, 73.5, CURRENT_DATE - 9,  'Chạy bộ nhẹ nhàng quanh công viên'),
      (v_uid, 73.4, CURRENT_DATE - 8,  'Uống đủ nước, ngủ đủ 8 tiếng'),
      (v_uid, 73.1, CURRENT_DATE - 7,  'Hoàn thành tuần đầu tiên - giảm hơn 1kg'),
      (v_uid, 72.9, CURRENT_DATE - 6,  'Cơ thể nhẹ nhõm, tiêu hóa tốt'),
      (v_uid, 72.6, CURRENT_DATE - 5,  'Tự nấu bữa tối với ức gà và khoai lang'),
      (v_uid, 72.4, CURRENT_DATE - 4,  'Tập kháng lực và cardio nhẹ'),
      (v_uid, 72.2, CURRENT_DATE - 3,  'Kiểm soát calo chuẩn theo MacroRing'),
      (v_uid, 72.0, CURRENT_DATE - 2,  'Đạt mốc 72.0kg!'),
      (v_uid, 71.8, CURRENT_DATE - 1,  'Ăn tối nhiều rau củ và cá hồi'),
      (v_uid, 71.5, CURRENT_DATE,      'Hôm nay cân lúc vừa thức dậy - rất hài lòng')
    ON CONFLICT (user_id, recorded_date) DO UPDATE SET weight = EXCLUDED.weight, notes = EXCLUDED.notes;
  END IF;
END $$;

-- 7.2 Lịch sử 14 ngày cho user_gain_weight@gmail.com: Tăng cơ từ 59.8kg lên 61.2kg
DO $$
DECLARE
  v_uid UUID;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'user_gain_weight@gmail.com' LIMIT 1;
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.weight_history (user_id, weight, recorded_date, notes)
    VALUES
      (v_uid, 59.8, CURRENT_DATE - 13, 'Khởi động lộ trình Bulking tăng cơ'),
      (v_uid, 59.9, CURRENT_DATE - 12, 'Tăng thêm 1 bữa phụ buổi xế'),
      (v_uid, 60.1, CURRENT_DATE - 11, 'Uống whey protein sau tập gym'),
      (v_uid, 60.2, CURRENT_DATE - 10, 'Tập nhóm cơ ngực và tay trước'),
      (v_uid, 60.3, CURRENT_DATE - 9,  'Ăn thêm cơm bò xào và sữa chua'),
      (v_uid, 60.5, CURRENT_DATE - 8,  'Thể lực cải thiện rõ rệt'),
      (v_uid, 60.6, CURRENT_DATE - 7,  'Đạt mốc 60.6kg sau tuần 1'),
      (v_uid, 60.7, CURRENT_DATE - 6,  'Nạp 2,600 kcal đầy đủ theo mục tiêu'),
      (v_uid, 60.8, CURRENT_DATE - 5,  'Cân nặng tăng ổn định không bị tích mỡ'),
      (v_uid, 60.9, CURRENT_DATE - 4,  'Tập cơ đùi Squat 80kg'),
      (v_uid, 61.0, CURRENT_DATE - 3,  'Cán mốc 61kg!'),
      (v_uid, 61.1, CURRENT_DATE - 2,  'Ăn 4 bữa trong ngày'),
      (v_uid, 61.1, CURRENT_DATE - 1,  'Nghỉ ngơi phục hồi cơ bắp'),
      (v_uid, 61.2, CURRENT_DATE,      'Hiện tại 61.2kg, tiếp tục hướng tới 68kg')
    ON CONFLICT (user_id, recorded_date) DO UPDATE SET weight = EXCLUDED.weight, notes = EXCLUDED.notes;
  END IF;
END $$;

-- 7.3 Lịch sử 14 ngày cho user_maintain@gmail.com: Giữ cân ổn định 50.4kg - 50.6kg
DO $$
DECLARE
  v_uid UUID;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'user_maintain@gmail.com' LIMIT 1;
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.weight_history (user_id, weight, recorded_date, notes)
    VALUES
      (v_uid, 50.6, CURRENT_DATE - 13, 'Bắt đầu tuần giữ dáng Yoga'),
      (v_uid, 50.5, CURRENT_DATE - 11, 'Ăn nhiều salad rau củ tươi'),
      (v_uid, 50.4, CURRENT_DATE - 9,  'Duy trì calo in = calo out'),
      (v_uid, 50.5, CURRENT_DATE - 7,  'Tập Pilates 1 tiếng'),
      (v_uid, 50.6, CURRENT_DATE - 5,  'Uống nước ép cần tây và táo'),
      (v_uid, 50.5, CURRENT_DATE - 3,  'Cân nặng rất chuẩn và ổn định'),
      (v_uid, 50.5, CURRENT_DATE,      'Vóc dáng thon gọn duy trì tốt')
    ON CONFLICT (user_id, recorded_date) DO UPDATE SET weight = EXCLUDED.weight, notes = EXCLUDED.notes;
  END IF;
END $$;

-- ==================================================================================
-- PHẦN 8: NẠP DỮ LIỆU NHẬT KÝ BỮA ĂN (HÔM NAY VÀ 7 NGÀY GẦN NHẤT)
-- Đảm bảo Vòng Calo Trang Chủ và Biểu đồ cột Tuần luôn sáng bừng dữ liệu thực tế!
-- ==================================================================================
DO $$
DECLARE
  v_uid UUID;
  f_pho BIGINT;
  f_com_tam BIGINT;
  f_bun_bo BIGINT;
  f_banh_mi BIGINT;
  f_xoi_ga BIGINT;
  f_hu_tieu BIGINT;
  f_bun_cha BIGINT;
  f_salad BIGINT;
  f_sua_chua BIGINT;
  f_tra_dao BIGINT;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'test@gmail.com' LIMIT 1;
  IF v_uid IS NULL THEN RETURN; END IF;

  -- Tìm các ID thực phẩm trong bảng foods để liên kết chuẩn khóa ngoại
  SELECT id INTO f_pho FROM public.foods WHERE name = 'Phở Bò Tái Nạm' LIMIT 1;
  SELECT id INTO f_com_tam FROM public.foods WHERE name = 'Cơm Tấm Sườn Bì Chả' LIMIT 1;
  SELECT id INTO f_bun_bo FROM public.foods WHERE name = 'Bún Bò Huế Chuẩn Vị' LIMIT 1;
  SELECT id INTO f_banh_mi FROM public.foods WHERE name = 'Bánh Mì Thịt Nguội Pate Truyền Thống' LIMIT 1;
  SELECT id INTO f_xoi_ga FROM public.foods WHERE name = 'Xôi Gà Xé Nấm Hương Hạt Sen' LIMIT 1;
  SELECT id INTO f_hu_tieu FROM public.foods WHERE name = 'Hủ Tiếu Nam Vang Chuẩn Vị' LIMIT 1;
  SELECT id INTO f_bun_cha FROM public.foods WHERE name = 'Bún Chả Hà Nội' LIMIT 1;
  SELECT id INTO f_salad FROM public.foods WHERE name = 'Salad Ức Gà Sốt Mè Rang' LIMIT 1;
  SELECT id INTO f_sua_chua FROM public.foods WHERE name = 'Sữa chua Hy Lạp không đường' LIMIT 1;
  SELECT id INTO f_tra_dao FROM public.foods WHERE name = 'Trà Đào Cam Sả Thanh Mát' LIMIT 1;

  -- Xóa sạch bữa ăn cũ trong 7 ngày gần đây của user test để tránh trùng lặp
  DELETE FROM public.daily_meals WHERE user_id = v_uid AND consumed_date >= (CURRENT_DATE - 6);

  -- 8.1. HÔM NAY (CURRENT_DATE): 4 BỮA ĂN HOÀN CHỈNH (TỔNG ~1,680 KCAL - VÒNG MACRO ĐẠT ~95%)
  INSERT INTO public.daily_meals (
    user_id, food_id, dish_name, meal_time, meal_source, quantity, serving_size,
    calories, protein, carbs, fat, fiber, sodium, consumed_date, consumed_time
  ) VALUES
    -- Bữa Sáng (07:30)
    (v_uid, f_pho, 'Phở Bò Tái Nạm (Hà Nội)', 'Sáng', 'eating_out', 1.0, '1 Tô tiêu chuẩn',
     520.0, 32.0, 58.0, 16.0, 2.5, 1850.0, CURRENT_DATE, '07:30:00'),
    -- Bữa Trưa (12:15)
    (v_uid, f_com_tam, 'Cơm Tấm Sườn Bì Chả (Sài Gòn)', 'Trưa', 'eating_out', 1.0, '1 Dĩa chuẩn',
     650.0, 34.0, 75.0, 22.0, 2.8, 1640.0, CURRENT_DATE, '12:15:00'),
    -- Bữa Ăn Vặt (15:30)
    (v_uid, f_sua_chua, 'Sữa chua Hy Lạp + Hạt chia', 'Ăn vặt', 'home_cooking', 1.0, '1 Cốc 150g',
     130.0, 12.0, 10.0, 4.0, 3.0, 60.0, CURRENT_DATE, '15:30:00'),
    -- Bữa Tối (19:00)
    (v_uid, f_salad, 'Mâm cơm: Ức gà áp chảo + Bông cải hấp + Khoai lang', 'Tối', 'home_cooking', 1.0, '1 Mâm cân 350g',
     380.0, 42.0, 22.0, 8.0, 4.5, 750.0, CURRENT_DATE, '19:00:00');

  -- 8.2. HÔM QUA (CURRENT_DATE - 1): TỔNG 1,600 KCAL
  INSERT INTO public.daily_meals (
    user_id, food_id, dish_name, meal_time, meal_source, quantity, serving_size,
    calories, protein, carbs, fat, fiber, sodium, consumed_date, consumed_time
  ) VALUES
    (v_uid, f_banh_mi, 'Bánh Mì Thịt Nguội Pate', 'Sáng', 'eating_out', 1.0, '1 Ổ chuẩn', 430.0, 18.0, 48.0, 19.0, 2.5, 1280.0, CURRENT_DATE - 1, '08:00:00'),
    (v_uid, f_bun_bo, 'Bún Bò Huế Chuẩn Vị', 'Trưa', 'eating_out', 1.0, '1 Tô nạm chả cua', 560.0, 32.0, 64.0, 18.0, 3.0, 2100.0, CURRENT_DATE - 1, '12:30:00'),
    (v_uid, f_tra_dao, 'Trà Đào Cam Sả Ít Đường', 'Ăn vặt', 'eating_out', 1.0, '1 Ly 500ml', 130.0, 1.0, 30.0, 0.0, 1.2, 25.0, CURRENT_DATE - 1, '15:45:00'),
    (v_uid, NULL, 'Cá hồi Na Uy áp chảo + Cơm lứt', 'Tối', 'home_cooking', 1.0, '1 Khẩu phần tự nấu', 480.0, 34.0, 35.0, 18.0, 3.2, 680.0, CURRENT_DATE - 1, '19:15:00');

  -- 8.3. NGÀY TRƯỚC (CURRENT_DATE - 2): TỔNG 1,710 KCAL
  INSERT INTO public.daily_meals (
    user_id, food_id, dish_name, meal_time, meal_source, quantity, serving_size,
    calories, protein, carbs, fat, fiber, sodium, consumed_date, consumed_time
  ) VALUES
    (v_uid, f_xoi_ga, 'Xôi Gà Xé Nấm Hương Hạt Sen', 'Sáng', 'eating_out', 1.0, '1 Hộp vừa', 560.0, 27.0, 78.0, 14.0, 3.2, 1340.0, CURRENT_DATE - 2, '07:45:00'),
    (v_uid, NULL, 'Cơm Gà Xối Mỡ Da Giòn', 'Trưa', 'eating_out', 1.0, '1 Dĩa góc tư đùi', 740.0, 38.0, 82.0, 28.0, 2.0, 1820.0, CURRENT_DATE - 2, '12:00:00'),
    (v_uid, NULL, 'Táo tươi Envy + Hạt hạnh nhân', 'Ăn vặt', 'home_cooking', 1.0, '1 Đĩa nhỏ', 90.0, 3.0, 15.0, 3.5, 2.8, 10.0, CURRENT_DATE - 2, '16:00:00'),
    (v_uid, f_salad, 'Salad Ức Gà Sốt Mè Rang', 'Tối', 'eating_out', 1.0, '1 Dĩa chuẩn', 320.0, 28.0, 14.0, 15.0, 4.8, 780.0, CURRENT_DATE - 2, '19:30:00');

  -- 8.4. NGÀY TRƯỚC (CURRENT_DATE - 3): TỔNG 1,630 KCAL
  INSERT INTO public.daily_meals (
    user_id, food_id, dish_name, meal_time, meal_source, quantity, serving_size,
    calories, protein, carbs, fat, fiber, sodium, consumed_date, consumed_time
  ) VALUES
    (v_uid, f_hu_tieu, 'Hủ Tiếu Nam Vang Chuẩn Vị', 'Sáng', 'eating_out', 1.0, '1 Tô chuẩn', 490.0, 26.0, 65.0, 14.0, 2.4, 1820.0, CURRENT_DATE - 3, '08:15:00'),
    (v_uid, f_bun_cha, 'Bún Chả Hà Nội', 'Trưa', 'eating_out', 1.0, '1 Suất tiêu chuẩn', 580.0, 28.0, 70.0, 20.0, 3.4, 1680.0, CURRENT_DATE - 3, '12:30:00'),
    (v_uid, f_sua_chua, 'Sữa chua không đường', 'Ăn vặt', 'home_cooking', 1.0, '1 Hộp 100g', 110.0, 10.0, 6.0, 1.0, 0.5, 45.0, CURRENT_DATE - 3, '15:15:00'),
    (v_uid, NULL, 'Thăn bò xào măng tây + Khoai tây', 'Tối', 'home_cooking', 1.0, '1 Dĩa tự nấu', 450.0, 38.0, 28.0, 12.0, 4.0, 720.0, CURRENT_DATE - 3, '19:00:00');

  -- 8.5. NGÀY TRƯỚC (CURRENT_DATE - 4): TỔNG 1,650 KCAL
  INSERT INTO public.daily_meals (
    user_id, food_id, dish_name, meal_time, meal_source, quantity, serving_size,
    calories, protein, carbs, fat, fiber, sodium, consumed_date, consumed_time
  ) VALUES
    (v_uid, NULL, 'Bánh Cuốn Nóng Thịt Băm Chả Lụa', 'Sáng', 'eating_out', 1.0, '1 Đĩa chuẩn', 460.0, 21.0, 62.0, 13.0, 2.5, 1520.0, CURRENT_DATE - 4, '07:30:00'),
    (v_uid, NULL, 'Cơm Rang Dưa Bò Hà Nội', 'Trưa', 'eating_out', 1.0, '1 Dĩa chuẩn', 680.0, 28.0, 85.0, 24.0, 3.2, 1940.0, CURRENT_DATE - 4, '12:15:00'),
    (v_uid, NULL, 'Canh sườn non rau củ + Cơm lứt', 'Tối', 'home_cooking', 1.0, '1 Tô canh lớn', 510.0, 32.0, 48.0, 16.0, 4.5, 980.0, CURRENT_DATE - 4, '19:15:00');

  -- 8.6. NGÀY TRƯỚC (CURRENT_DATE - 5): TỔNG 1,670 KCAL
  INSERT INTO public.daily_meals (
    user_id, food_id, dish_name, meal_time, meal_source, quantity, serving_size,
    calories, protein, carbs, fat, fiber, sodium, consumed_date, consumed_time
  ) VALUES
    (v_uid, NULL, 'Phở Gà Ta Lá Chanh', 'Sáng', 'eating_out', 1.0, '1 Tô thanh ngọt', 460.0, 30.0, 56.0, 12.0, 1.8, 1650.0, CURRENT_DATE - 5, '08:00:00'),
    (v_uid, NULL, 'Bún Đậu Mắm Tôm Mẹt Tiêu Chuẩn', 'Trưa', 'eating_out', 1.0, '1 Mẹt đậu thịt', 650.0, 32.0, 68.0, 26.0, 3.2, 1850.0, CURRENT_DATE - 5, '12:30:00'),
    (v_uid, NULL, 'Nước mía tươi tắc', 'Ăn vặt', 'eating_out', 1.0, '1 Ly 400ml', 140.0, 0.5, 34.0, 0.0, 0.8, 15.0, CURRENT_DATE - 5, '15:30:00'),
    (v_uid, NULL, 'Tôm sú rim thịt nạc + Bông cải hấp', 'Tối', 'home_cooking', 1.0, '1 Khẩu phần tự nấu', 420.0, 36.0, 25.0, 11.0, 4.0, 820.0, CURRENT_DATE - 5, '19:00:00');

  -- 8.7. NGÀY TRƯỚC (CURRENT_DATE - 6): TỔNG 1,670 KCAL
  INSERT INTO public.daily_meals (
    user_id, food_id, dish_name, meal_time, meal_source, quantity, serving_size,
    calories, protein, carbs, fat, fiber, sodium, consumed_date, consumed_time
  ) VALUES
    (v_uid, NULL, 'Bánh Mì Chảo Đầy Đủ (Pate, Bò, Trứng)', 'Sáng', 'eating_out', 1.0, '1 Chảo nóng + 1 Bánh', 670.0, 34.0, 56.0, 34.0, 3.0, 1820.0, CURRENT_DATE - 6, '08:30:00'),
    (v_uid, NULL, 'Cơm Sườn Nướng Mật Ong', 'Trưa', 'eating_out', 1.0, '1 Dĩa chuẩn', 620.0, 32.0, 74.0, 20.0, 2.4, 1580.0, CURRENT_DATE - 6, '12:15:00'),
    (v_uid, NULL, 'Đậu phụ sốt cà chua + Canh rau muống', 'Tối', 'home_cooking', 1.0, '1 Mâm cơm gia đình', 380.0, 24.0, 38.0, 12.0, 4.8, 890.0, CURRENT_DATE - 6, '19:00:00');
END $$;

-- ==================================================================================
-- PHẦN 9: NẠP DỮ LIỆU CÔNG THỨC MÓN TỰ NẤU, NƯỚC UỐNG, NHẮC NHỞ, YÊU THÍCH & AI
-- ==================================================================================
DO $$
DECLARE
  v_uid UUID;
  f_pho BIGINT;
  f_com_tam BIGINT;
  f_bun_bo BIGINT;
  f_banh_mi BIGINT;
  f_ca_hoi BIGINT;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'test@gmail.com' LIMIT 1;
  IF v_uid IS NULL THEN RETURN; END IF;

  SELECT id INTO f_pho FROM public.foods WHERE name = 'Phở Bò Tái Nạm' LIMIT 1;
  SELECT id INTO f_com_tam FROM public.foods WHERE name = 'Cơm Tấm Sườn Bì Chả' LIMIT 1;
  SELECT id INTO f_bun_bo FROM public.foods WHERE name = 'Bún Bò Huế Chuẩn Vị' LIMIT 1;
  SELECT id INTO f_banh_mi FROM public.foods WHERE name = 'Bánh Mì Thịt Nguội Pate Truyền Thống' LIMIT 1;
  SELECT id INTO f_ca_hoi FROM public.foods WHERE name = 'Cá hồi phi lê tươi Na Uy' LIMIT 1;

  -- 9.1 Sổ tay món tự nấu (User Recipes)
  DELETE FROM public.user_recipes WHERE user_id = v_uid;
  INSERT INTO public.user_recipes (user_id, recipe_name, cooking_method, total_weight, total_calories, protein, carbs, fat, ingredients_json)
  VALUES
    (v_uid, 'Ức gà áp chảo sốt tiêu đen kèm khoai lang mật', 'stir_fry', 350.0, 420.0, 46.0, 32.0, 8.5,
     '[{"name": "Ức gà phi lê tươi (sống)", "weight": 200, "cookingMethod": "stir_fry"}, {"name": "Khoai lang mật luộc / hấp", "weight": 150, "cookingMethod": "boil_steam"}]'::jsonb),
    (v_uid, 'Salad cá hồi Na Uy áp chảo sốt mè rang bắp ngọt', 'grilled', 300.0, 490.0, 34.0, 24.0, 26.0,
     '[{"name": "Cá hồi phi lê tươi Na Uy", "weight": 150, "cookingMethod": "grilled"}, {"name": "Xà lách búp mỡ tươi", "weight": 100, "cookingMethod": "none"}, {"name": "Ngô ngọt hạt luộc", "weight": 50, "cookingMethod": "boil_steam"}]'::jsonb),
    (v_uid, 'Thịt thăn bò tươi xào măng tây và nấm đùi gà', 'stir_fry', 320.0, 380.0, 42.0, 14.0, 12.0,
     '[{"name": "Thịt thăn bò tươi nạc (sống)", "weight": 180, "cookingMethod": "stir_fry"}, {"name": "Măng tây xanh non", "weight": 80, "cookingMethod": "stir_fry"}, {"name": "Nấm đùi gà tươi", "weight": 60, "cookingMethod": "stir_fry"}]'::jsonb);

  -- 9.2 Nhật ký uống nước hôm nay (Water Logs: 7 lần - Tổng 2,100 ml)
  DELETE FROM public.water_logs WHERE user_id = v_uid AND consumed_date = CURRENT_DATE;
  INSERT INTO public.water_logs (user_id, amount_ml, consumed_date, consumed_time)
  VALUES
    (v_uid, 300, CURRENT_DATE, '07:15:00'),
    (v_uid, 350, CURRENT_DATE, '09:30:00'),
    (v_uid, 250, CURRENT_DATE, '11:45:00'),
    (v_uid, 400, CURRENT_DATE, '14:20:00'),
    (v_uid, 350, CURRENT_DATE, '16:30:00'),
    (v_uid, 250, CURRENT_DATE, '18:50:00'),
    (v_uid, 200, CURRENT_DATE, '21:00:00');

  -- 9.3 Món ăn yêu thích / Đánh dấu (User Favorite Foods)
  DELETE FROM public.user_favorite_foods WHERE user_id = v_uid;
  IF f_pho IS NOT NULL THEN
    INSERT INTO public.user_favorite_foods (user_id, food_id, custom_name) VALUES (v_uid, f_pho, 'Phở bò tái nạm ruột') ON CONFLICT DO NOTHING;
  END IF;
  IF f_com_tam IS NOT NULL THEN
    INSERT INTO public.user_favorite_foods (user_id, food_id, custom_name) VALUES (v_uid, f_com_tam, 'Cơm tấm sườn bì chả ăn trưa') ON CONFLICT DO NOTHING;
  END IF;
  IF f_bun_bo IS NOT NULL THEN
    INSERT INTO public.user_favorite_foods (user_id, food_id, custom_name) VALUES (v_uid, f_bun_bo, 'Bún bò Huế sáng cuối tuần') ON CONFLICT DO NOTHING;
  END IF;
  IF f_ca_hoi IS NOT NULL THEN
    INSERT INTO public.user_favorite_foods (user_id, food_id, custom_name) VALUES (v_uid, f_ca_hoi, 'Cá hồi Na Uy giàu Omega-3') ON CONFLICT DO NOTHING;
  END IF;

  -- 9.4 Cấu hình thông báo nhắc nhở (User Reminders)
  INSERT INTO public.user_reminders (
    user_id, all_notifications_enabled, water_reminder_enabled, water_interval_hours,
    water_start_time, water_end_time, water_sound_and_vibrate,
    breakfast_reminder_enabled, breakfast_time,
    lunch_reminder_enabled, lunch_time,
    dinner_reminder_enabled, dinner_time,
    snack_reminder_enabled, snack_time,
    weight_reminder_enabled, weight_day_of_week, weight_time
  ) VALUES (
    v_uid, TRUE, TRUE, 2.0, '07:00:00', '21:30:00', TRUE,
    TRUE, '07:30:00', TRUE, '12:00:00', TRUE, '19:00:00',
    TRUE, '15:30:00', TRUE, 'Chủ Nhật', '07:00:00'
  ) ON CONFLICT (user_id) DO UPDATE SET
    all_notifications_enabled = TRUE,
    water_reminder_enabled = TRUE,
    breakfast_reminder_enabled = TRUE,
    lunch_reminder_enabled = TRUE,
    dinner_reminder_enabled = TRUE;

  -- 9.5 Lịch sử phân tích AI Gemini Pro (AI Nutrition Logs)
  DELETE FROM public.ai_nutrition_logs WHERE user_id = v_uid;
  INSERT INTO public.ai_nutrition_logs (user_id, raw_input_text, parsed_result, estimated_calories, accuracy_rate)
  VALUES
    (v_uid, 'Trưa nay ăn 1 tô phở bò tái nạm thêm 1 quả trứng trần và 2 chiếc quẩy giòn',
     '{"dish": "Phở Bò Tái Nạm", "portion": "1 Tô tiêu chuẩn", "toppings": ["Trứng trần", "Quẩy giòn"], "calories": 715, "protein": 40.5, "carbs": 74.5, "fat": 26.5}'::jsonb,
     715.0, 97.5),
    (v_uid, 'Tự nấu tối: 200g ức gà áp chảo ít dầu với 100g bông cải xanh luộc và 1 củ khoai lang 150g',
     '{"dish": "Mâm cơm ức gà khoai lang", "ingredients": [{"name": "Ức gà", "weight": 200, "cooking": "stir_fry"}, {"name": "Bông cải xanh", "weight": 100, "cooking": "boil"}, {"name": "Khoai lang", "weight": 150, "cooking": "steam"}], "calories": 420, "protein": 48.0, "carbs": 36.0, "fat": 6.5}'::jsonb,
     420.0, 98.0);

  -- 9.6 Thiết bị kiểm thử (User Devices)
  DELETE FROM public.user_devices WHERE user_id = v_uid;
  INSERT INTO public.user_devices (user_id, device_name, device_type, push_token)
  VALUES
    (v_uid, 'iPhone 15 Pro (iOS 18.2)', 'mobile', 'ExponentPushToken[demo-token-15-pro]'),
    (v_uid, 'Samsung Galaxy S24 Ultra (Android 14)', 'mobile', 'ExponentPushToken[demo-token-s24-ultra]');
END $$;

-- ==================================================================================
-- PHẦN 10: HÀM TIỆN ÍCH DÀNH CHO GIẢNG VIÊN / TESTER (ONE-CLICK SEED FOR ANY ACCOUNT)
-- Hướng dẫn: Gọi SELECT public.seed_user_demo_data('email_cua_ban@gmail.com');
-- để nạp ngay tức thì trọn bộ dữ liệu cho tài khoản bất kỳ mà bạn vừa đăng ký trên app!
-- ==================================================================================
CREATE OR REPLACE FUNCTION public.seed_user_demo_data(p_user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  v_target_id UUID;
  f_pho BIGINT;
  f_com_tam BIGINT;
  f_bun_bo BIGINT;
  f_salad BIGINT;
  f_sua_chua BIGINT;
BEGIN
  -- 1. Tìm user ID theo email
  SELECT id INTO v_target_id FROM auth.users WHERE LOWER(email) = LOWER(TRIM(p_user_email)) LIMIT 1;
  IF v_target_id IS NULL THEN
    RETURN 'LỖI: Không tìm thấy tài khoản với email "' || p_user_email || '" trong hệ thống auth.users. Vui lòng đăng ký tài khoản trên app trước!';
  END IF;

  -- 2. Cập nhật hồ sơ sức khỏe chuẩn
  INSERT INTO public.profiles (
    id, full_name, avatar_url, gender, age, height, current_weight, target_weight,
    activity_level, bmr, tdee, daily_calorie_goal, goal_type, target_days, subscription_tier
  ) VALUES (
    v_target_id, 'Người Dùng Kiểm Thử', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
    'Nam', 28, 172.0, 71.5, 66.0, 'light', 1650.0, 2268.0, 1768.0, 'Giảm cân', 60, 'Pro'
  ) ON CONFLICT (id) DO UPDATE SET
    current_weight = 71.5,
    target_weight = 66.0,
    daily_calorie_goal = 1768.0,
    goal_type = 'Giảm cân',
    target_days = 60,
    subscription_tier = 'Pro';

  -- 3. Nạp 14 ngày cân nặng
  INSERT INTO public.weight_history (user_id, weight, recorded_date, notes)
  VALUES
    (v_target_id, 74.2, CURRENT_DATE - 13, 'Bắt đầu lộ trình giảm cân cùng NutriTrack'),
    (v_target_id, 74.0, CURRENT_DATE - 12, 'Tập gym 45 phút, uống 2L nước'),
    (v_target_id, 73.8, CURRENT_DATE - 11, 'Ăn thanh đạm, cắt giảm nước ngọt'),
    (v_target_id, 73.7, CURRENT_DATE - 10, 'Cân sáng sớm lúc bụng rỗng'),
    (v_target_id, 73.5, CURRENT_DATE - 9,  'Chạy bộ nhẹ nhàng quanh công viên'),
    (v_target_id, 73.4, CURRENT_DATE - 8,  'Uống đủ nước, ngủ đủ 8 tiếng'),
    (v_target_id, 73.1, CURRENT_DATE - 7,  'Hoàn thành tuần đầu tiên'),
    (v_target_id, 72.9, CURRENT_DATE - 6,  'Cơ thể nhẹ nhõm, tiêu hóa tốt'),
    (v_target_id, 72.6, CURRENT_DATE - 5,  'Tự nấu bữa tối lành mạnh'),
    (v_target_id, 72.4, CURRENT_DATE - 4,  'Tập kháng lực và cardio nhẹ'),
    (v_target_id, 72.2, CURRENT_DATE - 3,  'Kiểm soát calo chuẩn theo MacroRing'),
    (v_target_id, 72.0, CURRENT_DATE - 2,  'Đạt mốc 72.0kg!'),
    (v_target_id, 71.8, CURRENT_DATE - 1,  'Ăn tối nhiều rau củ và cá hồi'),
    (v_target_id, 71.5, CURRENT_DATE,      'Hôm nay cân lúc vừa thức dậy - rất hài lòng')
  ON CONFLICT (user_id, recorded_date) DO UPDATE SET weight = EXCLUDED.weight, notes = EXCLUDED.notes;

  -- 4. Tìm ID món ăn
  SELECT id INTO f_pho FROM public.foods WHERE name = 'Phở Bò Tái Nạm' LIMIT 1;
  SELECT id INTO f_com_tam FROM public.foods WHERE name = 'Cơm Tấm Sườn Bì Chả' LIMIT 1;
  SELECT id INTO f_bun_bo FROM public.foods WHERE name = 'Bún Bò Huế Chuẩn Vị' LIMIT 1;
  SELECT id INTO f_salad FROM public.foods WHERE name = 'Salad Ức Gà Sốt Mè Rang' LIMIT 1;
  SELECT id INTO f_sua_chua FROM public.foods WHERE name = 'Sữa chua Hy Lạp không đường' LIMIT 1;

  -- 5. Xóa và nạp 7 ngày bữa ăn
  DELETE FROM public.daily_meals WHERE user_id = v_target_id AND consumed_date >= (CURRENT_DATE - 6);
  INSERT INTO public.daily_meals (
    user_id, food_id, dish_name, meal_time, meal_source, quantity, serving_size,
    calories, protein, carbs, fat, fiber, sodium, consumed_date, consumed_time
  ) VALUES
    (v_target_id, f_pho, 'Phở Bò Tái Nạm (Hà Nội)', 'Sáng', 'eating_out', 1.0, '1 Tô tiêu chuẩn', 520.0, 32.0, 58.0, 16.0, 2.5, 1850.0, CURRENT_DATE, '07:30:00'),
    (v_target_id, f_com_tam, 'Cơm Tấm Sườn Bì Chả (Sài Gòn)', 'Trưa', 'eating_out', 1.0, '1 Dĩa chuẩn', 650.0, 34.0, 75.0, 22.0, 2.8, 1640.0, CURRENT_DATE, '12:15:00'),
    (v_target_id, f_sua_chua, 'Sữa chua Hy Lạp + Hạt chia', 'Ăn vặt', 'home_cooking', 1.0, '1 Cốc 150g', 130.0, 12.0, 10.0, 4.0, 3.0, 60.0, CURRENT_DATE, '15:30:00'),
    (v_target_id, f_salad, 'Mâm cơm: Ức gà áp chảo + Bông cải hấp + Khoai lang', 'Tối', 'home_cooking', 1.0, '1 Mâm cân 350g', 380.0, 42.0, 22.0, 8.0, 4.5, 750.0, CURRENT_DATE, '19:00:00'),
    -- Ngày hôm qua
    (v_target_id, f_bun_bo, 'Bún Bò Huế Chuẩn Vị', 'Trưa', 'eating_out', 1.0, '1 Tô nạm chả cua', 560.0, 32.0, 64.0, 18.0, 3.0, 2100.0, CURRENT_DATE - 1, '12:30:00'),
    (v_target_id, f_salad, 'Salad Ức Gà Sốt Mè Rang', 'Tối', 'eating_out', 1.0, '1 Dĩa chuẩn', 320.0, 28.0, 14.0, 15.0, 4.8, 780.0, CURRENT_DATE - 1, '19:30:00'),
    -- Các ngày trước
    (v_target_id, f_pho, 'Phở Bò Tái Nạm', 'Sáng', 'eating_out', 1.0, '1 Tô chuẩn', 520.0, 32.0, 58.0, 16.0, 2.5, 1850.0, CURRENT_DATE - 2, '08:00:00'),
    (v_target_id, f_com_tam, 'Cơm Tấm Sườn Bì Chả', 'Trưa', 'eating_out', 1.0, '1 Dĩa chuẩn', 650.0, 34.0, 75.0, 22.0, 2.8, 1640.0, CURRENT_DATE - 2, '12:00:00'),
    (v_target_id, f_bun_bo, 'Bún Bò Huế', 'Trưa', 'eating_out', 1.0, '1 Tô chuẩn', 560.0, 32.0, 64.0, 18.0, 3.0, 2100.0, CURRENT_DATE - 3, '12:30:00'),
    (v_target_id, f_pho, 'Phở Gà Ta Lá Chanh', 'Sáng', 'eating_out', 1.0, '1 Tô chuẩn', 460.0, 30.0, 56.0, 12.0, 1.8, 1650.0, CURRENT_DATE - 4, '07:30:00'),
    (v_target_id, f_com_tam, 'Cơm Rang Dưa Bò', 'Trưa', 'eating_out', 1.0, '1 Dĩa chuẩn', 680.0, 28.0, 85.0, 24.0, 3.2, 1940.0, CURRENT_DATE - 5, '12:15:00'),
    (v_target_id, f_salad, 'Mâm cơm nạc heo bông cải', 'Tối', 'home_cooking', 1.0, '1 Mâm tự nấu', 420.0, 36.0, 25.0, 11.0, 4.0, 820.0, CURRENT_DATE - 6, '19:00:00');

  -- 6. Nạp nước uống & công thức
  INSERT INTO public.user_reminders (user_id) VALUES (v_target_id) ON CONFLICT DO NOTHING;
  DELETE FROM public.water_logs WHERE user_id = v_target_id AND consumed_date = CURRENT_DATE;
  INSERT INTO public.water_logs (user_id, amount_ml, consumed_date, consumed_time)
  VALUES
    (v_target_id, 300, CURRENT_DATE, '07:15:00'),
    (v_target_id, 350, CURRENT_DATE, '09:30:00'),
    (v_target_id, 400, CURRENT_DATE, '14:20:00'),
    (v_target_id, 350, CURRENT_DATE, '16:30:00'),
    (v_target_id, 250, CURRENT_DATE, '18:50:00'),
    (v_target_id, 350, CURRENT_DATE, '21:00:00');

  RETURN 'THÀNH CÔNG: Đã nạp đầy đủ 14 ngày lịch sử cân nặng, 7 ngày bữa ăn, nước uống và hồ sơ mục tiêu mẫu cho tài khoản ' || p_user_email || '!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
