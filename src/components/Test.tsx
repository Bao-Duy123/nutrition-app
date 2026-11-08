import { useEffect } from 'react';
import { View, Text } from 'react-native';
// Đảm bảo đường dẫn import supabase khớp với thư mục của bạn
import { supabase } from '../services/supabase'; 

export default function IndexScreen() {
  useEffect(() => {
    const testSupabaseConnection = async () => {
      try {
        // Thử gọi một hàm của Supabase (lấy session hiện tại)
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ Lỗi cấu hình Supabase:", error.message);
        } else {
          console.log("✅ KẾT NỐI SUPABASE THÀNH CÔNG!");
          console.log("Dữ liệu trả về:", data);
        }
      } catch (err) {
        console.error("❌ Lỗi mạng hoặc URL bị sai:", err);
      }
    };

    testSupabaseConnection();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Mở Terminal (Console) để xem kết quả kết nối Supabase nhé!</Text>
    </View>
  );
}