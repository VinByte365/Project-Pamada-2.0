import { useMemo, useState } from 'react';
import { Href, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ColorValue,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { Entry } from '@/components/Entry';
import { Eyebrow } from '@/components/Eyebrow';
import { Palette } from '@/constants/Colors';
import { Radius } from '@/constants/Metrics';
import { Type } from '@/constants/Typography';

const ease = Easing.bezier(0.32, 0.72, 0, 1).factory();

const noise = require('../../assets/images/noise.png') as number;

function useHover() {
  const [hovered, setHovered] = useState(false);
  return {
    hovered,
    handlers: {
      onHoverIn: () => setHovered(true),
      onHoverOut: () => setHovered(false),
    },
  };
}

function GlowOrb({
  colors,
  size,
  top,
  left,
  right,
  bottom,
}: {
  colors: readonly [ColorValue, ColorValue];
  size: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={colors}
      start={{ x: 0.3, y: 0.2 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.glowOrb,
        { width: size, height: size, borderRadius: size / 2, top, left, right, bottom },
      ]}
    />
  );
}

function MeshField() {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#06070B', Palette.background]}
        style={StyleSheet.absoluteFill}
      />
      <GlowOrb
        colors={['rgba(90,226,161,0.20)', 'rgba(5,5,5,0)'] as const}
        size={Math.max(width, height) * 0.78}
        left={-width * 0.28}
        top={-120}
      />
      <GlowOrb
        colors={['rgba(139,92,246,0.18)', 'rgba(5,5,5,0)'] as const}
        size={Math.max(width, height) * 0.9}
        right={-width * 0.35}
        bottom={-height * 0.22}
      />
      <Animated.Image source={noise} resizeMode="cover" style={styles.grain} />
    </View>
  );
}

function Reveal({
  scrollY,
  children,
  style,
  baseOffset,
}: {
  scrollY: SharedValue<number>;
  children: React.ReactNode;
  style?: object;
  baseOffset?: SharedValue<number>;
}) {
  const { height } = useWindowDimensions();
  const windowH = useSharedValue(height);
  const offset = useSharedValue(0);
  const onLayout = (e: LayoutChangeEvent) => {
    offset.value = e.nativeEvent.layout.y;
  };
  const animatedStyle = useAnimatedStyle(() => {
    const top = offset.value + (baseOffset?.value ?? 0);
    const enter = (scrollY.value + windowH.value * 0.9 - top) / 220;
    const enterP = Math.min(Math.max(enter, 0), 1);
    const leave = (scrollY.value - top) / 220;
    const leaveP = Math.min(Math.max(leave, 0), 1);
    const p = ease(enterP);
    return {
      opacity: p * (1 - leaveP * 0.85),
      transform: [
        { translateY: interpolate(p, [0, 1], [20, 0]) },
        { scale: interpolate(p, [0, 1], [0.975, 1]) },
      ],
    };
  });
  return (
    <Animated.View style={[animatedStyle, style]} onLayout={onLayout}>
      {children}
    </Animated.View>
  );
}

function ScrubWord({
  scrollY,
  windowH,
  offset,
  word,
  index,
  base = 0.08,
}: {
  scrollY: SharedValue<number>;
  windowH: SharedValue<number>;
  offset: SharedValue<number>;
  word: string;
  index: number;
  base?: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const reveal = scrollY.value - offset.value + windowH.value * 0.85 - index * 30;
    const p = reveal / 40;
    return {
      opacity: base + (1 - base) * Math.min(Math.max(p, 0), 1),
    };
  });
  return (
    <Animated.Text style={[styles.scrubWord, animatedStyle]}>
      {word}{' '}
    </Animated.Text>
  );
}

function Scrub({
  scrollY,
  text,
  base = 0.08,
}: {
  scrollY: SharedValue<number>;
  text: string;
  base?: number;
}) {
  const { height } = useWindowDimensions();
  const windowH = useSharedValue(height);
  const offset = useSharedValue(0);
  const onLayout = (e: LayoutChangeEvent) => {
    offset.value = e.nativeEvent.layout.y;
  };
  const words = useMemo(() => text.split(' '), [text]);
  return (
    <Animated.View style={styles.scrubWrap} onLayout={onLayout}>
      {words.map((word, i) => (
        <ScrubWord
          key={`${word}-${i}`}
          scrollY={scrollY}
          windowH={windowH}
          offset={offset}
          word={word}
          index={i}
          base={base}
        />
      ))}
    </Animated.View>
  );
}

