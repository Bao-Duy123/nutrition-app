/**
 * VIETNAMESE FOOD DATA DEFINITIONS & OFFLINE SEED FALLBACK
 * Kiến trúc chuẩn Production:
 * - File này chỉ chứa TypeScript Interfaces, cấu hình phương pháp chế biến (Cooking Methods)
 *   và một tập dữ liệu hạt nhân tối giản (Fallback Cache) phòng khi người dùng offline.
 * - Toàn bộ hàng nghìn món ăn & nguyên liệu phong phú được lưu trữ trên Supabase Database.
 */

export interface RestaurantTopping {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  icon: string;
  subtitle?: string;
  colorType?: 'peach' | 'purple' | 'pink' | 'mint' | 'blue';
}

export interface RestaurantDish {
  id: string;
  name: string;
  region: string;
  category: 'pho' | 'com' | 'bun' | 'mi_hu_tieu' | 'banh_mi' | 'xoi_khac' | 'lau_an_vat';
  imageUrl?: string;
  description?: string;
  sourceBadge?: string;
  reliability?: string;
  standardPortion: {
    label: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    subtitle: string;
  };
  specialPortion: {
    label: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    subtitle: string;
  };
  toppings: RestaurantTopping[];
}

export interface RawIngredient {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  icon: string;
  category: 'meat' | 'carb' | 'veggie' | 'seafood' | 'egg_dairy' | 'tofu_bean' | 'fat_seasoning';
  imageUrl?: string;
}

export interface CookingMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  oilUsageLevel: 'none' | 'low' | 'medium' | 'high';
  addsSeasoning: boolean;
}

// ==========================================
// 1. CẤU HÌNH CÁCH CHẾ BIẾN CỐ ĐỊNH (CHO AI SUY ĐOÁN DẦU MỠ & GIA VỊ)
// ==========================================
export const COOKING_METHODS: CookingMethod[] = [
  {
    id: 'none',
    name: 'Không chọn / Ăn tươi (Tính theo calo gốc)',
    description: 'Chỉ tính lượng calo do nguyên liệu cung cấp, không cộng thêm calo',
    icon: '🚫',
    oilUsageLevel: 'none',
    addsSeasoning: false,
  },
  {
    id: 'boil_steam',
    name: 'Luộc / Hấp thanh đạm',
    description: 'Không dùng dầu mỡ hay gia vị ngọt, giữ trọn calo tự nhiên (+0 kcal)',
    icon: '💧',
    oilUsageLevel: 'none',
    addsSeasoning: false,
  },
  {
    id: 'stir_fry',
    name: 'Áp chảo / Xào ít dầu',
    description: 'AI suy đoán lượng dầu láng chảo theo khối lượng (~5-10g dầu/400g mâm)',
    icon: '🍳',
    oilUsageLevel: 'low',
    addsSeasoning: false,
  },
  {
    id: 'deep_fry',
    name: 'Chiên / Rán ngập dầu',
    description: 'AI tính tỷ lệ ngấm dầu lipid theo cấu trúc nguyên liệu và khối lượng',
    icon: '🍟',
    oilUsageLevel: 'high',
    addsSeasoning: false,
  },
  {
    id: 'braised',
    name: 'Kho / Rim / Sốt đậm vị',
    description: 'AI tính dầu phi thơm + đường caramel / sốt ướp ngấm vào thức ăn',
    icon: '🍲',
    oilUsageLevel: 'medium',
    addsSeasoning: true,
  },
  {
    id: 'grilled',
    name: 'Nướng sốt / Quết mật ong',
    description: 'AI tính mỡ hao hụt kèm dầu quết mặt bóng và sốt caramel cháy cạnh',
    icon: '🔥',
    oilUsageLevel: 'low',
    addsSeasoning: true,
  },
];

