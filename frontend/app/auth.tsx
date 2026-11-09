import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  Card,
  FieldButton,
  Meta,
  SectionHead,
  Stamp,
} from '@/components/FieldUI';
import { ScreenShell } from '@/components/ScreenShell';
import { Palette } from '@/constants/Colors';
import { Type } from '@/constants/Typography';
import {
  signInWithEmail,
  signInWithMagicLink,
  signOut,
  signUpWithEmail,
} from '@/lib/auth/authService';
import { isSupabaseConfigured } from '@/lib/auth/supabase';
import { useAppStore } from '@/stores/useAppStore';

type PendingAction = 'signin' | 'signup' | 'magic' | 'signout' | null;

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
  const accountStatus = useAppStore((state) => state.accountStatus);
  const supabaseAccessToken = useAppStore((state) => state.supabaseAccessToken);
  const setSupabaseAccessToken = useAppStore(
    (state) => state.setSupabaseAccessToken
  );
  const localProfileId = useAppStore((state) => state.localProfileId);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const busy = pending !== null;
  const signedIn = accountStatus === 'synced' && Boolean(supabaseAccessToken);

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

  return (
    <ScreenShell
      eyebrow="Account / Optional"
      title="The cloud, on request."
      description="Signing in never gates the field tools. This page only adds a Supabase identity for backup, multi-device access and community. The ledger keeps working from local records."
      index="auth / optional"
      back
    >
      <View style={styles.notice}>
        <View style={styles.noticeBar} />
        <View style={styles.noticeCopy}>
          <Text style={styles.noticeTitle}>Local-only is still the default.</Text>
          <Text style={styles.noticeBody}>
            The scanner, farms, plants and records need no account. An account layers
            sync on top; it does not replace the local ledger.
          </Text>
        </View>
        <Stamp label="Optional" tone="moss" />
      </View>

      <Card tone="ink">
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
        </View>

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
            <Text style={styles.signOutNote}>
              Signing out keeps every local record on the device.
            </Text>
          </View>
        ) : null}
      </Card>

      <View style={styles.section}>
        <SectionHead
          index="01 / Access"
          title={signedIn ? 'One session at a time.' : 'One identity, when you want it.'}
          aside={signedIn ? 'Session active' : 'Email access'}
          note={
            signedIn
              ? 'The active session is shown above. Sign out before using a different account.'
              : 'Use the same email and password for either path. Creating an account also asks Supabase to send a confirmation email when that setting is enabled.'
          }
        />

        {feedback ? <AuthNotice tone={feedback.tone} message={feedback.message} /> : null}

        {!isSupabaseConfigured ? (
          <AuthNotice
            tone="error"
            message="Supabase is not configured in this build. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable cloud sign-in. Local-only use is unaffected."
          />
        ) : null}

        {signedIn ? (
          <Card>
            <View style={styles.linkedRow}>
              <View style={styles.linkedCopy}>
                <Meta tone="accent">Link established</Meta>
                <Text style={styles.linkedTitle}>This device is signed in.</Text>
                <Text style={styles.linkedBody}>
                  Use the sign-out control above to return to local-only mode. Signing
                  out does not delete farms, plants, scans or drafts on this device.
                </Text>
              </View>
              <Stamp label="Cloud on" tone="moss" />
            </View>
          </Card>
        ) : (
          <Card>
            <View style={styles.formHead}>
              <View style={styles.formHeadCopy}>
                <Meta tone="accent">Email & password</Meta>
                <Text style={styles.formTitle}>Sign in or create an account.</Text>
              </View>
              <Stamp
                label={isSupabaseConfigured ? 'Cloud optional' : 'Not configured'}
                tone={isSupabaseConfigured ? 'outline' : 'accent'}
              />
            </View>

            <Text style={styles.formIntro}>
              Nothing uploads just by signing in. Records move only when the sync queue
              runs, and the local copy remains authoritative.
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
                  <Text style={styles.fieldHint}>Six characters minimum</Text>
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
                    autoComplete="current-password"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={() => void handleSignIn()}
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
                label={pending === 'signin' ? 'Signing in…' : 'Sign in'}
                onPress={() => void handleSignIn()}
                disabled={busy || !isSupabaseConfigured}
                variant="ink"
              />
              <FieldButton
                label={pending === 'signup' ? 'Creating…' : 'Create account'}
                onPress={() => void handleSignUp()}
                disabled={busy || !isSupabaseConfigured}
                variant="outline"
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
                Magic links need Supabase email delivery and a redirect URL that returns
                to this app. Email and password work without that setup.
              </Text>
            </View>

            {pending ? (
              <View style={styles.busyRow} accessibilityLiveRegion="polite">
                <ActivityIndicator size="small" color={Palette.accent} />
                <Text style={styles.busyText}>{busyLabels[pending]}</Text>
              </View>
            ) : null}
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <SectionHead
          index="02 / Boundaries"
          title="What connecting changes."
          aside="Nothing hidden"
        />

        <View style={styles.benefits}>
          {[
            [
              '01',
              'Cloud backup',
              'A second copy of farms, plants and scans, written when sync runs.',
            ],
            [
              '02',
              'Multi-device ledger',
              'Open the same records from another phone after signing in.',
            ],
            [
              '03',
              'Community',
              'Publishing and replies require an account. Reading stays optional.',
            ],
          ].map(([id, title, note]) => (
            <View key={id} style={styles.benefitRow}>
              <Text style={styles.benefitIndex}>{id}</Text>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.benefitTitle}>{title}</Text>
                <Text style={styles.benefitNote}>{note}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.unchanged}>
          <View style={styles.unchangedCopy}>
            <Meta tone="accent">Unchanged</Meta>
            <Text style={styles.unchangedTitle}>The scanner never asks for a login.</Text>
            <Text style={styles.unchangedBody}>
              Diagnosis, maturity and grading continue to work offline. Auth adds an
              identity layer above the ledger; it does not replace local records.
            </Text>
          </View>
          <FieldButton
            label="Offline identity"
            href="/modal"
            variant="outline"
            compact
          />
        </View>

        <Text style={styles.footnote}>
          This screen establishes a Supabase session only. Automatic upload waits for
          the mobile sync queue, so local records are untouched until sync is built.
        </Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
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
    minWidth: 200,
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
    fontSize: 26,
    lineHeight: 29,
    color: Palette.cream,
  },
  statusBody: {
    ...Type.body,
    fontSize: 13.5,
    lineHeight: 21,
    color: Palette.creamMuted,
    maxWidth: 520,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: Palette.inkLine,
    paddingTop: 16,
    marginTop: 4,
  },
  statusCell: {
    flexGrow: 1,
    flexBasis: 130,
    gap: 4,
  },
  statusValue: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
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
    paddingTop: 16,
    marginTop: 4,
  },
  signOutNote: {
    ...Type.caption,
    fontSize: 8.5,
    lineHeight: 14,
    color: Palette.creamMuted,
    flex: 1,
    minWidth: 160,
  },
  section: {
    gap: 22,
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
  formHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    flexWrap: 'wrap',
  },
  formHeadCopy: {
    flex: 1,
    minWidth: 200,
    gap: 4,
  },
  formTitle: {
    ...Type.subtitle,
    fontSize: 23,
    lineHeight: 27,
  },
  formIntro: {
    ...Type.body,
    fontSize: 13,
    lineHeight: 20,
    color: Palette.muted,
    maxWidth: 480,
    marginTop: 2,
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
    marginTop: 2,
  },
  magicBlock: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
    paddingTop: 14,
    marginTop: 2,
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
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    flexWrap: 'wrap',
  },
  linkedCopy: {
    flex: 1,
    minWidth: 220,
    gap: 4,
  },
  linkedTitle: {
    ...Type.subtitle,
    fontSize: 22,
  },
  linkedBody: {
    ...Type.body,
    fontSize: 13,
    lineHeight: 20,
    color: Palette.muted,
    maxWidth: 480,
  },
  benefits: {
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  benefitRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  benefitIndex: {
    ...Type.caption,
    color: Palette.accent,
    width: 24,
    paddingTop: 2,
  },
  benefitTitle: {
    ...Type.label,
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
  },
  benefitNote: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.muted,
  },
  unchanged: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    paddingTop: 20,
  },
  unchangedCopy: {
    flex: 1,
    minWidth: 220,
    gap: 6,
  },
  unchangedTitle: {
    ...Type.title,
    fontSize: 24,
    lineHeight: 28,
  },
  unchangedBody: {
    ...Type.body,
    fontSize: 13,
    lineHeight: 20,
    color: Palette.muted,
    maxWidth: 480,
  },
  footnote: {
    ...Type.caption,
    fontSize: 8.5,
    lineHeight: 14,
    color: Palette.dim,
    maxWidth: 520,
  },
});
