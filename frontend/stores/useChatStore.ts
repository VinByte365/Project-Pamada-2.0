import { create } from 'zustand';

import { isChatOfflineError, requestChatReply } from '@/lib/api/chat';

export type ChatMessageRole = 'user' | 'assistant';

export type ChatDelivery = 'sending' | 'sent' | 'failed';

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  text: string;
  at: number;
  delivery?: ChatDelivery;
};

export type ChatFailureKind = 'offline' | 'server';

export type ChatFailure = {
  kind: ChatFailureKind;
  message: string;
};

type ChatState = {
  messages: ChatMessage[];
  status: 'idle' | 'sending';
  failure: ChatFailure | null;
  send: (message: string) => void;
  retry: () => void;
  clear: () => void;
};

let sequence = 0;

function nextId() {
  sequence += 1;
  return `chat-${Date.now().toString(36)}-${sequence.toString(36)}`;
}

/**
 * Session-scoped chat transcript. Nothing is written to the ledger or disk;
 * a fresh app session starts with an empty conversation.
 */
export const useChatStore = create<ChatState>((set, get) => {
  const deliver = async (messageId: string, text: string) => {
    set((state) => ({
      status: 'sending',
      failure: null,
      messages: state.messages.map((message): ChatMessage =>
        message.id === messageId ? { ...message, delivery: 'sending' } : message
      ),
    }));

    try {
      const reply = await requestChatReply(text);
      const assistantMessage: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        text: reply,
        at: Date.now(),
      };

      set((state) => ({
        status: 'idle',
        failure: null,
        messages: [
          ...state.messages.map((message): ChatMessage =>
            message.id === messageId ? { ...message, delivery: 'sent' } : message
          ),
          assistantMessage,
        ],
      }));
    } catch (error) {
      const offline = isChatOfflineError(error);
      set((state) => ({
        status: 'idle',
        failure: {
          kind: offline ? 'offline' : 'server',
          message: offline
            ? 'No line to the field guide. This conversation is held on this device only, and nothing was sent. Reconnect and try again.'
            : 'The field guide could not answer just now. This transcript is still on this device. Try once more in a moment.',
        },
        messages: state.messages.map((message): ChatMessage =>
          message.id === messageId ? { ...message, delivery: 'failed' } : message
        ),
      }));
    }
  };

  return {
    messages: [],
    status: 'idle',
    failure: null,

    send: (raw) => {
      const text = raw.trim();
      if (!text || get().status === 'sending') return;

      const messageId = nextId();
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: messageId,
            role: 'user',
            text,
            at: Date.now(),
            delivery: 'sending',
          },
        ],
        failure: null,
      }));

      void deliver(messageId, text);
    },

    retry: () => {
      if (get().status === 'sending') return;

      const failed = [...get().messages]
        .reverse()
        .find((message) => message.role === 'user' && message.delivery === 'failed');

      if (!failed) return;
      void deliver(failed.id, failed.text);
    },

    clear: () => {
      if (get().status === 'sending') return;
      set({ messages: [], status: 'idle', failure: null });
    },
  };
});
