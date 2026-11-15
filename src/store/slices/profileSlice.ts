import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Profile } from '../../types/database';

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  isLoading: false,
  isSaving: false,
  error: null,
};

export const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<Profile | null>) => {
      state.profile = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setProfileLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setProfileSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setProfileError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
      state.isSaving = false;
    },
    clearProfile: (state) => {
      state.profile = null;
      state.isLoading = false;
      state.isSaving = false;
      state.error = null;
    },
  },
});

export const {
  setProfile,
  setProfileLoading,
  setProfileSaving,
  setProfileError,
  clearProfile,
} = profileSlice.actions;

export default profileSlice.reducer;
