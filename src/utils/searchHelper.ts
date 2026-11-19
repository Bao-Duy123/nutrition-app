/**
 * Hàm loại bỏ dấu tiếng Việt để tìm kiếm thông minh không phân biệt dấu
 * ví dụ: 'phở bò' -> 'pho bo', 'Ức gà' -> 'uc ga'
 */
export const removeVietnameseTones = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

/**
 * Kiểm tra xem chuỗi nguồn có chứa từ khóa tìm kiếm hay không (hỗ trợ cả có dấu và không dấu)
 */
export const fuzzyMatchVietnamese = (source: string, keyword: string): boolean => {
  if (!keyword.trim()) return true;
  const normalizedSource = removeVietnameseTones(source);
  const normalizedKeyword = removeVietnameseTones(keyword);

  return (
    source.toLowerCase().includes(keyword.toLowerCase().trim()) ||
    normalizedSource.includes(normalizedKeyword)
  );
};

