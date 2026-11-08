import axios from 'axios';
import { CONFIG } from '../constants/config';
import { supabase } from './supabase';

/**
 * AXIOS CLIENT INSTANCE
 * Cấu hình gọi external API (Food nutrition lookup, AI assistant, v.v.)
 * Tự động đính kèm Supabase access_token nếu người dùng đang đăng nhập
 */
const axiosClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Gắn Auth token từ Supabase session
axiosClient.interceptors.request.use(
  async (config) => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Không thể lấy session token cho Axios:', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Chuẩn hóa dữ liệu trả về hoặc log lỗi
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'Lỗi mạng không xác định';
    console.error('Axios Error:', message);
    return Promise.reject(error);
  }
);

export default axiosClient;