// ==========================================
// 2. TẬP DỮ LIỆU HẠT NHÂN DỰ PHÒNG (OFFLINE SEED FALLBACK)
// Giữ dung lượng app siêu nhẹ (~3KB), luôn sẵn sàng khi không có mạng
// ==========================================
export const FALLBACK_RESTAURANT_DISHES: RestaurantDish[] = [
  {
    id: 'pho_bo_tai_nam',
    name: 'Phở Bò Tái Nạm',
    region: 'Hà Nội',
    category: 'pho',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=300&q=80',
    description: 'Nước dùng hầm xương bò truyền thống, gừng nướng',
    sourceBadge: 'Dữ liệu Viện Dinh Dưỡng & Quán gia truyền',
    reliability: '~85%',
    standardPortion: { label: 'Suất Thường', calories: 520, protein: 29.5, carbs: 61.5, fat: 13.5, subtitle: 'Tô chuẩn' },
    specialPortion: { label: 'Tô Lớn / Đặc Biệt', calories: 730, protein: 44, carbs: 80, fat: 22, subtitle: 'Nhiều bánh & thịt' },
    toppings: [
      { id: 'trung_tran', name: 'Trứng trần (1 quả)', calories: 75, protein: 6, carbs: 0.5, fat: 5, icon: '💧', subtitle: '+6g protein • +5g béo', colorType: 'peach' },
      { id: 'quay_gion', name: 'Quẩy giòn (2 chiếc)', calories: 120, protein: 2.5, carbs: 16, fat: 5.5, icon: '🥐', subtitle: '+16g tinh bột • giòn tan', colorType: 'purple' },
      { id: 'nuoc_beo', name: 'Nước béo / Nước tiết', calories: 110, protein: 1, carbs: 0, fat: 12, icon: '🥣', subtitle: '+12g chất béo tự nhiên', colorType: 'pink' },
      { id: 'thit_them', name: 'Thịt thêm (Tái / Nạm 50g)', calories: 95, protein: 14, carbs: 0, fat: 4.5, icon: '🥩', subtitle: '+14g protein nạc', colorType: 'mint' },
      { id: 'banh_them', name: 'Bánh phở thêm / Cơm thêm', calories: 150, protein: 3.5, carbs: 35, fat: 0.5, icon: '🍜', subtitle: '+35g carb năng lượng', colorType: 'blue' },
    ],
  },
  {
    id: 'com_tam_suon_bi_cha',
    name: 'Cơm Tấm Sườn Bì Chả',
    region: 'Sài Gòn',
    category: 'com',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
    description: 'Cơm tấm sườn nướng than hoa, bì giòn thính, chả trứng hấp',
    sourceBadge: 'Dữ liệu Viện Dinh Dưỡng & Quán gia truyền',
    reliability: '~88%',
    standardPortion: { label: 'Suất Thường', calories: 650, protein: 34, carbs: 75, fat: 22, subtitle: '1 sườn + bì + chả trứng' },
    specialPortion: { label: 'Tô Lớn / Đặc Biệt', calories: 880, protein: 48, carbs: 95, fat: 32, subtitle: 'Sườn cây lớn + ốp la' },
    toppings: [
      { id: 'op_la', name: 'Trứng ốp la lòng đào', calories: 90, protein: 6.5, carbs: 0.5, fat: 7, icon: '🍳', subtitle: '+6.5g protein lòng đào', colorType: 'peach' },
      { id: 'cha_trung', name: 'Chả trứng thêm 1 góc', calories: 110, protein: 7, carbs: 4, fat: 8, icon: '🥚', subtitle: '+7g đạm chả thịt', colorType: 'purple' },
      { id: 'suon_them', name: 'Sườn nướng thêm', calories: 220, protein: 20, carbs: 3, fat: 14, icon: '🍖', subtitle: '+20g protein nạc thơm', colorType: 'mint' },
      { id: 'com_them', name: 'Cơm tấm thêm 1 chén', calories: 160, protein: 3.5, carbs: 36, fat: 0.5, icon: '🍚', subtitle: '+36g carb năng lượng', colorType: 'blue' },
    ],
  },
  {
    id: 'bun_cha_ha_noi',
    name: 'Bún Chả Hà Nội',
    region: 'Hà Nội',
    category: 'bun',
    imageUrl: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=300&q=80',
    description: 'Chả nướng than hoa, bún tươi, đu đủ ngâm chua ngọt',
    sourceBadge: 'Dữ liệu Viện Dinh Dưỡng & Quán gia truyền',
    reliability: '~84%',
    standardPortion: { label: 'Suất Thường', calories: 580, protein: 28, carbs: 70, fat: 20, subtitle: 'Chả viên & chả miếng' },
    specialPortion: { label: 'Tô Lớn / Đặc Biệt', calories: 780, protein: 38, carbs: 88, fat: 28, subtitle: 'Kèm 2 nem rán giòn' },
    toppings: [
      { id: 'nem_ran', name: 'Nem rán giòn (1 chiếc)', calories: 140, protein: 7, carbs: 10, fat: 8.5, icon: '🥢', subtitle: '+7g protein nem cuốn', colorType: 'peach' },
      { id: 'cha_them', name: 'Chả viên nướng thêm', calories: 130, protein: 12, carbs: 2, fat: 8, icon: '🍢', subtitle: '+12g protein nướng', colorType: 'mint' },
      { id: 'bun_them', name: 'Bún tươi thêm 1 đĩa', calories: 120, protein: 2.5, carbs: 28, fat: 0.3, icon: '🍜', subtitle: '+28g carb bún thanh', colorType: 'blue' },
    ],
  },
  {
    id: 'hu_tieu_nam_vang',
    name: 'Hủ Tiếu Nam Vang',
    region: 'Miền Nam',
    category: 'mi_hu_tieu',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80',
    description: 'Nước lèo xương ống mực khô, tôm tươi, gan heo, thịt bằm',
    sourceBadge: 'Dữ liệu Viện Dinh Dưỡng & Quán gia truyền',
    reliability: '~86%',
    standardPortion: { label: 'Suất Thường', calories: 540, protein: 30, carbs: 65, fat: 18, subtitle: 'Tô chuẩn đầy đủ tôm thịt' },
    specialPortion: { label: 'Tô Lớn / Đặc Biệt', calories: 750, protein: 42, carbs: 85, fat: 25, subtitle: 'Thêm xí quách & tôm càng' },
    toppings: [
      { id: 'trung_cut', name: 'Trứng cút (3 quả)', calories: 45, protein: 3.5, carbs: 0.5, fat: 3.2, icon: '🥚', subtitle: '+3.5g protein tự nhiên', colorType: 'peach' },
      { id: 'tom_them', name: 'Tôm tươi thêm (3 con)', calories: 60, protein: 12, carbs: 0.5, fat: 0.8, icon: '🦐', subtitle: '+12g protein nạc hải sản', colorType: 'mint' },
      { id: 'hu_tieu_them', name: 'Hủ tiếu thêm', calories: 140, protein: 3, carbs: 32, fat: 0.5, icon: '🥣', subtitle: '+32g carb năng lượng', colorType: 'blue' },
    ],
  },
  {
    id: 'banh_mi_thit_nuong',
    name: 'Bánh Mì Thịt Nướng Pa Tê',
    region: 'Toàn quốc',
    category: 'banh_mi',
    imageUrl: 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=300&q=80',
    description: 'Vỏ giòn rụm, pa tê béo ngậy, sốt mayonnaise và dưa chua',
    sourceBadge: 'Dữ liệu Viện Dinh Dưỡng & Quán gia truyền',
    reliability: '~87%',
    standardPortion: { label: 'Suất Thường', calories: 420, protein: 18, carbs: 52, fat: 15, subtitle: '1 ổ đầy đủ tiêu chuẩn' },
    specialPortion: { label: 'Tô Lớn / Đặc Biệt', calories: 610, protein: 29, carbs: 56, fat: 28, subtitle: 'Thêm pate & thịt gấp đôi' },
    toppings: [
      { id: 'extra_pate', name: 'Thêm pa tê gan béo', calories: 80, protein: 4, carbs: 2, fat: 7, icon: '🧈', subtitle: '+7g lipid ngậy béo', colorType: 'pink' },
      { id: 'trung_op_la', name: 'Thêm 1 trứng ốp la', calories: 85, protein: 6.5, carbs: 0.5, fat: 6.5, icon: '🍳', subtitle: '+6.5g đạm quả trứng', colorType: 'peach' },
      { id: 'thit_nuong_them', name: 'Thịt nướng thêm', calories: 110, protein: 13, carbs: 2, fat: 6, icon: '🥩', subtitle: '+13g protein thơm', colorType: 'mint' },
    ],
  },
];

