import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  YStack,
  XStack,
  Text,
  Button,
  ScrollView,
  Spinner,
  View,
  Input,
} from 'tamagui';
import { TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector, useAppDispatch } from '../../src/store';
import { setProfile as setAuthProfile } from '../../src/store/slices/authSlice';
import { setProfile as setStoreProfile } from '../../src/store/slices/profileSlice';
import { setDailyCalorieGoal } from '../../src/store/slices/dietSlice';
import {
  getUserProfile,
  getWeightHistory,
  addWeightRecord,
  updateUserProfile,
  getTodayDateString,
  getMealsByDateRange,
} from '../../src/services/supabase';
import { THEME } from '../../src/constants/theme';
import { WeightHistory, Profile, DailyMeal } from '../../src/types/database';
import { useAppModal } from '../../src/components/ModalProvider';
import { calculateMealsTotal } from '../../src/utils/nutrition';
import {
  analyzeGoalWithAI,
  GoalAIAnalysis,
} from '../../src/services/goalAIService';

const getDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface DayCalorieItem {
  dayLabel: string;
  dateStr: string;
  calories: number;
  hasData: boolean;
}

const requiresScheduleAdjustment = (analysis: GoalAIAnalysis): boolean =>
  analysis.feasibilityLevel === 'hazardous' ||
  !analysis.isSafeCalorie ||
  (analysis.goalType === 'Tăng cân' && analysis.ratePerWeek > 0.6);

