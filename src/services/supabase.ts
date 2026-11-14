import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, User } from '@supabase/supabase-js';
import { CONFIG } from '../constants/config';
import { Profile, Food, DailyMeal, WeightHistory, MealTimeType } from '../types/database';

// Khởi tạo Supabase client với cấu hình bảo toàn phiên đăng nhập trên Mobile
export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

type SupabaseErrorInfo = {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
  status?: number;
};

const getSupabaseErrorInfo = (error: unknown): SupabaseErrorInfo => {
  if (typeof error === 'object' && error !== null) {
    const value = error as Record<string, unknown>;
    return {
      code: typeof value.code === 'string' ? value.code : undefined,
      message: typeof value.message === 'string' ? value.message : 'Lỗi chưa xác định từ Supabase.',
      details: typeof value.details === 'string' ? value.details : undefined,
      hint: typeof value.hint === 'string' ? value.hint : undefined,
      status: typeof value.status === 'number' ? value.status : undefined,
    };
  }
  return { message: error instanceof Error ? error.message : String(error) };
};

const getSupabaseRemediation = (info: SupabaseErrorInfo): string => {
  const text = `${info.code ?? ''} ${info.message}`.toLowerCase();
  if (text.includes('row-level security') || info.code === '42501') {
    return 'Kiểm tra RLS của public.profiles: cần SELECT/INSERT/UPDATE cho authenticated với điều kiện auth.uid() = id. Không tắt RLS và không dùng service-role key trong ứng dụng.';
  }
  if (text.includes('email_not_confirmed') || text.includes('email not confirmed')) {
    return 'Xác nhận email từ hộp thư trước khi đăng nhập; kiểm tra trạng thái người dùng trong Supabase Authentication > Users.';
  }
  if (text.includes('invalid_credentials') || text.includes('invalid login credentials')) {
    return 'Kiểm tra email/mật khẩu và xác nhận email. Nếu quên mật khẩu, dùng chức năng Quên mật khẩu.';
  }
  if (text.includes('already registered') || text.includes('user_already_exists')) {
    return 'Email đã có tài khoản. Hãy đăng nhập hoặc dùng Quên mật khẩu thay vì đăng ký lại.';
  }
  if (text.includes('weak_password') || text.includes('password should')) {
    return 'Mật khẩu chưa đáp ứng chính sách của dự án. Kiểm tra độ dài và yêu cầu mật khẩu trong Supabase Authentication > Settings.';
  }
  if (text.includes('signup is disabled') || text.includes('signups not allowed')) {
    return 'Bật đăng ký email trong Supabase Authentication > Providers > Email, rồi thử lại.';
  }
  if (info.code === '23502' || info.code === '42703' || info.code === '42P01') {
    return 'Schema database không khớp với ứng dụng. Kiểm tra bảng public.profiles và các cột profile mà ứng dụng đang ghi.';
  }
  if (text.includes('fetch') || text.includes('network') || text.includes('failed to fetch')) {
    return 'Kiểm tra kết nối mạng, SUPABASE_URL, cấu hình DNS và quyền truy cập dự án Supabase.';
  }
  return 'Dùng code/message/details/hint ở log để kiểm tra cấu hình Supabase Auth, schema hoặc policy liên quan.';
};

export const formatSupabaseError = (error: unknown): string => {
  const info = getSupabaseErrorInfo(error);
  const fields = [
    info.code ? `Code: ${info.code}` : null,
    info.status ? `HTTP: ${info.status}` : null,
    `Chi tiết: ${info.message}`,
    info.details ? `Details: ${info.details}` : null,
    info.hint ? `Hint: ${info.hint}` : null,
    `Cách kiểm tra: ${getSupabaseRemediation(info)}`,
  ].filter((field): field is string => Boolean(field));
  return fields.join('\n');
};

export const logSupabaseError = (operation: string, error: unknown): string => {
  const info = getSupabaseErrorInfo(error);
  const remediation = getSupabaseRemediation(info);
  console.error(`[Supabase][${operation}]`, {
    code: info.code,
    status: info.status,
    message: info.message,
    details: info.details,
    hint: info.hint,
    remediation,
  });
  return formatSupabaseError(error);
};

