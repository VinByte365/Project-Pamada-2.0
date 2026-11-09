import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AloeMark } from '@/components/AloeArt';
import { Entry } from '@/components/Entry';
import { Eyebrow } from '@/components/Eyebrow';
import { Card, FieldButton, Meta, Rule, Stamp } from '@/components/FieldUI';
import { PaperBackground } from '@/components/PaperBackground';
import { Palette } from '@/constants/Colors';
import { Layout, Radius } from '@/constants/Metrics';
import { Type } from '@/constants/Typography';
import { useChatStore, type ChatFailure, type ChatMessage } from '@/stores/useChatStore';

const ease = Easing.bezier(0.32, 0.72, 0, 1);

const quickPrompts = [
  { label: 'Watering', question: 'How often should I water aloe vera?' },
  { label: 'Soil & pH', question: 'What soil pH does aloe vera prefer?' },
  { label: 'Pests', question: 'What pests commonly affect aloe vera?' },
  { label: 'Harvest', question: 'When should I harvest an aloe vera leaf?' },
];

function formatClock(at: number) {
  const date = new Date(at);
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const hour = date.getHours() % 12 || 12;
  return `${hour}:${minutes} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
}

function BackButton() {
  const router = useRouter();
  const [focused, setFocused] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={10}
      onPress={goBack}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.backButton,
        focused && styles.focusedRing,
        pressed && styles.pressed,
      ]}
    >
      <SymbolView
        name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }}
        size={15}
        tintColor={Palette.text}
        weight="light"
      />
      <Text style={styles.backLabel}>Back</Text>
    </Pressable>
  );
}

function PromptChip({
  label,
  question,
  onSelect,
}: {
  label: string;
  question: string;
  onSelect: () => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Use a suggested question about ${label.toLowerCase()}`}
      accessibilityHint="Fills the message field with this question."
      onPress={onSelect}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.promptChip,
        focused && styles.focusedRing,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.promptLabel}>{label}</Text>
      <Text style={styles.promptGlyph}>↗</Text>
    </Pressable>
  );
}

function EmptyTranscript({ onPrompt }: { onPrompt: (question: string) => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyMark}>
        <AloeMark size={30} color={Palette.moss} />
      </View>
      <Meta tone="accent">Awaiting first question</Meta>
      <Text style={styles.emptyTitle}>Ask about the leaf, the soil, the cut.</Text>
      <Text style={styles.emptyBody}>
        An aloe-only guide for care, field readings, harvest and grading. Answers come from
        the backend when the signal allows; the transcript stays on this device.
      </Text>
      <View style={styles.promptRow}>
        {quickPrompts.map((prompt) => (
          <PromptChip
            key={prompt.label}
            label={prompt.label}
            question={prompt.question}
            onSelect={() => onPrompt(prompt.question)}
          />
        ))}
      </View>
    </View>
  );
}

function MessageRow({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const failed = message.delivery === 'failed';
  const sending = message.delivery === 'sending';

  return (
    <Entry distance={9}>
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        <View style={[styles.messageMetaRow, isUser && styles.messageMetaRowUser]}>
          <Meta tone={isUser ? 'accent' : 'ink'}>{isUser ? 'You' : 'Field guide'}</Meta>
          <Text style={styles.messageTime}>{formatClock(message.at)}</Text>
          {sending ? <Text style={styles.messageState}>sending</Text> : null}
          {failed ? <Stamp label="Not sent" tone="accent" /> : null}
        </View>
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleGuide,
            failed && styles.bubbleFailed,
          ]}
        >
          {!isUser ? <View style={styles.guideRule} /> : null}
          <Text
            selectable
            style={[
              styles.bubbleText,
              isUser ? styles.bubbleTextUser : styles.bubbleTextGuide,
            ]}
          >
            {message.text}
          </Text>
        </View>
      </View>
    </Entry>
  );
}

function TypingDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.24);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 380, easing: ease }),
          withTiming(0.24, { duration: 420, easing: ease })
        ),
        -1,
        false
      )
    );

    return () => cancelAnimation(opacity);
  }, [delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.typingDot, animatedStyle]} />;
}

