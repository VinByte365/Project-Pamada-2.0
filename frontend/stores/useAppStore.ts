import { create } from 'zustand';

type AccountStatus = 'local_only' | 'synced';

interface AppState {
  localProfileId: string | null;
  accountStatus: AccountStatus;
  supabaseAccessToken: string | null;
  setLocalProfile: (id: string) => void;
  setAccountStatus: (status: AccountStatus) => void;
  setSupabaseAccessToken: (token: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  localProfileId: null,
  accountStatus: 'local_only',
  supabaseAccessToken: null,
  setLocalProfile: (id) => set({ localProfileId: id }),
  setAccountStatus: (status) => set({ accountStatus: status }),
  setSupabaseAccessToken: (token) =>
    set({ supabaseAccessToken: token, accountStatus: token ? 'synced' : 'local_only' }),
}));