function PillButton({
  href,
  label,
  variant = 'primary',
}: {
  href: Href;
  label: string;
  variant?: 'primary' | 'ghost';
}) {
  const { hovered, handlers } = useHover();
  return (
    <Link href={href} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.pill,
          variant === 'primary' ? styles.pillPrimary : styles.pillGhost,
          hovered && styles.pillHover,
          pressed && styles.pressed,
        ]}
        {...handlers}
      >
        <Text
          style={[
            styles.pillLabel,
            variant === 'primary' ? styles.pillLabelPrimary : styles.pillLabelGhost,
          ]}
        >
          {label}
        </Text>
        <View
          style={[
            styles.pillChip,
            variant === 'primary' ? styles.pillChipPrimary : styles.pillChipGhost,
          ]}
        >
          <Text
            style={[
              styles.pillChipGlyph,
              variant === 'primary' ? styles.pillChipGlyphPrimary : styles.pillChipGlyphGhost,
            ]}
          >
            ↗
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

type Unit = {
  id: string;
  title: string;
  value: string;
  note: string;
  href?: Href;
  wide?: boolean;
  accent?: boolean;
};

function GlassCard({
  children,
  width,
  minHeight,
  hovered,
  accent,
}: {
  children: React.ReactNode;
  width: number;
  minHeight: number;
  hovered: boolean;
  accent?: boolean;
}) {
  return (
    <View
      style={[
        styles.bezel,
        { width, minHeight },
        accent && styles.bezelAccent,
        hovered && styles.bezelHover,
      ]}
    >
      <View style={[styles.glassCore, accent && styles.glassCoreAccent]}>
        {children}
      </View>
    </View>
  );
}

function ModuleCell({
  unit,
  scrollY,
  baseOffset,
  width,
  columns,
}: {
  unit: Unit;
  scrollY: SharedValue<number>;
  baseOffset: SharedValue<number>;
  width: number;
  columns: number;
}) {
  const { hovered, handlers } = useHover();
  const content = (
    <GlassCard width={width} minHeight={unit.wide ? 168 : 188} hovered={hovered} accent={unit.accent}>
      <View style={styles.unitHead}>
        <Text style={styles.unitCode}>{unit.id}</Text>
        <Text style={[styles.unitTitle, unit.accent && styles.unitTitleAccent]}>
          {unit.title}
        </Text>
      </View>
      <Text style={[styles.unitValue, unit.wide && styles.unitValueWide]}>{unit.value}</Text>
      <View style={styles.unitFoot}>
        <Text style={[styles.unitNote, unit.accent && styles.unitNoteAccent]}>{unit.note}</Text>
        {unit.href ? <Text style={styles.unitArrow}>↗</Text> : null}
      </View>
    </GlassCard>
  );
  return (
    <Reveal
      scrollY={scrollY}
      baseOffset={baseOffset}
      style={{ width, minHeight: unit.wide ? 168 : 188 }}
    >
      {unit.href ? (
        <Link href={unit.href} asChild>
          <Pressable {...handlers}>{content}</Pressable>
        </Link>
      ) : (
        <Pressable {...handlers}>{content}</Pressable>
      )}
    </Reveal>
  );
}

const units: Unit[] = [
  {
    id: '01',
    title: 'Plants',
    value: '0',
    note: 'diagnosis · maturity · grading',
    href: '/plants',
    wide: true,
  },
  {
    id: '02',
    title: 'Farms',
    value: '0',
    note: 'registered plots',
    href: '/farms',
  },
  {
    id: '03',
    title: 'Sensors',
    value: '0',
    note: 'soil · n · p · k · ph',
    href: '/sensors',
  },
  {
    id: '04',
    title: 'Reports',
    value: '0',
    note: 'grades & profitability',
    href: '/reports',
    wide: true,
  },
  {
    id: '05',
    title: 'Sync',
    value: 'local',
    note: 'offline-first by design',
    accent: true,
  },
];

const steps = [
  {
    id: '01',
    title: 'Scan',
    note: 'one frame is all it needs',
    detail: 'Point the camera at a single leaf — the engine reads it on-device.',
  },
  {
    id: '02',
    title: 'Diagnose',
    note: 'resolved locally',
    detail: 'Disease, maturity and grade are computed right here. No upload.',
  },
  {
    id: '03',
    title: 'Act',
    note: 'trusted next steps',
    detail: 'Clear recommendations for soil, harvest and grading when you decide.',
  },
];

