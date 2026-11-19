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
import { TouchableOpacity, Alert, Platform } from 'react-native';
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
  ACTIVITY_OPTIONS,
  GoalAIAnalysis,
} from '../../src/services/goalAIService';

export default function GoalScreen() {
  const dispatch = useAppDispatch();
  const modal = useAppModal();
  const insets = useSafeAreaInsets();
  const { userId, profile } = useAppSelector((state) => state.auth);

  // Dữ liệu thể trạng cơ bản từ profile
  const [currentWeight, setCurrentWeight] = useState<number>(Number(profile?.current_weight || 65));
  const [targetWeight, setTargetWeight] = useState<number>(Number(profile?.target_weight || 60));
  const [height, setHeight] = useState<number>(Number(profile?.height || 168));
  const [age, setAge] = useState<number>(Number(profile?.age || 25));
  const [gender, setGender] = useState<string>(profile?.gender || 'Nam');
  const [activityLevel, setActivityLevel] = useState<string>(profile?.activity_level || 'moderate');
  const [targetDays, setTargetDays] = useState<number>(Number(profile?.target_days || 60));

  // Trạng thái giao diện
  const [weightHistory, setWeightHistory] = useState<WeightHistory[]>([]);
  const [newWeightInput, setNewWeightInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingGoal, setIsSavingGoal] = useState<boolean>(false);
  const [isSavingWeight, setIsSavingWeight] = useState<boolean>(false);
  const [showEditBaseline, setShowEditBaseline] = useState<boolean>(false);

  // Đồng bộ state khi profile trong Redux thay đổi
  useEffect(() => {
    if (profile) {
      if (profile.current_weight) setCurrentWeight(Number(profile.current_weight));
      if (profile.target_weight) setTargetWeight(Number(profile.target_weight));
      if (profile.height) setHeight(Number(profile.height));
      if (profile.age) setAge(Number(profile.age));
      if (profile.gender) setGender(profile.gender);
      if (profile.activity_level) setActivityLevel(profile.activity_level);
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

  // PHÂN TÍCH THÔNG MINH BẰNG HUẤN LUYỆN VIÊN AI (REAL-TIME REACTIVE)
  const aiAnalysis: GoalAIAnalysis = useMemo(() => {
    return analyzeGoalWithAI({
      currentWeight,
      targetWeight,
      height,
      age,
      gender,
      activityLevel,
      targetDays,
    });
  }, [currentWeight, targetWeight, height, age, gender, activityLevel, targetDays]);

  // Xử lý áp dụng mục tiêu mới vào toàn bộ hệ thống
  const handleApplyGoal = async () => {
    setIsSavingGoal(true);
    const updates: Partial<Profile> = {
      target_weight: targetWeight,
      target_days: targetDays,
      activity_level: activityLevel,
      goal_type: aiAnalysis.goalType,
      daily_calorie_goal: aiAnalysis.dailyCalorieTarget,
      bmr: aiAnalysis.bmr,
      tdee: aiAnalysis.tdee,
      height,
      age,
      gender,
      current_weight: currentWeight,
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
        message: `Đã cập nhật mục tiêu ${aiAnalysis.goalType} (~${aiAnalysis.dailyCalorieTarget} kcal/ngày). Toàn bộ Trang chủ và Nhật ký dinh dưỡng đã được đồng bộ!`,
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

      // Thêm vào danh sách tạm trên giao diện
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
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: Math.max(insets.bottom + 80, 100),
      }}
      showsVerticalScrollIndicator={false}
    >
      <YStack paddingHorizontal="$4" gap="$4">
        {/* ========================================================================= */}
        {/* HEADER TRANG */}
        {/* ========================================================================= */}
        <XStack justifyContent="space-between" alignItems="center">
          <YStack gap="$1">
            <XStack alignItems="center" gap="$2">
              <Text fontSize={22} fontWeight="900" color="#0F172A">
                Mục Tiêu & AI Coach
              </Text>
              <Text fontSize={22}>🎯</Text>
            </XStack>
            <Text fontSize={13} color="#64748B" fontWeight="500">
              Phân tích thể trạng, dự báo khả thi & kế hoạch calo cá nhân hóa
            </Text>
          </YStack>
        </XStack>

        {/* ========================================================================= */}
        {/* 1. THẺ THỂ TRẠNG HIỆN TẠI & CHỈ SỐ CHUYỂN HÓA CỦA BẠN */}
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
          <XStack justifyContent="space-between" alignItems="center">
            <XStack alignItems="center" gap="$2.5">
              <View
                width={36}
                height={36}
                borderRadius={18}
                backgroundColor="#EFF6FF"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize={18}>👤</Text>
              </View>
              <YStack>
                <Text fontSize={15.5} fontWeight="800" color="#0F172A">
                  Thể trạng hiện tại
                </Text>
                <Text fontSize={12} color="#64748B">
                  Chỉ số sức khỏe & tốc độ chuyển hóa
                </Text>
              </YStack>
            </XStack>

            <TouchableOpacity
              onPress={() => setShowEditBaseline(!showEditBaseline)}
              activeOpacity={0.7}
            >
              <View
                backgroundColor={showEditBaseline ? '#E2E8F0' : '#F1F5F9'}
                paddingHorizontal="$3"
                paddingVertical="$1"
                borderRadius={14}
              >
                <Text fontSize={12} fontWeight="700" color="#0055D4">
                  {showEditBaseline ? 'Đóng ✕' : 'Chỉnh thể trạng ✎'}
                </Text>
              </View>
            </TouchableOpacity>
          </XStack>

          {/* Form chỉnh sửa thể trạng cơ bản khi bấm mở */}
          {showEditBaseline && (
            <YStack
              backgroundColor="#F8FAFC"
              padding="$3.5"
              borderRadius={18}
              borderWidth={1}
              borderColor="#E2E8F0"
              gap="$3"
            >
              <Text fontSize={13} fontWeight="700" color="#475569">
                Cập nhật thông tin thể trạng:
              </Text>
              <XStack gap="$3">
                <YStack flex={1} gap="$1">
                  <Text fontSize={12} color="#64748B" fontWeight="600">
                    Cân nặng (kg)
                  </Text>
                  <Input
                    backgroundColor="#FFFFFF"
                    height={42}
                    borderRadius={12}
                    borderWidth={1}
                    borderColor="#CBD5E1"
                    fontSize={14}
                    fontWeight="700"
                    keyboardType="numeric"
                    value={String(currentWeight)}
                    onChangeText={(t) => setCurrentWeight(Number(t) || currentWeight)}
                  />
                </YStack>

                <YStack flex={1} gap="$1">
                  <Text fontSize={12} color="#64748B" fontWeight="600">
                    Chiều cao (cm)
                  </Text>
                  <Input
                    backgroundColor="#FFFFFF"
                    height={42}
                    borderRadius={12}
                    borderWidth={1}
                    borderColor="#CBD5E1"
                    fontSize={14}
                    fontWeight="700"
                    keyboardType="numeric"
                    value={String(height)}
                    onChangeText={(t) => setHeight(Number(t) || height)}
                  />
                </YStack>

                <YStack flex={1} gap="$1">
                  <Text fontSize={12} color="#64748B" fontWeight="600">
                    Tuổi
                  </Text>
                  <Input
                    backgroundColor="#FFFFFF"
                    height={42}
                    borderRadius={12}
                    borderWidth={1}
                    borderColor="#CBD5E1"
                    fontSize={14}
                    fontWeight="700"
                    keyboardType="numeric"
                    value={String(age)}
                    onChangeText={(t) => setAge(Number(t) || age)}
                  />
                </YStack>
              </XStack>

              <XStack gap="$2" alignItems="center">
                <Text fontSize={12} color="#64748B" fontWeight="600">
                  Giới tính:
                </Text>
                {['Nam', 'Nữ'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g)}
                    activeOpacity={0.7}
                  >
                    <View
                      backgroundColor={gender === g ? '#0055D4' : '#FFFFFF'}
                      borderWidth={1}
                      borderColor={gender === g ? '#0055D4' : '#CBD5E1'}
                      paddingHorizontal="$3.5"
                      paddingVertical="$1"
                      borderRadius={14}
                    >
                      <Text
                        fontSize={12}
                        fontWeight="700"
                        color={gender === g ? '#FFFFFF' : '#475569'}
                      >
                        {g}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </XStack>
            </YStack>
          )}

          {/* 3 Thẻ thống kê chỉ số thể trạng */}
          <XStack gap="$2.5">
            <YStack
              flex={1}
              backgroundColor="#F8FAFC"
              padding="$3"
              borderRadius={18}
              borderWidth={1}
              borderColor="#E2E8F0"
              alignItems="center"
              gap="$1"
            >
              <Text fontSize={11} fontWeight="700" color="#64748B">
                CÂN NẶNG HIỆN TẠI
              </Text>
              <Text fontSize={20} fontWeight="900" color="#0F172A">
                {currentWeight} <Text fontSize={12} fontWeight="600">kg</Text>
              </Text>
              <Text fontSize={11} fontWeight="600" color="#64748B">
                Cao {height}cm
              </Text>
            </YStack>

            <YStack
              flex={1}
              backgroundColor="#F8FAFC"
              padding="$3"
              borderRadius={18}
              borderWidth={1}
              borderColor="#E2E8F0"
              alignItems="center"
              gap="$1"
            >
              <Text fontSize={11} fontWeight="700" color="#64748B">
                CHỈ SỐ BMI
              </Text>
              <Text fontSize={20} fontWeight="900" color={aiAnalysis.bmiCategory.color}>
                {aiAnalysis.currentBMI}
              </Text>
              <View
                backgroundColor="#FFFFFF"
                paddingHorizontal="$2"
                paddingVertical="$0.5"
                borderRadius={10}
                borderWidth={1}
                borderColor="#E2E8F0"
              >
                <Text fontSize={10} fontWeight="700" color={aiAnalysis.bmiCategory.color}>
                  {aiAnalysis.bmiCategory.label}
                </Text>
              </View>
            </YStack>

            <YStack
              flex={1}
              backgroundColor="#F8FAFC"
              padding="$3"
              borderRadius={18}
              borderWidth={1}
              borderColor="#E2E8F0"
              alignItems="center"
              gap="$1"
            >
              <Text fontSize={11} fontWeight="700" color="#64748B">
                TIÊU HAO TDEE
              </Text>
              <Text fontSize={20} fontWeight="900" color="#0055D4">
                {aiAnalysis.tdee}
              </Text>
              <Text fontSize={11} fontWeight="600" color="#64748B">
                BMR: {aiAnalysis.bmr} kcal
              </Text>
            </YStack>
          </XStack>
        </YStack>

        {/* ========================================================================= */}
        {/* 2. THIẾT LẬP MỤC TIÊU CÂN NẶNG & THỜI GIAN THỰC HIỆN */}
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
          <XStack justifyContent="space-between" alignItems="center">
            <XStack alignItems="center" gap="$2.5">
              <View
                width={36}
                height={36}
                borderRadius={18}
                backgroundColor="#FEF3C7"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize={18}>🎯</Text>
              </View>
              <YStack>
                <Text fontSize={15.5} fontWeight="800" color="#0F172A">
                  Kế hoạch mong muốn
                </Text>
                <Text fontSize={12} color="#64748B">
                  Chọn cân nặng đích và thời gian hoàn thành
                </Text>
              </YStack>
            </XStack>

            <View
              backgroundColor={
                aiAnalysis.goalType === 'Giảm cân'
                  ? '#EFF6FF'
                  : aiAnalysis.goalType === 'Tăng cân'
                  ? '#FEF3C7'
                  : '#DCFCE7'
              }
              paddingHorizontal="$3"
              paddingVertical="$1"
              borderRadius={14}
            >
              <Text
                fontSize={12}
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

          {/* 2.1 Chọn Cân Nặng Mục Tiêu */}
          <YStack gap="$2.5">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={13.5} fontWeight="700" color="#334155">
                Cân nặng mục tiêu (kg):
              </Text>
              <Text fontSize={12.5} color="#64748B">
                BMI đích: <Text fontWeight="700" color="#0F172A">{aiAnalysis.targetBMI}</Text> ({aiAnalysis.bmiCategory.targetLabel})
              </Text>
            </XStack>

            <XStack alignItems="center" gap="$2">
              <XStack
                flex={1}
                alignItems="center"
                justifyContent="space-between"
                backgroundColor="#F8FAFC"
                borderRadius={20}
                borderWidth={1.5}
                borderColor="#E2E8F0"
                paddingHorizontal="$3"
                height={48}
              >
                <TouchableOpacity
                  onPress={() => setTargetWeight((prev) => Math.max(30, Math.round((prev - 0.5) * 10) / 10))}
                  activeOpacity={0.6}
                >
                  <Text fontSize={22} fontWeight="800" color="#64748B" paddingHorizontal="$2">
                    -
                  </Text>
                </TouchableOpacity>

                <XStack alignItems="baseline" gap="$1">
                  <Text fontSize={20} fontWeight="900" color="#0F172A">
                    {targetWeight}
                  </Text>
                  <Text fontSize={13} fontWeight="700" color="#64748B">
                    kg
                  </Text>
                </XStack>

                <TouchableOpacity
                  onPress={() => setTargetWeight((prev) => Math.min(200, Math.round((prev + 0.5) * 10) / 10))}
                  activeOpacity={0.6}
                >
                  <Text fontSize={22} fontWeight="800" color="#64748B" paddingHorizontal="$2">
                    +
                  </Text>
                </TouchableOpacity>
              </XStack>

              {/* Nút chỉnh nhanh */}
              {[-2, -1, +1, +2].map((delta) => (
                <TouchableOpacity
                  key={delta}
                  onPress={() => setTargetWeight((prev) => Math.max(30, prev + delta))}
                  activeOpacity={0.7}
                >
                  <View
                    backgroundColor="#F1F5F9"
                    borderRadius={18}
                    paddingHorizontal="$2.5"
                    paddingVertical="$2"
                    borderWidth={1}
                    borderColor="#E2E8F0"
                  >
                    <Text fontSize={12} fontWeight="800" color="#0055D4">
                      {delta > 0 ? `+${delta}k` : `${delta}k`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </XStack>
          </YStack>

          {/* 2.2 Chọn Thời Gian Hoàn Thành (Timeline) */}
          <YStack gap="$2.5">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={13.5} fontWeight="700" color="#334155">
                Thời gian dự kiến hoàn thành:
              </Text>
              <Text fontSize={12.5} color="#0055D4" fontWeight="700">
                {targetDays} ngày (~{aiAnalysis.weeks} tuần)
              </Text>
            </XStack>

            <XStack gap="$2" flexWrap="wrap">
              {[
                { days: 30, label: '30 ngày (~1 tháng)' },
                { days: 60, label: '60 ngày (~2 tháng)' },
                { days: 90, label: '90 ngày (~3 tháng)' },
                { days: 180, label: '180 ngày (~6 tháng)' },
              ].map((item) => {
                const isSelected = targetDays === item.days;
                return (
                  <TouchableOpacity
                    key={item.days}
                    onPress={() => setTargetDays(item.days)}
                    activeOpacity={0.7}
                    style={{ flex: 1, minWidth: '45%' }}
                  >
                    <View
                      backgroundColor={isSelected ? '#0055D4' : '#F8FAFC'}
                      borderWidth={1.5}
                      borderColor={isSelected ? '#0055D4' : '#E2E8F0'}
                      borderRadius={16}
                      paddingVertical="$2.5"
                      alignItems="center"
                    >
                      <Text
                        fontSize={12.5}
                        fontWeight="800"
                        color={isSelected ? '#FFFFFF' : '#334155'}
                      >
                        {item.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </XStack>
          </YStack>

          {/* 2.3 Chọn Mức Độ Vận Động / Tập Luyện */}
          <YStack gap="$2.5">
            <Text fontSize={13.5} fontWeight="700" color="#334155">
              Mức độ tập luyện & vận động:
            </Text>

            <YStack gap="$2">
              {ACTIVITY_OPTIONS.map((item) => {
                const isSelected =
                  activityLevel === item.key ||
                  activityLevel?.toLowerCase().includes(item.label.toLowerCase().slice(0, 4));

                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setActivityLevel(item.key)}
                    activeOpacity={0.7}
                  >
                    <XStack
                      backgroundColor={isSelected ? '#EFF6FF' : '#F8FAFC'}
                      borderWidth={1.5}
                      borderColor={isSelected ? '#0055D4' : '#E2E8F0'}
                      borderRadius={18}
                      padding="$3"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <XStack alignItems="center" gap="$3" flex={1}>
                        <Text fontSize={24}>{item.icon}</Text>
                        <YStack flex={1}>
                          <Text
                            fontSize={13.5}
                            fontWeight="800"
                            color={isSelected ? '#0055D4' : '#0F172A'}
                          >
                            {item.label}
                          </Text>
                          <Text fontSize={11.5} color="#64748B">
                            {item.sublabel}
                          </Text>
                        </YStack>
                      </XStack>

                      <View
                        width={20}
                        height={20}
                        borderRadius={10}
                        borderWidth={2}
                        borderColor={isSelected ? '#0055D4' : '#CBD5E1'}
                        alignItems="center"
                        justifyContent="center"
                      >
                        {isSelected && (
                          <View
                            width={10}
                            height={10}
                            borderRadius={5}
                            backgroundColor="#0055D4"
                          />
                        )}
                      </View>
                    </XStack>
                  </TouchableOpacity>
                );
              })}
            </YStack>
          </YStack>
        </YStack>

        {/* ========================================================================= */}
        {/* 3. THẺ PHÂN TÍCH KHẢ THI TỪ HUẤN LUYỆN VIÊN AI (AI COACH ASSESSMENT) */}
        {/* ========================================================================= */}
        <YStack
          backgroundColor="#FFFFFF"
          borderRadius={24}
          padding="$4"
          borderWidth={1.5}
          borderColor={aiAnalysis.badgeColor}
          gap="$4"
          style={THEME.shadow}
        >
          {/* Header AI Badge */}
          <XStack justifyContent="space-between" alignItems="center">
            <XStack alignItems="center" gap="$2.5">
              <View
                width={38}
                height={38}
                borderRadius={19}
                backgroundColor={
                  aiAnalysis.feasibilityLevel === 'hazardous'
                    ? '#FEE2E2'
                    : aiAnalysis.feasibilityLevel === 'challenging'
                    ? '#FEF3C7'
                    : '#DCFCE7'
                }
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize={20}>
                  {aiAnalysis.feasibilityLevel === 'hazardous'
                    ? '⚠️'
                    : aiAnalysis.feasibilityLevel === 'challenging'
                    ? '⚡'
                    : '🤖'}
                </Text>
              </View>
              <YStack>
                <Text fontSize={15.5} fontWeight="900" color="#0F172A">
                  Đánh giá khả thi từ AI
                </Text>
                <Text fontSize={12} color="#64748B">
                  Phân tích y khoa & thích ứng chuyển hóa
                </Text>
              </YStack>
            </XStack>

            <View
              backgroundColor={aiAnalysis.badgeColor}
              paddingHorizontal="$3"
              paddingVertical="$1"
              borderRadius={14}
            >
              <Text fontSize={12} fontWeight="800" color="#FFFFFF">
                {aiAnalysis.difficultyTitle}
              </Text>
            </View>
          </XStack>

          {/* Thanh đo Điểm khả thi (Feasibility Meter) */}
          <YStack gap="$1.5">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={12.5} fontWeight="700" color="#475569">
                Điểm khả thi thực hiện:
              </Text>
              <Text fontSize={13.5} fontWeight="900" color={aiAnalysis.badgeColor}>
                {aiAnalysis.feasibilityScore}/100% • Tốc độ: ~{aiAnalysis.ratePerWeek} kg/tuần
              </Text>
            </XStack>
            <View height={8} backgroundColor="#E2E8F0" borderRadius={4} overflow="hidden">
              <View
                width={`${aiAnalysis.feasibilityScore}%`}
                height="100%"
                backgroundColor={aiAnalysis.badgeColor}
                borderRadius={4}
              />
            </View>
          </YStack>

          {/* Hộp chi tiết nhận định AI */}
          <YStack
            backgroundColor="#F8FAFC"
            padding="$3.5"
            borderRadius={18}
            borderWidth={1}
            borderColor="#E2E8F0"
            gap="$2.5"
          >
            <Text fontSize={13.5} color="#0F172A" lineHeight={20} fontWeight="600">
              {aiAnalysis.detailedAnalysis}
            </Text>

            {/* Cảnh báo an toàn nếu calo quá thấp hoặc thời gian quá gấp */}
            {aiAnalysis.suggestedTargetDaysMin && (
              <XStack
                backgroundColor="#FFF1F2"
                padding="$3"
                borderRadius={14}
                borderWidth={1}
                borderColor="#FECDD3"
                alignItems="center"
                justifyContent="space-between"
                gap="$2"
              >
                <YStack flex={1}>
                  <Text fontSize={12} fontWeight="800" color="#BE123C">
                    💡 Khuyến nghị tối ưu từ AI:
                  </Text>
                  <Text fontSize={11.5} color="#9F1239">
                    Nên đặt mốc ít nhất {aiAnalysis.suggestedTargetDaysMin} ngày (~
                    {Math.round(aiAnalysis.suggestedTargetDaysMin / 7)} tuần) để bảo vệ sức khỏe.
                  </Text>
                </YStack>
                <TouchableOpacity
                  onPress={() => setTargetDays(aiAnalysis.suggestedTargetDaysMin || 90)}
                  activeOpacity={0.7}
                >
                  <View
                    backgroundColor="#BE123C"
                    paddingHorizontal="$3"
                    paddingVertical="$1.5"
                    borderRadius={12}
                  >
                    <Text fontSize={11.5} fontWeight="800" color="#FFFFFF">
                      Áp dụng
                    </Text>
                  </View>
                </TouchableOpacity>
              </XStack>
            )}
          </YStack>

          {/* LƯỢNG CALO ĐỀ XUẤT HÀNG NGÀY */}
          <YStack
            backgroundColor="#EEF4FF"
            padding="$4"
            borderRadius={20}
            borderWidth={1}
            borderColor="#DBEAFE"
            gap="$3"
          >
            <XStack justifyContent="space-between" alignItems="center">
              <YStack gap="$0.5">
                <Text fontSize={12} fontWeight="700" color="#475569">
                  MỤC TIÊU NẠP MỖI NGÀY:
                </Text>
                <XStack alignItems="baseline" gap="$1.5">
                  <Text fontSize={32} fontWeight="900" color="#0055D4">
                    {aiAnalysis.dailyCalorieTarget}
                  </Text>
                  <Text fontSize={15} fontWeight="800" color="#0055D4">
                    kcal / ngày
                  </Text>
                </XStack>
              </YStack>

              <YStack alignItems="flex-end" gap="$0.5">
                <Text fontSize={11.5} color="#64748B">
                  Tiêu hao: {aiAnalysis.tdee} kcal
                </Text>
                <Text
                  fontSize={12.5}
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

            {/* Phân bổ tỷ lệ Macro (Carb / Đạm / Béo) */}
            <XStack gap="$2">
              <View
                flex={1}
                backgroundColor="#FFFFFF"
                padding="$2.5"
                borderRadius={14}
                alignItems="center"
                borderWidth={1}
                borderColor="#E2E8F0"
              >
                <Text fontSize={11} fontWeight="700" color="#2563EB">● Carb</Text>
                <Text fontSize={16} fontWeight="900" color="#0F172A">{aiAnalysis.macros.carbGrams}g</Text>
                <Text fontSize={10} color="#64748B">{aiAnalysis.macros.carbPercentage}% Calo</Text>
              </View>

              <View
                flex={1}
                backgroundColor="#FFFFFF"
                padding="$2.5"
                borderRadius={14}
                alignItems="center"
                borderWidth={1}
                borderColor="#E2E8F0"
              >
                <Text fontSize={11} fontWeight="700" color="#059669">● Đạm (Protein)</Text>
                <Text fontSize={16} fontWeight="900" color="#0F172A">{aiAnalysis.macros.proteinGrams}g</Text>
                <Text fontSize={10} color="#64748B">{aiAnalysis.macros.proteinPercentage}% Calo</Text>
              </View>

              <View
                flex={1}
                backgroundColor="#FFFFFF"
                padding="$2.5"
                borderRadius={14}
                alignItems="center"
                borderWidth={1}
                borderColor="#E2E8F0"
              >
                <Text fontSize={11} fontWeight="700" color="#EA580C">● Béo (Fat)</Text>
                <Text fontSize={16} fontWeight="900" color="#0F172A">{aiAnalysis.macros.fatGrams}g</Text>
                <Text fontSize={10} color="#64748B">{aiAnalysis.macros.fatPercentage}% Calo</Text>
              </View>
            </XStack>
          </YStack>

          {/* Lời khuyên hành động từ AI Coach */}
          <YStack gap="$2">
            <Text fontSize={13} fontWeight="800" color="#334155">
              Lời khuyên hành động từ Huấn luyện viên AI:
            </Text>
            {aiAnalysis.actionableTips.map((tip, idx) => (
              <XStack key={idx} alignItems="flex-start" gap="$2">
                <Text fontSize={12.5} color="#475569" lineHeight={18} flex={1}>
                  {tip}
                </Text>
              </XStack>
            ))}
          </YStack>

          {/* NÚT ÁP DỤNG MỤC TIÊU VÀO TOÀN BỘ ỨNG DỤNG */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleApplyGoal}
            disabled={isSavingGoal}
          >
            <View
              height={52}
              borderRadius={26}
              backgroundColor="#0055D4"
              alignItems="center"
              justifyContent="center"
              style={THEME.shadow}
            >
              <XStack alignItems="center" gap="$2">
                {isSavingGoal ? (
                  <Spinner size="small" color="#FFFFFF" />
                ) : (
                  <Text fontSize={16} color="#FFFFFF">
                    ✓
                  </Text>
                )}
                <Text color="#FFFFFF" fontSize={15} fontWeight="800">
                  {isSavingGoal
                    ? 'Đang đồng bộ hệ thống...'
                    : `Lưu & Kích hoạt mục tiêu (~${aiAnalysis.dailyCalorieTarget} kcal/ngày)`}
                </Text>
              </XStack>
            </View>
          </TouchableOpacity>
        </YStack>

        {/* ========================================================================= */}
        {/* 4. BIỂU ĐỒ LỊCH SỬ TIẾN TRÌNH CÂN NẶNG & GHI NHẬN HÔM NAY */}
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
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize={15.5} fontWeight="800" color="#0F172A">
              Tiến trình cân nặng 📈
            </Text>
            <Text fontSize={12} color="#64748B">
              {weightHistory.length} lần ghi nhận
            </Text>
          </XStack>

          {/* Biểu đồ cột trực quan */}
          {isLoading ? (
            <YStack padding="$6" alignItems="center">
              <Spinner size="large" color="#0055D4" />
            </YStack>
          ) : weightHistory.length === 0 ? (
            <YStack padding="$4" alignItems="center" gap="$2">
              <Text fontSize={32}>⚖️</Text>
              <Text fontSize={13} color="#94A3B8" textAlign="center">
                Chưa có lịch sử cân nặng. Hãy nhập cân nặng hôm nay bên dưới để bắt đầu theo dõi!
              </Text>
            </YStack>
          ) : (
            <YStack gap="$2.5">
              <View
                height={160}
                backgroundColor="#F8FAFC"
                borderRadius={18}
                padding="$3"
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
                      <YStack key={item.id || index} alignItems="center" gap="$1">
                        <Text fontSize={10.5} fontWeight="700" color="#0F172A">
                          {item.weight}
                        </Text>
                        <View
                          width={24}
                          height={`${hPercent}%`}
                          backgroundColor={isNearTarget ? '#10B981' : '#0055D4'}
                          borderRadius={6}
                        />
                        <Text fontSize={9.5} color="#64748B">
                          {item.recorded_date.slice(5)}
                        </Text>
                      </YStack>
                    );
                  })}
                </XStack>
              </View>

              <XStack justifyContent="space-between" paddingHorizontal="$1">
                <Text fontSize={11.5} color="#64748B">
                  Mục tiêu hướng tới: <Text fontWeight="800" color="#0055D4">{targetWeight} kg</Text>
                </Text>
                <Text fontSize={11.5} color="#64748B">
                  Thấp: {chartData.minW + 2}kg • Cao: {chartData.maxW - 2}kg
                </Text>
              </XStack>
            </YStack>
          )}

          {/* Ô nhập cân nặng hôm nay */}
          <YStack gap="$2" paddingTop="$1">
            <Text fontSize={13} fontWeight="700" color="#334155">
              Ghi nhận số cân hôm nay:
            </Text>

            <XStack gap="$2.5" alignItems="center">
              <Input
                flex={1}
                value={newWeightInput}
                onChangeText={setNewWeightInput}
                placeholder="Nhập cân nặng (ví dụ: 64.5)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                backgroundColor="#F8FAFC"
                borderRadius={18}
                borderWidth={1.5}
                borderColor="#E2E8F0"
                height={46}
                fontSize={14.5}
                fontWeight="700"
                paddingHorizontal="$3.5"
              />

              <Button
                backgroundColor="#0055D4"
                borderRadius={18}
                height={46}
                paddingHorizontal="$4"
                disabled={isSavingWeight}
                onPress={handleAddWeight}
              >
                <Text fontSize={13.5} fontWeight="800" color="#FFFFFF">
                  {isSavingWeight ? 'Đang lưu...' : 'Lưu lại'}
                </Text>
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
  );
}
