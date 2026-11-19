/**
 * GOAL AI SERVICE - HỆ THỐNG PHÂN TÍCH MỤC TIÊU & HUẤN LUYỆN VIÊN DINH DƯỠNG AI
 * Tính toán chuyển hóa (BMR, TDEE), đánh giá tính khả thi, phân bổ Macro theo mức độ tập luyện
 * và đưa ra lời khuyên y khoa cá nhân hóa.
 */

export interface GoalAIInput {
  currentWeight: number; // kg
  targetWeight: number; // kg
  height: number; // cm
  age: number; // tuổi
  gender: string; // 'Nam' | 'Nữ'
  activityLevel: string; // 'sedentary' | 'light' | 'moderate' | 'very_active' hoặc tiếng Việt
  targetDays: number; // Số ngày thực hiện
}

export type FeasibilityLevel = 'ideal' | 'moderate' | 'challenging' | 'hazardous';

export interface GoalAIAnalysis {
  goalType: 'Giảm cân' | 'Tăng cân' | 'Giữ cân';
  currentBMI: number;
  targetBMI: number;
  bmiCategory: {
    label: string;
    targetLabel: string;
    color: string;
  };
  weightDiff: number; // kg chênh lệch
  weeks: number; // số tuần
  ratePerWeek: number; // kg/tuần
  
  // Năng lượng chuyển hóa
  bmr: number; // Calo tiêu thụ tối thiểu khi nghỉ ngơi
  tdee: number; // Tổng năng lượng tiêu thụ hàng ngày
  dailyCalorieTarget: number; // Calo mục tiêu nạp mỗi ngày
  dailyCalorieAdjustment: number; // Thâm hụt (-) hoặc thặng dư (+) mỗi ngày
  
  // Dinh dưỡng đa lượng (Macros) khuyến nghị theo mức độ tập luyện
  macros: {
    proteinGrams: number;
    proteinCalories: number;
    proteinPercentage: number;
    carbGrams: number;
    carbCalories: number;
    carbPercentage: number;
    fatGrams: number;
    fatCalories: number;
    fatPercentage: number;
  };
  
  // Đánh giá AI về tính khả thi & độ khó
  feasibilityScore: number; // 0 - 100%
  feasibilityLevel: FeasibilityLevel;
  difficultyTitle: string; // vd: "Rất khả thi & Bền vững"
  badgeColor: string; // Màu sắc hiển thị
  isSafeCalorie: boolean; // Có vượt ngưỡng an toàn y khoa không
  safeMinCalorie: number; // Ngưỡng calo sàn an toàn
  suggestedTargetDaysMin?: number; // Số ngày tối thiểu đề xuất nếu quá gấp
  summaryText: string;
  detailedAnalysis: string;
  actionableTips: string[];
}

// 1. Phân loại mức độ vận động
export const ACTIVITY_OPTIONS = [
  {
    key: 'sedentary',
    label: 'Ít vận động',
    icon: '🧘‍♂️',
    sublabel: 'Làm việc văn phòng, ít đi lại, không tập thể thao',
    multiplier: 1.2,
  },
  {
    key: 'light',
    label: 'Vận động nhẹ',
    icon: '🚶‍♂️',
    sublabel: 'Đi bộ, làm việc nhà, tập nhẹ 1-3 buổi/tuần',
    multiplier: 1.375,
  },
  {
    key: 'moderate',
    label: 'Vận động vừa phải',
    icon: '🏋️‍♂️',
    sublabel: 'Tập gym, chạy bộ, thể thao 3-5 buổi/tuần',
    multiplier: 1.55,
  },
  {
    key: 'very_active',
    label: 'Vận động nhiều',
    icon: '⚡',
    sublabel: 'Tập luyện cường độ cao 6-7 buổi/tuần hoặc lao động nặng',
    multiplier: 1.725,
  },
];

export const getActivityMultiplier = (activityLevel?: string | null): number => {
  if (!activityLevel) return 1.375;
  const normalized = activityLevel.toLowerCase();
  if (normalized.includes('ít') || normalized.includes('sedentary')) return 1.2;
  if (normalized.includes('nhẹ') || normalized.includes('light')) return 1.375;
  if (normalized.includes('vừa') || normalized.includes('moderate')) return 1.55;
  if (normalized.includes('nhiều') || normalized.includes('active') || normalized.includes('cường độ')) return 1.725;
  
  const parsed = parseFloat(activityLevel);
  if (!isNaN(parsed) && parsed >= 1.0 && parsed <= 2.5) return parsed;
  return 1.375;
};

