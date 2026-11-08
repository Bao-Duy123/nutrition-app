import { useState, useEffect } from 'react';

/**
 * Custom hook tối ưu tìm kiếm thực phẩm, tránh gọi API liên tục mỗi khi gõ
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
