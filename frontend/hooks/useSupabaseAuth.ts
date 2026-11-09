import { useEffect } from 'react';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/auth/supabase';
import { useAppStore } from '@/stores/useAppStore';

export function useSupabaseAuthSync() {
  const setSupabaseAccessToken = useAppStore((state) => state.setSupabaseAccessToken);
  const setSupabaseUserId = useAppStore((state) => state.setSupabaseUserId);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        logger.info('Initial Supabase session:', data.session ? 'present' : 'none');
        setSupabaseAccessToken(data.session?.access_token ?? null);
        setSupabaseUserId(data.session?.user?.id ?? null);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      logger.info('Auth state changed:', _event, session ? 'session present' : 'no session');
      setSupabaseAccessToken(session?.access_token ?? null);
      setSupabaseUserId(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [setSupabaseAccessToken, setSupabaseUserId]);
}
