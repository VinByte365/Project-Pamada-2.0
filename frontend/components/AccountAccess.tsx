import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { Palette } from '@/constants/Colors';
import { Type } from '@/constants/Typography';
import { useAppStore } from '@/stores/useAppStore';

type FocusKey = 'signin' | 'signup' | 'account';

/**
 * Persistent, low-noise entry point for the optional cloud account.
 * Local-only is the default; these controls only open the auth sheet.
 */
export function AccountAccess({ style }: { style?: StyleProp<ViewStyle> }) {
  const router = useRouter();
  const signedIn = useAppStore(
    (state) => state.accountStatus === 'synced' && Boolean(state.supabaseAccessToken)
  );
  const [focusKey, setFocusKey] = useState<FocusKey | null>(null);

  const openAuth = (mode?: 'signin' | 'signup') => {
    if (mode) {
      router.push({ pathname: '/auth', params: { mode } });
      return;
    }
    router.push('/auth');
  };

  if (signedIn) {
    return (
      <View style={[styles.row, style]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Account. Cloud session active. Opens account settings."
          onPress={() => openAuth()}
          onFocus={() => setFocusKey('account')}
          onBlur={() => setFocusKey((current) => (current === 'account' ? null : current))}
          style={({ pressed }) => [
            styles.action,
            styles.actionOutline,
            focusKey === 'account' && styles.focused,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.dot} />
          <Text numberOfLines={1} style={styles.actionLabel}>
            Account
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.row, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign in"
        accessibilityHint="Opens the optional cloud account sheet."
        onPress={() => openAuth('signin')}
        onFocus={() => setFocusKey('signin')}
        onBlur={() => setFocusKey((current) => (current === 'signin' ? null : current))}
        style={({ pressed }) => [
          styles.action,
          styles.actionSolid,
          focusKey === 'signin' && styles.focused,
          pressed && styles.pressed,
        ]}
      >
        <Text numberOfLines={1} style={[styles.actionLabel, styles.actionLabelSolid]}>
          Sign in
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create account"
        accessibilityHint="Opens the optional cloud account sheet in create-account mode."
        onPress={() => openAuth('signup')}
        onFocus={() => setFocusKey('signup')}
        onBlur={() => setFocusKey((current) => (current === 'signup' ? null : current))}
        style={({ pressed }) => [
          styles.action,
          styles.actionOutline,
          focusKey === 'signup' && styles.focused,
          pressed && styles.pressed,
        ]}
      >
        <Text numberOfLines={1} style={styles.actionLabel}>
          Create account
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
  action: {
    minHeight: 40,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  actionSolid: {
    backgroundColor: Palette.ink,
    borderColor: Palette.ink,
  },
  actionOutline: {
    backgroundColor: 'rgba(22,26,20,0.015)',
    borderColor: Palette.hairline,
  },
  actionLabel: {
    ...Type.label,
    fontSize: 12,
    fontFamily: 'Satoshi-Medium',
    color: Palette.text,
    flexShrink: 1,
  },
  actionLabelSolid: {
    color: Palette.cream,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Palette.moss,
  },
  focused: {
    borderColor: Palette.accent,
    boxShadow: '0 0 0 3px rgba(196,86,45,0.18)',
  },
  pressed: {
    opacity: 0.6,
  },
});
