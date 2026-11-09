import axios from 'axios';

import { apiClient } from '@/lib/api/client';

export type ChatResponse = {
  reply: string;
};

/**
 * Ask the aloe-only backend field guide a question.
 * The backend owns topic scope: non-aloe prompts receive a polite decline
 * in `reply`, which the UI renders without interpreting it.
 */
export async function requestChatReply(message: string): Promise<string> {
  const { data } = await apiClient.post<ChatResponse>('/chat', { message });

  if (typeof data?.reply !== 'string' || !data.reply.trim()) {
    throw new Error('The field guide returned an empty reply.');
  }

  return data.reply.trim();
}

/**
 * A request only counts as local-only when it never reached a server.
 * HTTP errors with a response are server failures, not connectivity loss.
 */
export function isChatOfflineError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true;
  return error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';
}
