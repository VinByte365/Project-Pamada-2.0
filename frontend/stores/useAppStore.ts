import { create } from 'zustand';

import type { CloudProfile, ProfileSyncStatus } from '@/lib/auth/types';

type AccountStatus = 'local_only' | 'synced';

interface AppState {
  localProfileId: string | null;
  accountStatus: AccountStatus;
  supabaseAccessToken: string | null;
  supabaseUserId: string | null;
  cloudProfile: CloudProfile | null;
  profileSyncStatus: ProfileSyncStatus;
  profileSyncMessage: string | null;
  setLocalProfile: (id: string) => void;
  setAccountStatus: (status: AccountStatus) => void;
  setSupabaseAccessToken: (token: string | null) => void;
  setSupabaseUserId: (id: string | null) => void;
  setProfileSyncing: () => void;
  setCloudProfile: (profile: CloudProfile) => void;
  setProfileSyncIssue: (status: Exclude<ProfileSyncStatus, 'idle' | 'syncing' | 'synced'>, message: string) => void;
  clearCloudProfile: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  localProfileId: null,
  accountStatus: 'local_only',
  supabaseAccessToken: null,
  supabaseUserId: null,
  cloudProfile: null,
  profileSyncStatus: 'idle',
  profileSyncMessage: null,
  setLocalProfile: (id) => set({ localProfileId: id }),
  setAccountStatus: (status) => set({ accountStatus: status }),
  setSupabaseAccessToken: (token) =>
    set({ supabaseAccessToken: token, accountStatus: token ? 'synced' : 'local_only' }),
  setSupabaseUserId: (id) => set({ supabaseUserId: id }),
  setProfileSyncing: () => set({ profileSyncStatus: 'syncing', profileSyncMessage: null }),
  setCloudProfile: (profile) => set({ cloudProfile: profile, profileSyncStatus: 'synced', profileSyncMessage: null }),
  setProfileSyncIssue: (status, message) => set({ profileSyncStatus: status, profileSyncMessage: message }),
  clearCloudProfile: () => set({ cloudProfile: null, profileSyncStatus: 'idle', profileSyncMessage: null }),
}));