// 2. Phân loại BMI chuẩn châu Á (WHO / IDI & WPRO)
export const getBMICategory = (bmi: number): { label: string; color: string } => {
  if (bmi < 18.5) return { label: 'Thiếu cân (Gầy)', color: '#F59E0B' };
  if (bmi <= 22.9) return { label: 'Cân đối (Lý tưởng)', color: '#10B981' };
  if (bmi <= 24.9) return { label: 'Tiền béo phì (Thừa cân)', color: '#F59E0B' };
  if (bmi <= 29.9) return { label: 'Béo phì độ I', color: '#EF4444' };
  return { label: 'Béo phì độ II', color: '#B91C1C' };
};

/**
 * HÀM PHÂN TÍCH MỤC TIÊU VÀ TÍNH TOÁN DINH DƯỠNG BẰNG AI
 */
export const analyzeGoalWithAI = (input: GoalAIInput): GoalAIAnalysis => {
  const currentWeight = Math.max(30, Number(input.currentWeight) || 60);
  const targetWeight = Math.max(30, Number(input.targetWeight) || 60);
  const height = Math.max(100, Number(input.height) || 165);
  const age = Math.max(12, Number(input.age) || 25);
  const gender = input.gender || 'Nam';
  const targetDays = Math.max(7, Number(input.targetDays) || 60);
  const isFemale = gender.toLowerCase().includes('nữ') || gender.toLowerCase() === 'female';

  // 1. Chỉ số BMI
  const heightM = height / 100;
  const currentBMI = Math.round((currentWeight / (heightM * heightM)) * 10) / 10;
  const targetBMI = Math.round((targetWeight / (heightM * heightM)) * 10) / 10;
  const currentBMICat = getBMICategory(currentBMI);
  const targetBMICat = getBMICategory(targetBMI);

  // 2. Chuyển hóa cơ bản BMR (Mifflin-St Jeor)
  const baseBMR = 10 * currentWeight + 6.25 * height - 5 * age;
  const bmr = Math.round(isFemale ? baseBMR - 161 : baseBMR + 5);

  // 3. Tổng tiêu hao năng lượng TDEE
  const actMultiplier = getActivityMultiplier(input.activityLevel);
  const tdee = Math.round(bmr * actMultiplier);

  // 4. Xác định loại mục tiêu & tốc độ
  const weightDiff = Math.round(Math.abs(currentWeight - targetWeight) * 10) / 10;
  let goalType: 'Giảm cân' | 'Tăng cân' | 'Giữ cân' = 'Giữ cân';
  if (targetWeight < currentWeight - 0.2) goalType = 'Giảm cân';
  else if (targetWeight > currentWeight + 0.2) goalType = 'Tăng cân';

  const weeks = Math.max(1, Math.round((targetDays / 7) * 10) / 10);
  const ratePerWeek =
    goalType === 'Giữ cân'
      ? 0
      : Math.round((weightDiff / (targetDays / 7)) * 100) / 100;

  // 5. Tính lượng Calo mục tiêu
  // 1kg mỡ cơ thể chứa xấp xỉ 7700 kcal
  const totalCalorieAdjustment = weightDiff * 7700;
  const dailyAdjustment = Math.round(totalCalorieAdjustment / targetDays);

  let dailyCalorieTarget = tdee;
  let isSafeCalorie = true;
  const safeMinCalorie = isFemale ? 1200 : 1400; // Ngưỡng sàn y khoa tối thiểu

  if (goalType === 'Giảm cân') {
    const rawTarget = tdee - dailyAdjustment;
    if (rawTarget < safeMinCalorie) {
      isSafeCalorie = false;
      dailyCalorieTarget = safeMinCalorie;
    } else {
      dailyCalorieTarget = rawTarget;
    }
  } else if (goalType === 'Tăng cân') {
    // Không tăng quá 750 kcal/ngày để tránh tích mỡ thừa bùng phát
    dailyCalorieTarget = tdee + Math.min(750, dailyAdjustment);
  } else {
    dailyCalorieTarget = tdee;
  }

  // 6. Phân bổ Macro theo mức độ tập luyện (Personalized Macro Distribution)
  // Người tập luyện vừa/nhiều (gym, thể thao) cần tỷ lệ Protein cao hơn để giữ cơ & phát triển cơ
  const isHighActivity = actMultiplier >= 1.55;
  let proteinRatio = 0.25; // 25% calo
  let carbRatio = 0.50; // 50% calo
  let fatRatio = 0.25; // 25% calo

  if (goalType === 'Giảm cân') {
    if (isHighActivity) {
      // Giảm mỡ giữ cơ cho người tập luyện
      proteinRatio = 0.30;
      carbRatio = 0.45;
      fatRatio = 0.25;
    } else {
      proteinRatio = 0.25;
      carbRatio = 0.45;
      fatRatio = 0.30;
    }
  } else if (goalType === 'Tăng cân') {
    if (isHighActivity) {
      // Lean bulk (tăng cơ nạc)
      proteinRatio = 0.28;
      carbRatio = 0.50;
      fatRatio = 0.22;
    } else {
      proteinRatio = 0.22;
      carbRatio = 0.53;
      fatRatio = 0.25;
    }
  }

  const proteinCalories = Math.round(dailyCalorieTarget * proteinRatio);
  const carbCalories = Math.round(dailyCalorieTarget * carbRatio);
  const fatCalories = Math.round(dailyCalorieTarget * fatRatio);

  const macros = {
    proteinGrams: Math.round(proteinCalories / 4),
    proteinCalories,
    proteinPercentage: Math.round(proteinRatio * 100),
    carbGrams: Math.round(carbCalories / 4),
    carbCalories,
    carbPercentage: Math.round(carbRatio * 100),
    fatGrams: Math.round(fatCalories / 9),
    fatCalories,
    fatPercentage: Math.round(fatRatio * 100),
  };

  // 7. Đánh giá AI về tính khả thi & độ khó (Feasibility & Difficulty Engine)
  let feasibilityScore = 90;
  let feasibilityLevel: FeasibilityLevel = 'ideal';
  let difficultyTitle = 'Lý tưởng & Rất bền vững';
  let badgeColor = '#10B981';
  let summaryText = '';
  let detailedAnalysis = '';
  let suggestedTargetDaysMin: number | undefined = undefined;
  const actionableTips: string[] = [];

  if (goalType === 'Giảm cân') {
    if (ratePerWeek <= 0.4) {
      feasibilityScore = 95;
      feasibilityLevel = 'ideal';
      difficultyTitle = 'Dễ dàng & Rất bền vững';
      badgeColor = '#10B981';
      summaryText = `Tốc độ giảm ~${ratePerWeek} kg/tuần rất nhẹ nhàng, bảo toàn cơ bắp tối đa và không lo bị đói.`;
      detailedAnalysis = `Mục tiêu giảm ${weightDiff} kg trong ${targetDays} ngày (${weeks} tuần) tương đương mức thâm hụt calo chỉ ${dailyAdjustment} kcal/ngày. Thể trạng của bạn nạp ~${dailyCalorieTarget} kcal/ngày sẽ vô cùng thoải mái, tỷ lệ duy trì thành công đạt trên 95%.`;
    } else if (ratePerWeek <= 0.75) {
      feasibilityScore = 88;
      feasibilityLevel = 'ideal';
      difficultyTitle = 'Tốc độ vàng (Khả thi cao)';
      badgeColor = '#10B981';
      summaryText = `Tốc độ giảm ~${ratePerWeek} kg/tuần là tiêu chuẩn vàng theo khuyến nghị của các chuyên gia dinh dưỡng.`;
      detailedAnalysis = `Mục tiêu giảm ${weightDiff} kg trong ${targetDays} ngày đòi hỏi thâm hụt ~${dailyAdjustment} kcal/ngày. Đây là tốc độ đốt mỡ tối ưu giúp bạn đạt vóc dáng săn chắc mà vẫn tràn đầy năng lượng cho công việc và sinh hoạt.`;
    } else if (ratePerWeek <= 1.0) {
      feasibilityScore = 65;
      feasibilityLevel = 'challenging';
      difficultyTitle = 'Thách thức cao (Cần kỷ luật)';
      badgeColor = '#F59E0B';
      summaryText = `Tốc độ giảm ~${ratePerWeek} kg/tuần khá nhanh, cần kiểm soát chế độ ăn nghiêm ngặt.`;
      detailedAnalysis = `Mục tiêu giảm ${weightDiff} kg trong ${targetDays} ngày đòi hỏi thâm hụt lớn ~${dailyAdjustment} kcal/ngày. Bạn cần kiên định nạp đủ ${macros.proteinGrams}g đạm mỗi ngày để tránh teo cơ và hạn chế cảm giác thèm ăn.`;
    } else {
      feasibilityScore = 35;
      feasibilityLevel = 'hazardous';
      difficultyTitle = 'Cảnh báo: Quá gấp & Không an toàn';
      badgeColor = '#EF4444';
      suggestedTargetDaysMin = Math.ceil((weightDiff / 0.65) * 7);
      summaryText = `Tốc độ giảm ~${ratePerWeek} kg/tuần vượt quá ngưỡng an toàn y tế (>1kg/tuần).`;
      detailedAnalysis = `Mục tiêu giảm ${weightDiff} kg chỉ trong ${targetDays} ngày buộc cơ thể thâm hụt quá lớn (~${dailyAdjustment} kcal/ngày), calo mục tiêu tụt xuống ${dailyCalorieTarget} kcal. Điều này dễ gây tụt huyết áp, rụng tóc, suy nhược và hiệu ứng Yo-Yo (tăng cân trở lại). AI đề xuất nên kéo dài thời gian lên ít nhất ${suggestedTargetDaysMin} ngày (~${Math.round(suggestedTargetDaysMin / 7)} tuần) để giảm mỡ an toàn.`;
    }

    // Lời khuyên cho giảm cân
    if (isHighActivity) {
      actionableTips.push(`🏋️ Tăng cường Protein: Đảm bảo nạp ${macros.proteinGrams}g đạm/ngày từ ức gà, cá, trứng, đậu hũ để bảo vệ cơ bắp khi thâm hụt calo.`);
      actionableTips.push(`⚡ Nạp Carb trước & sau tập: Dành phần lớn trong ${macros.carbGrams}g Carb vào các bữa quanh buổi tập để tối ưu hiệu suất đốt mỡ.`);
    } else {
      actionableTips.push(`🚶 Tăng vận động tự nhiên (NEAT): Cố gắng đi bộ 7.000 - 10.000 bước mỗi ngày để đốt thêm calo mà không gây mệt mỏi.`);
      actionableTips.push(`🥗 Ưu tiên chất xơ: Bổ sung 300g-400g rau xanh vào bữa chính để kéo dài cảm giác no với lượng calo cực thấp.`);
    }
    actionableTips.push(`💧 Uống đủ 2 - 2.5 lít nước mỗi ngày và ghi chép nhật ký ăn uống đều đặn để bám sát mức ${dailyCalorieTarget} kcal.`);

  } else if (goalType === 'Tăng cân') {
    if (ratePerWeek <= 0.35) {
      feasibilityScore = 95;
      feasibilityLevel = 'ideal';
      difficultyTitle = 'Tăng cơ nạc lý tưởng (Lean Bulk)';
      badgeColor = '#10B981';
      summaryText = `Tốc độ tăng ~${ratePerWeek} kg/tuần giúp tối ưu phát triển cơ bắp, hạn chế tối đa tích mỡ thừa.`;
      detailedAnalysis = `Mục tiêu tăng ${weightDiff} kg trong ${targetDays} ngày đòi hỏi thặng dư nhẹ ~${dailyAdjustment} kcal/ngày. Đây là chiến lược tăng cân thông minh nhất, giúp vóc dáng dày dặn và săn chắc.`;
    } else if (ratePerWeek <= 0.6) {
      feasibilityScore = 78;
      feasibilityLevel = 'moderate';
      difficultyTitle = 'Tăng cân nhanh (Cần tập luyện)';
      badgeColor = '#F59E0B';
      summaryText = `Tốc độ tăng ~${ratePerWeek} kg/tuần khá nhanh, cần kết hợp tập kháng lực đều đặn.`;
      detailedAnalysis = `Mục tiêu tăng ${weightDiff} kg trong ${targetDays} ngày đòi hỏi bạn phải nạp ${dailyCalorieTarget} kcal/ngày (+${dailyAdjustment} kcal thặng dư). Hãy tập gym/kháng lực 3-4 buổi/tuần để calo chuyển hóa thành cơ bắp thay vì tích mỡ bụng.`;
    } else {
      feasibilityScore = 50;
      feasibilityLevel = 'challenging';
      difficultyTitle = 'Cảnh báo: Dễ tích mỡ bụng';
      badgeColor = '#EF4444';
      suggestedTargetDaysMin = Math.ceil((weightDiff / 0.4) * 7);
      summaryText = `Tốc độ tăng ~${ratePerWeek} kg/tuần quá nhanh so với tốc độ tổng hợp mô cơ tự nhiên của cơ thể.`;
      detailedAnalysis = `Cơ thể chỉ có thể phát triển tối đa khoảng 0.2 - 0.4 kg cơ nạc mỗi tuần. Tăng quá nhanh sẽ khiến phần lớn trọng lượng tăng thêm là mỡ thừa. AI khuyên bạn nên giãn thời gian ra khoảng ${suggestedTargetDaysMin} ngày để tăng cân săn chắc.`;
    }

    actionableTips.push(`🥩 Nạp đủ ${macros.proteinGrams}g Protein mỗi ngày để xây dựng mô cơ bắp mới.`);
    actionableTips.push(`🥑 Bổ sung chất béo tốt từ các loại hạt, bơ đậu phộng, dầu ô liu để dễ dàng đạt mốc ${dailyCalorieTarget} kcal.`);
    actionableTips.push(`🏋️ Kết hợp các bài tập đa khớp (Squat, Deadlift, Hít đất) để kích thích hấp thu dưỡng chất.`);

  } else {
    // Giữ cân
    feasibilityScore = 100;
    feasibilityLevel = 'ideal';
    difficultyTitle = 'Duy trì vóc dáng hoàn hảo';
    badgeColor = '#10B981';
    summaryText = `Mức Calo ${tdee} kcal/ngày cân bằng hoàn hảo với năng lượng tiêu hao hàng ngày (TDEE).`;
    detailedAnalysis = `Bạn đang ở trạng thái cân bằng năng lượng tuyệt vời. Hãy tập trung vào việc nâng cao chất lượng thực phẩm và rèn luyện thể lực bền bỉ.`;
    actionableTips.push(`🥗 Ăn đa dạng nhóm chất: ${macros.carbGrams}g Carb, ${macros.proteinGrams}g Đạm, ${macros.fatGrams}g Chất béo.`);
    actionableTips.push(`🏃 Duy trì thói quen vận động hiện tại để giữ gìn chỉ số BMI ${currentBMI} chuẩn đẹp.`);
    actionableTips.push(`⚖️ Cân định kỳ 1-2 lần mỗi tuần để kịp thời điều chỉnh nếu cân nặng biến động quá 1-2 kg.`);
  }

  if (goalType === 'Giảm cân' && !isSafeCalorie) {
    const availableDailyDeficit = tdee - safeMinCalorie;
    if (availableDailyDeficit > 0) {
      const daysAtSafeMinimum = Math.ceil((weightDiff * 7700) / availableDailyDeficit);
      suggestedTargetDaysMin = Math.max(suggestedTargetDaysMin || 0, daysAtSafeMinimum);
    }
  }

  return {
    goalType,
    currentBMI,
    targetBMI,
    bmiCategory: {
      label: currentBMICat.label,
      targetLabel: targetBMICat.label,
      color: currentBMICat.color,
    },
    weightDiff,
    weeks,
    ratePerWeek,
    bmr,
    tdee,
    dailyCalorieTarget,
    dailyCalorieAdjustment: dailyCalorieTarget - tdee,
    macros,
    feasibilityScore,
    feasibilityLevel,
    difficultyTitle,
    badgeColor,
    isSafeCalorie,
    safeMinCalorie,
    suggestedTargetDaysMin,
    summaryText,
    detailedAnalysis,
    actionableTips,
  };
};
