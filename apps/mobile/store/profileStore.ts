import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BusinessProfile } from '../constants/business';
import { EMPTY_BUSINESS_PROFILE } from '../constants/business';

const STORAGE_KEY = 'business_profile';

interface ProfileStore {
  profile: BusinessProfile;
  isLoaded: boolean;
  setProfile: (profile: BusinessProfile) => Promise<void>;
  loadProfile: () => Promise<void>;
  isProfileComplete: () => boolean;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: EMPTY_BUSINESS_PROFILE,
  isLoaded: false,

  setProfile: async (profile) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    set({ profile });
  },

  loadProfile: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ profile: JSON.parse(stored), isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  isProfileComplete: () => {
    const { profile } = get();
    return !!(profile.name && profile.phone);
  },
}));