function TypingRow() {
  return (
    <Entry distance={6}>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Field guide is reading the leaf and preparing a reply"
        accessibilityLiveRegion="polite"
        style={styles.typingRow}
      >
        <View style={styles.typingBubble}>
          <View style={styles.typingHead}>
            <Meta tone="accent">Field guide</Meta>
            <View style={styles.typingDots}>
              <TypingDot delay={0} />
              <TypingDot delay={140} />
              <TypingDot delay={280} />
            </View>
          </View>
          <Text style={styles.typingText}>Reading the leaf…</Text>
        </View>
      </View>
    </Entry>
  );
}

function ClearButton({ disabled, onPress }: { disabled: boolean; onPress: () => void }) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Clear this chat session"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.clearButton,
        focused && styles.focusedRing,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.clearLabel}>Clear</Text>
    </Pressable>
  );
}

function FailureNotice({
  failure,
  onRetry,
}: {
  failure: ChatFailure;
  onRetry: () => void;
}) {
  const offline = failure.kind === 'offline';

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[styles.failure, offline ? styles.failureOffline : styles.failureServer]}
    >
      <View
        style={[
          styles.failureBar,
          { backgroundColor: offline ? Palette.accent : Palette.warn },
        ]}
      />
      <View style={styles.failureCopy}>
        <Meta tone="ink">{offline ? 'Local only' : 'No answer'}</Meta>
        <Text style={styles.failureText}>{failure.message}</Text>
      </View>
      <FieldButton
        label="Try again"
        onPress={onRetry}
        variant="outline"
        compact
        accessibilityLabel="Try sending the last question again"
        style={styles.retryButton}
      />
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compactHeader = height < 700;
  const messages = useChatStore((state) => state.messages);
  const status = useChatStore((state) => state.status);
  const failure = useChatStore((state) => state.failure);
  const send = useChatStore((state) => state.send);
  const retry = useChatStore((state) => state.retry);
  const clear = useChatStore((state) => state.clear);

  const [draft, setDraft] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const sending = status === 'sending';
  const canSend = draft.trim().length > 0 && !sending;

  useEffect(() => {
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 70);
    return () => clearTimeout(timer);
  }, [messages.length, status]);

  const scrollToEnd = () => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 70);
  };

  const applyPrompt = (question: string) => {
    setDraft(question);
    setTimeout(() => inputRef.current?.focus(), 30);
    scrollToEnd();
  };

  const submit = () => {
    const text = draft.trim();
    if (!text || sending) return;

    setDraft('');
    send(text);
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const entriesLabel =
    messages.length === 0
      ? 'No entries yet'
      : `${messages.length} ${messages.length === 1 ? 'entry' : 'entries'} · session only`;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PaperBackground />
      <View
        style={[
          styles.frame,
          compactHeader && styles.frameCompact,
          {
            paddingTop: insets.top + 14,
            paddingBottom: Math.max(insets.bottom, 10) + 10,
          },
        ]}
      >
        <View style={styles.masthead}>
          <BackButton />
          <Text style={styles.pageIndex}>Field guide / 07</Text>
        </View>

        <Rule />

        <Entry delay={40} style={styles.head}>
          <Eyebrow label="Aloe vera only · Backend-assisted" />
          <Text style={[styles.title, compactHeader && styles.titleCompact]}>
            Ask the field guide.
          </Text>
          {compactHeader ? null : (
            <Text style={styles.description}>
              Care, field readings, harvest and grading — answered for aloe barbadensis
              miller. Questions outside the crop are declined by the guide itself.
            </Text>
          )}
        </Entry>

        <Entry delay={150} style={styles.transcriptWrap}>
          <Card style={styles.transcriptShell} coreStyle={styles.transcriptCore}>
            <View style={styles.transcriptHead}>
              <View style={styles.transcriptHeadCopy}>
                <Meta tone="ink">Session transcript</Meta>
                <Text style={styles.transcriptNote}>{entriesLabel}</Text>
              </View>
              <View style={styles.transcriptActions}>
                <Stamp label="Aloe only" tone="moss" />
                {messages.length > 0 ? (
                  <ClearButton disabled={sending} onPress={clear} />
                ) : null}
              </View>
            </View>

            <Rule />

            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <MessageRow message={item} />}
              ListEmptyComponent={<EmptyTranscript onPrompt={applyPrompt} />}
              ListFooterComponent={sending ? <TypingRow /> : null}
              ItemSeparatorComponent={() => <View style={styles.messageGap} />}
              contentContainerStyle={[
                styles.listContent,
                messages.length === 0 && styles.listContentEmpty,
              ]}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              onContentSizeChange={scrollToEnd}
            />
          </Card>
        </Entry>

        {failure ? <FailureNotice failure={failure} onRetry={retry} /> : null}

        <View style={styles.composerShell}>
          <View style={styles.composerCore}>
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                value={draft}
                onChangeText={setDraft}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                multiline
                maxLength={500}
                textAlignVertical="top"
                placeholder="Ask about watering, pests, harvest…"
                placeholderTextColor={Palette.dim}
                selectionColor={Palette.accent}
                accessibilityLabel="Ask an aloe vera question"
                accessibilityHint="Type a question about aloe vera care, field conditions, or harvest. Answers require a backend connection."
                style={[styles.input, inputFocused && styles.inputFocused]}
              />
              <FieldButton
                label={sending ? 'Sending' : 'Send'}
                onPress={submit}
                disabled={!canSend}
                variant="ink"
                compact
                accessibilityLabel={sending ? 'Sending your question' : 'Send your question'}
                style={styles.sendButton}
              />
            </View>

            <View style={styles.composerFoot}>
              <Text style={styles.composerNote}>
                {sending
                  ? 'Reading the leaf · waiting for the backend'
                  : 'Answers need a connection · transcript kept on this device'}
              </Text>
              <Text style={styles.counter}>{draft.length}/500</Text>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.gutter,
    gap: 14,
  },
  frameCompact: {
    gap: 10,
  },
  masthead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  backButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingLeft: 7,
    paddingRight: 9,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: Radius.pill,
  },
  backLabel: {
    ...Type.meta,
    color: Palette.text,
  },
  pageIndex: {
    ...Type.caption,
    color: Palette.dim,
    textAlign: 'right',
    flexShrink: 1,
  },
  head: {
    gap: 10,
    paddingTop: 2,
  },
  title: {
    ...Type.displaySmall,
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -1.5,
    maxWidth: 620,
  },
  titleCompact: {
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -1.2,
  },
  description: {
    ...Type.body,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 580,
  },
  transcriptWrap: {
    flex: 1,
    minHeight: 0,
  },
  transcriptShell: {
    flex: 1,
  },
  transcriptCore: {
    padding: 0,
    overflow: 'hidden',
  },
  transcriptHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  transcriptHeadCopy: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 130,
    gap: 2,
  },
  transcriptNote: {
    ...Type.caption,
    color: Palette.dim,
    textTransform: 'none',
    letterSpacing: 0.2,
  },
  transcriptActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
    marginLeft: 'auto',
  },
  clearButton: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearLabel: {
    ...Type.labelSmall,
    color: Palette.text,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  list: {
    flex: 1,
  },
  listContentEmpty: {
    justifyContent: 'center',
  },
  messageGap: {
    height: 18,
  },
  messageRow: {
    alignItems: 'flex-start',
    gap: 6,
    maxWidth: '100%',
  },
  messageRowUser: {
    alignItems: 'flex-end',
  },
  messageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 2,
  },
  messageMetaRowUser: {
    justifyContent: 'flex-end',
  },
  messageTime: {
    ...Type.caption,
    fontSize: 8,
    letterSpacing: 0.8,
    color: Palette.dim,
    textTransform: 'none',
  },
  messageState: {
    ...Type.caption,
    fontSize: 8,
    letterSpacing: 0.8,
    color: Palette.accentDeep,
    textTransform: 'none',
  },
  bubble: {
    maxWidth: 560,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  bubbleGuide: {
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderTopLeftRadius: 6,
    overflow: 'hidden',
  },
  bubbleUser: {
    backgroundColor: Palette.ink,
    borderColor: Palette.ink,
    borderTopRightRadius: 6,
  },
  bubbleFailed: {
    borderColor: Palette.accent,
    borderStyle: 'dashed',
  },
  guideRule: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 2,
    backgroundColor: Palette.accent,
  },
  bubbleText: {
    ...Type.body,
    fontSize: 14.5,
    lineHeight: 22,
  },
  bubbleTextGuide: {
    color: Palette.body,
  },
  bubbleTextUser: {
    color: Palette.cream,
  },
  empty: {
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 18,
  },
  emptyMark: {
    width: 48,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emptyTitle: {
    ...Type.title,
    fontSize: 25,
    lineHeight: 29,
    maxWidth: 420,
  },
  emptyBody: {
    ...Type.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: Palette.muted,
    maxWidth: 500,
  },
  promptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  promptChip: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: Palette.hairline,
    borderRadius: Radius.pill,
    paddingLeft: 13,
    paddingRight: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(22,26,20,0.015)',
  },
  promptLabel: {
    ...Type.labelSmall,
    fontSize: 11.5,
    color: Palette.text,
  },
  promptGlyph: {
    fontFamily: 'CabinetGrotesk-Bold',
    fontSize: 10,
    color: Palette.accentDeep,
  },
  typingRow: {
    alignItems: 'flex-start',
    paddingTop: 18,
  },
  typingBubble: {
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    borderTopLeftRadius: 6,
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 6,
  },
  typingHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.accent,
  },
  typingText: {
    ...Type.body,
    fontSize: 13,
    lineHeight: 19,
    color: Palette.muted,
  },
  failure: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: 12,
    paddingLeft: 0,
    overflow: 'hidden',
  },
  failureOffline: {
    borderColor: 'rgba(196,86,45,0.28)',
    backgroundColor: Palette.accentSoft,
  },
  failureServer: {
    borderColor: 'rgba(162,58,42,0.3)',
    backgroundColor: 'rgba(162,58,42,0.07)',
  },
  failureBar: {
    alignSelf: 'stretch',
    width: 3,
    borderRadius: 3,
  },
  failureCopy: {
    flex: 1,
    minWidth: 180,
    gap: 3,
  },
  failureText: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.body,
  },
  retryButton: {
    alignSelf: 'center',
    flexShrink: 0,
  },
  composerShell: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.card,
    padding: 5,
    backgroundColor: Palette.shell,
  },
  composerCore: {
    borderWidth: 1,
    borderColor: 'rgba(22,26,20,0.06)',
    borderRadius: Radius.cardInner,
    backgroundColor: Palette.surface,
    padding: 12,
    gap: 9,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 108,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    backgroundColor: Palette.background,
    color: Palette.text,
    fontFamily: 'Satoshi-Regular',
    fontSize: 14.5,
    lineHeight: 21,
    paddingHorizontal: 13,
    paddingTop: 11,
    paddingBottom: 11,
  },
  inputFocused: {
    borderColor: Palette.accent,
    boxShadow: '0 0 0 3px rgba(196,86,45,0.16)',
  },
  sendButton: {
    alignSelf: 'flex-end',
  },
  composerFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  composerNote: {
    ...Type.caption,
    color: Palette.muted,
    textTransform: 'none',
    letterSpacing: 0.2,
    flexShrink: 1,
    minWidth: 180,
  },
  counter: {
    ...Type.caption,
    color: Palette.dim,
    textTransform: 'none',
    letterSpacing: 0.2,
  },
  focusedRing: {
    borderColor: Palette.accent,
    boxShadow: '0 0 0 3px rgba(196,86,45,0.18)',
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.36,
  },
});
