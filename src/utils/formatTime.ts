/**
 * DATE & TIME HELPERS
 */

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (dateStr: string): string => {
  try {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    return `Ngày ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

export const getFriendlyDayName = (dateStr: string): string => {
  const today = getTodayDateString();
  if (dateStr === today) return 'Hôm nay';
  
  const target = new Date(dateStr);
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return days[target.getDay()] || dateStr;
};
