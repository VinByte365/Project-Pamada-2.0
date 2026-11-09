import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AloeMark } from '@/components/AloeArt';
import {
  Card,
  FieldButton,
  Meta,
  Rule,
  Stamp,
} from '@/components/FieldUI';
import { PaperBackground } from '@/components/PaperBackground';
import { Palette } from '@/constants/Colors';
import { Layout } from '@/constants/Metrics';
import { Type } from '@/constants/Typography';
import {
  signInWithEmail,
  signInWithMagicLink,
  signOut,
  signUpWithEmail,
} from '@/lib/auth/authService';
import { syncCloudProfile } from '@/lib/auth/profileSync';
import { isSupabaseConfigured } from '@/lib/auth/supabase';
import { useAppStore } from '@/stores/useAppStore';

type AuthMode = 'signin' | 'signup';

type PendingAction = 'signin' | 'signup' | 'magic' | 'signout' | 'profile' | null;

type Feedback = {
  tone: 'error' | 'success' | 'info';
  message: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const busyLabels: Record<Exclude<PendingAction, null>, string> = {
  signin: 'Contacting Supabase · checking the password',
  signup: 'Contacting Supabase · creating the account',
  magic: 'Contacting Supabase · requesting a sign-in link',
  signout: 'Contacting Supabase · closing the session',
  profile: 'Contacting FastAPI · loading the MongoDB profile',
};

function describeAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Email or password is incorrect. Try again, or use a sign-in link.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Confirm the email address first. Check the inbox for this account, then sign in.';
  }
  if (
    normalized.includes('user already registered') ||
    normalized.includes('already registered')
  ) {
    return 'That email already has an account. Sign in instead, or use a sign-in link.';
  }
  if (normalized.includes('password should be at least')) {
    return 'Use at least six characters for the password.';
  }
  if (normalized.includes('unable to validate email')) {
    return 'Enter a valid email address, such as grower@example.com.';
  }
  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return 'Too many attempts. Wait a moment, then try again.';
  }
  if (normalized.includes('for security purposes')) {
    return 'Wait a moment before requesting another email from Supabase.';
  }
  if (normalized.includes('network') || normalized.includes('fetch')) {
    return 'The cloud could not be reached. The ledger is still safe on this device.';
  }

  return message;
}

function AuthNotice({ tone, message }: Feedback) {
  const tones = {
    error: {
      border: 'rgba(162,58,42,0.32)',
      background: 'rgba(162,58,42,0.08)',
      bar: Palette.warn,
      label: 'Error',
    },
    success: {
      border: 'rgba(46,70,51,0.28)',
      background: Palette.mossSoft,
      bar: Palette.moss,
      label: 'Done',
    },
    info: {
      border: 'rgba(196,86,45,0.24)',
      background: Palette.accentSoft,
      bar: Palette.accent,
      label: 'Note',
    },
  }[tone];

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion={tone === 'error' ? 'assertive' : 'polite'}
      style={[
        styles.feedback,
        { borderColor: tones.border, backgroundColor: tones.background },
      ]}
    >
      <View style={[styles.feedbackBar, { backgroundColor: tones.bar }]} />
      <View style={styles.feedbackCopy}>
        <Meta tone="ink">{tones.label}</Meta>
        <Text style={styles.feedbackText}>{message}</Text>
      </View>
    </View>
  );
}

