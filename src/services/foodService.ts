import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { Food } from '../types/database';
import {
  RestaurantDish,
  RawIngredient,
  FALLBACK_RESTAURANT_DISHES,
  FALLBACK_RAW_INGREDIENTS,
  RestaurantTopping,
} from '../data/vietnameseFoodData';
import { fuzzyMatchVietnamese } from '../utils/searchHelper';

const STORAGE_KEY_FOODS_CACHE = '@nutrition_app_foods_cache_v1';

/**
 * Sinh danh sách món gọi thêm (toppings) thông minh theo từng loại món quán Việt
 * Áp dụng khi món ăn trong Database chưa kịp cấu hình toppings riêng.
 */
export const getDefaultToppingsForDish = (
  category: RestaurantDish['category'],
  foodName: string
): RestaurantTopping[] => {
  const nameLower = foodName.toLowerCase();

  // 1. DÒNG CƠM: Cơm tấm, Cơm sườn, Cơm gà, Cơm rang...
  if (category === 'com' || nameLower.includes('cơm')) {
    return [
      { id: 'op_la', name: 'Trứng ốp la (1 quả)', calories: 90, protein: 6.5, carbs: 0.5, fat: 7, icon: '🍳', subtitle: '+6.5g protein lòng đào', colorType: 'peach' },
      { id: 'cha_trung', name: 'Chả trứng hấp (1 miếng)', calories: 130, protein: 8, carbs: 4, fat: 9, icon: '🥮', subtitle: '+8g protein • béo bùi', colorType: 'purple' },
      { id: 'suon_them', name: 'Sườn nướng thêm (1 miếng)', calories: 240, protein: 22, carbs: 5, fat: 15, icon: '🥩', subtitle: '+22g protein nạc thơm', colorType: 'mint' },
      { id: 'bi_them', name: 'Bì heo trộn thính (30g)', calories: 85, protein: 10, carbs: 1, fat: 4.5, icon: '🥓', subtitle: '+10g protein giòn dai', colorType: 'pink' },
      { id: 'com_them', name: 'Cơm thêm (1 chén)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, icon: '🍚', subtitle: '+28g carb năng lượng', colorType: 'blue' },
      { id: 'canh_them', name: 'Canh súp / Canh khổ qua', calories: 45, protein: 2, carbs: 4, fat: 2, icon: '🥣', subtitle: 'Thanh nhiệt, ít calo', colorType: 'mint' },
    ];
  }

  // 2. DÒNG BÚN: Bún đậu mắm tôm vs Bún bò Huế / Bún chả / Bún riêu
  if (category === 'bun' || nameLower.includes('bún')) {
    if (nameLower.includes('đậu') || nameLower.includes('mẹt')) {
      return [
        { id: 'doi_sun', name: 'Dồi sụn rán (4 miếng)', calories: 165, protein: 9, carbs: 6, fat: 11, icon: '🌭', subtitle: '+9g protein • sụn sần sật', colorType: 'purple' },
        { id: 'nem_ran', name: 'Nem rán giòn (2 chiếc)', calories: 180, protein: 7, carbs: 12, fat: 11, icon: '🥟', subtitle: '+12g carb giòn rụm', colorType: 'peach' },
        { id: 'cha_com', name: 'Chả cốm chiên (2 miếng)', calories: 145, protein: 8, carbs: 10, fat: 7.5, icon: '🍘', subtitle: '+8g protein dẻo thơm', colorType: 'mint' },
        { id: 'thit_luoc', name: 'Thịt chân giò luộc (50g)', calories: 125, protein: 11, carbs: 0, fat: 9, icon: '🥩', subtitle: '+11g protein nạc', colorType: 'pink' },
        { id: 'dau_ran', name: 'Đậu phụ rán giòn (4 miếng)', calories: 110, protein: 8, carbs: 2, fat: 7.5, icon: '🧈', subtitle: '+8g đạm thực vật', colorType: 'blue' },
      ];
    }
    if (nameLower.includes('chả')) {
      return [
        { id: 'cha_vien', name: 'Chả viên nướng thêm (3 viên)', calories: 150, protein: 12, carbs: 2, fat: 10, icon: '🧆', subtitle: '+12g protein nướng than', colorType: 'mint' },
        { id: 'cha_mieng', name: 'Chả ba chỉ nướng (50g)', calories: 180, protein: 10, carbs: 1, fat: 15, icon: '🥩', subtitle: 'Đậm đà ngậy béo', colorType: 'peach' },
        { id: 'nem_cua_be', name: 'Nem cua bể giòn (1 chiếc)', calories: 160, protein: 8, carbs: 11, fat: 9.5, icon: '🥟', subtitle: 'Vỏ giòn, nhân tôm cua', colorType: 'purple' },
        { id: 'bun_them', name: 'Bún tươi thêm (1 đĩa)', calories: 120, protein: 2, carbs: 27, fat: 0.2, icon: '🍜', subtitle: '+27g carb năng lượng', colorType: 'blue' },
      ];
    }
    // Bún bò Huế / Bún riêu / Bún cá...
    return [
      { id: 'cha_cua', name: 'Chả cua / Chả bò (2 viên)', calories: 120, protein: 9, carbs: 3, fat: 8, icon: '🦀', subtitle: '+9g protein • thơm ngọt', colorType: 'peach' },
      { id: 'thit_bo_them', name: 'Nạm bò / Bắp bò thêm (50g)', calories: 110, protein: 15, carbs: 0, fat: 5.5, icon: '🥩', subtitle: '+15g protein nạc', colorType: 'mint' },
      { id: 'tiet_luoc', name: 'Tiết heo luộc (1 miếng)', calories: 45, protein: 8, carbs: 0.5, fat: 1, icon: '🩸', subtitle: '+8g protein • giàu sắt', colorType: 'pink' },
      { id: 'gio_heo', name: 'Móng giò / Giò heo thêm', calories: 210, protein: 16, carbs: 0, fat: 16, icon: '🍖', subtitle: '+16g protein & collagen', colorType: 'purple' },
      { id: 'quay_gion', name: 'Quẩy giòn (2 chiếc)', calories: 120, protein: 2.5, carbs: 16, fat: 5.5, icon: '🥐', subtitle: '+16g carb giòn tan', colorType: 'blue' },
    ];
  }

  // 3. DÒNG BÁNH MÌ: Bánh mì thịt, bánh mì chảo, bánh mì pate...
  if (category === 'banh_mi' || nameLower.includes('bánh mì')) {
    return [
      { id: 'pate_them', name: 'Pate gan thêm (30g)', calories: 115, protein: 4.5, carbs: 2, fat: 10, icon: '🥫', subtitle: '+10g chất béo thơm bùi', colorType: 'pink' },
      { id: 'op_la', name: 'Trứng ốp la (1 quả)', calories: 90, protein: 6.5, carbs: 0.5, fat: 7, icon: '🍳', subtitle: '+6.5g protein lòng đào', colorType: 'peach' },
      { id: 'cha_lua', name: 'Chả lụa / Xúc xích (40g)', calories: 95, protein: 7.5, carbs: 1.5, fat: 6.5, icon: '🥓', subtitle: '+7.5g protein nạc', colorType: 'mint' },
      { id: 'bo_thom', name: 'Bơ thơm / Sốt bơ trứng (15g)', calories: 90, protein: 0.3, carbs: 0.5, fat: 10, icon: '🧈', subtitle: 'Tăng vị béo ngậy', colorType: 'purple' },
      { id: 'pho_mai', name: 'Phô mai lát Cheddar', calories: 75, protein: 5, carbs: 0.3, fat: 6, icon: '🧀', subtitle: '+5g protein canxi', colorType: 'blue' },
    ];
  }

  // 4. DÒNG MÌ, HỦ TIẾU, MIẾN, BÁNH CANH
  if (category === 'mi_hu_tieu' || nameLower.includes('hủ tiếu') || nameLower.includes('mì') || nameLower.includes('bánh canh') || nameLower.includes('miến')) {
    return [
      { id: 'tom_them', name: 'Tôm tươi lột vỏ (3 con)', calories: 65, protein: 13, carbs: 0.5, fat: 0.8, icon: '🦐', subtitle: '+13g protein thuần khiết', colorType: 'peach' },
      { id: 'hoanh_thanh', name: 'Hoành thánh chiên (2 cái)', calories: 120, protein: 4, carbs: 12, fat: 6.5, icon: '🥟', subtitle: '+12g carb giòn thơm', colorType: 'purple' },
      { id: 'trung_cut', name: 'Trứng cút luộc (3 quả)', calories: 48, protein: 4, carbs: 0.2, fat: 3.5, icon: '🥚', subtitle: '+4g protein bùi béo', colorType: 'blue' },
      { id: 'xa_xiu', name: 'Xá xíu / Sườn thêm (50g)', calories: 130, protein: 14, carbs: 2, fat: 7.5, icon: '🥩', subtitle: '+14g protein đậm đà', colorType: 'mint' },
      { id: 'mi_them', name: 'Mì / Hủ tiếu thêm (1 vắt)', calories: 140, protein: 3.5, carbs: 30, fat: 0.5, icon: '🥣', subtitle: '+30g carb năng lượng', colorType: 'pink' },
    ];
  }

  // 5. MẶC ĐỊNH: DÒNG PHỞ (Phở bò, Phở gà, Phở sốt vang...)
  return [
    { id: 'trung_tran', name: 'Trứng trần (1 quả)', calories: 75, protein: 6, carbs: 0.5, fat: 5, icon: '💧', subtitle: '+6g protein • +5g béo', colorType: 'peach' },
    { id: 'quay_gion', name: 'Quẩy giòn (2 chiếc)', calories: 120, protein: 2.5, carbs: 16, fat: 5.5, icon: '🥐', subtitle: '+16g tinh bột • giòn tan', colorType: 'purple' },
    { id: 'nuoc_beo', name: 'Nước béo / Chén tiết', calories: 110, protein: 2, carbs: 0, fat: 11, icon: '🥣', subtitle: '+11g chất béo tự nhiên', colorType: 'pink' },
    { id: 'thit_them', name: 'Thịt bò tái / nạm thêm (50g)', calories: 105, protein: 16, carbs: 0, fat: 4.5, icon: '🥩', subtitle: '+16g protein nạc', colorType: 'mint' },
    { id: 'banh_them', name: 'Bánh phở thêm (100g)', calories: 140, protein: 2.5, carbs: 31, fat: 0.3, icon: '🍜', subtitle: '+31g carb năng lượng', colorType: 'blue' },
  ];
};

/**
 * Chuyển đổi một bản ghi Food từ Supabase sang kiểu RestaurantDish
 */
export const mapFoodToRestaurantDish = (food: Food): RestaurantDish => {
  const stdCal = Number(food.calories) || 500;
  const stdProt = Number(food.protein) || 25;
  const stdCarb = Number(food.carbs) || 60;
  const stdFat = Number(food.fat) || 15;

  let category: RestaurantDish['category'] = 'pho';
  const nameLower = food.name.toLowerCase();
  if (nameLower.includes('cơm')) category = 'com';
  else if (nameLower.includes('bún')) category = 'bun';
  else if (nameLower.includes('mì') || nameLower.includes('hủ tiếu') || nameLower.includes('miến') || nameLower.includes('bánh canh')) category = 'mi_hu_tieu';
  else if (nameLower.includes('bánh mì')) category = 'banh_mi';
  else if (nameLower.includes('xôi') || nameLower.includes('bánh cuốn') || nameLower.includes('bánh giò')) category = 'xoi_khac';
  else if (nameLower.includes('trà') || nameLower.includes('cà phê') || nameLower.includes('gà rán') || nameLower.includes('bánh xèo')) category = 'lau_an_vat';

  // Lấy topping nếu có lưu dạng JSON trong Database, hoặc tự động sinh theo loại món
  const toppings: RestaurantTopping[] = Array.isArray(food.toppings) && food.toppings.length > 0
    ? (food.toppings as RestaurantTopping[])
    : getDefaultToppingsForDish(category, food.name);

  const specialCal = food.special_calories ? Number(food.special_calories) : Math.round(stdCal * 1.35);
  const specialProt = food.special_protein ? Number(food.special_protein) : Math.round(stdProt * 1.35);
  const specialCarb = food.special_carbs ? Number(food.special_carbs) : Math.round(stdCarb * 1.35);
  const specialFat = food.special_fat ? Number(food.special_fat) : Math.round(stdFat * 1.35);

  return {
    id: String(food.id),
    name: food.name,
    region: food.region || 'Việt Nam',
    category,
    imageUrl: food.image_url || undefined,
    description: food.region ? `Món ngon đặc sản ${food.region}` : 'Khẩu phần ăn tiệm chuẩn vị truyền thống',
    sourceBadge: 'Dữ liệu Viện Dinh Dưỡng & Quán gia truyền',
    reliability: '~85%',
    standardPortion: {
      label: food.serving_size || 'Suất Thường',
      calories: stdCal,
      protein: stdProt,
      carbs: stdCarb,
      fat: stdFat,
      subtitle: 'Tô chuẩn',
    },
    specialPortion: {
      label: food.special_label || 'Tô Lớn / Đặc Biệt',
      calories: specialCal,
      protein: specialProt,
      carbs: specialCarb,
      fat: specialFat,
      subtitle: 'Nhiều bánh & thịt',
    },
    toppings,
  };
};

/**
 * Chuyển đổi một bản ghi Food từ Supabase sang kiểu RawIngredient
 */
export const mapFoodToRawIngredient = (food: Food): RawIngredient => {
  const cal = Number(food.calories) || 100;
  const prot = Number(food.protein) || 10;
  const carb = Number(food.carbs) || 10;
  const fat = Number(food.fat) || 2;

  let category: RawIngredient['category'] = 'veggie';
  let icon = '🥗';
  const nameLower = food.name.toLowerCase();

  if (nameLower.includes('gà') || nameLower.includes('bò') || nameLower.includes('heo') || nameLower.includes('lợn') || nameLower.includes('vịt')) {
    category = 'meat';
    icon = '🥩';
  } else if (nameLower.includes('cá') || nameLower.includes('tôm') || nameLower.includes('mực') || nameLower.includes('cua') || nameLower.includes('hàu')) {
    category = 'seafood';
    icon = '🐟';
  } else if (nameLower.includes('trứng') || nameLower.includes('sữa') || nameLower.includes('whey') || nameLower.includes('phô mai')) {
    category = 'egg_dairy';
    icon = '🥚';
  } else if (nameLower.includes('cơm') || nameLower.includes('gạo') || nameLower.includes('khoai') || nameLower.includes('bún') || nameLower.includes('bánh phở') || nameLower.includes('yến mạch')) {
    category = 'carb';
    icon = '🍚';
  } else if (nameLower.includes('đậu') || nameLower.includes('lạc') || nameLower.includes('hạt')) {
    category = 'tofu_bean';
    icon = '🧈';
  } else if (nameLower.includes('dầu') || nameLower.includes('bơ') || nameLower.includes('mỡ') || nameLower.includes('đường') || nameLower.includes('nước mắm')) {
    category = 'fat_seasoning';
    icon = '🫒';
  }

  return {
    id: String(food.id),
    name: food.name,
    caloriesPer100g: cal,
    proteinPer100g: prot,
    carbsPer100g: carb,
    fatPer100g: fat,
    icon,
    category,
    imageUrl: food.image_url || undefined,
  };
};

/**
 * Tìm kiếm Món ăn quán (Ăn ngoài) trực tiếp từ database Supabase
 */
export const searchRestaurantDishes = async (
  query: string = '',
  category: string = 'all',
  limit: number = 40
): Promise<RestaurantDish[]> => {
  try {
    // 1. Truy vấn cơ sở dữ liệu Supabase bảng foods
    let dbQuery = supabase
      .from('foods')
      .select('*')
      .not('serving_size', 'ilike', '%100g%') // Lấy các món ăn phần/tô/dĩa
      .order('id', { ascending: true })
      .limit(limit);

    if (query.trim() !== '') {
      dbQuery = dbQuery.ilike('name', `%${query.trim()}%`);
    }

    const { data: remoteFoods, error } = await dbQuery;

    if (!error && remoteFoods && remoteFoods.length > 0) {
      const remoteDishes = remoteFoods.map(mapFoodToRestaurantDish);
      // Lưu lại vào cache để dự phòng khi mất mạng
      AsyncStorage.setItem(STORAGE_KEY_FOODS_CACHE + '_dishes', JSON.stringify(remoteDishes)).catch(() => {});
      
      let results = remoteDishes;
      if (category !== 'all') {
        results = results.filter((d) => d.category === category);
      }
      if (query.trim() !== '') {
        results = results.filter((d) => fuzzyMatchVietnamese(d.name, query) || fuzzyMatchVietnamese(d.region, query));
      }
      return results;
    }

    // 2. Nếu không có kết quả từ mạng (offline), thử đọc từ cache đã lưu từ DB trước đó
    const cached = await AsyncStorage.getItem(STORAGE_KEY_FOODS_CACHE + '_dishes');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let results = parsed as RestaurantDish[];
        if (category !== 'all') {
          results = results.filter((d) => d.category === category);
        }
        if (query.trim() !== '') {
          results = results.filter((d) => fuzzyMatchVietnamese(d.name, query) || fuzzyMatchVietnamese(d.region, query));
        }
        return results;
      }
    }

    return [];
  } catch (err) {
    console.warn('[FoodService] Lỗi khi truy vấn món quán từ database:', err);
    return [];
  }
};

