import { Href, useRouter } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AloeMark } from '@/components/AloeArt';
import { Palette } from '@/constants/Colors';
import { Radius } from '@/constants/Metrics';
import { Type } from '@/constants/Typography';

const ease = Easing.bezier(0.32, 0.72, 0, 1).factory();

export function useHover() {
  const [hovered, setHovered] = useState(false);
  return {
    hovered,
    handlers: {
      onHoverIn: () => setHovered(true),
      onHoverOut: () => setHovered(false),
    },
  };
}

export function Meta({
  children,
  style,
  tone = 'muted',
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  tone?: 'muted' | 'ink' | 'cream' | 'accent';
}) {
  return (
    <Text
      style={[
        Type.meta,
        tone === 'cream' && { color: Palette.creamMuted },
        tone === 'ink' && { color: Palette.text },
        tone === 'accent' && { color: Palette.accentDeep },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Rule({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.rule, style]} />;
}

export function Stamp({
  label,
  tone = 'outline',
}: {
  label: string;
  tone?: 'outline' | 'ink' | 'accent' | 'moss' | 'cream';
}) {
  const tones = {
    outline: { border: Palette.border, bg: 'transparent', text: Palette.muted },
    ink: { border: Palette.ink, bg: Palette.ink, text: Palette.cream },
    accent: { border: Palette.accent, bg: Palette.accentSoft, text: Palette.accentDeep },
    moss: { border: 'rgba(46,70,51,0.32)', bg: Palette.mossSoft, text: Palette.moss },
    cream: {
      border: 'rgba(241,236,224,0.3)',
      bg: 'rgba(241,236,224,0.08)',
      text: Palette.cream,
    },
  }[tone];

  return (
    <View style={[styles.stamp, { borderColor: tones.border, backgroundColor: tones.bg }]}>
      <Text style={[Type.caption, styles.stampText, { color: tones.text }]}>{label}</Text>
    </View>
  );
}

export function SectionHead({
  index,
  title,
  aside,
  note,
}: {
  index: string;
  title: string;
  aside?: string;
  note?: string;
}) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionMetaRow}>
        <Meta tone="accent">{index}</Meta>
        {aside ? <Meta>{aside}</Meta> : null}
      </View>
      <Rule />
      <Text style={styles.sectionTitle}>{title}</Text>
      {note ? <Text style={styles.sectionNote}>{note}</Text> : null}
    </View>
  );
}

type CardTone = 'paper' | 'ink' | 'accent' | 'bare';

export function Card({
  children,
  tone = 'paper',
  style,
  coreStyle,
}: {
  children: ReactNode;
  tone?: CardTone;
  style?: StyleProp<ViewStyle>;
  coreStyle?: StyleProp<ViewStyle>;
}) {
  const shells: Record<CardTone, ViewStyle> = {
    paper: { backgroundColor: Palette.shell, borderColor: Palette.border },
    ink: { backgroundColor: 'rgba(22,26,20,0.12)', borderColor: 'rgba(22,26,20,0.2)' },
    accent: { backgroundColor: 'rgba(196,86,45,0.16)', borderColor: 'rgba(196,86,45,0.28)' },
    bare: { backgroundColor: 'transparent', borderColor: 'transparent' },
  };
  const cores: Record<CardTone, ViewStyle> = {
    paper: {
      backgroundColor: Palette.surface,
      borderColor: 'rgba(22,26,20,0.06)',
    },
    ink: { backgroundColor: Palette.ink, borderColor: Palette.inkLine },
    accent: { backgroundColor: Palette.accent, borderColor: 'rgba(22,26,20,0.18)' },
    bare: { backgroundColor: 'transparent', borderColor: 'transparent' },
  };

  return (
    <View
      style={[
        styles.cardShell,
        shells[tone],
        tone === 'bare' && styles.cardShellBare,
        style,
      ]}
    >
      <View style={[styles.cardCore, cores[tone], coreStyle]}>{children}</View>
    </View>
  );
}

type ButtonVariant = 'ink' | 'accent' | 'outline' | 'cream';

