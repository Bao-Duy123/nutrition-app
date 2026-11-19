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
import { TouchableOpacity } from 'react-native';
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
} from '../../src/services/supabase';
import { THEME } from '../../src/constants/theme';
import { WeightHistory, Profile } from '../../src/types/database';
import { useAppModal } from '../../src/components/ModalProvider';
import {
  analyzeGoalWithAI,
  GoalAIAnalysis,
} from '../../src/services/goalAIService';

// Helper chuyển tên mức độ vận động thân thiện
const getActivityLabel = (level?: string | null): string => {
  if (!level) return 'Vận động vừa phải (mặc định)';
  const n = level.toLowerCase();
  if (n.includes('ít') || n.includes('sedentary')) return 'Ít vận động (Bàn giấy)';
  if (n.includes('nhẹ') || n.includes('light')) return 'Vận động nhẹ (1-3 buổi/tuần)';
  if (n.includes('vừa') || n.includes('moderate')) return 'Vận động vừa phải (3-5 buổi/tuần)';
  if (n.includes('nhiều') || n.includes('active') || n.includes('cường độ')) return 'Vận động nhiều (6-7 buổi/tuần)';
  return level;
};

export default function GoalScreen() {
  const dispatch = useAppDispatch();
  const modal = useAppModal();
  const insets = useSafeAreaInsets();
  const { userId, profile } = useAppSelector((state) => state.auth);

  // Dữ liệu thể trạng cơ bản lấy từ profile người dùng
  const [currentWeight, setCurrentWeight] = useState<number>(Number(profile?.current_weight || 65));
  const [targetWeight, setTargetWeight] = useState<number>(Number(profile?.target_weight || 60));
  const [height, setHeight] = useState<number>(Number(profile?.height || 168));
  const [age, setAge] = useState<number>(Number(profile?.age || 25));
  const [gender, setGender] = useState<string>(profile?.gender || 'Nam');
  
  // Mức độ vận động: Lấy trực tiếp từ thông tin cá nhân (không chọn ở đây)
  const activityLevel = profile?.activity_level || 'moderate';

  // Số ngày hoàn thành mục tiêu: Cho người dùng tự nhập
  const [targetDays, setTargetDays] = useState<number>(Number(profile?.target_days || 60));

  // Trạng thái giao diện
  const [weightHistory, setWeightHistory] = useState<WeightHistory[]>([]);
  const [newWeightInput, setNewWeightInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingGoal, setIsSavingGoal] = useState<boolean>(false);
  const [isSavingWeight, setIsSavingWeight] = useState<boolean>(false);

  // Đồng bộ state khi profile trong Redux thay đổi
  useEffect(() => {
    if (profile) {
      if (profile.current_weight) setCurrentWeight(Number(profile.current_weight));
      if (profile.target_weight) setTargetWeight(Number(profile.target_weight));
      if (profile.height) setHeight(Number(profile.height));
      if (profile.age) setAge(Number(profile.age));
      if (profile.gender) setGender(profile.gender);
      if (profile.target_days) setTargetDays(Number(profile.target_days));
    }
  }, [profile]);

  // Tải dữ liệu từ database
  const fetchData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [profileRes, historyRes] = await Promise.all([
        getUserProfile(userId),
        getWeightHistory(userId),
      ]);

      if (profileRes.data) {
        dispatch(setAuthProfile(profileRes.data));
        dispatch(setStoreProfile(profileRes.data));
      }

      if (historyRes.data) {
        setWeightHistory(historyRes.data);
      }
    } catch (err: any) {
      console.warn('Lỗi khi tải dữ liệu mục tiêu:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // PHÂN TÍCH THÔNG MINH BẰNG HUẤN LUYỆN VIÊN AI
  const aiAnalysis: GoalAIAnalysis = useMemo(() => {
    return analyzeGoalWithAI({
      currentWeight,
      targetWeight,
      height,
      age,
      gender,
      activityLevel,
      targetDays: Math.max(1, targetDays),
    });
  }, [currentWeight, targetWeight, height, age, gender, activityLevel, targetDays]);

  // Áp dụng mục tiêu mới vào toàn bộ hệ thống
  const handleApplyGoal = async () => {
    if (targetDays <= 0) {
      await modal.alert({
        title: 'Thời gian chưa hợp lệ',
        message: 'Vui lòng nhập số ngày hoàn thành mục tiêu lớn hơn 0.',
        type: 'warning',
      });
      return;
    }

    setIsSavingGoal(true);
    const updates: Partial<Profile> = {
      target_weight: targetWeight,
      target_days: targetDays,
      goal_type: aiAnalysis.goalType,
      daily_calorie_goal: aiAnalysis.dailyCalorieTarget,
      bmr: aiAnalysis.bmr,
      tdee: aiAnalysis.tdee,
    };

    try {
      if (userId) {
        const { error } = await updateUserProfile(userId, updates);
        if (error) {
          await modal.alert({
            title: 'Lỗi lưu dữ liệu',
            message: error.message || 'Không thể cập nhật mục tiêu vào Supabase.',
            type: 'error',
          });
          setIsSavingGoal(false);
          return;
        }
      }

      // Cập nhật Redux store để toàn bộ ứng dụng (Trang chủ, Nhật ký, Báo cáo) đồng bộ ngay lập tức!
      const updatedProfile = { ...(profile || {}), ...updates } as Profile;
      dispatch(setAuthProfile(updatedProfile));
      dispatch(setStoreProfile(updatedProfile));
      dispatch(setDailyCalorieGoal(aiAnalysis.dailyCalorieTarget));

      await modal.alert({
        title: 'Áp dụng mục tiêu thành công! 🎯',
        message: `Đã lưu mục tiêu ${aiAnalysis.goalType} (~${aiAnalysis.dailyCalorieTarget} kcal/ngày). Toàn bộ Trang chủ và Nhật ký dinh dưỡng đã được đồng bộ!`,
        type: 'success',
        confirmText: 'Tuyệt vời',
      });
    } catch (err: any) {
      await modal.alert({
        title: 'Lỗi',
        message: err?.message || 'Có lỗi xảy ra khi lưu mục tiêu.',
        type: 'error',
      });
    } finally {
      setIsSavingGoal(false);
    }
  };

  // Thêm bản ghi cân nặng hôm nay
  const handleAddWeight = async () => {
    const val = parseFloat(newWeightInput);
    if (isNaN(val) || val <= 20 || val >= 300) {
      await modal.alert({
        title: 'Cân nặng không hợp lệ',
        message: 'Vui lòng nhập số cân nặng hợp lệ (từ 20kg đến 300kg).',
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

        // Cập nhật current_weight trong profile
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

  // Mốc thống kê biểu đồ
  const chartData = useMemo(() => {
    const list = weightHistory.slice(-7);
    const weights = list.map((w) => Number(w.weight));
    const minW = weights.length > 0 ? Math.min(...weights, targetWeight) - 2 : 50;
    const maxW = weights.length > 0 ? Math.max(...weights, currentWeight) + 2 : 80;
    const range = Math.max(1, maxW - minW);
    return { list, minW, maxW, range };
  }, [weightHistory, currentWeight, targetWeight]);

  return (
    <ScrollView
      backgroundColor={THEME.colors.background}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 14),
        paddingBottom: Math.max(insets.bottom + 70, 90),
      }}
      showsVerticalScrollIndicator={false}
    >
      <YStack paddingHorizontal="$3.5" gap="$3">
        {/* ========================================================================= */}
        {/* HEADER GỌN GÀNG, KHÔNG THỪA KHOẢNG TRẮNG */}
        {/* ========================================================================= */}
        <YStack gap="$0.5">
          <XStack alignItems="center" gap="$1.5">
            <Text fontSize={20} fontWeight="900" color="#0F172A">
              Mục Tiêu & AI Coach
            </Text>
            <Text fontSize={20}>🎯</Text>
          </XStack>
          <Text fontSize={12} color="#64748B" fontWeight="500">
            Kế hoạch calo & phân tích tính khả thi cá nhân hóa
          </Text>
        </YStack>

        {/* ========================================================================= */}
        {/* 1. THẺ THỂ TRẠNG HIỆN TẠI (TỪ HỒ SƠ CÁ NHÂN) */}
        {/* ========================================================================= */}
        <YStack
          backgroundColor="#FFFFFF"
          borderRadius={20}
          padding="$3.5"
          borderWidth={1}
          borderColor="#E2E8F0"
          gap="$2.5"
          style={THEME.shadow}
        >
          <XStack justifyContent="space-between" alignItems="center">
            <XStack alignItems="center" gap="$2">
              <Text fontSize={15}>👤</Text>
              <Text fontSize={14.5} fontWeight="800" color="#0F172A">
                Thể trạng của bạn
              </Text>
            </XStack>

            <View
              backgroundColor="#EFF6FF"
              paddingHorizontal="$2.5"
              paddingVertical="$0.5"
              borderRadius={12}
            >
              <Text fontSize={11} fontWeight="800" color="#2563EB">
                BMI: {aiAnalysis.currentBMI} ({aiAnalysis.bmiCategory.label})
              </Text>
            </View>
          </XStack>

          {/* Dòng tóm tắt thông số cá nhân */}
          <XStack gap="$2" flexWrap="wrap">
            <View
              flex={1}
              minWidth={100}
              backgroundColor="#F8FAFC"
              paddingVertical="$2"
              paddingHorizontal="$2.5"
              borderRadius={14}
              borderWidth={1}
              borderColor="#E2E8F0"
            >
              <Text fontSize={10.5} fontWeight="700" color="#64748B">CÂN NẶNG</Text>
              <Text fontSize={16} fontWeight="900" color="#0F172A">
                {currentWeight} <Text fontSize={11} fontWeight="600">kg</Text>
              </Text>
              <Text fontSize={10} color="#64748B">Cao {height}cm • {age}t</Text>
            </View>

            <View
              flex={1}
              minWidth={100}
              backgroundColor="#F8FAFC"
              paddingVertical="$2"
              paddingHorizontal="$2.5"
              borderRadius={14}
              borderWidth={1}
              borderColor="#E2E8F0"
            >
              <Text fontSize={10.5} fontWeight="700" color="#64748B">TIÊU HAO (TDEE)</Text>
              <Text fontSize={16} fontWeight="900" color="#0055D4">
                {aiAnalysis.tdee} <Text fontSize={11} fontWeight="600">kcal</Text>
              </Text>
              <Text fontSize={10} color="#64748B">BMR: {aiAnalysis.bmr} kcal</Text>
            </View>
          </XStack>

          {/* Mức độ vận động lấy từ thông tin cá nhân */}
          <XStack
            backgroundColor="#F1F5F9"
            paddingVertical="$1.5"
            paddingHorizontal="$2.5"
            borderRadius={12}
            alignItems="center"
            gap="$1.5"
          >
            <Text fontSize={13}>🏃</Text>
            <Text fontSize={11.5} color="#475569" fontWeight="600" flexShrink={1}>
              Vận động (theo hồ sơ): <Text fontWeight="800" color="#0F172A">{getActivityLabel(activityLevel)}</Text>
            </Text>
          </XStack>
        </YStack>

        {/* ========================================================================= */}
        {/* 2. THIẾT LẬP MỤC TIÊU: CÂN NẶNG ĐÍCH & SỐ NGÀY TỰ NHẬP */}
        {/* ========================================================================= */}
        <YStack
          backgroundColor="#FFFFFF"
          borderRadius={20}
          padding="$3.5"
          borderWidth={1}
          borderColor="#E2E8F0"
          gap="$3"
          style={THEME.shadow}
        >
          <XStack justifyContent="space-between" alignItems="center">
            <XStack alignItems="center" gap="$2">
              <Text fontSize={15}>🎯</Text>
              <Text fontSize={14.5} fontWeight="800" color="#0F172A">
                Mục tiêu mong muốn
              </Text>
            </XStack>

            <View
              backgroundColor={
                aiAnalysis.goalType === 'Giảm cân'
                  ? '#EFF6FF'
                  : aiAnalysis.goalType === 'Tăng cân'
                  ? '#FEF3C7'
                  : '#DCFCE7'
              }
              paddingHorizontal="$2.5"
              paddingVertical="$1"
              borderRadius={12}
            >
              <Text
                fontSize={11.5}
                fontWeight="800"
                color={
                  aiAnalysis.goalType === 'Giảm cân'
                    ? '#2563EB'
                    : aiAnalysis.goalType === 'Tăng cân'
                    ? '#D97706'
                    : '#16A34A'
                }
              >
                {aiAnalysis.goalType} ({aiAnalysis.weightDiff > 0 ? `${aiAnalysis.weightDiff}kg` : '0kg'})
              </Text>
            </View>
          </XStack>

          {/* 2.1 Cân Nặng Mục Tiêu */}
          <YStack gap="$1.5">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={12.5} fontWeight="700" color="#334155">
                Cân nặng mục tiêu (kg):
              </Text>
              <Text fontSize={11.5} color="#64748B">
                BMI đích: <Text fontWeight="700" color="#0F172A">{aiAnalysis.targetBMI}</Text>
              </Text>
            </XStack>

            <XStack alignItems="center" gap="$2">
              <TouchableOpacity
                onPress={() => setTargetWeight((prev) => Math.max(30, Math.round((prev - 0.5) * 10) / 10))}
                activeOpacity={0.6}
              >
                <View
                  width={42}
                  height={42}
                  borderRadius={12}
                  backgroundColor="#F1F5F9"
                  alignItems="center"
                  justifyContent="center"
                  borderWidth={1}
                  borderColor="#E2E8F0"
                >
                  <Text fontSize={20} fontWeight="800" color="#475569">
                    -
                  </Text>
                </View>
              </TouchableOpacity>

              <Input
                flex={1}
                height={42}
                borderRadius={12}
                borderWidth={1.5}
                borderColor="#E2E8F0"
                backgroundColor="#F8FAFC"
                fontSize={16}
                fontWeight="800"
                color="#0F172A"
                textAlign="center"
                keyboardType="numeric"
                value={String(targetWeight)}
                onChangeText={(t) => {
                  const val = parseFloat(t);
                  setTargetWeight(isNaN(val) ? 0 : val);
                }}
              />

              <TouchableOpacity
                onPress={() => setTargetWeight((prev) => Math.min(250, Math.round((prev + 0.5) * 10) / 10))}
                activeOpacity={0.6}
              >
                <View
                  width={42}
                  height={42}
                  borderRadius={12}
                  backgroundColor="#F1F5F9"
                  alignItems="center"
                  justifyContent="center"
                  borderWidth={1}
                  borderColor="#E2E8F0"
                >
                  <Text fontSize={20} fontWeight="800" color="#475569">
                    +
                  </Text>
                </View>
              </TouchableOpacity>
            </XStack>
          </YStack>

          {/* 2.2 Số Ngày Hoàn Thành Mục Tiêu (Người Dùng Tự Nhập Trực Tiếp) */}
          <YStack gap="$1.5">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={12.5} fontWeight="700" color="#334155">
                Số ngày thực hiện (tự nhập):
              </Text>
              <Text fontSize={11.5} color="#0055D4" fontWeight="700">
                ~{aiAnalysis.weeks} tuần (khoảng {(targetDays / 30).toFixed(1)} tháng)
              </Text>
            </XStack>

            <XStack alignItems="center" gap="$2">
              <TouchableOpacity
                onPress={() => setTargetDays((prev) => Math.max(5, prev - 5))}
                activeOpacity={0.6}
              >
                <View
                  width={42}
                  height={42}
                  borderRadius={12}
                  backgroundColor="#F1F5F9"
                  alignItems="center"
                  justifyContent="center"
                  borderWidth={1}
                  borderColor="#E2E8F0"
                >
                  <Text fontSize={13} fontWeight="800" color="#475569">
                    -5d
                  </Text>
                </View>
              </TouchableOpacity>

              <Input
                flex={1}
                height={42}
                borderRadius={12}
                borderWidth={1.5}
                borderColor="#E2E8F0"
                backgroundColor="#F8FAFC"
                fontSize={16}
                fontWeight="800"
                color="#0F172A"
                textAlign="center"
                keyboardType="numeric"
                placeholder="Nhập số ngày"
                value={targetDays > 0 ? String(targetDays) : ''}
                onChangeText={(t) => {
                  const val = parseInt(t, 10);
                  setTargetDays(isNaN(val) ? 0 : val);
                }}
              />

              <TouchableOpacity
                onPress={() => setTargetDays((prev) => prev + 5)}
                activeOpacity={0.6}
              >
                <View
                  width={42}
                  height={42}
                  borderRadius={12}
                  backgroundColor="#F1F5F9"
                  alignItems="center"
                  justifyContent="center"
                  borderWidth={1}
                  borderColor="#E2E8F0"
                >
                  <Text fontSize={13} fontWeight="800" color="#475569">
                    +5d
                  </Text>
                </View>
              </TouchableOpacity>
            </XStack>
          </YStack>
        </YStack>

        {/* ========================================================================= */}
        {/* 3. THẺ PHÂN TÍCH KHẢ THI & KẾ HOẠCH DINH DƯỠNG TỪ AI COACH */}
        {/* ========================================================================= */}
        <YStack
          backgroundColor="#FFFFFF"
          borderRadius={20}
          padding="$3.5"
          borderWidth={1.5}
          borderColor={aiAnalysis.badgeColor}
          gap="$3"
          style={THEME.shadow}
        >
          {/* Header AI & Đánh giá mức độ */}
          <XStack justifyContent="space-between" alignItems="center">
            <XStack alignItems="center" gap="$2">
              <Text fontSize={17}>
                {aiAnalysis.feasibilityLevel === 'hazardous'
                  ? '⚠️'
                  : aiAnalysis.feasibilityLevel === 'challenging'
                  ? '⚡'
                  : '🤖'}
              </Text>
              <Text fontSize={14.5} fontWeight="900" color="#0F172A">
                Đánh giá AI
              </Text>
            </XStack>

            <View
              backgroundColor={aiAnalysis.badgeColor}
              paddingHorizontal="$2.5"
              paddingVertical="$1"
              borderRadius={12}
            >
              <Text fontSize={11} fontWeight="800" color="#FFFFFF">
                {aiAnalysis.difficultyTitle}
              </Text>
            </View>
          </XStack>

          {/* Điểm khả thi & Tốc độ thay đổi */}
          <YStack gap="$1">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={12} fontWeight="700" color="#475569">
                Điểm khả thi: <Text fontWeight="900" color={aiAnalysis.badgeColor}>{aiAnalysis.feasibilityScore}%</Text>
              </Text>
              <Text fontSize={12} fontWeight="700" color="#475569">
                Tốc độ: ~{aiAnalysis.ratePerWeek} kg/tuần
              </Text>
            </XStack>
            <View height={6} backgroundColor="#E2E8F0" borderRadius={3} overflow="hidden">
              <View
                width={`${aiAnalysis.feasibilityScore}%`}
                height="100%"
                backgroundColor={aiAnalysis.badgeColor}
                borderRadius={3}
              />
            </View>
          </YStack>

          {/* Chi tiết nhận định từ AI */}
          <YStack
            backgroundColor="#F8FAFC"
            padding="$2.5"
            borderRadius={14}
            borderWidth={1}
            borderColor="#E2E8F0"
            gap="$2"
          >
            <Text fontSize={12.5} color="#0F172A" lineHeight={18} fontWeight="500">
              {aiAnalysis.detailedAnalysis}
            </Text>

            {/* Gợi ý điều chỉnh nếu quá gấp */}
            {aiAnalysis.suggestedTargetDaysMin && (
              <XStack
                backgroundColor="#FFF1F2"
                padding="$2"
                borderRadius={10}
                borderWidth={1}
                borderColor="#FECDD3"
                alignItems="center"
                justifyContent="space-between"
                gap="$1.5"
              >
                <Text fontSize={11} color="#9F1239" fontWeight="600" flex={1}>
                  💡 Khuyên đặt tối thiểu {aiAnalysis.suggestedTargetDaysMin} ngày để an toàn.
                </Text>
                <TouchableOpacity
                  onPress={() => setTargetDays(aiAnalysis.suggestedTargetDaysMin || 90)}
                  activeOpacity={0.7}
                >
                  <View
                    backgroundColor="#BE123C"
                    paddingHorizontal="$2.5"
                    paddingVertical="$1"
                    borderRadius={8}
                  >
                    <Text fontSize={10.5} fontWeight="800" color="#FFFFFF">
                      Áp dụng
                    </Text>
                  </View>
                </TouchableOpacity>
              </XStack>
            )}
          </YStack>

          {/* Khối Lượng Calo Đề Xuất Mỗi Ngày */}
          <YStack
            backgroundColor="#EEF4FF"
            padding="$3"
            borderRadius={16}
            borderWidth={1}
            borderColor="#DBEAFE"
            gap="$2.5"
          >
            <XStack justifyContent="space-between" alignItems="center">
              <YStack>
                <Text fontSize={11} fontWeight="700" color="#475569">
                  MỤC TIÊU ĂN HÀNG NGÀY:
                </Text>
                <XStack alignItems="baseline" gap="$1">
                  <Text fontSize={26} fontWeight="900" color="#0055D4">
                    {aiAnalysis.dailyCalorieTarget}
                  </Text>
                  <Text fontSize={13} fontWeight="800" color="#0055D4">
                    kcal / ngày
                  </Text>
                </XStack>
              </YStack>

              <YStack alignItems="flex-end">
                <Text fontSize={10.5} color="#64748B">
                  Tiêu hao: {aiAnalysis.tdee} kcal
                </Text>
                <Text
                  fontSize={11.5}
                  fontWeight="800"
                  color={aiAnalysis.dailyCalorieAdjustment < 0 ? '#2563EB' : '#D97706'}
                >
                  {aiAnalysis.dailyCalorieAdjustment < 0
                    ? `Thâm hụt: ${aiAnalysis.dailyCalorieAdjustment} kcal`
                    : aiAnalysis.dailyCalorieAdjustment > 0
                    ? `Thặng dư: +${aiAnalysis.dailyCalorieAdjustment} kcal`
                    : 'Cân bằng'}
                </Text>
              </YStack>
            </XStack>

            {/* 3 Thẻ Macro (Carb / Đạm / Béo) */}
            <XStack gap="$1.5">
              <View
                flex={1}
                backgroundColor="#FFFFFF"
                paddingVertical="$2"
                paddingHorizontal="$1.5"
                borderRadius={12}
                alignItems="center"
                borderWidth={1}
                borderColor="#E2E8F0"
              >
                <Text fontSize={10.5} fontWeight="700" color="#2563EB">● Carb</Text>
                <Text fontSize={14.5} fontWeight="900" color="#0F172A">{aiAnalysis.macros.carbGrams}g</Text>
                <Text fontSize={9.5} color="#64748B">{aiAnalysis.macros.carbPercentage}% calo</Text>
              </View>

              <View
                flex={1}
                backgroundColor="#FFFFFF"
                paddingVertical="$2"
                paddingHorizontal="$1.5"
                borderRadius={12}
                alignItems="center"
                borderWidth={1}
                borderColor="#E2E8F0"
              >
                <Text fontSize={10.5} fontWeight="700" color="#059669">● Đạm</Text>
                <Text fontSize={14.5} fontWeight="900" color="#0F172A">{aiAnalysis.macros.proteinGrams}g</Text>
                <Text fontSize={9.5} color="#64748B">{aiAnalysis.macros.proteinPercentage}% calo</Text>
              </View>

              <View
                flex={1}
                backgroundColor="#FFFFFF"
                paddingVertical="$2"
                paddingHorizontal="$1.5"
                borderRadius={12}
                alignItems="center"
                borderWidth={1}
                borderColor="#E2E8F0"
              >
                <Text fontSize={10.5} fontWeight="700" color="#EA580C">● Béo</Text>
                <Text fontSize={14.5} fontWeight="900" color="#0F172A">{aiAnalysis.macros.fatGrams}g</Text>
                <Text fontSize={9.5} color="#64748B">{aiAnalysis.macros.fatPercentage}% calo</Text>
              </View>
            </XStack>
          </YStack>

          {/* Lời khuyên ngắn từ AI */}
          <YStack gap="$1.5">
            {aiAnalysis.actionableTips.map((tip, idx) => (
              <Text key={idx} fontSize={11.5} color="#475569" lineHeight={16}>
                {tip}
              </Text>
            ))}
          </YStack>

          {/* NÚT LƯU MỤC TIÊU VÀ ĐỒNG BỘ TOÀN APP */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleApplyGoal}
            disabled={isSavingGoal}
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
                {isSavingGoal ? (
                  <Spinner size="small" color="#FFFFFF" />
                ) : (
                  <Text fontSize={15} color="#FFFFFF">
                    ✓
                  </Text>
                )}
                <Text color="#FFFFFF" fontSize={14} fontWeight="800">
                  {isSavingGoal
                    ? 'Đang đồng bộ...'
                    : `Lưu mục tiêu (~${aiAnalysis.dailyCalorieTarget} kcal)`}
                </Text>
              </XStack>
            </View>
          </TouchableOpacity>
        </YStack>

        {/* ========================================================================= */}
        {/* 4. BIỂU ĐỒ CÂN NẶNG & GHI NHẬN HÔM NAY */}
        {/* ========================================================================= */}
        <YStack
          backgroundColor="#FFFFFF"
          borderRadius={20}
          padding="$3.5"
          borderWidth={1}
          borderColor="#E2E8F0"
          gap="$2.5"
          style={THEME.shadow}
        >
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize={14.5} fontWeight="800" color="#0F172A">
              Tiến trình cân nặng 📈
            </Text>
            <Text fontSize={11.5} color="#64748B">
              {weightHistory.length} lần ghi nhận
            </Text>
          </XStack>

          {/* Biểu đồ trực quan */}
          {isLoading ? (
            <YStack padding="$4" alignItems="center">
              <Spinner size="small" color="#0055D4" />
            </YStack>
          ) : weightHistory.length === 0 ? (
            <YStack padding="$3" alignItems="center" gap="$1.5">
              <Text fontSize={26}>⚖️</Text>
              <Text fontSize={12} color="#94A3B8" textAlign="center">
                Chưa có lịch sử. Nhập cân nặng hôm nay bên dưới để bắt đầu!
              </Text>
            </YStack>
          ) : (
            <YStack gap="$1.5">
              <View
                height={130}
                backgroundColor="#F8FAFC"
                borderRadius={14}
                padding="$2.5"
                justifyContent="flex-end"
                borderWidth={1}
                borderColor="#E2E8F0"
              >
                <XStack height="100%" alignItems="flex-end" justifyContent="space-around">
                  {chartData.list.map((item, index) => {
                    const hPercent = Math.min(
                      100,
                      Math.max(
                        15,
                        Math.round(((Number(item.weight) - chartData.minW) / chartData.range) * 100)
                      )
                    );
                    const isNearTarget = Math.abs(Number(item.weight) - targetWeight) <= 1;

                    return (
                      <YStack key={item.id || index} alignItems="center" gap="$0.5">
                        <Text fontSize={9.5} fontWeight="700" color="#0F172A">
                          {item.weight}
                        </Text>
                        <View
                          width={20}
                          height={`${hPercent}%`}
                          backgroundColor={isNearTarget ? '#10B981' : '#0055D4'}
                          borderRadius={4}
                        />
                        <Text fontSize={8.5} color="#64748B">
                          {item.recorded_date.slice(5)}
                        </Text>
                      </YStack>
                    );
                  })}
                </XStack>
              </View>

              <XStack justifyContent="space-between" paddingHorizontal="$1">
                <Text fontSize={11} color="#64748B">
                  Mục tiêu: <Text fontWeight="800" color="#0055D4">{targetWeight} kg</Text>
                </Text>
                <Text fontSize={11} color="#64748B">
                  Thấp: {chartData.minW + 2}kg • Cao: {chartData.maxW - 2}kg
                </Text>
              </XStack>
            </YStack>
          )}

          {/* Ô nhập số cân hôm nay */}
          <XStack gap="$2" alignItems="center" paddingTop="$1">
            <Input
              flex={1}
              value={newWeightInput}
              onChangeText={setNewWeightInput}
              placeholder="Cân nặng hôm nay (kg)"
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
                {isSavingWeight ? 'Lưu...' : 'Lưu lại'}
              </Text>
            </Button>
          </XStack>
        </YStack>
      </YStack>
    </ScrollView>
  );
}
