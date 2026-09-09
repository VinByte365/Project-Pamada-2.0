import { create } from 'zustand';

type AccountStatus = 'local_only' | 'synced';

interface AppState {
  localProfileId: string | null;
  accountStatus: AccountStatus;
  setLocalProfile: (id: string) => void;
  setAccountStatus: (status: AccountStatus) => void;
}

export const useAppStore = create<AppState>((set) => ({
  localProfileId: null,
  accountStatus: 'local_only',
  setLocalProfile: (id) => set({ localProfileId: id }),
  setAccountStatus: (status) => set({ accountStatus: status }),
}));