export default function GoalScreen() {
  const dispatch = useAppDispatch();
  const modal = useAppModal();
  const insets = useSafeAreaInsets();
  const { userId, profile } = useAppSelector((state) => state.auth);

  // Dữ liệu thể trạng cơ bản từ profile
  const currentWeight = Number(profile?.current_weight || 0);
  const targetWeight = Number(profile?.target_weight || 0);
  const targetDays = Number(profile?.target_days || 0);
  const height = Number(profile?.height || 0);
  const age = Number(profile?.age || 0);
  const gender = profile?.gender || 'Nam';
  const activityLevel = profile?.activity_level || 'moderate';

  // Lịch sử cân nặng & bữa ăn 7 ngày từ Database
  const [weightHistory, setWeightHistory] = useState<WeightHistory[]>([]);
  const [meals7Days, setMeals7Days] = useState<DailyMeal[]>([]);
  const [newWeightInput, setNewWeightInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingWeight, setIsSavingWeight] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Modal cài đặt mục tiêu
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [inputTargetWeight, setInputTargetWeight] = useState<string>('');
  const [inputTargetDays, setInputTargetDays] = useState<string>('');
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Kiểm tra người dùng đã cấu hình mục tiêu hay chưa
  const hasConfiguredGoal = Boolean(
    targetWeight > 0 &&
    targetDays > 0 &&
    currentWeight > 0 &&
    height > 0 &&
    age > 0
  );

  // Tải dữ liệu thực từ database
  const fetchData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Ngày 6 ngày trước đến hôm nay (7 ngày)
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 6);
      const startDateStr = getDateString(pastDate);
      const endDateStr = getDateString(today);

      const [profileRes, historyRes, mealsRes] = await Promise.all([
        getUserProfile(userId),
        getWeightHistory(userId),
        getMealsByDateRange(userId, startDateStr, endDateStr),
      ]);

      if (profileRes.data) {
        dispatch(setAuthProfile(profileRes.data));
        dispatch(setStoreProfile(profileRes.data));
      }

      if (historyRes.data) {
        setWeightHistory(historyRes.data);
      }

      if (mealsRes.data) {
        setMeals7Days(mealsRes.data);
      }
      const requestError = profileRes.error || historyRes.error || mealsRes.error;
      setDataError(requestError ? 'Một số dữ liệu chưa tải được. Vui lòng thử tải lại.' : null);
    } catch (err) {
      setDataError(
        err instanceof Error
          ? `Không thể tải dữ liệu: ${err.message}`
          : 'Không thể tải dữ liệu. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId, dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // PHÂN TÍCH CHUYỂN HÓA VÀ DINH DƯỠNG BẰNG AI THEO DỮ LIỆU THỰC
  const aiAnalysis: GoalAIAnalysis | null = useMemo(() => {
    if (!hasConfiguredGoal) return null;
    return analyzeGoalWithAI({
      currentWeight,
      targetWeight,
      height,
      age,
      gender,
      activityLevel,
      targetDays,
    });
  }, [hasConfiguredGoal, currentWeight, targetWeight, height, age, gender, activityLevel, targetDays]);

  // Chỉ hiển thị khoảng cách tới mục tiêu; không suy đoán ngày bắt đầu từ lịch sử cân cũ.
  const progressMetrics = useMemo(() => {
    const remainingWeightToGoal = Math.round((targetWeight - currentWeight) * 10) / 10;
    return { remainingWeightToGoal };
  }, [currentWeight, targetWeight]);

  const recentWeightHistory = useMemo(
    () => [...weightHistory].slice(-5).reverse(),
    [weightHistory]
  );

  const configPreview = useMemo(() => {
    const previewWeight = Number(inputTargetWeight.trim().replace(',', '.'));
    const previewDays = Number(inputTargetDays.trim());
    if (
      currentWeight <= 0 ||
      height <= 0 ||
      age <= 0 ||
      !Number.isFinite(previewWeight) ||
      previewWeight <= 20 ||
      previewWeight >= 300 ||
      !Number.isInteger(previewDays) ||
      previewDays < 7 ||
      previewDays > 730
    ) {
      return null;
    }

    return analyzeGoalWithAI({
      currentWeight,
      targetWeight: previewWeight,
      height,
      age,
      gender,
      activityLevel,
      targetDays: previewDays,
    });
  }, [
    inputTargetWeight,
    inputTargetDays,
    currentWeight,
    height,
    age,
    gender,
    activityLevel,
  ]);

  // TÍNH TOÁN DỮ LIỆU CALO 7 NGÀY QUA TỪ DATABASE THỰC
  const past7DaysMetrics = useMemo(() => {
    const list: DayCalorieItem[] = [];
    const today = new Date();
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = getDateString(d);
      const dayLabel = dayNames[d.getDay()];

      const dayMeals = meals7Days.filter((m) => m.consumed_date === dateStr);

      list.push({
        dayLabel,
        dateStr,
        calories: calculateMealsTotal(dayMeals).calories,
        hasData: dayMeals.length > 0,
      });
    }

    const targetCal =
      aiAnalysis?.dailyCalorieTarget ||
      (Number(profile?.daily_calorie_goal) > 0 ? Number(profile?.daily_calorie_goal) : 0);
    const loggedDays = list.filter((d) => d.hasData);
    const daysWithinGoal =
      targetCal > 0 ? loggedDays.filter((d) => d.calories <= targetCal).length : 0;
    const avgCal =
      loggedDays.length > 0
        ? Math.round(loggedDays.reduce((sum, d) => sum + d.calories, 0) / loggedDays.length)
        : 0;

    const maxCal = Math.max(...loggedDays.map((d) => d.calories), 1);

    return {
      list,
      targetCal,
      loggedDaysCount: loggedDays.length,
      daysWithinGoal,
      avgCal,
      maxCal,
    };
  }, [meals7Days, aiAnalysis, profile]);

  // Mở modal cấu hình mục tiêu
  const handleOpenConfigModal = () => {
    setInputTargetWeight(targetWeight > 0 ? String(targetWeight) : String(currentWeight || 60));
    setInputTargetDays(targetDays > 0 ? String(targetDays) : '60');
    setIsConfigModalOpen(true);
  };

  // Lưu cấu hình mục tiêu mới vào Supabase
  const handleSaveConfig = async () => {
    const newTargetW = Number(inputTargetWeight.trim().replace(',', '.'));
    const newDays = Number(inputTargetDays.trim());

    if (isNaN(newTargetW) || newTargetW <= 20 || newTargetW >= 300) {
      await modal.alert({
        title: 'Cân nặng không hợp lệ',
        message: 'Vui lòng nhập cân nặng mục tiêu hợp lệ (từ 20kg đến 300kg).',
        type: 'warning',
      });
      return;
    }

    if (!Number.isInteger(newDays) || newDays < 7 || newDays > 730) {
      await modal.alert({
        title: 'Số ngày không hợp lệ',
        message: 'Vui lòng nhập số ngày hoàn thành từ 7 ngày đến 730 ngày (2 năm).',
        type: 'warning',
      });
      return;
    }

    if (!userId || !profile || currentWeight <= 0 || height <= 0 || age <= 0) {
      await modal.alert({
        title: 'Thiếu thông tin sức khỏe',
        message: 'Vui lòng hoàn tất cân nặng hiện tại, chiều cao và tuổi trong hồ sơ trước khi thiết lập mục tiêu.',
        type: 'warning',
      });
      return;
    }

    const previewAnalysis = analyzeGoalWithAI({
      currentWeight,
      targetWeight: newTargetW,
      height,
      age,
      gender,
      activityLevel,
      targetDays: newDays,
    });

    if (requiresScheduleAdjustment(previewAnalysis)) {
      const suggestedDays = previewAnalysis.suggestedTargetDaysMin;
      await modal.alert({
        title: 'Thời hạn cần điều chỉnh',
        message: suggestedDays
          ? `Tốc độ này vượt ngưỡng khuyến nghị hoặc cần mức calo quá thấp. Hãy kéo dài mục tiêu lên ít nhất ${suggestedDays} ngày để có kế hoạch phù hợp hơn.`
          : 'Tốc độ này vượt ngưỡng khuyến nghị. Hãy kéo dài thời hạn trước khi lưu mục tiêu.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSavingConfig(true);

      const updates: Partial<Profile> = {
        target_weight: newTargetW,
        target_days: newDays,
        goal_type: previewAnalysis.goalType,
        daily_calorie_goal: previewAnalysis.dailyCalorieTarget,
        bmr: previewAnalysis.bmr,
        tdee: previewAnalysis.tdee,
      };

      const { data: savedProfile, error } = await updateUserProfile(userId, updates);
      if (error || !savedProfile) {
        await modal.alert({
          title: 'Lỗi lưu dữ liệu',
          message: error?.message || 'Không thể lưu mục tiêu vào hồ sơ. Vui lòng thử lại.',
          type: 'error',
        });
        return;
      }

      dispatch(setAuthProfile(savedProfile));
      dispatch(setStoreProfile(savedProfile));
      dispatch(setDailyCalorieGoal(previewAnalysis.dailyCalorieTarget));

      setIsConfigModalOpen(false);

      await modal.alert({
        title: 'Cài đặt mục tiêu thành công! 🎯',
        message: `Đã thiết lập ${previewAnalysis.goalType} về ${newTargetW} kg trong ${newDays} ngày (${previewAnalysis.dailyCalorieTarget.toLocaleString()} kcal/ngày).`,
        type: 'success',
      });
    } catch (err) {
      await modal.alert({
        title: 'Lỗi',
        message: err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu mục tiêu.',
        type: 'error',
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Ghi nhận cân nặng hôm nay vào Database thực
  const handleAddWeight = async () => {
    const val = Number(newWeightInput.trim().replace(',', '.'));
    if (isNaN(val) || val <= 20 || val >= 300) {
      await modal.alert({
        title: 'Cân nặng không hợp lệ',
        message: 'Vui lòng nhập cân nặng hợp lệ (từ 20kg đến 300kg).',
        type: 'warning',
      });
      return;
    }

    if (!userId || !profile) {
      await modal.alert({
        title: 'Chưa thể ghi nhận',
        message: 'Vui lòng đăng nhập và hoàn tất hồ sơ trước khi ghi nhận cân nặng.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSavingWeight(true);
      const todayStr = getTodayDateString();

      const { data: savedRecord, error: historyError } = await addWeightRecord(userId, val, todayStr);
      if (historyError || !savedRecord) {
        await modal.alert({
          title: 'Lỗi ghi nhận',
          message: historyError?.message || 'Không thể lưu cân nặng vào lịch sử.',
          type: 'error',
        });
        return;
      }

      const { data: updatedProfile, error: profileError } = await updateUserProfile(userId, {
        current_weight: val,
      });
      if (profileError || !updatedProfile) {
        setWeightHistory((prev) => [
          ...prev.filter((weight) => weight.recorded_date !== todayStr),
          savedRecord,
        ]);
        await modal.alert({
          title: 'Chưa đồng bộ hồ sơ',
          message: 'Cân nặng đã được ghi vào lịch sử nhưng hồ sơ chưa cập nhật. Vui lòng tải lại và thử lại.',
          type: 'error',
        });
        return;
      }

      dispatch(setAuthProfile(updatedProfile));
      dispatch(setStoreProfile(updatedProfile));

      setWeightHistory((prev) => [
        ...prev.filter((weight) => weight.recorded_date !== todayStr),
        savedRecord,
      ]);
      setNewWeightInput('');

      await modal.alert({
        title: 'Ghi nhận thành công! ⚖️',
        message: `Đã cập nhật cân nặng mới nhất: ${val} kg.`,
        type: 'success',
      });
    } catch (err) {
      await modal.alert({
        title: 'Không thể ghi nhận',
        message: err instanceof Error ? err.message : 'Đã xảy ra lỗi khi ghi nhận cân nặng.',
        type: 'error',
      });
    } finally {
      setIsSavingWeight(false);
    }
  };

  return (
    <ScrollView
      backgroundColor={THEME.colors.background}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 14),
        paddingBottom: Math.max(insets.bottom + 80, 100),
      }}
      showsVerticalScrollIndicator={false}
    >
      <YStack paddingHorizontal="$4" gap="$5">
        {/* ========================================================================= */}
        {/* TOP HEADER */}
        {/* ========================================================================= */}
        <XStack alignItems="center">
          <XStack alignItems="center" gap="$2.5">
            {/* Icon tròn bên trái */}
            <View
              width={38}
              height={38}
              borderRadius={19}
              backgroundColor="#EFF6FF"
              alignItems="center"
              justifyContent="center"
              borderWidth={1}
              borderColor="#DBEAFE"
            >
              <Text fontSize={18}>🎯</Text>
            </View>

            <YStack gap="$0.5">
              <Text fontSize={18} fontWeight="900" color="#0F172A">
                Mục tiêu & Tiến trình
              </Text>

              {/* Sub-badge trạng thái */}
              {hasConfiguredGoal && aiAnalysis && (
                <View
                  backgroundColor={
                    requiresScheduleAdjustment(aiAnalysis)
                      ? '#FEF3C7'
                      : '#DCFCE7'
                  }
                  paddingHorizontal="$2"
                  paddingVertical="$0.5"
                  borderRadius={10}
                  alignSelf="flex-start"
                >
                  <Text
                    fontSize={10.5}
                    fontWeight="700"
                    color={
                      requiresScheduleAdjustment(aiAnalysis)
                        ? '#B45309'
                        : '#16A34A'
                    }
                  >
                    {requiresScheduleAdjustment(aiAnalysis)
                      ? '● Cần điều chỉnh thời hạn'
                      : `● ${aiAnalysis.goalType} (~${aiAnalysis.ratePerWeek} kg/tuần)`}
                  </Text>
                </View>
              )}
            </YStack>
          </XStack>
        </XStack>

        {dataError && (
          <XStack
            backgroundColor="#FEF2F2"
            borderColor="#FECACA"
            borderWidth={1}
            borderRadius={14}
            padding="$3"
            alignItems="center"
            justifyContent="space-between"
            gap="$2"
          >
            <Text flex={1} fontSize={11.5} color="#B91C1C">
              {dataError}
            </Text>
            <TouchableOpacity onPress={() => void fetchData()} disabled={isLoading}>
              <Text fontSize={11.5} fontWeight="800" color="#0055D4">
                {isLoading ? 'Đang tải' : 'Tải lại'}
              </Text>
            </TouchableOpacity>
          </XStack>
        )}

        {/* ========================================================================= */}
        {/* KHỐI 1: TỔNG QUAN MỤC TIÊU (MATCH PICTURE/MỤC TIÊU.PNG) */}
        {/* ========================================================================= */}
        <YStack
          backgroundColor="#FFFFFF"
          borderRadius={24}
          padding="$4"
          borderWidth={1}
          borderColor="#E2E8F0"
          gap="$4"
          style={THEME.shadow}
        >
          {/* Hàng trên: Nhãn & Nút Cài đặt mục tiêu */}
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize={11} fontWeight="800" color="#64748B" letterSpacing={0.5}>
              {hasConfiguredGoal ? 'KẾ HOẠCH HIỆN TẠI' : 'CHƯA CÓ MỤC TIÊU'}
            </Text>

            <TouchableOpacity activeOpacity={0.7} onPress={handleOpenConfigModal}>
              <XStack
                backgroundColor="#EFF6FF"
                borderWidth={1}
                borderColor="#BFDBFE"
                paddingHorizontal="$2.5"
                paddingVertical="$1"
                borderRadius={16}
                alignItems="center"
                gap="$1.5"
              >
                <Text fontSize={12}>⚙️</Text>
                <Text fontSize={11.5} fontWeight="800" color="#0055D4">
                  Cài đặt mục tiêu
                </Text>
              </XStack>
            </TouchableOpacity>
          </XStack>

          {hasConfiguredGoal && aiAnalysis ? (
            <>
              {/* Tiêu đề mục tiêu lớn */}
              <Text fontSize={20} fontWeight="900" color="#0F172A">
                {aiAnalysis.goalType === 'Giảm cân'
                  ? `Giảm về ${targetWeight.toFixed(1)} kg`
                  : aiAnalysis.goalType === 'Tăng cân'
                  ? `Tăng lên ${targetWeight.toFixed(1)} kg`
                  : `Giữ ở mức ${targetWeight.toFixed(1)} kg`}
              </Text>

              {/* 3 Thẻ số đo trong hàng ngang */}
              <XStack gap="$2.5">
                <View
                  flex={1}
                  backgroundColor="#F8FAFC"
                  paddingVertical="$2.5"
                  paddingHorizontal="$2"
                  borderRadius={16}
                  borderWidth={1}
                  borderColor="#E2E8F0"
                  alignItems="center"
                  gap="$0.5"
                >
                  <Text fontSize={11} fontWeight="600" color="#64748B">
                    Hiện tại
                  </Text>
                  <Text fontSize={18} fontWeight="900" color="#0F172A">
                    {currentWeight.toFixed(1)} <Text fontSize={11} fontWeight="600">kg</Text>
                  </Text>
                </View>

                <View
                  flex={1}
                  backgroundColor="#F8FAFC"
                  paddingVertical="$2.5"
                  paddingHorizontal="$2"
                  borderRadius={16}
                  borderWidth={1}
                  borderColor="#E2E8F0"
                  alignItems="center"
                  gap="$0.5"
                >
                  <Text fontSize={11} fontWeight="600" color="#64748B">
                    Mục tiêu
                  </Text>
                  <Text fontSize={18} fontWeight="900" color="#0055D4">
                    {targetWeight.toFixed(1)} <Text fontSize={11} fontWeight="600">kg</Text>
                  </Text>
                </View>

                <View
                  flex={1}
                  backgroundColor="#F8FAFC"
                  paddingVertical="$2.5"
                  paddingHorizontal="$2"
                  borderRadius={16}
                  borderWidth={1}
                  borderColor="#E2E8F0"
                  alignItems="center"
                  gap="$0.5"
                >
                  <Text fontSize={11} fontWeight="600" color="#64748B">
                    {progressMetrics.remainingWeightToGoal === 0
                      ? 'Trạng thái'
                      : progressMetrics.remainingWeightToGoal < 0
                      ? 'Cần giảm'
                      : 'Cần tăng'}
                  </Text>
                  <Text
                    fontSize={18}
                    fontWeight="900"
                    color={progressMetrics.remainingWeightToGoal === 0 ? '#059669' : '#0055D4'}
                  >
                    {progressMetrics.remainingWeightToGoal === 0
                      ? 'Đã đạt'
                      : `${Math.abs(progressMetrics.remainingWeightToGoal).toFixed(1)} kg`}
                  </Text>
                </View>
              </XStack>

              <Text fontSize={11.5} color="#64748B">
                Thời hạn: <Text fontWeight="800" color="#0F172A">{targetDays} ngày</Text>
              </Text>
            </>
          ) : null}
        </YStack>

        {/* ========================================================================= */}
        {/* KHỐI 2: 📊 THÔNG SỐ (BMR, TDEE, HẠN MỨC CALO NẠP & PHÂN BỔ MACROS) */}
        {/* ========================================================================= */}
        <YStack
          backgroundColor="#FFFFFF"
          borderRadius={24}
          padding="$4"
          borderWidth={1}
          borderColor="#E2E8F0"
          gap="$3.5"
          style={THEME.shadow}
        >
          {/* Header Thông số */}
          <XStack alignItems="center" gap="$2">
            <Text fontSize={16}>📊</Text>
            <Text fontSize={16} fontWeight="900" color="#0F172A">
              Thông số
            </Text>
          </XStack>

          {hasConfiguredGoal && aiAnalysis ? (
            <>
              {/* 2 Thẻ: BMR cơ bản & TDEE vận động */}
              <XStack gap="$2.5">
                <View
                  flex={1}
                  backgroundColor="#F8FAFC"
                  padding="$3"
                  borderRadius={18}
                  borderWidth={1}
                  borderColor="#E2E8F0"
                  gap="$1"
                >
                  <XStack alignItems="center" gap="$1.5">
                    <Text fontSize={13}>📉</Text>
                    <Text fontSize={12} fontWeight="700" color="#475569">
                      BMR cơ bản
                    </Text>
                  </XStack>
                  <Text fontSize={20} fontWeight="900" color="#0F172A">
                    {aiAnalysis.bmr.toLocaleString()} <Text fontSize={12} fontWeight="600">kcal</Text>
                  </Text>
                  <Text fontSize={10} color="#64748B">
                    Năng lượng cơ thể khi nghỉ ngơi
                  </Text>
                </View>

                <View
                  flex={1}
                  backgroundColor="#F8FAFC"
                  padding="$3"
                  borderRadius={18}
                  borderWidth={1}
                  borderColor="#E2E8F0"
                  gap="$1"
                >
                  <XStack alignItems="center" gap="$1.5">
                    <Text fontSize={13}>⚡</Text>
                    <Text fontSize={12} fontWeight="700" color="#475569">
                      TDEE vận động
                    </Text>
                  </XStack>
                  <Text fontSize={20} fontWeight="900" color="#0F172A">
                    {aiAnalysis.tdee.toLocaleString()} <Text fontSize={12} fontWeight="600">kcal</Text>
                  </Text>
                  <Text fontSize={10} color="#64748B">
                    Tổng tiêu hao mỗi ngày
                  </Text>
                </View>
              </XStack>

              {/* Hộp Calo mục tiêu nạp mỗi ngày */}
              <View
                backgroundColor="#F0F7FF"
                borderRadius={18}
                borderWidth={1}
                borderColor="#BFDBFE"
                padding="$3.5"
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack gap="$0.5">
                    <Text fontSize={11.5} fontWeight="700" color="#475569">
                      Mục tiêu calo/ngày
                    </Text>
                    <XStack alignItems="baseline" gap="$1.5">
                      <Text fontSize={28} fontWeight="900" color="#0055D4">
                        {aiAnalysis.dailyCalorieTarget.toLocaleString()}
                      </Text>
                      <Text fontSize={13} fontWeight="800" color="#0055D4">
                        kcal/ngày
                      </Text>
                    </XStack>
                  </YStack>

                  <YStack alignItems="flex-end" gap="$1">
                    <View
                      backgroundColor="#FFEDD5"
                      borderWidth={1}
                      borderColor="#FED7AA"
                      paddingHorizontal="$2.5"
                      paddingVertical="$1"
                      borderRadius={12}
                    >
                      <Text fontSize={11} fontWeight="800" color="#C2410C">
                        {aiAnalysis.dailyCalorieAdjustment < 0
                            ? `Thâm hụt ${Math.abs(aiAnalysis.dailyCalorieAdjustment)} kcal`
                          : aiAnalysis.dailyCalorieAdjustment > 0
                          ? `Thặng dư +${aiAnalysis.dailyCalorieAdjustment} kcal`
                          : 'Cân bằng 0 kcal'}
                      </Text>
                    </View>
                  </YStack>
                </XStack>
                {!aiAnalysis.isSafeCalorie && (
                  <Text fontSize={11} color="#B45309">
                    Mức calo đã được giới hạn ở ngưỡng tối thiểu; hãy kéo dài thời hạn để đạt tốc độ phù hợp.
                  </Text>
                )}
              </View>

              {/* Thanh phân bổ Macros mục tiêu (Đạm, Tinh bột, Chất béo) */}
              <YStack gap="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize={12} fontWeight="800" color="#0F172A">
                    Phân bổ Macros mục tiêu
                  </Text>
                  <Text fontSize={11} color="#64748B" fontWeight="600">
                    100% Calo
                  </Text>
                </XStack>

                {/* Thanh tiến trình đa màu sắc */}
                <XStack height={8} borderRadius={4} overflow="hidden" backgroundColor="#E2E8F0">
                  <View width={`${aiAnalysis.macros.proteinPercentage}%`} backgroundColor="#2563EB" />
                  <View width={`${aiAnalysis.macros.carbPercentage}%`} backgroundColor="#EA580C" />
                  <View width={`${aiAnalysis.macros.fatPercentage}%`} backgroundColor="#16A34A" />
                </XStack>

                {/* 3 Cột định lượng gram */}
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack alignItems="flex-start" gap="$0.5">
                    <Text fontSize={11} fontWeight="700" color="#2563EB">
                      ● Đạm ({aiAnalysis.macros.proteinPercentage}%)
                    </Text>
                    <Text fontSize={15} fontWeight="900" color="#0F172A">
                      {aiAnalysis.macros.proteinGrams}g
                    </Text>
                  </YStack>

                  <YStack alignItems="center" gap="$0.5">
                    <Text fontSize={11} fontWeight="700" color="#EA580C">
                      ● Tinh bột ({aiAnalysis.macros.carbPercentage}%)
                    </Text>
                    <Text fontSize={15} fontWeight="900" color="#0F172A">
                      {aiAnalysis.macros.carbGrams}g
                    </Text>
                  </YStack>

                  <YStack alignItems="flex-end" gap="$0.5">
                    <Text fontSize={11} fontWeight="700" color="#16A34A">
                      ● Chất béo ({aiAnalysis.macros.fatPercentage}%)
                    </Text>
                    <Text fontSize={15} fontWeight="900" color="#0F172A">
                      {aiAnalysis.macros.fatGrams}g
                    </Text>
                  </YStack>
                </XStack>
              </YStack>
            </>
          ) : (
            <YStack paddingVertical="$2" alignItems="center" gap="$1">
              <Text fontSize={12} color="#94A3B8" textAlign="center">
                Thiết lập mục tiêu để xem BMR, TDEE và calo đề xuất.
              </Text>
            </YStack>
          )}
        </YStack>

        {/* ========================================================================= */}
        {/* KHỐI 3: LỊCH SỬ CÂN NẶNG ĐÃ GHI NHẬN */}
        {/* ========================================================================= */}
        <YStack
          backgroundColor="#FFFFFF"
          borderRadius={24}
          padding="$4"
          borderWidth={1}
          borderColor="#E2E8F0"
          gap="$4"
          style={THEME.shadow}
        >
          {/* Header theo dõi cân nặng */}
          <XStack alignItems="center" gap="$2">
            <Text fontSize={16}>📉</Text>
            <Text fontSize={16} fontWeight="900" color="#0F172A">
              Lịch sử cân nặng
            </Text>
          </XStack>

          {recentWeightHistory.length > 0 ? (
            <YStack gap="$2">
              {recentWeightHistory.map((record) => (
                <XStack
                  key={record.id}
                  justifyContent="space-between"
                  alignItems="center"
                  backgroundColor="#F8FAFC"
                  paddingHorizontal="$3"
                  paddingVertical="$2.5"
                  borderRadius={12}
                  borderWidth={1}
                  borderColor="#E2E8F0"
                >
                  <Text fontSize={12} color="#64748B">
                    {record.recorded_date.split('-').reverse().join('/')}
                  </Text>
                  <Text fontSize={14} fontWeight="800" color="#0F172A">
                    {Number(record.weight).toFixed(1)} kg
                  </Text>
                </XStack>
              ))}
            </YStack>
          ) : (
            <YStack padding="$3" alignItems="center" gap="$1.5">
              <Text fontSize={12} color="#64748B" textAlign="center">
                Chưa ghi nhận cân nặng.
              </Text>
            </YStack>
          )}

          {/* Ô nhập cân nặng hôm nay (Lưu dữ liệu thực vào database) */}
          <XStack gap="$2" alignItems="center" paddingTop="$1">
            <Input
              flex={1}
              value={newWeightInput}
              onChangeText={setNewWeightInput}
              placeholder="Nhập cân nặng hôm nay (kg)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              backgroundColor="#F8FAFC"
              borderRadius={14}
              borderWidth={1.5}
              borderColor="#E2E8F0"
              height={42}
              fontSize={13.5}
              fontWeight="700"
              paddingHorizontal="$3"
            />

            <Button
              backgroundColor="#0055D4"
              borderRadius={14}
              height={42}
              paddingHorizontal="$3.5"
              disabled={isSavingWeight}
              onPress={handleAddWeight}
            >
              <Text fontSize={13} fontWeight="800" color="#FFFFFF">
                {isSavingWeight ? 'Lưu...' : 'Ghi nhận'}
              </Text>
            </Button>
          </XStack>
        </YStack>

        {/* ========================================================================= */}
        {/* KHỐI 4: LƯỢNG CALO ĐÃ GHI NHẬN TRONG 7 NGÀY */}
        {/* ========================================================================= */}
        <YStack
          backgroundColor="#FFFFFF"
          borderRadius={24}
          padding="$4"
          borderWidth={1}
          borderColor="#E2E8F0"
          gap="$4"
          style={THEME.shadow}
        >
          {/* Header Calo 7 ngày */}
          <XStack justifyContent="space-between" alignItems="center">
            <YStack gap="$0.5">
              <XStack alignItems="center" gap="$1.5">
                <Text fontSize={15} fontWeight="900" color="#0F172A">
                  Lượng calo đã ghi nhận (7 ngày)
                </Text>
              </XStack>
              <Text fontSize={11.5} color="#64748B">
                {past7DaysMetrics.targetCal > 0
                  ? <>Mục tiêu mỗi ngày: <Text fontWeight="800" color="#0055D4">{past7DaysMetrics.targetCal.toLocaleString()} kcal</Text></>
                  : 'Chưa có mục tiêu calo để đối chiếu'}
              </Text>
            </YStack>
          </XStack>

          {/* Biểu đồ cột 7 ngày */}
          {past7DaysMetrics.loggedDaysCount > 0 ? (
            <YStack gap="$2.5">
              <View
                height={210}
                backgroundColor="#F8FAFC"
                borderRadius={18}
                padding="$2.5"
                justifyContent="flex-end"
                borderWidth={1}
                borderColor="#E2E8F0"
              >
                {/* Cột calo theo từng ngày */}
                <XStack height="100%" alignItems="flex-end" justifyContent="space-around">
                  {past7DaysMetrics.list.map((item, idx) => {
                    const isOver =
                      past7DaysMetrics.targetCal > 0 &&
                      item.calories > past7DaysMetrics.targetCal;
                    const barHeight = item.hasData
                      ? Math.max(
                          12,
                          Math.round((item.calories / past7DaysMetrics.maxCal) * 145)
                        )
                      : 5;
                    const barColor = !item.hasData
                      ? '#E2E8F0'
                      : past7DaysMetrics.targetCal === 0
                      ? '#3B82F6'
                      : isOver
                      ? '#F97316'
                      : '#22C55E';

                    return (
                      <YStack key={idx} alignItems="center" gap="$1" flex={1}>
                        <Text
                          fontSize={10}
                          fontWeight="700"
                          color={!item.hasData ? '#CBD5E1' : isOver ? '#EA580C' : '#475569'}
                        >
                          {item.hasData ? item.calories.toLocaleString() : '-'}
                        </Text>

                        <View
                          width={30}
                          height={barHeight}
                          backgroundColor={barColor}
                          borderRadius={7}
                        />

                        <Text fontSize={10.5} fontWeight="700" color="#475569">
                          {item.dayLabel}
                        </Text>
                      </YStack>
                    );
                  })}
                </XStack>
              </View>

              {past7DaysMetrics.targetCal > 0 && (
                <XStack alignItems="center" gap="$3">
                  <XStack alignItems="center" gap="$1">
                    <View width={8} height={8} borderRadius={4} backgroundColor="#22C55E" />
                    <Text fontSize={10} color="#64748B">Trong mục tiêu</Text>
                  </XStack>
                  <XStack alignItems="center" gap="$1">
                    <View width={8} height={8} borderRadius={4} backgroundColor="#F97316" />
                    <Text fontSize={10} color="#64748B">Vượt mục tiêu</Text>
                  </XStack>
                </XStack>
              )}

              {/* Tóm tắt chân biểu đồ */}
              <XStack justifyContent="space-between" paddingHorizontal="$1">
                <Text fontSize={11} fontWeight="700" color="#16A34A">
                  {past7DaysMetrics.targetCal > 0
                    ? `Trong hạn mức: ${past7DaysMetrics.daysWithinGoal}/${past7DaysMetrics.loggedDaysCount} ngày ghi nhận`
                    : `Có ghi nhận: ${past7DaysMetrics.loggedDaysCount}/7 ngày`}
                </Text>
                <Text fontSize={11} color="#64748B">
                  Trung bình: <Text fontWeight="800" color="#0F172A">~{past7DaysMetrics.avgCal.toLocaleString()} kcal/ngày</Text>
                </Text>
              </XStack>
            </YStack>
          ) : (
            /* Chưa có bữa ăn nào trong 7 ngày qua */
            <YStack padding="$3" alignItems="center" gap="$1.5">
              <Text fontSize={26}>🥗</Text>
              <Text fontSize={12} color="#64748B" textAlign="center">
                Chưa có nhật ký calo trong 7 ngày qua.
              </Text>
            </YStack>
          )}
        </YStack>
      </YStack>

      {/* ========================================================================= */}
      {/* MODAL CÀI ĐẶT MỤC TIÊU [ ⚙️ CÀI ĐẶT MỤC TIÊU ] */}
      {/* ========================================================================= */}
      <Modal
        visible={isConfigModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsConfigModalOpen(false)}
      >
        <View
          flex={1}
          backgroundColor="rgba(15, 23, 42, 0.6)"
          justifyContent="center"
          alignItems="center"
          padding="$4"
        >
          <YStack
            backgroundColor="#FFFFFF"
            borderRadius={24}
            padding="$4.5"
            width="100%"
            maxWidth={360}
            gap="$3.5"
            style={THEME.shadow}
          >
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={16.5} fontWeight="900" color="#0F172A">
                ⚙️ Cài đặt mục tiêu
              </Text>
              <TouchableOpacity onPress={() => setIsConfigModalOpen(false)} activeOpacity={0.7}>
                <View
                  width={28}
                  height={28}
                  borderRadius={14}
                  backgroundColor="#F1F5F9"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize={13} color="#64748B" fontWeight="800">
                    ✕
                  </Text>
                </View>
              </TouchableOpacity>
            </XStack>

            {/* Nhập Cân nặng mục tiêu */}
            <YStack gap="$1.5">
              <Text fontSize={12.5} fontWeight="700" color="#334155">
                Cân nặng mục tiêu (kg):
              </Text>
              <XStack alignItems="center" gap="$2">
                <TouchableOpacity
                  onPress={() => {
                    const current = parseFloat(inputTargetWeight) || 60;
                    setInputTargetWeight(String(Math.max(20, Math.round((current - 0.5) * 10) / 10)));
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    width={40}
                    height={40}
                    borderRadius={12}
                    backgroundColor="#F1F5F9"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize={18} fontWeight="800" color="#475569">-</Text>
                  </View>
                </TouchableOpacity>

                <Input
                  flex={1}
                  height={42}
                  borderRadius={12}
                  borderWidth={1.5}
                  borderColor="#CBD5E1"
                  backgroundColor="#F8FAFC"
                  fontSize={16}
                  fontWeight="800"
                  textAlign="center"
                  keyboardType="numeric"
                  value={inputTargetWeight}
                  onChangeText={setInputTargetWeight}
                  placeholder="Nhập số cân"
                />

                <TouchableOpacity
                  onPress={() => {
                    const current = parseFloat(inputTargetWeight) || 60;
                    setInputTargetWeight(String(Math.min(250, Math.round((current + 0.5) * 10) / 10)));
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    width={40}
                    height={40}
                    borderRadius={12}
                    backgroundColor="#F1F5F9"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize={18} fontWeight="800" color="#475569">+</Text>
                  </View>
                </TouchableOpacity>
              </XStack>
            </YStack>

            {/* Nhập Số ngày hoàn thành mục tiêu */}
            <YStack gap="$1.5">
              <Text fontSize={12.5} fontWeight="700" color="#334155">
                Thời hạn (ngày):
              </Text>
              <XStack alignItems="center" gap="$2">
                <TouchableOpacity
                  onPress={() => {
                    const current = parseInt(inputTargetDays, 10) || 60;
                    setInputTargetDays(String(Math.max(7, current - 5)));
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    width={40}
                    height={40}
                    borderRadius={12}
                    backgroundColor="#F1F5F9"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize={13} fontWeight="800" color="#475569">-5d</Text>
                  </View>
                </TouchableOpacity>

                <Input
                  flex={1}
                  height={42}
                  borderRadius={12}
                  borderWidth={1.5}
                  borderColor="#CBD5E1"
                  backgroundColor="#F8FAFC"
                  fontSize={16}
                  fontWeight="800"
                  textAlign="center"
                  keyboardType="numeric"
                  value={inputTargetDays}
                  onChangeText={setInputTargetDays}
                  placeholder="Số ngày"
                />

                <TouchableOpacity
                  onPress={() => {
                    const current = parseInt(inputTargetDays, 10) || 60;
                    setInputTargetDays(String(current + 5));
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    width={40}
                    height={40}
                    borderRadius={12}
                    backgroundColor="#F1F5F9"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize={13} fontWeight="800" color="#475569">+5d</Text>
                  </View>
                </TouchableOpacity>
              </XStack>

              <Text fontSize={11} color="#64748B">
                Tương đương ~{((parseInt(inputTargetDays, 10) || 60) / 7).toFixed(1)} tuần
              </Text>
            </YStack>

            {configPreview && (
              <YStack
                backgroundColor={requiresScheduleAdjustment(configPreview) ? '#FFF7ED' : '#F0F7FF'}
                borderColor={requiresScheduleAdjustment(configPreview) ? '#FED7AA' : '#BFDBFE'}
                borderWidth={1}
                borderRadius={14}
                padding="$3"
                gap="$1.5"
              >
                <Text fontSize={12} fontWeight="800" color="#0F172A">
                  Ước tính: {configPreview.goalType} · {configPreview.ratePerWeek} kg/tuần
                </Text>
                <Text fontSize={11.5} color="#334155">
                  {configPreview.dailyCalorieTarget.toLocaleString()} kcal/ngày · Đạm {configPreview.macros.proteinGrams}g · Carb {configPreview.macros.carbGrams}g · Béo {configPreview.macros.fatGrams}g
                </Text>
                {requiresScheduleAdjustment(configPreview) && (
                  <Text fontSize={11} color="#B45309">
                    Tốc độ chưa phù hợp. Hãy tăng thời hạn
                    {configPreview.suggestedTargetDaysMin
                      ? ` lên ít nhất ${configPreview.suggestedTargetDaysMin} ngày`
                      : ''}
                    .
                  </Text>
                )}
              </YStack>
            )}

            {/* Nút bấm Lưu & Kích hoạt mục tiêu */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSaveConfig}
              disabled={isSavingConfig}
            >
              <View
                height={48}
                borderRadius={24}
                backgroundColor="#0055D4"
                alignItems="center"
                justifyContent="center"
                style={THEME.shadow}
              >
                <XStack alignItems="center" gap="$2">
                  {isSavingConfig ? (
                    <Spinner size="small" color="#FFFFFF" />
                  ) : (
                    <Text fontSize={15} color="#FFFFFF">✓</Text>
                  )}
                  <Text fontSize={14.5} fontWeight="800" color="#FFFFFF">
                    {isSavingConfig ? 'Đang lưu...' : 'Lưu mục tiêu'}
                  </Text>
                </XStack>
              </View>
            </TouchableOpacity>
          </YStack>
        </View>
      </Modal>
    </ScrollView>
  );
}