export function FieldButton({
  label,
  href,
  onPress,
  variant = 'ink',
  disabled = false,
  compact = false,
  style,
  accessibilityLabel,
}: {
  label: string;
  href?: Href;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const router = useRouter();
  const hover = useSharedValue(0);
  const press = useSharedValue(0);

  const handlePress = () => {
    if (disabled) return;
    if (href) {
      router.push(href);
      return;
    }
    onPress?.();
  };

  const shellMotion = useAnimatedStyle(() => ({
    transform: [
      { translateY: -2 * hover.value + 1 * press.value },
      { scale: 1 - 0.012 * press.value },
    ],
  }));
  const chipMotion = useAnimatedStyle(() => ({
    transform: [
      { translateX: 2.5 * hover.value },
      { translateY: -1.5 * hover.value },
    ],
  }));

  const tones: Record<ButtonVariant, { shell: ViewStyle; label: TextStyle; chip: ViewStyle; glyph: TextStyle }> = {
    ink: {
      shell: { backgroundColor: Palette.ink, borderColor: Palette.ink },
      label: { color: Palette.cream },
      chip: { backgroundColor: 'rgba(241,236,224,0.12)' },
      glyph: { color: Palette.cream },
    },
    accent: {
      shell: { backgroundColor: Palette.accent, borderColor: Palette.accent },
      label: { color: '#1B120D' },
      chip: { backgroundColor: 'rgba(22,26,20,0.14)' },
      glyph: { color: '#1B120D' },
    },
    outline: {
      shell: { backgroundColor: 'transparent', borderColor: Palette.hairline },
      label: { color: Palette.text },
      chip: { backgroundColor: Palette.ink },
      glyph: { color: Palette.cream },
    },
    cream: {
      shell: { backgroundColor: Palette.creamLift, borderColor: Palette.creamLift },
      label: { color: Palette.ink },
      chip: { backgroundColor: Palette.ink },
      glyph: { color: Palette.cream },
    },
  };
  const tone = tones[variant];

  const content = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      onHoverIn={() => {
        hover.value = withTiming(1, { duration: 240, easing: ease });
      }}
      onHoverOut={() => {
        hover.value = withTiming(0, { duration: 320, easing: ease });
      }}
      onPressIn={() => {
        press.value = withTiming(1, { duration: 140, easing: ease });
      }}
      onPressOut={() => {
        press.value = withSpring(0, { damping: 18, stiffness: 240 });
      }}
      style={[styles.buttonPress, compact && styles.buttonPressCompact]}
    >
      <Text
        numberOfLines={1}
        style={[styles.buttonLabel, compact && styles.buttonLabelCompact, tone.label]}
      >
        {label}
      </Text>
      <Animated.View
        style={[
          styles.buttonChip,
          compact && styles.buttonChipCompact,
          tone.chip,
          chipMotion,
        ]}
      >
        <Text style={[styles.buttonGlyph, tone.glyph]}>↗</Text>
      </Animated.View>
    </Pressable>
  );

  return (
    <Animated.View
      style={[
        styles.buttonShell,
        tone.shell,
        compact && styles.buttonShellCompact,
        disabled && styles.disabled,
        shellMotion,
        style,
      ]}
    >
      {content}
    </Animated.View>
  );
}

export function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 240, easing: ease });
  }, [progress, value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(22,26,20,0.16)', Palette.moss]
    ),
  }));
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: 2 + progress.value * 18 }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      onPress={() => onChange(!value)}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.knob, knobStyle]} />
      </Animated.View>
    </Pressable>
  );
}

