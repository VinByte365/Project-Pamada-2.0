import { create } from 'zustand';

import type {
  CloudProfile,
  ProfileIssueStatus,
  ProfileSyncStatus,
} from '@/lib/auth/types';

type AccountStatus = 'local_only' | 'synced';

interface AppState {
  localProfileId: string | null;
  accountStatus: AccountStatus;
  supabaseAccessToken: string | null;
  cloudProfile: CloudProfile | null;
  profileSyncStatus: ProfileSyncStatus;
  profileSyncMessage: string | null;
  setLocalProfile: (id: string) => void;
  setAccountStatus: (status: AccountStatus) => void;
  setSupabaseAccessToken: (token: string | null) => void;
  setProfileSyncing: () => void;
  setCloudProfile: (profile: CloudProfile) => void;
  setProfileSyncIssue: (status: ProfileIssueStatus, message: string) => void;
}

const signedOutProfileState = {
  cloudProfile: null,
  profileSyncStatus: 'idle' as const,
  profileSyncMessage: null,
};

export const useAppStore = create<AppState>((set) => ({
  localProfileId: null,
  accountStatus: 'local_only',
  supabaseAccessToken: null,
  ...signedOutProfileState,
  setLocalProfile: (id) => set({ localProfileId: id }),
  setAccountStatus: (status) => set({ accountStatus: status }),
  setSupabaseAccessToken: (token) =>
    set((state) => {
      if (!token) {
        return {
          supabaseAccessToken: null,
          accountStatus: 'local_only',
          ...signedOutProfileState,
        };
      }

      // A fresh sign-in starts with no cloud profile. Token refreshes keep the
      // profile and its sync state so the shell does not flicker.
      if (!state.supabaseAccessToken) {
        return {
          supabaseAccessToken: token,
          accountStatus: 'synced',
          ...signedOutProfileState,
        };
      }

      return { supabaseAccessToken: token, accountStatus: 'synced' };
    }),
  setProfileSyncing: () =>
    set((state) =>
      state.supabaseAccessToken
        ? { profileSyncStatus: 'syncing', profileSyncMessage: null }
        : {},
    ),
  setCloudProfile: (profile) =>
    set((state) =>
      state.supabaseAccessToken
        ? {
            cloudProfile: profile,
            profileSyncStatus: 'synced',
            profileSyncMessage: null,
          }
        : {},
    ),
  setProfileSyncIssue: (status, message) =>
    set((state) =>
      state.supabaseAccessToken
        ? { profileSyncStatus: status, profileSyncMessage: message }
        : {},
    ),
}));
