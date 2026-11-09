import { useEffect } from 'react';

import { logger } from '@/lib/logger';
import { syncCloudProfile } from '@/lib/auth/profileSync';
import { supabase } from '@/lib/auth/supabase';
import { useAppStore } from '@/stores/useAppStore';

function hydrateCloudProfile() {
  const state = useAppStore.getState();

  // Only attempt the automatic lookup once per fresh session. A failed lookup
  // leaves a visible retry action in the account sheet instead of retrying on
  // every auth event or render.
  if (
    state.supabaseAccessToken &&
    !state.cloudProfile &&
    state.profileSyncStatus === 'idle'
  ) {
    void syncCloudProfile();
  }
}

export function useSupabaseAuthSync() {
  const setSupabaseAccessToken = useAppStore((state) => state.setSupabaseAccessToken);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;

      logger.info('Initial Supabase session:', data.session ? 'present' : 'none');
      setSupabaseAccessToken(data.session?.access_token ?? null);

      if (data.session) {
        hydrateCloudProfile();
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      logger.info('Auth state changed:', event, session ? 'session present' : 'no session');
      setSupabaseAccessToken(session?.access_token ?? null);

      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        // Defer so the API client's own getSession() call cannot block
        // Supabase's auth callback.
        setTimeout(() => {
          if (active) hydrateCloudProfile();
        }, 0);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [setSupabaseAccessToken]);
}
