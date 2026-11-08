import { useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { ensureUserProfile, logSupabaseError, logUnexpectedError, supabase } from '../services/supabase';
import { useAppDispatch, useAppSelector } from '../store';
import { setSession, setProfile, setAuthLoading, clearAuth } from '../store/slices/authSlice';
import { setDailyCalorieGoal } from '../store/slices/dietSlice';
import { CONFIG } from '../constants/config';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { session, userId, profile, isAuthenticated, isLoading, error } = useAppSelector(
    (state) => state.auth
  );

  // Lắng nghe thay đổi trạng thái Auth của Supabase
  useEffect(() => {
    let isMounted = true;
    let authEventVersion = 0;
    let profileLoadVersion = 0;

    const loadProfile = async (user: User, version: number) => {
      const { data: userProfile, error } = await ensureUserProfile(user);
      if (!isMounted || version !== profileLoadVersion) return;
      if (error) {
        console.error('[Auth][profile.restore] Could not restore or create profile.', {
          message: error instanceof Error ? error.message : String(error),
        });
        dispatch(setProfile(null));
        return;
      }
      dispatch(setProfile(userProfile));
      dispatch(setDailyCalorieGoal(userProfile?.daily_calorie_goal ?? CONFIG.DEFAULT_DAILY_CALORIE_GOAL));
    };

    const initAuth = async () => {
      try {
        dispatch(setAuthLoading(true));
        const eventVersionAtStart = authEventVersion;
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) {
          logSupabaseError('auth.getSession', error);
          if (isMounted && eventVersionAtStart === authEventVersion) {
            dispatch(setSession(null));
          }
          return;
        }

        if (isMounted && eventVersionAtStart === authEventVersion) {
          dispatch(setSession(currentSession));
          if (currentSession?.user) {
            const version = ++profileLoadVersion;
            await loadProfile(currentSession.user, version);
          }
        }
      } catch (err) {
        logUnexpectedError('auth.initialize', err);
      } finally {
        if (isMounted) dispatch(setAuthLoading(false));
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      authEventVersion += 1;
      dispatch(setSession(newSession));
      if (newSession?.user) {
        dispatch(setProfile(null));
        const version = ++profileLoadVersion;
        setTimeout(() => {
          if (isMounted) void loadProfile(newSession.user, version);
        }, 0);
      } else {
        profileLoadVersion += 1;
        dispatch(clearAuth());
        dispatch(setDailyCalorieGoal(CONFIG.DEFAULT_DAILY_CALORIE_GOAL));
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [dispatch]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logSupabaseError('auth.signOut', error);
        return;
      }
      dispatch(clearAuth());
    } catch (e) {
      logUnexpectedError('auth.signOut', e);
    }
  };

  return {
    session,
    userId,
    profile,
    isAuthenticated,
    isLoading,
    error,
    signOut,
  };
};