function StatusCell({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <View style={styles.statusCell}>
      <Meta tone="cream">{label}</Meta>
      <Text style={styles.statusValue}>{value}</Text>
      <Text style={styles.statusNote}>{note}</Text>
    </View>
  );
}

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();

  const accountStatus = useAppStore((state) => state.accountStatus);
  const supabaseAccessToken = useAppStore((state) => state.supabaseAccessToken);
  const setSupabaseAccessToken = useAppStore(
    (state) => state.setSupabaseAccessToken
  );
  const localProfileId = useAppStore((state) => state.localProfileId);
  const cloudProfile = useAppStore((state) => state.cloudProfile);
  const profileSyncStatus = useAppStore((state) => state.profileSyncStatus);
  const profileSyncMessage = useAppStore((state) => state.profileSyncMessage);

  const [mode, setMode] = useState<AuthMode>(
    params.mode === 'signup' ? 'signup' : 'signin'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const [buttonFocus, setButtonFocus] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const busy = pending !== null;
  const signedIn = accountStatus === 'synced' && Boolean(supabaseAccessToken);

  useEffect(() => {
    setMode(params.mode === 'signup' ? 'signup' : 'signin');
  }, [params.mode]);

  const close = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  const selectMode = (next: AuthMode) => {
    if (busy || next === mode) return;
    setMode(next);
    setFeedback(null);
  };

  const readEmail = () => {
    const value = email.trim();
    if (!value) {
      setFeedback({
        tone: 'error',
        message: 'Enter the email address for this account.',
      });
      return null;
    }
    if (!EMAIL_PATTERN.test(value)) {
      setFeedback({
        tone: 'error',
        message: 'Enter a valid email address, such as grower@example.com.',
      });
      return null;
    }
    return value;
  };

  const handleSignIn = async () => {
    if (pending || !isSupabaseConfigured) return;

    const address = readEmail();
    if (!address) return;
    if (!password) {
      setFeedback({ tone: 'error', message: 'Enter the password for this account.' });
      return;
    }

    setPending('signin');
    setFeedback(null);

    try {
      const result = await signInWithEmail(address, password);
      if (result.error) {
        setFeedback({ tone: 'error', message: describeAuthError(result.error) });
        return;
      }

      setPassword('');
      setFeedback({
        tone: 'success',
        message: 'Signed in. This device can now use the cloud layer when a connection is available.',
      });
    } catch {
      setFeedback({
        tone: 'error',
        message: 'The cloud could not be reached. The ledger is still safe on this device.',
      });
    } finally {
      setPending(null);
    }
  };

  const handleSignUp = async () => {
    if (pending || !isSupabaseConfigured) return;

    const address = readEmail();
    if (!address) return;
    if (password.length < 6) {
      setFeedback({
        tone: 'error',
        message: 'Use at least six characters for the password.',
      });
      return;
    }

    setPending('signup');
    setFeedback(null);

    try {
      const result = await signUpWithEmail(address, password);
      if (result.error) {
        setFeedback({ tone: 'error', message: describeAuthError(result.error) });
        return;
      }

      setPassword('');
      setFeedback({
        tone: 'success',
        message: `Account created for ${address}. If Supabase requires confirmation, open the email before signing in.`,
      });
    } catch {
      setFeedback({
        tone: 'error',
        message: 'The cloud could not be reached. The ledger is still safe on this device.',
      });
    } finally {
      setPending(null);
    }
  };

  const handleMagicLink = async () => {
    if (pending || !isSupabaseConfigured) return;

    const address = readEmail();
    if (!address) return;

    setPending('magic');
    setFeedback(null);

    try {
      const result = await signInWithMagicLink(address);
      if (result.error) {
        setFeedback({ tone: 'error', message: describeAuthError(result.error) });
        return;
      }

      setFeedback({
        tone: 'success',
        message: `Sign-in link requested for ${address}. Open it on this device to finish.`,
      });
    } catch {
      setFeedback({
        tone: 'error',
        message: 'The cloud could not be reached. The ledger is still safe on this device.',
      });
    } finally {
      setPending(null);
    }
  };

  const handleRetryProfile = async () => {
    if (pending) return;

    setPending('profile');
    setFeedback(null);

    try {
      const result = await syncCloudProfile();
      if (result.status === 'synced') {
        setFeedback({
          tone: 'success',
          message: 'Cloud profile linked. The MongoDB record is now held in this session.',
        });
      }
    } catch {
      setFeedback({
        tone: 'error',
        message:
          'The cloud profile could not be checked. Local records are unaffected; try again later.',
      });
    } finally {
      setPending(null);
    }
  };

  const handleSignOut = async () => {
    if (pending) return;

    setPending('signout');
    setFeedback(null);

    try {
      const result = await signOut();
      if (result.error) {
        setFeedback({ tone: 'error', message: describeAuthError(result.error) });
        return;
      }

      setSupabaseAccessToken(null);
      useAppStore.getState().clearCloudProfile();
      setEmail('');
      setPassword('');
      setFeedback({
        tone: 'info',
        message: 'Signed out. Local-only mode is active again, and every record stays on this device.',
      });
    } catch {
      setFeedback({
        tone: 'error',
        message: 'The cloud could not be reached. The session was not closed; try again when online.',
      });
    } finally {
      setPending(null);
    }
  };

  const submit = () => {
    if (mode === 'signup') {
      void handleSignUp();
      return;
    }
    void handleSignIn();
  };

  const primaryLabel =
    mode === 'signup'
      ? pending === 'signup'
        ? 'Creating account…'
        : 'Create account'
      : pending === 'signin'
        ? 'Signing in…'
        : 'Sign in';

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PaperBackground />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 14,
            paddingBottom: insets.bottom + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          accessibilityViewIsModal
          style={styles.frame}
        >
          <View style={styles.grabber} />

          <View style={styles.masthead}>
            <View style={styles.brand}>
              <AloeMark size={24} color={Palette.moss} />
              <Meta tone="ink">FarmSystem</Meta>
            </View>

            <View style={styles.mastheadRight}>
              <Stamp
                label={signedIn ? 'Signed in' : 'Local only'}
                tone={signedIn ? 'moss' : 'outline'}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close account sheet"
                hitSlop={10}
                onPress={close}
                onFocus={() => setButtonFocus('close')}
                onBlur={() =>
                  setButtonFocus((current) => (current === 'close' ? null : current))
                }
                style={({ pressed }) => [
                  styles.close,
                  buttonFocus === 'close' && styles.focusRing,
                  pressed && styles.pressed,
                ]}
              >
                <SymbolView
                  name={{ ios: 'xmark', android: 'close', web: 'close' }}
                  size={16}
                  weight="light"
                  tintColor={Palette.text}
                />
              </Pressable>
            </View>
          </View>

          <Rule />

          <View style={styles.head}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowRule} />
              <Meta>Account / Optional</Meta>
            </View>
            <Text accessibilityRole="header" style={styles.title}>
              The cloud, on request.
            </Text>
            <Text style={styles.description}>
              Signing in never gates the field tools. An account adds a Supabase
              identity for backup, multi-device access and community. The ledger
              keeps working from local records.
            </Text>
          </View>

          <View style={styles.notice}>
            <View style={styles.noticeBar} />
            <View style={styles.noticeCopy}>
              <Text style={styles.noticeTitle}>Local-only is still the default.</Text>
              <Text style={styles.noticeBody}>
                The scanner, farms, plants and records need no account. An account
                layers sync on top; it does not replace the local ledger.
              </Text>
            </View>
            <Stamp label="Optional" tone="moss" />
          </View>

          <Card tone="ink">
            <View style={styles.cardBody}>
              <View style={styles.statusHead}>
                <View style={styles.statusCopy}>
                  <Meta tone="cream">Account state</Meta>
                  <Text style={styles.statusTitle}>
                    {signedIn ? 'Linked to the cloud.' : 'Local-only, as intended.'}
                  </Text>
                </View>
                <Stamp
                  label={signedIn ? 'Signed in' : 'Local only'}
                  tone="cream"
                />
              </View>

              <Text style={styles.statusBody}>
                {signedIn
                  ? 'A Supabase session is held on this device. Cloud operations can use it, while offline records remain the source of truth.'
                  : 'No cloud session is active. Everything on this device continues to work without an account or a connection.'}
              </Text>

              <View style={styles.statusGrid}>
                <StatusCell
                  label="Local identity"
                  value={localProfileId ? 'Present' : 'Not created'}
                  note={localProfileId ? 'Stored on this device' : 'Create one in Settings'}
                />
                <StatusCell
                  label="Session token"
                  value={supabaseAccessToken ? 'Active' : 'None'}
                  note={
                    supabaseAccessToken
                      ? 'Secured on this device'
                      : 'No cloud access'
                  }
                />
                <StatusCell
                  label="Cloud profile"
                  value={
                    cloudProfile
                      ? cloudProfile.email ?? cloudProfile.name ?? 'Linked'
                      : profileSyncStatus === 'syncing'
                        ? 'Loading'
                        : 'Not loaded'
                  }
                  note={
                    cloudProfile
                      ? 'MongoDB record'
                      : profileSyncStatus === 'offline'
                        ? 'Backend unreachable'
                        : profileSyncStatus === 'unauthorized'
                          ? 'Verification failed'
                          : 'Retry from Account'
                  }
                />
              </View>

              {profileSyncStatus === 'syncing' ? (
                <View style={styles.profileSyncRow} accessibilityLiveRegion="polite">
                  <ActivityIndicator size="small" color={Palette.accent} />
                  <Text style={styles.profileSyncText}>
                    Checking the cloud profile…
                  </Text>
                </View>
              ) : null}

              {profileSyncMessage ? (
                <AuthNotice
                  tone={
                    profileSyncStatus === 'unauthorized' ||
                    profileSyncStatus === 'error'
                      ? 'error'
                      : 'info'
                  }
                  message={profileSyncMessage}
                />
              ) : null}

              {signedIn && feedback ? (
                <AuthNotice tone={feedback.tone} message={feedback.message} />
              ) : null}

              {signedIn ? (
                <View style={styles.signOutRow}>
                  <FieldButton
                    label={pending === 'signout' ? 'Signing out…' : 'Sign out'}
                    onPress={() => void handleSignOut()}
                    disabled={busy}
                    variant="cream"
                    compact
                  />
                  {pending === 'signout' ? (
                    <ActivityIndicator size="small" color={Palette.accent} />
                  ) : null}
                  {profileSyncStatus !== 'synced' &&
                  profileSyncStatus !== 'syncing' ? (
                    <FieldButton
                      label="Retry profile sync"
                      onPress={() => void handleRetryProfile()}
                      disabled={busy}
                      variant="cream"
                      compact
                    />
                  ) : null}
                  <Text style={styles.signOutNote}>
                    Signing out keeps every local record on the device.
                  </Text>
                </View>
              ) : null}
            </View>
          </Card>

          {!signedIn ? (
            <Card>
              <View style={styles.cardBody}>
                <View style={styles.formHead}>
                  <View style={styles.formHeadCopy}>
                    <Meta tone="accent">Email & password</Meta>
                    <Text style={styles.formTitle}>
                      {mode === 'signup'
                        ? 'Create a cloud account.'
                        : 'Sign in to the cloud.'}
                    </Text>
                  </View>
                  <Stamp
                    label={isSupabaseConfigured ? 'Cloud optional' : 'Not configured'}
                    tone={isSupabaseConfigured ? 'outline' : 'accent'}
                  />
                </View>

                {feedback ? (
                  <AuthNotice tone={feedback.tone} message={feedback.message} />
                ) : null}

                {!isSupabaseConfigured ? (
                  <AuthNotice
                    tone="error"
                    message="Supabase is not configured in this build. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable cloud sign-in. Local-only use is unaffected."
                  />
                ) : null}

                <View accessibilityRole="tablist" style={styles.modeSwitch}>
                  <Pressable
                    accessibilityRole="tab"
                    accessibilityLabel="Sign in"
                    accessibilityState={{ selected: mode === 'signin', disabled: busy }}
                    disabled={busy}
                    onPress={() => selectMode('signin')}
                    onFocus={() => setButtonFocus('mode-signin')}
                    onBlur={() =>
                      setButtonFocus((current) =>
                        current === 'mode-signin' ? null : current
                      )
                    }
                    style={({ pressed }) => [
                      styles.modeTab,
                      mode === 'signin' && styles.modeTabActive,
                      buttonFocus === 'mode-signin' && styles.focusRing,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modeLabel,
                        mode === 'signin' && styles.modeLabelActive,
                      ]}
                    >
                      Sign in
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="tab"
                    accessibilityLabel="Create account"
                    accessibilityState={{ selected: mode === 'signup', disabled: busy }}
                    disabled={busy}
                    onPress={() => selectMode('signup')}
                    onFocus={() => setButtonFocus('mode-signup')}
                    onBlur={() =>
                      setButtonFocus((current) =>
                        current === 'mode-signup' ? null : current
                      )
                    }
                    style={({ pressed }) => [
                      styles.modeTab,
                      mode === 'signup' && styles.modeTabActive,
                      buttonFocus === 'mode-signup' && styles.focusRing,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modeLabel,
                        mode === 'signup' && styles.modeLabelActive,
                      ]}
                    >
                      Create account
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.formIntro}>
                  {mode === 'signup'
                    ? 'The account is created with Supabase. If confirmation is enabled, open the email before signing in. Local records are untouched.'
                    : 'Use the email and password for this account. Nothing uploads just by signing in; records move only when the sync queue runs.'}
                </Text>

                <View style={styles.form}>
                  <View style={styles.field}>
                    <View style={styles.fieldLabelRow}>
                      <Meta>Email address</Meta>
                      <Text style={styles.fieldHint}>Used for sign-in only</Text>
                    </View>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocused('email')}
                      onBlur={() =>
                        setFocused((current) => (current === 'email' ? null : current))
                      }
                      placeholder="grower@example.com"
                      placeholderTextColor={Palette.dim}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      textContentType="emailAddress"
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      editable={!busy}
                      accessibilityLabel="Email address"
                      style={[styles.input, focused === 'email' && styles.inputFocused]}
                      selectionColor={Palette.accent}
                    />
                  </View>

                  <View style={styles.field}>
                    <View style={styles.fieldLabelRow}>
                      <Meta>Password</Meta>
                      <Text style={styles.fieldHint}>
                        {mode === 'signup' ? 'Six characters minimum' : 'Required'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.passwordShell,
                        focused === 'password' && styles.passwordShellFocused,
                      ]}
                    >
                      <TextInput
                        ref={passwordRef}
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setFocused('password')}
                        onBlur={() =>
                          setFocused((current) =>
                            current === 'password' ? null : current
                          )
                        }
                        placeholder="Your password"
                        placeholderTextColor={Palette.dim}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete={
                          mode === 'signup' ? 'new-password' : 'current-password'
                        }
                        textContentType={
                          mode === 'signup' ? 'newPassword' : 'password'
                        }
                        returnKeyType="go"
                        onSubmitEditing={submit}
                        editable={!busy}
                        accessibilityLabel="Password"
                        accessibilityHint="At least six characters when creating an account."
                        style={styles.passwordInput}
                        selectionColor={Palette.accent}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        hitSlop={8}
                        onPress={() => setShowPassword((current) => !current)}
                      >
                        <Text style={styles.reveal}>
                          {showPassword ? 'Hide' : 'Show'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                <View style={styles.formActions}>
                  <FieldButton
                    label={primaryLabel}
                    onPress={submit}
                    disabled={busy || !isSupabaseConfigured}
                    variant="ink"
                  />
                </View>

                <View style={styles.magicBlock}>
                  <FieldButton
                    label={pending === 'magic' ? 'Sending link…' : 'Email a sign-in link'}
                    onPress={() => void handleMagicLink()}
                    disabled={busy || !isSupabaseConfigured}
                    variant="accent"
                    compact
                  />
                  <Text style={styles.magicNote}>
                    Magic links need Supabase email delivery and a redirect URL that
                    returns to this app. Email and password work without that setup.
                  </Text>
                </View>

                {pending ? (
                  <View style={styles.busyRow} accessibilityLiveRegion="polite">
                    <ActivityIndicator size="small" color={Palette.accent} />
                    <Text style={styles.busyText}>{busyLabels[pending]}</Text>
                  </View>
                ) : null}
              </View>
            </Card>
          ) : null}

          <View style={styles.footRow}>
            <Text style={styles.footnote}>
              Cloud backup, multi-device access and community are the only additions.
              The scanner never asks for a login. Automatic upload waits for the mobile
              sync queue, so local records are untouched until sync is built.
            </Text>
            <FieldButton
              label="Return to the field"
              onPress={close}
              variant="outline"
              compact
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    paddingHorizontal: Layout.gutter,
  },
  frame: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    gap: 22,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(22,26,20,0.18)',
    alignSelf: 'center',
    marginBottom: 2,
  },
  masthead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flexShrink: 1,
  },
  mastheadRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 10,
    marginLeft: 'auto',
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusRing: {
    borderColor: Palette.accent,
    boxShadow: '0 0 0 3px rgba(196,86,45,0.18)',
  },
  pressed: {
    opacity: 0.55,
  },
  head: {
    gap: 12,
    paddingTop: 2,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  eyebrowRule: {
    width: 18,
    height: 2,
    backgroundColor: Palette.accent,
  },
  title: {
    ...Type.displaySmall,
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -1.5,
    maxWidth: 540,
  },
  description: {
    ...Type.body,
    fontSize: 14.5,
    lineHeight: 22,
    maxWidth: 520,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(46,70,51,0.24)',
    backgroundColor: Palette.mossSoft,
    borderRadius: 16,
  },
  noticeBar: {
    width: 2,
    alignSelf: 'stretch',
    backgroundColor: Palette.moss,
    borderRadius: 1,
  },
  noticeCopy: {
    flex: 1,
    minWidth: 190,
    gap: 4,
  },
  noticeTitle: {
    ...Type.label,
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
  },
  noticeBody: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.muted,
    maxWidth: 520,
  },
  feedback: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderRadius: 14,
  },
  feedbackBar: {
    width: 2,
    borderRadius: 1,
  },
  feedbackCopy: {
    flex: 1,
    gap: 3,
  },
  feedbackText: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.body,
  },
  cardBody: {
    gap: 14,
  },
  statusHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  statusCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  statusTitle: {
    ...Type.title,
    fontSize: 24,
    lineHeight: 28,
    color: Palette.cream,
  },
  statusBody: {
    ...Type.body,
    fontSize: 13,
    lineHeight: 20,
    color: Palette.creamMuted,
    maxWidth: 520,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: Palette.inkLine,
    paddingTop: 14,
  },
  statusCell: {
    flexGrow: 1,
    flexBasis: 130,
    gap: 4,
  },
  profileSyncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileSyncText: {
    ...Type.caption,
    fontSize: 9,
    lineHeight: 14,
    color: Palette.creamMuted,
  },
  statusValue: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    lineHeight: 20,
    color: Palette.cream,
  },
  statusNote: {
    ...Type.caption,
    fontSize: 8,
    lineHeight: 13,
    color: Palette.creamDim,
  },
  signOutRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: Palette.inkLine,
    paddingTop: 14,
  },
  signOutNote: {
    ...Type.caption,
    fontSize: 8.5,
    lineHeight: 14,
    color: Palette.creamMuted,
    flex: 1,
    minWidth: 160,
  },
  formHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    flexWrap: 'wrap',
  },
  formHeadCopy: {
    flex: 1,
    minWidth: 190,
    gap: 4,
  },
  formTitle: {
    ...Type.subtitle,
    fontSize: 22,
    lineHeight: 26,
  },
  modeSwitch: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 999,
    backgroundColor: Palette.shell,
  },
  modeTab: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modeTabActive: {
    backgroundColor: Palette.ink,
    borderColor: Palette.ink,
  },
  modeLabel: {
    ...Type.label,
    fontSize: 12,
    color: Palette.muted,
    textAlign: 'center',
  },
  modeLabelActive: {
    fontFamily: 'Satoshi-Bold',
    color: Palette.cream,
  },
  formIntro: {
    ...Type.body,
    fontSize: 13,
    lineHeight: 20,
    color: Palette.muted,
    maxWidth: 500,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 7,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  fieldHint: {
    ...Type.caption,
    fontSize: 8,
    color: Palette.dim,
  },
  input: {
    ...Type.bodyStrong,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 48,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Palette.text,
    backgroundColor: 'rgba(22,26,20,0.015)',
    outlineWidth: 0,
    outlineStyle: 'none' as unknown as 'solid',
  },
  inputFocused: {
    borderColor: Palette.accent,
    backgroundColor: 'rgba(196,86,45,0.03)',
    boxShadow: '0 0 0 3px rgba(196,86,45,0.10)',
  },
  passwordShell: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 14,
    backgroundColor: 'rgba(22,26,20,0.015)',
    paddingRight: 6,
  },
  passwordShellFocused: {
    borderColor: Palette.accent,
    backgroundColor: 'rgba(196,86,45,0.03)',
    boxShadow: '0 0 0 3px rgba(196,86,45,0.10)',
  },
  passwordInput: {
    ...Type.bodyStrong,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Palette.text,
    outlineWidth: 0,
    outlineStyle: 'none' as unknown as 'solid',
  },
  reveal: {
    ...Type.caption,
    fontSize: 9,
    color: Palette.accentDeep,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  formActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  magicBlock: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
    paddingTop: 14,
  },
  magicNote: {
    ...Type.caption,
    fontSize: 8.5,
    lineHeight: 14,
    color: Palette.muted,
    maxWidth: 480,
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  busyText: {
    ...Type.caption,
    fontSize: 9,
    color: Palette.muted,
  },
  footRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    paddingTop: 18,
  },
  footnote: {
    ...Type.caption,
    fontSize: 8.5,
    lineHeight: 14,
    color: Palette.dim,
    maxWidth: 420,
    flex: 1,
    minWidth: 190,
  },
});