export const logUnexpectedError = (operation: string, error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[App][${operation}]`, {
    name: error instanceof Error ? error.name : 'UnknownError',
    message,
  });
  return `${message}\n\nKiểm tra log [App][${operation}] trong console để xem chi tiết.`;
};

// Helper lấy ngày hôm nay theo định dạng YYYY-MM-DD
export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ==========================================
// 1. HELPER API CHO BẢNG PROFILES
// ==========================================

/**
 * Lấy thông tin profile của người dùng theo UUID
 */
export const getUserProfile = async (userId: string): Promise<{ data: Profile | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      logSupabaseError('profiles.select', error);
      return { data: null, error };
    }
    return { data: data as Profile, error: null };
  } catch (err) {
    logUnexpectedError('profiles.select', err);
    return { data: null, error: err };
  }
};

/**
 * Cập nhật thông tin profile của người dùng
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Profile>
): Promise<{ data: Profile | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logSupabaseError('profiles.update', error);
      return { data: null, error };
    }
    return { data: data as Profile, error: null };
  } catch (err) {
    logUnexpectedError('profiles.update', err);
    return { data: null, error: err };
  }
};

/**
 * Tạo mới hoặc cập nhật profile (upsert)
 */
export const upsertUserProfile = async (
  profile: Pick<Profile, 'id'> & Partial<Omit<Profile, 'id'>>
): Promise<{ data: Profile | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      logSupabaseError('profiles.upsert', error);
      return { data: null, error };
    }
    return { data: data as Profile, error: null };
  } catch (err) {
    logUnexpectedError('profiles.upsert', err);
    return { data: null, error: err };
  }
};

const getNumericMetadata = (metadata: Record<string, unknown>, key: string): number | null => {
  const value = metadata[key];
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const ensureUserProfile = async (
  user: User
): Promise<{ data: Profile | null; error: unknown }> => {
  const { data: existingProfile, error: selectError } = await getUserProfile(user.id);
  if (selectError) return { data: null, error: selectError };
  if (existingProfile) return { data: existingProfile, error: null };

  const userMetadata = user.user_metadata ?? {};
  const profileMetadata =
    typeof userMetadata.app_profile === 'object' && userMetadata.app_profile !== null
      ? (userMetadata.app_profile as Record<string, unknown>)
      : {};
  const metadataName =
    typeof profileMetadata.full_name === 'string'
      ? profileMetadata.full_name
      : typeof userMetadata.full_name === 'string'
        ? userMetadata.full_name
        : null;
  const gender = typeof profileMetadata.gender === 'string' ? profileMetadata.gender : null;
  const goalType = typeof profileMetadata.goal_type === 'string' ? profileMetadata.goal_type : null;

  return upsertUserProfile({
    id: user.id,
    full_name: metadataName,
    gender,
    age: getNumericMetadata(profileMetadata, 'age'),
    height: getNumericMetadata(profileMetadata, 'height'),
    current_weight: getNumericMetadata(profileMetadata, 'current_weight'),
    target_weight: getNumericMetadata(profileMetadata, 'target_weight'),
    goal_type: goalType,
    daily_calorie_goal: getNumericMetadata(profileMetadata, 'daily_calorie_goal'),
  });
};

// ==========================================
// 2. HELPER API CHO BẢNG FOODS
// ==========================================

/**
 * Lấy toàn bộ danh sách thực phẩm, có hỗ trợ tìm kiếm theo tên
 */
export const getAllFoods = async (searchQuery?: string): Promise<{ data: Food[]; error: any }> => {
  try {
    let query = supabase.from('foods').select('*').order('name', { ascending: true });

    if (searchQuery && searchQuery.trim() !== '') {
      query = query.ilike('name', `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Lỗi khi lấy danh sách foods:', error.message);
      return { data: [], error };
    }
    return { data: (data as Food[]) || [], error: null };
  } catch (err) {
    console.error('Lỗi ngoại lệ khi lấy foods:', err);
    return { data: [], error: err };
  }
};

/**
 * Lấy thông tin một thực phẩm theo ID
 */