/**
 * Tìm kiếm Nguyên liệu thô (Tự nấu) trực tiếp từ database Supabase
 */
export const searchRawIngredients = async (
  query: string = '',
  category: string = 'all',
  limit: number = 50
): Promise<RawIngredient[]> => {
  try {
    // 1. Truy vấn Supabase với thực phẩm có serving_size là '100g'
    let dbQuery = supabase
      .from('foods')
      .select('*')
      .ilike('serving_size', '%100g%')
      .order('name', { ascending: true })
      .limit(limit);

    if (query.trim() !== '') {
      dbQuery = dbQuery.ilike('name', `%${query.trim()}%`);
    }

    const { data: remoteFoods, error } = await dbQuery;

    if (!error && remoteFoods && remoteFoods.length > 0) {
      const remoteIngredients = remoteFoods.map(mapFoodToRawIngredient);
      AsyncStorage.setItem(STORAGE_KEY_FOODS_CACHE + '_ingredients', JSON.stringify(remoteIngredients)).catch(() => {});

      let results = remoteIngredients;
      if (category !== 'all') {
        results = results.filter((i) => i.category === category);
      }
      if (query.trim() !== '') {
        results = results.filter((i) => fuzzyMatchVietnamese(i.name, query));
      }
      return results;
    }

    // 2. Dự phòng offline từ cache của DB
    const cached = await AsyncStorage.getItem(STORAGE_KEY_FOODS_CACHE + '_ingredients');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let results = parsed as RawIngredient[];
        if (category !== 'all') {
          results = results.filter((i) => i.category === category);
        }
        if (query.trim() !== '') {
          results = results.filter((i) => fuzzyMatchVietnamese(i.name, query));
        }
        return results;
      }
    }

    return [];
  } catch (err) {
    console.warn('[FoodService] Lỗi khi truy vấn nguyên liệu từ database:', err);
    return [];
  }
};
