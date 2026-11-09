// Production-safe logging for the mobile client.
// In development, logs are emitted to the console.
// In production, logs are silenced by default to avoid leaking implementation
// details and noisy auth/rate-limit failures. Replace the no-op branches with
// a crash-reporting provider (e.g. Sentry) when one is added.

declare const __DEV__: boolean;

const isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

export const logger = {
  info: (...args: unknown[]) => {
    if (isDevelopment) console.info('[FarmSystem]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) console.warn('[FarmSystem]', ...args);
  },
  error: (...args: unknown[]) => {
    if (isDevelopment) console.error('[FarmSystem]', ...args);
  },
};

export function isRateLimitError(error: { status?: number; message?: string } | null | undefined) {
  if (!error) return false;
  if (error.status === 429) return true;
  const message = (error.message ?? '').toLowerCase();
  return message.includes('rate limit') || message.includes('too many requests');
}