export const getFoodById = async (foodId: number): Promise<{ data: Food | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .eq('id', foodId)
      .single();

    if (error) {
      console.error('Lỗi khi lấy chi tiết food:', error.message);
      return { data: null, error };
    }
    return { data: data as Food, error: null };
  } catch (err) {
    console.error('Lỗi ngoại lệ khi lấy chi tiết food:', err);
    return { data: null, error: err };
  }
};

// ==========================================
// 3. HELPER API CHO BẢNG DAILY_MEALS
// ==========================================

/**
 * Lấy danh sách các món ăn đã tiêu thụ hôm nay của user (join với bảng foods)
 */
export const getTodayMeals = async (
  userId: string,
  dateStr?: string
): Promise<{ data: DailyMeal[]; error: any }> => {
  try {
    const targetDate = dateStr || getTodayDateString();

    const { data, error } = await supabase
      .from('daily_meals')
      .select('*, foods:food_id(*)')
      .eq('user_id', userId)
      .eq('consumed_date', targetDate)
      .order('id', { ascending: true });

    if (error) {
      console.error('Lỗi khi lấy daily_meals:', error.message);
      return { data: [], error };
    }
    return { data: (data as DailyMeal[]) || [], error: null };
  } catch (err) {
    console.error('Lỗi ngoại lệ khi lấy daily_meals:', err);
    return { data: [], error: err };
  }
};

/**
 * Thêm một bữa ăn vào bảng daily_meals
 */
export const addMeal = async (
  userId: string,
  foodId: number,
  quantity: number = 1,
  mealTime: MealTimeType | string = 'Trưa',
  consumedDate?: string
): Promise<{ data: DailyMeal | null; error: any }> => {
  try {
    const targetDate = consumedDate || getTodayDateString();

    const { data, error } = await supabase
      .from('daily_meals')
      .insert({
        user_id: userId,
        food_id: foodId,
        quantity: Number(quantity),
        meal_time: mealTime,
        consumed_date: targetDate,
      })
      .select('*, foods:food_id(*)')
      .single();

    if (error) {
      console.error('Lỗi khi thêm meal:', error.message);
      return { data: null, error };
    }
    return { data: data as DailyMeal, error: null };
  } catch (err) {
    console.error('Lỗi ngoại lệ khi thêm meal:', err);
    return { data: null, error: err };
  }
};

/**
 * Lưu một bữa ăn đã qua tính toán AI (Ăn ngoài hoặc Tự nấu)
 */
export const logCalculatedMeal = async (
  userId: string,
  mealData: {
    dishName: string;
    totalCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: string;
    mealTime: MealTimeType | string;
    consumedDate?: string;
  }
): Promise<{ data: DailyMeal | null; error: any }> => {
  try {
    const targetDate = mealData.consumedDate || getTodayDateString();

    // 1. Tạo một bản ghi thực phẩm trong bảng foods
    let createdFoodId: number | null = null;
    let createdFood: Food | null = null;

    const { data: foodData, error: foodError } = await supabase
      .from('foods')
      .insert({
        name: mealData.dishName,
        serving_size: mealData.servingSize,
        calories: mealData.totalCalories,
        protein: mealData.protein,
        carbs: mealData.carbs,
        fat: mealData.fat,
      })
      .select()
      .single();

    if (!foodError && foodData) {
      createdFoodId = foodData.id;
      createdFood = foodData as Food;
    } else {
      console.warn('Lưu food phụ vào foods thất bại hoặc bảng foods chưa hỗ trợ:', foodError);
    }

    // 2. Thêm vào bảng daily_meals
    // Thử chèn đầy đủ cột mới theo schema toàn diện, nếu DB cũ chưa có cột mới thì tự động fallback
    const basicPayload = {
      user_id: userId,
      food_id: createdFoodId,
      quantity: 1,
      meal_time: mealData.mealTime,
      consumed_date: targetDate,
    };

    const fullPayload = {
      ...basicPayload,
      dish_name: mealData.dishName,
      serving_size: mealData.servingSize,
      calories: mealData.totalCalories,
      protein: mealData.protein,
      carbs: mealData.carbs,
      fat: mealData.fat,
    };

    let mealRecord: any = null;
    let mealError: any = null;

    const fullRes = await supabase
      .from('daily_meals')
      .insert(fullPayload)
      .select('*, foods:food_id(*)')
      .single();

    if (fullRes.error && fullRes.error.message?.includes('column')) {
      const basicRes = await supabase
        .from('daily_meals')
        .insert(basicPayload)
        .select('*, foods:food_id(*)')
        .single();
      mealRecord = basicRes.data;
      mealError = basicRes.error;
    } else {
      mealRecord = fullRes.data;
      mealError = fullRes.error;
    }

    if (mealError) {
      logSupabaseError('daily_meals.insert_calculated', mealError);
      return { data: null, error: mealError };
    }

    // Đảm bảo đối tượng trả về có thông tin foods
    if (mealRecord && !mealRecord.foods && createdFood) {
      mealRecord.foods = createdFood;
    }

    return { data: mealRecord as DailyMeal, error: null };
  } catch (err) {
    logUnexpectedError('meals.logCalculatedMeal', err);
    return { data: null, error: err };
  }
};

