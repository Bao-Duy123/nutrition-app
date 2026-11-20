import { supabase, logSupabaseError, logUnexpectedError } from './supabase';
import { Profile } from '../types/database';

export interface ProfileServiceResponse<T> {
  data: T | null;
  error: any | null;
}

/**
 * Lấy thông tin profile người dùng theo userId
 */
export const getProfile = async (userId: string): Promise<ProfileServiceResponse<Profile>> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      logSupabaseError('profileService.getProfile', error);
      return { data: null, error };
    }
    return { data: data as Profile, error: null };
  } catch (err) {
    logUnexpectedError('profileService.getProfile', err);
    return { data: null, error: err };
  }
};

/**
 * Upsert thông tin profile người dùng, tự động thêm updated_at
 */
export const upsertProfile = async (
  profile: Pick<Profile, 'id'> & Partial<Omit<Profile, 'id'>>
): Promise<ProfileServiceResponse<Profile>> => {
  try {
    const payload = {
      ...profile,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      logSupabaseError('profileService.upsertProfile', error);
      return { data: null, error };
    }
    return { data: data as Profile, error: null };
  } catch (err) {
    logUnexpectedError('profileService.upsertProfile', err);
    return { data: null, error: err };
  }
};

/**
 * Cập nhật thông tin profile của người dùng
 */
export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>
): Promise<ProfileServiceResponse<Profile>> => {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logSupabaseError('profileService.updateProfile', error);
      return { data: null, error };
    }
    return { data: data as Profile, error: null };
  } catch (err) {
    logUnexpectedError('profileService.updateProfile', err);
    return { data: null, error: err };
  }
};

/**
 * Gọi RPC backend để xóa auth user và dữ liệu liên quan.
 * Hàm SQL/RPC sẽ được triển khai trên Supabase; client không dùng service-role key.
 */
export const deleteCurrentUserAccount = async (): Promise<{ error: any | null }> => {
  try {
    const { error } = await supabase.rpc('delete_user_account');
    if (error) {
      logSupabaseError('profileService.deleteCurrentUserAccount', error);
      return { error };
    }
    return { error: null };
  } catch (error) {
    logUnexpectedError('profileService.deleteCurrentUserAccount', error);
    return { error };
  }
};
