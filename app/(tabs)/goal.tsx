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
import {
  analyzeGoalWithAI,
  GoalAIAnalysis,
} from '../../src/services/goalAIService';

// Helper lấy chữ cái đầu đại diện avatar
const getInitials = (name?: string | null): string => {
  if (!name) return 'NT';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Helper tính ngày dự kiến hoàn thành
const getProjectedDateString = (daysRemaining: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + Math.max(0, daysRemaining));
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

interface DayCalorieItem {
  dayLabel: string;
  dateStr: string;
  calories: number;
  hasData: boolean;
}

export default function GoalScreen() {
  const dispatch = useAppDispatch();
  const modal = useAppModal();
  const insets = useSafeAreaInsets();
  const { userId, profile } = useAppSelector((state) => state.auth);

  // Dữ liệu thể trạng cơ bản từ profile
  const [currentWeight, setCurrentWeight] = useState<number>(Number(profile?.current_weight || 0));
  const [targetWeight, setTargetWeight] = useState<number>(Number(profile?.target_weight || 0));
  const [targetDays, setTargetDays] = useState<number>(Number(profile?.target_days || 0));
  const [height, setHeight] = useState<number>(Number(profile?.height || 0));
  const [age, setAge] = useState<number>(Number(profile?.age || 0));
  const [gender, setGender] = useState<string>(profile?.gender || 'Nam');
  const activityLevel = profile?.activity_level || 'moderate';

  // Lịch sử cân nặng & bữa ăn 7 ngày từ Database
  const [weightHistory, setWeightHistory] = useState<WeightHistory[]>([]);
  const [meals7Days, setMeals7Days] = useState<DailyMeal[]>([]);
  const [newWeightInput, setNewWeightInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingWeight, setIsSavingWeight] = useState<boolean>(false);

  // Modal cài đặt mục tiêu
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [inputTargetWeight, setInputTargetWeight] = useState<string>('');
  const [inputTargetDays, setInputTargetDays] = useState<string>('');
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Đồng bộ state khi profile thay đổi
  useEffect(() => {
    if (profile) {
      if (profile.current_weight != null) setCurrentWeight(Number(profile.current_weight));
      if (profile.target_weight != null) setTargetWeight(Number(profile.target_weight));
      if (profile.target_days != null) setTargetDays(Number(profile.target_days));
      if (profile.height != null) setHeight(Number(profile.height));
      if (profile.age != null) setAge(Number(profile.age));
      if (profile.gender) setGender(profile.gender);
    }
  }, [profile]);

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
      const startDateStr = pastDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];

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
    } catch (err: any) {
      console.warn('Lỗi khi tải dữ liệu thực từ database:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, dispatch]);

  useEffect(() => {
    fetchData();
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

  // TÍNH TOÁN TIẾN TRÌNH THEO SỐ NGÀY ĐÃ CẤU HÌNH
  const progressMetrics = useMemo(() => {
    if (!hasConfiguredGoal || !aiAnalysis) {
      return {
        startWeight: currentWeight,
        weightDiff: 0,
        achievedKg: 0,
        progressPercent: 0,
        daysPassed: 0,
        daysRemaining: 0,
        weeksRemaining: 0,
        projectedDateStr: '',
        remainingWeightToGoal: 0,
      };
    }

    // Cân nặng bắt đầu: Lấy từ bản ghi đầu tiên trong weight_history hoặc currentWeight
    const startWeight =
      weightHistory.length > 0 ? Number(weightHistory[0].weight) : currentWeight;

    // Ngày bắt đầu: Lấy từ bản ghi đầu tiên hoặc profile.created_at
    const startDateRaw =
      weightHistory.length > 0
        ? weightHistory[0].recorded_date
        : profile?.created_at || getTodayDateString();

    const startTimestamp = new Date(startDateRaw).getTime();
    const daysSinceStart = Math.max(
      1,
      Math.floor((Date.now() - startTimestamp) / (1000 * 60 * 60 * 24)) + 1
    );

    const daysPassed = Math.min(targetDays, daysSinceStart);
    const daysRemaining = Math.max(0, targetDays - daysPassed);
    const weeksRemaining = Math.ceil(daysRemaining / 7);
    const projectedDateStr = getProjectedDateString(daysRemaining);

    const totalNeedToChange = Math.abs(startWeight - targetWeight);
    const achievedKg = Math.round(Math.abs(startWeight - currentWeight) * 10) / 10;
    const progressPercent =
      totalNeedToChange > 0
        ? Math.min(100, Math.round((achievedKg / totalNeedToChange) * 100))
        : 100;

    const remainingWeightToGoal = Math.round((targetWeight - currentWeight) * 10) / 10;

    return {
      startWeight,
      weightDiff: aiAnalysis.weightDiff,
      achievedKg,
      progressPercent,
      daysPassed,
      daysRemaining,
      weeksRemaining,
      projectedDateStr,
      remainingWeightToGoal,
    };
  }, [hasConfiguredGoal, aiAnalysis, currentWeight, targetWeight, targetDays, weightHistory, profile]);

  // TÍNH TOÁN DỮ LIỆU CALO 7 NGÀY QUA TỪ DATABASE THỰC
  const past7DaysMetrics = useMemo(() => {
    const list: DayCalorieItem[] = [];
    const today = new Date();
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = dayNames[d.getDay()];

      const dayMeals = meals7Days.filter((m) => m.consumed_date === dateStr);
      const totalCal = dayMeals.reduce((sum, m) => {
        const cal =
          m.calories != null
            ? Number(m.calories)
            : m.foods?.calories
            ? Number(m.foods.calories) * Number(m.quantity || 1)
            : 0;
        return sum + cal;
      }, 0);

      list.push({
        dayLabel,
        dateStr,
        calories: Math.round(totalCal),
        hasData: dayMeals.length > 0,
      });
    }

    const targetCal = aiAnalysis?.dailyCalorieTarget || profile?.daily_calorie_goal || 2000;
    const loggedDays = list.filter((d) => d.hasData);
    const daysWithinGoal = loggedDays.filter((d) => d.calories <= targetCal).length;
    const avgCal =
      loggedDays.length > 0
        ? Math.round(loggedDays.reduce((sum, d) => sum + d.calories, 0) / loggedDays.length)
        : 0;

    const maxCal = Math.max(targetCal * 1.25, ...list.map((d) => d.calories), 2200);

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
    const newTargetW = parseFloat(inputTargetWeight);
    const newDays = parseInt(inputTargetDays, 10);

    if (isNaN(newTargetW) || newTargetW <= 20 || newTargetW >= 300) {
      await modal.alert({
        title: 'Cân nặng không hợp lệ',
        message: 'Vui lòng nhập cân nặng mục tiêu hợp lệ (từ 20kg đến 300kg).',
        type: 'warning',
      });
      return;
    }

    if (isNaN(newDays) || newDays < 7 || newDays > 730) {
      await modal.alert({
        title: 'Số ngày không hợp lệ',
        message: 'Vui lòng nhập số ngày hoàn thành từ 7 ngày đến 730 ngày (2 năm).',
        type: 'warning',
      });
      return;
    }

    // Tính toán lại BMR, TDEE và Calo với dữ liệu mục tiêu mới
    const safeCurrentW = currentWeight > 0 ? currentWeight : newTargetW;
    const safeHeight = height > 0 ? height : 168;
    const safeAge = age > 0 ? age : 25;

    const previewAnalysis = analyzeGoalWithAI({
      currentWeight: safeCurrentW,
      targetWeight: newTargetW,
      height: safeHeight,
      age: safeAge,
      gender,
      activityLevel,
      targetDays: newDays,
    });

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

      if (userId) {
        const { error } = await updateUserProfile(userId, updates);
        if (error) {
          await modal.alert({
            title: 'Lỗi lưu dữ liệu',
            message: error.message || 'Không thể lưu mục tiêu vào Supabase.',
            type: 'error',
          });
          setIsSavingConfig(false);
          return;
        }
      }

      // Cập nhật Redux Store
      const updatedProfile = { ...(profile || {}), ...updates } as Profile;
      dispatch(setAuthProfile(updatedProfile));
      dispatch(setStoreProfile(updatedProfile));
      dispatch(setDailyCalorieGoal(previewAnalysis.dailyCalorieTarget));

      setTargetWeight(newTargetW);
      setTargetDays(newDays);
      setIsConfigModalOpen(false);

      await modal.alert({
        title: 'Cài đặt mục tiêu thành công! 🎯',
        message: `Đã thiết lập ${previewAnalysis.goalType} về ${newTargetW} kg trong ${newDays} ngày (~${previewAnalysis.dailyCalorieTarget} kcal/ngày). Toàn bộ hệ thống đã được đồng bộ!`,
        type: 'success',
      });
    } catch (err: any) {
      await modal.alert({
        title: 'Lỗi',
        message: err?.message || 'Có lỗi xảy ra khi lưu mục tiêu.',
        type: 'error',
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Ghi nhận cân nặng hôm nay vào Database thực
  const handleAddWeight = async () => {
    const val = parseFloat(newWeightInput);
    if (isNaN(val) || val <= 20 || val >= 300) {
      await modal.alert({
        title: 'Cân nặng không hợp lệ',
        message: 'Vui lòng nhập cân nặng hợp lệ (từ 20kg đến 300kg).',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSavingWeight(true);
      const todayStr = getTodayDateString();

      if (userId) {
        const { error } = await addWeightRecord(userId, val, todayStr);
        if (error) {
          await modal.alert({
            title: 'Lỗi',
            message: error.message || 'Không thể lưu cân nặng vào nhật ký.',
            type: 'error',
          });
          setIsSavingWeight(false);
          return;
        }

        await updateUserProfile(userId, { current_weight: val });
      }

      setCurrentWeight(val);
      const updated = { ...(profile || {}), current_weight: val } as Profile;
      dispatch(setAuthProfile(updated));
      dispatch(setStoreProfile(updated));

      const newRecord: WeightHistory = {
        id: Date.now(),
        user_id: userId || 'local',
        weight: val,
        recorded_date: todayStr,
      };
      setWeightHistory((prev) => [...prev.filter((w) => w.recorded_date !== todayStr), newRecord]);
      setNewWeightInput('');

      await modal.alert({
        title: 'Ghi nhận thành công! ⚖️',
        message: `Đã cập nhật cân nặng mới nhất: ${val} kg.`,
        type: 'success',
      });
    } catch (err: any) {
      console.warn('Lỗi ghi nhận cân nặng:', err);
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
      <YStack paddingHorizontal="$4" gap="$3.5">
        {/* ========================================================================= */}
        {/* TOP HEADER: MỤC TIÊU & TIẾN TRÌNH + SUB-BADGE + CHUÔNG + AVATAR */}
        {/* ========================================================================= */}
        <XStack justifyContent="space-between" alignItems="center">
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
              {hasConfiguredGoal && aiAnalysis ? (
                <View
                  backgroundColor="#DCFCE7"
                  paddingHorizontal="$2"
                  paddingVertical="$0.5"
                  borderRadius={10}
                  alignSelf="flex-start"
                >
                  <Text fontSize={10.5} fontWeight="700" color="#16A34A">
                    ● Đang {aiAnalysis.goalType.toLowerCase()} (~{aiAnalysis.ratePerWeek} kg/tuần)
                  </Text>
                </View>
              ) : (
                <View
                  backgroundColor="#F1F5F9"
                  paddingHorizontal="$2"
                  paddingVertical="$0.5"
                  borderRadius={10}
                  alignSelf="flex-start"
                >
                  <Text fontSize={10.5} fontWeight="700" color="#64748B">
                    ● Chưa cấu hình mục tiêu
                  </Text>
                </View>
              )}
            </YStack>
          </XStack>

          {/* Nút Chuông & Avatar bên phải */}
          <XStack alignItems="center" gap="$2">
            <View
              width={36}
              height={36}
              borderRadius={18}
              backgroundColor="#FFFFFF"
              alignItems="center"
              justifyContent="center"
              borderWidth={1}
              borderColor="#E2E8F0"
            >
              <Text fontSize={15}>🔔</Text>
            </View>

            <View
              width={36}
              height={36}
              borderRadius={18}
              backgroundColor="#0055D4"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize={13} fontWeight="800" color="#FFFFFF">
                {getInitials(profile?.full_name)}
              </Text>
            </View>
          </XStack>
        </XStack>

        {/* ========================================================================= */}
        {/* KHỐI 1: TỔNG QUAN MỤC TIÊU (MATCH PICTURE/MỤC TIÊU.PNG) */}
        {/* ========================================================================= */}
        <YStack
          backgroundColor="#FFFFFF"
          borderRadius={24}
          padding="$4"
          borderWidth={1}
          borderColor="#E2E8F0"
          gap="$3"
          style={THEME.shadow}
        >
          {/* Hàng trên: Nhãn & Nút Cài đặt mục tiêu */}
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize={11} fontWeight="800" color="#64748B" letterSpacing={0.5}>
              TỔNG QUAN MỤC TIÊU
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
                    Còn lại
                  </Text>
                  <Text
                    fontSize={18}
                    fontWeight="900"
                    color={progressMetrics.remainingWeightToGoal < 0 ? '#EA580C' : '#059669'}
                  >
                    {progressMetrics.remainingWeightToGoal > 0 ? `+${progressMetrics.remainingWeightToGoal}` : progressMetrics.remainingWeightToGoal}{' '}
                    <Text fontSize={11} fontWeight="600">kg</Text>
                  </Text>
                </View>
              </XStack>

              {/* Thanh tiến độ hoàn thành */}
              <YStack gap="$1.5">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize={11.5} color="#475569" fontWeight="600">
                    Tiến độ hoàn thành: <Text fontWeight="800" color="#0055D4">{progressMetrics.progressPercent}%</Text> (Đã đạt {progressMetrics.achievedKg} kg)
                  </Text>
                  <Text fontSize={11} color="#64748B">
                    Bắt đầu: {progressMetrics.startWeight} kg
                  </Text>
                </XStack>

                <View height={8} backgroundColor="#E2E8F0" borderRadius={4} overflow="hidden">
                  <View
                    width={`${progressMetrics.progressPercent}%`}
                    height="100%"
                    backgroundColor="#0055D4"
                    borderRadius={4}
                  />
                </View>
              </YStack>

              {/* Hàng thời gian dự kiến */}
              <XStack justifyContent="space-between" alignItems="center" paddingTop="$0.5">
                <XStack alignItems="center" gap="$1.5">
                  <Text fontSize={13}>📅</Text>
                  <Text fontSize={12} color="#64748B" fontWeight="600">
                    Thời gian dự kiến:
                  </Text>
                </XStack>

                <Text fontSize={12} fontWeight="800" color="#0F172A">
                  Còn {progressMetrics.weeksRemaining} tuần (Dự kiến: {progressMetrics.projectedDateStr})
                </Text>
              </XStack>
            </>
          ) : (
            /* Trạng thái chưa cấu hình mục tiêu */
            <YStack paddingVertical="$3" alignItems="center" gap="$2.5">
              <Text fontSize={32}>🎯</Text>
              <Text fontSize={15} fontWeight="800" color="#0F172A" textAlign="center">
                Bạn chưa cấu hình mục tiêu cân nặng
              </Text>
              <Text fontSize={12} color="#64748B" textAlign="center" maxWidth={290} lineHeight={17}>
                Hãy bấm nút "Cài đặt mục tiêu" phía trên để thiết lập số cân mong muốn và số ngày hoàn thành.
              </Text>
              <TouchableOpacity activeOpacity={0.85} onPress={handleOpenConfigModal}>
                <View
                  backgroundColor="#0055D4"
                  paddingHorizontal="$4"
                  paddingVertical="$2"
                  borderRadius={18}
                >
                  <Text fontSize={13} fontWeight="800" color="#FFFFFF">
                    Cài đặt mục tiêu ngay
                  </Text>
                </View>
              </TouchableOpacity>
            </YStack>
          )}
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
              {/* Tabs chuyển đổi: Giảm cân | Giữ cân | Tăng cân (Khóa theo mục tiêu đang cấu hình) */}
              <XStack backgroundColor="#F1F5F9" padding="$1" borderRadius={20} gap="$1">
                {(['Giảm cân', 'Giữ cân', 'Tăng cân'] as const).map((g) => {
                  const isActive = aiAnalysis.goalType === g;
                  return (
                    <View
                      key={g}
                      flex={1}
                      backgroundColor={isActive ? '#0055D4' : 'transparent'}
                      paddingVertical="$1.5"
                      borderRadius={16}
                      alignItems="center"
                    >
                      <Text
                        fontSize={12}
                        fontWeight={isActive ? '800' : '600'}
                        color={isActive ? '#FFFFFF' : '#64748B'}
                      >
                        {g}
                      </Text>
                    </View>
                  );
                })}
              </XStack>

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
                    Năng lượng sinh tồn tối thiểu
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
                      Hạn mức Calo nạp mỗi ngày
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
                          ? `Thâm hụt ${aiAnalysis.dailyCalorieAdjustment} kcal`
                          : aiAnalysis.dailyCalorieAdjustment > 0
                          ? `Thặng dư +${aiAnalysis.dailyCalorieAdjustment} kcal`
                          : 'Cân bằng 0 kcal'}
                      </Text>
                    </View>
                    <Text fontSize={10.5} color="#64748B">
                      ~ {aiAnalysis.ratePerWeek} kg {aiAnalysis.goalType.toLowerCase()}/tuần
                    </Text>
                  </YStack>
                </XStack>
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
                Chưa có dữ liệu tính toán. Vui lòng cấu hình mục tiêu để hiển thị BMR, TDEE và định mức calo.
              </Text>
            </YStack>
          )}
        </YStack>

        {/* ========================================================================= */}
        {/* KHỐI 3: 📉 TIẾN TRÌNH CÂN NẶNG (PHỤ THUỘC SỐ NGÀY ĐÃ CẤU HÌNH) */}
        {/* ========================================================================= */}
        <YStack
          backgroundColor="#FFFFFF"
          borderRadius={24}
          padding="$4"
          borderWidth={1}
          borderColor="#E2E8F0"
          gap="$3"
          style={THEME.shadow}
        >
          {/* Header Tiến trình */}
          <YStack gap="$0.5">
            <XStack alignItems="center" gap="$2">
              <Text fontSize={16}>📉</Text>
              <Text fontSize={16} fontWeight="900" color="#0F172A">
                Tiến trình cân nặng
              </Text>
            </XStack>
            <Text fontSize={11.5} color="#64748B">
              {hasConfiguredGoal
                ? `Theo kế hoạch ${targetDays} ngày đã cấu hình`
                : 'Chưa cấu hình chu kỳ mục tiêu'}
            </Text>
          </YStack>

          {hasConfiguredGoal ? (
            <>
              {/* Badges thông tin */}
              <XStack gap="$2" flexWrap="wrap">
                <View
                  backgroundColor="#DCFCE7"
                  paddingHorizontal="$2.5"
                  paddingVertical="$1"
                  borderRadius={12}
                >
                  <Text fontSize={11.5} fontWeight="800" color="#16A34A">
                    ↓ -{progressMetrics.achievedKg} kg
                  </Text>
                </View>

                <View
                  backgroundColor="#EFF6FF"
                  paddingHorizontal="$2.5"
                  paddingVertical="$1"
                  borderRadius={12}
                >
                  <Text fontSize={11.5} fontWeight="800" color="#0055D4">
                    📅 Kế hoạch {targetDays} ngày
                  </Text>
                </View>
              </XStack>

              {/* Status Box: Chu kỳ mục tiêu đã qua & còn lại */}
              <View
                backgroundColor="#F0F7FF"
                borderRadius={14}
                paddingHorizontal="$3"
                paddingVertical="$2"
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack alignItems="center" gap="$1.5">
                    <Text fontSize={13}>🕒</Text>
                    <Text fontSize={11.5} color="#475569" fontWeight="600">
                      Chu kỳ cấu hình: <Text fontWeight="800" color="#0055D4">{targetDays} ngày</Text>
                    </Text>
                  </XStack>

                  <Text fontSize={11.5} color="#475569" fontWeight="600">
                    Đã qua: <Text fontWeight="800" color="#0F172A">{progressMetrics.daysPassed} ngày</Text> • Còn lại: <Text fontWeight="800" color="#0055D4">{progressMetrics.daysRemaining} ngày</Text>
                  </Text>
                </XStack>
              </View>

              {/* Filter Pills */}
              <XStack gap="$1.5" alignItems="center">
                <View
                  backgroundColor="#0055D4"
                  paddingHorizontal="$2.5"
                  paddingVertical="$1"
                  borderRadius={12}
                >
                  <Text fontSize={11} fontWeight="800" color="#FFFFFF">
                    Toàn kỳ ({targetDays} ngày)
                  </Text>
                </View>

                <View
                  backgroundColor="#F1F5F9"
                  paddingHorizontal="$2.5"
                  paddingVertical="$1"
                  borderRadius={12}
                >
                  <Text fontSize={11} fontWeight="600" color="#64748B">
                    30 ngày gần đây
                  </Text>
                </View>

                <View
                  backgroundColor="#F1F5F9"
                  paddingHorizontal="$2.5"
                  paddingVertical="$1"
                  borderRadius={12}
                >
                  <Text fontSize={11} fontWeight="600" color="#64748B">
                    14 ngày
                  </Text>
                </View>
              </XStack>

              {/* Biểu đồ đường tiến trình cân nặng (Vẽ từ dữ liệu thực trong weight_history) */}
              {weightHistory.length > 0 ? (
                <YStack gap="$2" paddingTop="$1">
                  <View
                    height={160}
                    backgroundColor="#F0F7FF"
                    borderRadius={18}
                    borderWidth={1}
                    borderColor="#DBEAFE"
                    padding="$3"
                    justifyContent="space-between"
                  >
                    {/* Các đường grid ngang với mốc cân */}
                    <YStack
                      position="absolute"
                      top={12}
                      bottom={28}
                      left={12}
                      right={12}
                      justifyContent="space-between"
                    >
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text fontSize={10} color="#94A3B8">
                          {Math.max(currentWeight, targetWeight) + 2}kg
                        </Text>
                        <View flex={1} height={1} backgroundColor="#E2E8F0" marginLeft="$2" />
                      </XStack>
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text fontSize={10} color="#94A3B8">
                          {Math.round((currentWeight + targetWeight) / 2)}kg
                        </Text>
                        <View flex={1} height={1} backgroundColor="#E2E8F0" marginLeft="$2" />
                      </XStack>
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text fontSize={10} color="#94A3B8">
                          {targetWeight}kg
                        </Text>
                        <View flex={1} height={1} backgroundColor="#BFDBFE" marginLeft="$2" borderStyle="dashed" />
                      </XStack>
                    </YStack>

                    {/* Vùng vẽ các điểm cân nặng thực tế và điểm dự phóng */}
                    <XStack
                      height="100%"
                      alignItems="center"
                      justifyContent="space-between"
                      paddingHorizontal="$4"
                      paddingBottom="$4"
                    >
                      {/* Điểm Ngày 1 */}
                      <YStack alignItems="center" gap="$1">
                        <View
                          width={10}
                          height={10}
                          borderRadius={5}
                          backgroundColor="#0055D4"
                          borderWidth={2}
                          borderColor="#FFFFFF"
                        />
                        <Text fontSize={10} color="#64748B" fontWeight="600">
                          {progressMetrics.startWeight}kg
                        </Text>
                      </YStack>

                      {/* Điểm Hiện tại (Hôm nay) với badge nổi bật màu đen */}
                      <YStack alignItems="center" gap="$1">
                        <View
                          backgroundColor="#0F172A"
                          paddingHorizontal="$2"
                          paddingVertical="$0.5"
                          borderRadius={8}
                        >
                          <Text fontSize={11} fontWeight="800" color="#FFFFFF">
                            {currentWeight} kg
                          </Text>
                        </View>
                        <View
                          width={12}
                          height={12}
                          borderRadius={6}
                          backgroundColor="#0055D4"
                          borderWidth={2}
                          borderColor="#FFFFFF"
                        />
                      </YStack>

                      {/* Điểm Đích (Mục tiêu tương lai) */}
                      <YStack alignItems="center" gap="$1">
                        <View
                          width={12}
                          height={12}
                          borderRadius={6}
                          backgroundColor="#FFFFFF"
                          borderWidth={2.5}
                          borderColor="#16A34A"
                        />
                        <Text fontSize={10.5} fontWeight="800" color="#16A34A">
                          {targetWeight}kg
                        </Text>
                      </YStack>
                    </XStack>

                    {/* Trục hoành ngày ở dưới cùng */}
                    <XStack justifyContent="space-between" paddingHorizontal="$2">
                      <Text fontSize={10} color="#64748B">
                        Ngày 1
                      </Text>
                      <Text fontSize={10} color="#0055D4" fontWeight="800">
                        Ngày {progressMetrics.daysPassed} (Nay)
                      </Text>
                      <Text fontSize={10} color="#16A34A" fontWeight="800">
                        Ngày {targetDays} (Đích)
                      </Text>
                    </XStack>
                  </View>

                  {/* Chú giải biểu đồ */}
                  <XStack justifyContent="space-between" paddingHorizontal="$1">
                    <Text fontSize={10.5} color="#475569">
                      <Text color="#0055D4" fontWeight="800">▬</Text> Đã theo dõi ({progressMetrics.daysPassed} ngày: {currentWeight} kg)
                    </Text>
                    <Text fontSize={10.5} color="#475569">
                      <Text color="#16A34A" fontWeight="800">╍</Text> Dự báo {progressMetrics.daysRemaining} ngày tới (Mục tiêu {targetWeight} kg)
                    </Text>
                  </XStack>
                </YStack>
              ) : (
                /* Chưa có bản ghi nào trong database weight_history */
                <YStack padding="$3.5" alignItems="center" gap="$1.5">
                  <Text fontSize={26}>⚖️</Text>
                  <Text fontSize={12} color="#64748B" textAlign="center">
                    Chưa có lịch sử cân nặng trong database. Hãy nhập số cân hôm nay bên dưới để bắt đầu vẽ biểu đồ tiến trình thực tế!
                  </Text>
                </YStack>
              )}
            </>
          ) : (
            <YStack paddingVertical="$2" alignItems="center" gap="$1">
              <Text fontSize={12} color="#94A3B8" textAlign="center">
                Chưa có dữ liệu tiến trình. Vui lòng cấu hình mục tiêu cân nặng và số ngày để hiển thị.
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
        {/* KHỐI 4: CALO NẠP VS TIÊU HAO (7 NGÀY QUA) - TỪ DATABASE DAILY_MEALS THỰC */}
        {/* ========================================================================= */}
        <YStack
          backgroundColor="#FFFFFF"
          borderRadius={24}
          padding="$4"
          borderWidth={1}
          borderColor="#E2E8F0"
          gap="$3"
          style={THEME.shadow}
        >
          {/* Header Calo 7 ngày */}
          <XStack justifyContent="space-between" alignItems="center">
            <YStack gap="$0.5">
              <XStack alignItems="center" gap="$1.5">
                <Text fontSize={15} fontWeight="900" color="#0F172A">
                  Calo nạp vs Tiêu hao (7 ngày qua)
                </Text>
                <Text fontSize={14}>ℹ️</Text>
              </XStack>
              <Text fontSize={11.5} color="#64748B">
                Đường giới hạn đề xuất: <Text fontWeight="800" color="#0055D4">{past7DaysMetrics.targetCal.toLocaleString()} kcal</Text>
              </Text>
            </YStack>
          </XStack>

          {/* Biểu đồ cột 7 ngày từ T2 đến CN */}
          {past7DaysMetrics.loggedDaysCount > 0 ? (
            <YStack gap="$2.5">
              <View
                height={150}
                backgroundColor="#F8FAFC"
                borderRadius={18}
                padding="$2.5"
                justifyContent="flex-end"
                borderWidth={1}
                borderColor="#E2E8F0"
              >
                {/* Đường giới hạn mục tiêu ngang */}
                <View
                  position="absolute"
                  left={10}
                  right={10}
                  top={`${Math.max(15, 100 - (past7DaysMetrics.targetCal / past7DaysMetrics.maxCal) * 100)}%`}
                  height={1}
                  borderWidth={1}
                  borderColor="#0055D4"
                  borderStyle="dashed"
                  zIndex={2}
                />
                <View
                  position="absolute"
                  right={12}
                  top={`${Math.max(10, 95 - (past7DaysMetrics.targetCal / past7DaysMetrics.maxCal) * 100)}%`}
                  backgroundColor="#0055D4"
                  paddingHorizontal="$1.5"
                  paddingVertical="$0.5"
                  borderRadius={6}
                  zIndex={3}
                >
                  <Text fontSize={8.5} fontWeight="800" color="#FFFFFF">
                    Mục tiêu
                  </Text>
                </View>

                {/* 7 Cột calo ngày */}
                <XStack height="100%" alignItems="flex-end" justifyContent="space-around">
                  {past7DaysMetrics.list.map((item, idx) => {
                    const isOver = item.calories > past7DaysMetrics.targetCal;
                    const hPercent = item.hasData
                      ? Math.min(100, Math.max(15, Math.round((item.calories / past7DaysMetrics.maxCal) * 100)))
                      : 0;

                    return (
                      <YStack key={idx} alignItems="center" gap="$1" flex={1}>
                        {/* Số calo hiển thị trên đầu cột */}
                        <Text
                          fontSize={9}
                          fontWeight="700"
                          color={!item.hasData ? '#CBD5E1' : isOver ? '#EA580C' : '#475569'}
                        >
                          {item.hasData ? item.calories.toLocaleString() : '-'}
                        </Text>

                        {/* Thân cột */}
                        <View
                          width={26}
                          height={item.hasData ? `${hPercent}%` : 4}
                          backgroundColor={!item.hasData ? '#E2E8F0' : isOver ? '#EA580C' : '#16A34A'}
                          borderRadius={5}
                        />

                        {/* Tên thứ (T2, T3, ..., CN) */}
                        <Text fontSize={10} fontWeight="700" color="#64748B">
                          {item.dayLabel}
                        </Text>
                      </YStack>
                    );
                  })}
                </XStack>
              </View>

              {/* Tóm tắt chân biểu đồ */}
              <XStack justifyContent="space-between" paddingHorizontal="$1">
                <Text fontSize={11} fontWeight="700" color="#16A34A">
                  ● Đạt thâm hụt: {past7DaysMetrics.daysWithinGoal}/7 ngày
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
                Chưa có nhật ký bữa ăn trong 7 ngày qua. Hãy thêm món ăn trong tab Nhật ký để theo dõi lượng calo nạp thực tế!
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
                Số ngày hoàn thành (tự nhập):
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

              {/* Tóm tắt quy đổi */}
              <Text fontSize={11} color="#64748B">
                ~ {((parseInt(inputTargetDays, 10) || 60) / 7).toFixed(1)} tuần (khoảng {((parseInt(inputTargetDays, 10) || 60) / 30).toFixed(1)} tháng)
              </Text>
            </YStack>

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
                    {isSavingConfig ? 'Đang lưu...' : 'Lưu & Áp dụng mục tiêu'}
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