export const FALLBACK_RAW_INGREDIENTS: RawIngredient[] = [
  { id: 'chicken_breast', name: 'Ức gà phi lê (sống)', caloriesPer100g: 120, proteinPer100g: 23.0, carbsPer100g: 0.0, fatPer100g: 2.6, icon: '🍗', category: 'meat', imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200&q=80' },
  { id: 'brown_rice', name: 'Cơm gạo lứt huyết rồng', caloriesPer100g: 110, proteinPer100g: 2.6, carbsPer100g: 23.0, fatPer100g: 0.8, icon: '🍚', category: 'carb', imageUrl: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=200&q=80' },
  { id: 'broccoli', name: 'Bông cải xanh (luộc)', caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 6.7, fatPer100g: 0.4, icon: '🥦', category: 'veggie', imageUrl: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=200&q=80' },
  { id: 'beef_tenderloin', name: 'Thịt thăn bò tươi nạc', caloriesPer100g: 142, proteinPer100g: 26.0, carbsPer100g: 0.0, fatPer100g: 3.5, icon: '🥩', category: 'meat', imageUrl: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=200&q=80' },
  { id: 'pork_loin', name: 'Thịt thăn heo nạc', caloriesPer100g: 135, proteinPer100g: 24.0, carbsPer100g: 0.0, fatPer100g: 4.0, icon: '🥩', category: 'meat', imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=200&q=80' },
  { id: 'salmon', name: 'Cá hồi tươi phi lê', caloriesPer100g: 208, proteinPer100g: 20.0, carbsPer100g: 0.0, fatPer100g: 13.0, icon: '🐟', category: 'seafood', imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=200&q=80' },
  { id: 'egg_whole', name: 'Trứng gà nguyên quả', caloriesPer100g: 143, proteinPer100g: 12.6, carbsPer100g: 0.7, fatPer100g: 9.5, icon: '🥚', category: 'egg_dairy', imageUrl: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=200&q=80' },
  { id: 'white_rice', name: 'Cơm trắng nấu chín', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28.0, fatPer100g: 0.3, icon: '🍚', category: 'carb', imageUrl: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=200&q=80' },
  { id: 'tofu_white', name: 'Đậu phụ trắng truyền thống', caloriesPer100g: 76, proteinPer100g: 8.0, carbsPer100g: 1.9, fatPer100g: 4.8, icon: '🧈', category: 'tofu_bean', imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80' },
  { id: 'cooking_oil', name: 'Dầu ăn tinh luyện thực vật', caloriesPer100g: 884, proteinPer100g: 0.0, carbsPer100g: 0.0, fatPer100g: 100.0, icon: '🫗', category: 'fat_seasoning' },
];

// Xuất tương thích ngược (Backward compatibility)
export const VIETNAMESE_RESTAURANT_DISHES = FALLBACK_RESTAURANT_DISHES;
export const RAW_INGREDIENTS = FALLBACK_RAW_INGREDIENTS;
