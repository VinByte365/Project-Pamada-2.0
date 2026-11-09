import { supabase } from './supabase';
import { isRateLimitError, logger } from '@/lib/logger';

export type AuthResult = {
  error: string | null;
};

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  logger.info('Attempting sign up for:', email);
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    if (isRateLimitError(error)) {
      logger.warn('Sign up rate limited for:', email);
    } else {
      logger.error('Sign up failed:', error.message);
    }
  } else {
    logger.info('Sign up request completed for:', email);
  }
  return { error: error?.message ?? null };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  logger.info('Attempting sign in for:', email);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (isRateLimitError(error)) {
      logger.warn('Sign in rate limited for:', email);
    } else {
      logger.error('Sign in failed:', error.message);
    }
  } else {
    logger.info('Sign in successful for:', email);
  }
  return { error: error?.message ?? null };
}

export async function signInWithMagicLink(email: string): Promise<AuthResult> {
  logger.info('Sending magic link to:', email);
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) {
    if (isRateLimitError(error)) {
      logger.warn('Magic link rate limited for:', email);
    } else {
      logger.error('Magic link failed:', error.message);
    }
  } else {
    logger.info('Magic link sent to:', email);
  }
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<AuthResult> {
  logger.info('Signing out');
  const { error } = await supabase.auth.signOut();
  if (error) {
    if (isRateLimitError(error)) {
      logger.warn('Sign out rate limited');
    } else {
      logger.error('Sign out failed:', error.message);
    }
  } else {
    logger.info('Sign out successful');
  }
  return { error: error?.message ?? null };
}