function SectionHead({ index, title }: { index: string; title: string }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionPill}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionMeta}>{index}</Text>
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const columns = width >= 760 ? 2 : 1;
  const columnW = width - 40;
  const halfW = (columnW - 14) / 2;
  const cellWidth = (wide: boolean) => (columns === 1 ? columnW : wide ? columnW : halfW);

  const scrollY = useSharedValue(0);
  const unitsOffset = useSharedValue(0);
  const ctaBlock = useHover();
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  return (
    <View style={styles.screen}>
      <MeshField />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Entry delay={40}>
          <View style={styles.hero}>
            <Eyebrow label="FarmSystem · Group 03" />
            <Text style={styles.heroTitle}>
              Aloe intelligence,{' '}
              <Text style={styles.heroAccent}>in your pocket.</Text>
            </Text>
            <Text style={styles.heroSub}>
              Diagnose, grade and plan your crop — entirely on this device, even
              when the network drops out.
            </Text>
          </View>
        </Entry>

        <Entry delay={170}>
          <View style={styles.ctaRow}>
            <PillButton href="/scan/diagnosis" label="Scan a leaf" />
            <PillButton href="/farms" label="Explore farms" variant="ghost" />
          </View>
        </Entry>

        <Entry delay={60}>
          <SectionHead index="01 / modules" title="Your system at a glance" />
        </Entry>

        <View
          style={styles.units}
          onLayout={(e) => {
            unitsOffset.value = e.nativeEvent.layout.y;
          }}
        >
          {units.map((unit) => (
            <ModuleCell
              key={unit.id}
              unit={unit}
              scrollY={scrollY}
              baseOffset={unitsOffset}
              width={cellWidth(unit.wide ?? false)}
              columns={columns}
            />
          ))}
        </View>

        <Entry delay={60}>
          <SectionHead index="02 / procedure" title="Three steps, zero drift" />
        </Entry>

        <View style={styles.steps}>
          {steps.map((step) => (
            <Reveal key={step.id} scrollY={scrollY} style={styles.stepSlot}>
              <View style={styles.stepCard}>
                <View style={styles.stepHead}>
                  <View style={styles.stepChip}>
                    <Text style={styles.stepId}>{step.id}</Text>
                  </View>
                  <Text style={styles.stepNote}>{step.note}</Text>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDetail}>{step.detail}</Text>
              </View>
            </Reveal>
          ))}
        </View>

        <Entry delay={60}>
          <SectionHead index="03 / doctrine" title="Why we build this" />
        </Entry>

        <Reveal scrollY={scrollY} style={styles.manifestoCard}>
          <Scrub
            scrollY={scrollY}
            text="A connected toolkit that respects unconnected farms — everything that matters runs and lives on this device, ready for the moments when the network does not."
          />
        </Reveal>

        <Entry delay={80}>
          <Link href="/scan/diagnosis" asChild>
            <Pressable
              style={({ pressed }) => [pressed && styles.pressed]}
              onHoverIn={ctaBlock.handlers.onHoverIn}
              onHoverOut={ctaBlock.handlers.onHoverOut}
            >
              <LinearGradient
                colors={['#5AE2A1', '#2F9E63']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.ctaBlock, ctaBlock.hovered && styles.ctaBlockHover]}
              >
                <View style={styles.ctaBlockHead}>
                  <View style={styles.ctaBlockText}>
                    <Text style={styles.ctaBlockTitle}>Start your first scan</Text>
                    <Text style={styles.ctaBlockSub}>
                      everything stays on this device
                    </Text>
                  </View>
                  <View style={styles.ctaBlockChip}>
                    <Text style={styles.ctaBlockGlyph}>↗</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Link>
        </Entry>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2026 FarmSystem · Group 03 · Built for offline farms
          </Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  glowOrb: {
    position: 'absolute',
  },
  grain: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },
  content: {
    paddingTop: 88,
    paddingHorizontal: 20,
    paddingBottom: 130,
    gap: 30,
  },
  hero: {
    gap: 18,
  },
  heroTitle: {
    ...Type.display,
    fontSize: 50,
    lineHeight: 52,
    letterSpacing: -1.8,
  },
  heroAccent: {
    color: Palette.accent,
  },
  heroSub: {
    ...Type.body,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 330,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radius.pill,
    paddingVertical: 12,
    paddingLeft: 20,
    paddingRight: 8,
  },
  pillPrimary: {
    backgroundColor: Palette.accent,
  },
  pillGhost: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  pillHover: {
    transform: [{ translateY: -2 }],
  },
  pressed: {
    opacity: 0.88,
  },
  pillLabel: {
    ...Type.label,
    fontSize: 15,
  },
  pillLabelPrimary: {
    color: Palette.accentContrast,
    fontFamily: 'Satoshi-Bold',
  },
  pillLabelGhost: {
    color: Palette.text,
  },
  pillChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillChipPrimary: {
    backgroundColor: Palette.accentContrast,
  },
  pillChipGhost: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pillChipGlyph: {
    fontSize: 14,
  },
  pillChipGlyphPrimary: {
    color: Palette.accent,
  },
  pillChipGlyphGhost: {
    color: Palette.text,
  },
  sectionHead: {
    gap: 10,
  },
  sectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  sectionDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Palette.accent,
  },
  sectionMeta: {
    ...Type.caption,
    color: Palette.muted,
  },
  sectionTitle: {
    ...Type.title,
    fontSize: 27,
    lineHeight: 32,
  },
  units: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  bezel: {
    borderRadius: Radius.glass,
    padding: 7,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Palette.border,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
  },
  bezelHover: {
    transform: [{ translateY: -3 }],
  },
  bezelAccent: {
    borderColor: 'rgba(139,92,246,0.35)',
    backgroundColor: 'rgba(139,92,246,0.06)',
  },
  glassCore: {
    flex: 1,
    borderRadius: Radius.glassInner,
    backgroundColor: 'rgba(13,15,22,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 18,
    gap: 14,
    justifyContent: 'space-between',
  },
  glassCoreAccent: {
    backgroundColor: 'rgba(20,16,40,0.72)',
  },
  unitHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  unitCode: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 10,
    letterSpacing: 1.6,
    color: Palette.fine,
  },
  unitTitle: {
    ...Type.label,
    fontSize: 14,
    color: Palette.muted,
  },
  unitTitleAccent: {
    color: Palette.accent,
  },
  unitValue: {
    fontFamily: 'CabinetGrotesk-Bold',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1,
    color: Palette.text,
  },
  unitValueWide: {
    fontSize: 40,
    lineHeight: 46,
  },
  unitFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitNote: {
    ...Type.caption,
    color: Palette.dim,
  },
  unitNoteAccent: {
    color: Palette.accentAlt,
  },
  unitArrow: {
    color: Palette.dim,
    fontSize: 13,
  },
  steps: {
    gap: 12,
  },
  stepSlot: {
    width: '100%',
  },
  stepCard: {
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 22,
    gap: 10,
  },
  stepHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(90,226,161,0.3)',
  },
  stepId: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: Palette.accent,
  },
  stepNote: {
    ...Type.caption,
    color: Palette.dim,
  },
  stepTitle: {
    ...Type.displaySmall,
    fontSize: 28,
    lineHeight: 32,
  },
  stepDetail: {
    ...Type.body,
    fontSize: 14,
    lineHeight: 21,
    color: Palette.body,
  },
  manifestoCard: {
    borderRadius: Radius.glass,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  scrubWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  scrubWord: {
    fontFamily: 'CabinetGrotesk-Bold',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.8,
    color: Palette.text,
  },
  ctaBlock: {
    borderRadius: Radius.glass,
    padding: 24,
    overflow: 'hidden',
  },
  ctaBlockHover: {
    transform: [{ translateY: -3 }],
  },
  ctaBlockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  ctaBlockText: {
    gap: 6,
  },
  ctaBlockTitle: {
    fontFamily: 'CabinetGrotesk-Black',
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -1,
    color: Palette.accentContrast,
  },
  ctaBlockSub: {
    ...Type.caption,
    color: 'rgba(5,5,5,0.6)',
  },
  ctaBlockChip: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,5,5,0.14)',
  },
  ctaBlockGlyph: {
    fontSize: 18,
    color: Palette.accentContrast,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 8,
  },
  footerText: {
    ...Type.caption,
    fontSize: 9,
    letterSpacing: 1.3,
    color: Palette.dim,
  },
});