export function Stat({
  value,
  label,
  note,
  tone = 'ink',
  align = 'left',
}: {
  value: string;
  label: string;
  note?: string;
  tone?: 'ink' | 'cream' | 'accent';
  align?: 'left' | 'right';
}) {
  const color =
    tone === 'cream' ? Palette.cream : tone === 'accent' ? Palette.accent : Palette.text;
  const noteColor =
    tone === 'cream' ? Palette.creamMuted : tone === 'accent' ? Palette.accentDeep : Palette.muted;

  return (
    <View style={{ gap: 5, alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      <Meta tone={tone === 'cream' ? 'cream' : 'muted'}>{label}</Meta>
      <Text style={[Type.numeral, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {note ? (
        <Text style={[Type.labelSmall, { color: noteColor }]} numberOfLines={1}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

export function LedgerRow({
  index,
  title,
  note,
  value,
  href,
  onPress,
  last = false,
}: {
  index: string;
  title: string;
  note: string;
  value: string;
  href?: Href;
  onPress?: () => void;
  last?: boolean;
}) {
  const router = useRouter();
  const hover = useSharedValue(0);
  const hoverLayer = useAnimatedStyle(() => ({ opacity: hover.value }));
  const arrowMotion = useAnimatedStyle(() => ({
    transform: [
      { translateX: 3 * hover.value },
      { translateY: -2 * hover.value },
    ],
  }));

  const body = (
    <Pressable
      accessibilityRole={href || onPress ? 'button' : undefined}
      accessibilityLabel={`${title}. ${note}. ${value}`}
      onPress={href ? () => router.push(href) : onPress}
      onHoverIn={() => {
        hover.value = withTiming(1, { duration: 220, easing: ease });
      }}
      onHoverOut={() => {
        hover.value = withTiming(0, { duration: 280, easing: ease });
      }}
      style={[styles.ledgerRow, last && styles.ledgerRowLast]}
    >
      <Animated.View pointerEvents="none" style={[styles.ledgerHover, hoverLayer]} />
      <Text style={styles.ledgerIndex}>{index}</Text>
      <View style={styles.ledgerText}>
        <Text style={styles.ledgerTitle}>{title}</Text>
        <Text style={styles.ledgerNote}>{note}</Text>
      </View>
      <Text style={styles.ledgerValue}>{value}</Text>
      {href || onPress ? (
        <Animated.View style={[styles.ledgerArrow, arrowMotion]}>
          <Text style={styles.ledgerGlyph}>↗</Text>
        </Animated.View>
      ) : (
        <View style={styles.ledgerArrow}>
          <View style={styles.ledgerDot} />
        </View>
      )}
    </Pressable>
  );

  return body;
}

export function ScreenFooter() {
  return (
    <View style={styles.footer}>
      <Rule />
      <View style={styles.footerRow}>
        <View style={styles.footerBrand}>
          <AloeMark size={24} color={Palette.moss} />
          <View style={{ gap: 2 }}>
            <Meta tone="ink">FarmSystem</Meta>
            <Meta>Group 03 · BSIT-NS-3A</Meta>
          </View>
        </View>
        <Meta>© 2026</Meta>
      </View>
      <Text style={styles.footerLine}>
        Local when offline. Intelligent on the device. Connected through the cloud.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rule: {
    height: 1,
    backgroundColor: Palette.border,
  },
  stamp: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.tag,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  stampText: {
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 1.2,
  },
  sectionHead: {
    gap: 12,
  },
  sectionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    ...Type.title,
    maxWidth: 560,
  },
  sectionNote: {
    ...Type.body,
    maxWidth: 520,
  },
  cardShell: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: 5,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)',
  },
  cardShellBare: {
    padding: 0,
    borderWidth: 0,
  },
  cardCore: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.cardInner,
    padding: 20,
  },
  buttonShell: {
    alignSelf: 'flex-start',
    flexShrink: 0,
    flexGrow: 0,
    borderRadius: Radius.pill,
    borderWidth: 1,
    boxShadow: '0 14px 28px -18px rgba(22,26,20,0.55)',
  },
  buttonShellCompact: {
    borderRadius: Radius.pill,
  },
  buttonPress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 9,
    paddingLeft: 21,
    paddingRight: 7,
  },
  buttonPressCompact: {
    paddingVertical: 6,
    paddingLeft: 16,
    paddingRight: 5,
    gap: 10,
  },
  buttonLabel: {
    ...Type.label,
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
    flexShrink: 0,
  },
  buttonLabelCompact: {
    fontSize: 12,
    fontFamily: 'Satoshi-Medium',
  },
  buttonChip: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonChipCompact: {
    width: 26,
    height: 26,
  },
  buttonGlyph: {
    fontFamily: 'CabinetGrotesk-Bold',
    fontSize: 14,
    lineHeight: 16,
    marginTop: -1,
  },
  disabled: {
    opacity: 0.36,
  },
  track: {
    width: 44,
    height: 26,
    borderRadius: 999,
    justifyContent: 'center',
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: Palette.creamLift,
    boxShadow: '0 2px 5px rgba(22,26,20,0.25)',
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 17,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
    overflow: 'hidden',
  },
  ledgerRowLast: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  ledgerHover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(22,26,20,0.035)',
  },
  ledgerIndex: {
    ...Type.caption,
    width: 24,
    color: Palette.dim,
  },
  ledgerText: {
    flex: 1,
    gap: 3,
  },
  ledgerTitle: {
    ...Type.subtitle,
    fontSize: 19,
    lineHeight: 23,
  },
  ledgerNote: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 17,
    color: Palette.muted,
  },
  ledgerValue: {
    ...Type.monoLarge,
    fontSize: 12,
    color: Palette.muted,
  },
  ledgerArrow: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerGlyph: {
    fontFamily: 'CabinetGrotesk-Bold',
    fontSize: 12,
    color: Palette.text,
  },
  ledgerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.sage,
  },
  footer: {
    gap: 14,
    paddingTop: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerLine: {
    ...Type.body,
    fontSize: 12,
    lineHeight: 18,
    color: Palette.muted,
    maxWidth: 420,
  },
});