/**
 * Xóa một bản ghi bữa ăn
 */
export const deleteMeal = async (mealId: number): Promise<{ success: boolean; error: any }> => {
  try {
    const { error } = await supabase
      .from('daily_meals')
      .delete()
      .eq('id', mealId);

    if (error) {
      console.error('Lỗi khi xóa meal:', error.message);
      return { success: false, error };
    }
    return { success: true, error: null };
  } catch (err) {
    console.error('Lỗi ngoại lệ khi xóa meal:', err);
    return { success: false, error: err };
  }
};

// ==========================================
// 4. HELPER API CHO BẢNG WEIGHT_HISTORY
// ==========================================

/**
 * Lấy lịch sử cân nặng của user
 */
export const getWeightHistory = async (
  userId: string
): Promise<{ data: WeightHistory[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('weight_history')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_date', { ascending: true });

    if (error) {
      console.error('Lỗi khi lấy lịch sử cân nặng:', error.message);
      return { data: [], error };
    }
    return { data: (data as WeightHistory[]) || [], error: null };
  } catch (err) {
    console.error('Lỗi ngoại lệ khi lấy lịch sử cân nặng:', err);
    return { data: [], error: err };
  }
};

/**
 * Thêm một bản ghi cân nặng mới
 */
export const addWeightRecord = async (
  userId: string,
  weight: number,
  recordedDate?: string
): Promise<{ data: WeightHistory | null; error: any }> => {
  try {
    const targetDate = recordedDate || getTodayDateString();

    const { data, error } = await supabase
      .from('weight_history')
      .insert({
        user_id: userId,
        weight: Number(weight),
        recorded_date: targetDate,
      })
      .select()
      .single();

    if (error) {
      console.error('Lỗi khi thêm cân nặng:', error.message);
      return { data: null, error };
    }
    return { data: data as WeightHistory, error: null };
  } catch (err) {
    console.error('Lỗi ngoại lệ khi thêm cân nặng:', err);
    return { data: null, error: err };
  }
};

// ==========================================
// 5. HELPER API CHO BẢNG USER_RECIPES (CÔNG THỨC TỰ NẤU)
// ==========================================

export interface UserRecipeData {
  recipe_name: string;
  cooking_method?: string;
  total_weight?: number;
  total_calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients_json?: any;
}

export const saveUserRecipe = async (
  userId: string,
  recipe: UserRecipeData
): Promise<{ data: any | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('user_recipes')
      .insert({
        user_id: userId,
        recipe_name: recipe.recipe_name,
        cooking_method: recipe.cooking_method,
        total_weight: recipe.total_weight,
        total_calories: recipe.total_calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        ingredients_json: recipe.ingredients_json,
      })
      .select()
      .single();

    if (error) {
      console.warn('Lỗi khi lưu user_recipe:', error.message);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.warn('Lỗi ngoại lệ khi lưu user_recipe:', err);
    return { data: null, error: err };
  }
};

export const getUserRecipes = async (
  userId: string
): Promise<{ data: any[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('user_recipes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Lỗi khi lấy user_recipes:', error.message);
      return { data: [], error };
    }
    return { data: data || [], error: null };
  } catch (err) {
    console.warn('Lỗi ngoại lệ khi lấy user_recipes:', err);
    return { data: [], error: err };
  }
};
