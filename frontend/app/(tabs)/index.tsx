import { Href } from 'expo-router';
import {
  LayoutChangeEvent,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AloeMark, AloeRosette } from '@/components/AloeArt';
import { Entry } from '@/components/Entry';
import { Eyebrow } from '@/components/Eyebrow';
import {
  FieldButton,
  LedgerRow,
  Meta,
  Rule,
  ScreenFooter,
  SectionHead,
  Stamp,
  Stat,
} from '@/components/FieldUI';
import { PaperBackground } from '@/components/PaperBackground';
import { Palette } from '@/constants/Colors';
import { Layout } from '@/constants/Metrics';
import { Type } from '@/constants/Typography';

const ease = Easing.bezier(0.32, 0.72, 0, 1).factory();

function Reveal({
  scrollY,
  children,
  style,
}: {
  scrollY: SharedValue<number>;
  children: React.ReactNode;
  style?: object;
}) {
  const { height } = useWindowDimensions();
  const windowH = useSharedValue(height);
  const offset = useSharedValue(0);
  const onLayout = (e: LayoutChangeEvent) => {
    offset.value = e.nativeEvent.layout.y;
  };
  const animatedStyle = useAnimatedStyle(() => {
    const top = offset.value;
    const enter = (scrollY.value + windowH.value * 0.94 - top) / 260;
    const enterP = Math.min(Math.max(enter, 0), 1);
    const p = ease(enterP);
    return {
      opacity: p,
      transform: [
        { translateY: interpolate(p, [0, 1], [26, 0]) },
        { scale: interpolate(p, [0, 1], [0.985, 1]) },
      ],
    };
  });
  return (
    <Animated.View style={[animatedStyle, style]} onLayout={onLayout}>
      {children}
    </Animated.View>
  );
}

function SpecimenPlate({ wide }: { wide: boolean }) {
  return (
    <View style={[styles.plate, wide ? styles.plateWide : styles.plateNarrow]}>
      <View style={styles.plateAccentLine} />
      <View style={styles.plateHead}>
        <Meta tone="cream">Specimen / 004</Meta>
        <Stamp label="Unscanned" tone="cream" />
      </View>

      <View style={styles.plateArt}>
        <AloeRosette height={wide ? 216 : 206} tone="ink" />
        <View pointerEvents="none" style={styles.measure}>
          {[
            { label: '0', top: 0 },
            { label: '20', top: 52 },
            { label: '40', top: 104 },
          ].map((tick) => (
            <View key={tick.label} style={[styles.measureTick, { top: tick.top }]}>
              <Text style={styles.measureLabel}>{tick.label}</Text>
              <View style={styles.measureRule} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.plateFoot}>
        <View style={{ gap: 3 }}>
          <Meta tone="cream">Aloe barbadensis</Meta>
          <Text style={styles.plateName}>Miller</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 3 }}>
          <Text style={styles.plateHeight}>42 cm</Text>
          <Meta tone="cream">Stage 02 / 05</Meta>
        </View>
      </View>
    </View>
  );
}

const modules: {
  id: string;
  title: string;
  note: string;
  value: string;
  href?: Href;
}[] = [
  {
    id: '01',
    title: 'Plants',
    note: 'Disease, maturity and grade history',
    value: '0',
    href: '/plants',
  },
  { id: '02', title: 'Farms', note: 'Plots, acreage and planting records', value: '0', href: '/farms' },
  {
    id: '03',
    title: 'Sensors',
    note: 'Moisture, N-P-K, EC and pH from the node',
    value: '—',
    href: '/sensors',
  },
  {
    id: '04',
    title: 'Reports',
    note: 'Yield, grade mix and return on investment',
    value: '—',
    href: '/reports',
  },
  { id: '05', title: 'Sync', note: 'A quiet queue for when signal returns', value: 'Local' },
];

const steps = [
  {
    id: '01',
    title: 'Scan',
    detail: 'Hold one leaf inside the frame. The camera reads what the eye cannot.',
    tag: 'ON-DEVICE',
  },
  {
    id: '02',
    title: 'Diagnose',
    detail: 'Disease, maturity and grade resolve locally. Nothing is uploaded.',
    tag: 'OFFLINE',
  },
  {
    id: '03',
    title: 'Act',
    detail: 'Harvest, treat or grade on evidence — not on a guess.',
    tag: 'FIELD-READY',
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 860;
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  return (
    <View style={styles.screen}>
      <PaperBackground />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 14, paddingBottom: Layout.tabBarInset + insets.bottom },
        ]}
      >
        <View style={styles.frame}>
          <View style={styles.masthead}>
            <View style={styles.brand}>
              <AloeMark size={27} color={Palette.moss} />
              <View style={{ gap: 2 }}>
                <Text style={styles.brandWord}>FARMSYSTEM</Text>
                <Meta>Aloe ledger · Group 03</Meta>
              </View>
            </View>
            <View style={styles.status}>
              <View style={styles.statusDot} />
              <Meta tone="ink">Local only</Meta>
            </View>
          </View>

          <Rule style={{ marginTop: 12 }} />

          <View style={[styles.hero, wide && styles.heroWide]}>
            <Entry delay={30} style={styles.heroCopy}>
              <Eyebrow label="Aloe barbadensis miller · 2026" />
              <Text style={[styles.heroTitle, wide && styles.heroTitleWide]}>
                Read the leaf.{'\n'}Keep the <Text style={styles.heroAccent}>record.</Text>
              </Text>
              <Text style={styles.heroBody}>
                A field companion for aloe vera that works where the signal does not.
                Diagnose disease, time the harvest, grade the cut — and know the margin.
              </Text>
              <View style={styles.ctaRow}>
                <FieldButton label="Open the scanner" href="/scan/diagnosis" />
                <FieldButton label="Browse records" href="/farms" variant="outline" />
              </View>
            </Entry>

            <Entry delay={170} style={[styles.plateWrap, wide && styles.plateWrapWide]}>
              <SpecimenPlate wide={wide} />
            </Entry>
          </View>

          <Entry delay={260}>
            <View style={styles.stats}>
              <View style={styles.statCell}>
                <Stat label="Plants" value="0" note="awaiting records" />
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Stat label="Farms" value="0" note="no plots yet" />
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Stat label="Node" value="—" note="not paired" />
              </View>
            </View>
          </Entry>

          <Reveal scrollY={scrollY}>
            <SectionHead
              index="01 / Instruments"
              title="Everything the field asks for."
              aside="05 modules"
              note="Each module writes to the same local ledger. The cloud is a copy, never the source."
            />
          </Reveal>

          <View>
            {modules.map((module, index) => (
              <Reveal key={module.id} scrollY={scrollY}>
                <LedgerRow
                  index={module.id}
                  title={module.title}
                  note={module.note}
                  value={module.value}
                  href={module.href}
                  last={index === modules.length - 1}
                />
              </Reveal>
            ))}
          </View>

          <Reveal scrollY={scrollY}>
            <SectionHead
              index="02 / Protocol"
              title="Three moves. No signal needed."
              aside="Scan → Diagnose → Act"
            />
          </Reveal>

          <View>
            {steps.map((step, index) => (
              <Reveal key={step.id} scrollY={scrollY}>
                <View style={[styles.step, index === 0 && styles.stepFirst]}>
                  <Text
                    numberOfLines={1}
                    style={[styles.stepNumber, index === 1 && styles.stepNumberAccent]}
                  >
                    {step.id}
                  </Text>
                  <View style={styles.stepCopy}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDetail}>{step.detail}</Text>
                  </View>
                  <Stamp tone={index === 1 ? 'accent' : 'outline'} label={step.tag} />
                </View>
              </Reveal>
            ))}
          </View>

          <Reveal scrollY={scrollY}>
            <SectionHead
              index="03 / Doctrine"
              title="Built for the dead zones."
              aside="Field principle"
            />
          </Reveal>

          <Reveal scrollY={scrollY}>
            <View style={styles.doctrine}>
              <View style={styles.doctrineHead}>
                <Meta tone="cream">Field doctrine / 01</Meta>
                <Stamp label="Offline-first" tone="cream" />
              </View>
              <Text style={styles.doctrineQuote}>
                A connected toolkit that respects{' '}
                <Text style={styles.doctrineQuoteAccent}>unconnected farms.</Text>
              </Text>
              <Text style={styles.doctrineBody}>
                Everything that matters is computed and kept on this device. Sync is a
                courtesy, not a requirement.
              </Text>
              <View style={styles.doctrineFoot}>
                <Text style={styles.doctrineNote}>No upload required · no account required</Text>
                <FieldButton
                  label="Start your first scan"
                  href="/scan/diagnosis"
                  variant="cream"
                />
              </View>
              <View style={styles.doctrineCorner}>
                <Text style={styles.doctrineCornerText}>03</Text>
              </View>
            </View>
          </Reveal>

          <ScreenFooter />
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
  scroll: {
    paddingHorizontal: Layout.gutter,
  },
  frame: {
    width: '100%',
    maxWidth: Layout.maxWidth,
    alignSelf: 'center',
    gap: 34,
  },
  masthead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandWord: {
    ...Type.meta,
    color: Palette.text,
    fontSize: 10.5,
    letterSpacing: 1.7,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Palette.moss,
  },
  hero: {
    gap: 26,
    paddingTop: 8,
  },
  heroWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 44,
  },
  heroCopy: {
    flex: 1,
    gap: 18,
    paddingTop: 6,
  },
  heroTitle: {
    ...Type.display,
    fontSize: 50,
    lineHeight: 51,
    letterSpacing: -2.1,
  },
  heroTitleWide: {
    fontSize: 62,
    lineHeight: 62,
    letterSpacing: -2.7,
  },
  heroAccent: {
    color: Palette.accent,
  },
  heroBody: {
    ...Type.body,
    fontSize: 15.5,
    lineHeight: 24,
    maxWidth: 430,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 2,
  },
  plateWrap: {
    width: '100%',
  },
  plateWrapWide: {
    width: 340,
  },
  plate: {
    backgroundColor: Palette.ink,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(22,26,20,0.4)',
    padding: 18,
    gap: 14,
    overflow: 'hidden',
    boxShadow: '0 28px 56px -34px rgba(22,26,20,0.7)',
  },
  plateWide: {
    minHeight: 404,
  },
  plateNarrow: {
    minHeight: 388,
  },
  plateAccentLine: {
    position: 'absolute',
    left: 9,
    top: 26,
    bottom: 26,
    width: 2,
    backgroundColor: Palette.accent,
    opacity: 0.85,
  },
  plateHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingLeft: 6,
  },
  plateArt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 216,
  },
  measure: {
    position: 'absolute',
    left: 8,
    top: 16,
    bottom: 16,
    width: 40,
    justifyContent: 'flex-start',
    gap: 16,
  },
  measureTick: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  measureLabel: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 8,
    color: Palette.creamDim,
    width: 14,
  },
  measureRule: {
    width: 12,
    height: 1,
    backgroundColor: 'rgba(241,236,224,0.24)',
  },
  plateFoot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingLeft: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.inkLine,
  },
  plateName: {
    fontFamily: 'CabinetGrotesk-Bold',
    fontSize: 24,
    lineHeight: 27,
    letterSpacing: -0.8,
    color: Palette.cream,
  },
  plateHeight: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 12,
    color: Palette.cream,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Palette.border,
    paddingVertical: 18,
  },
  statCell: {
    flex: 1,
    paddingRight: 8,
  },
  statDivider: {
    width: 1,
    backgroundColor: Palette.border,
    marginRight: 12,
    marginLeft: 4,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
    paddingVertical: 22,
  },
  stepFirst: {
    borderTopWidth: 0,
    paddingTop: 4,
  },
  stepNumber: {
    fontFamily: 'CabinetGrotesk-Black',
    fontSize: 54,
    lineHeight: 54,
    letterSpacing: -3,
    color: Palette.dim,
    width: 74,
    flexShrink: 0,
  },
  stepNumberAccent: {
    color: Palette.accent,
  },
  stepCopy: {
    flex: 1,
    gap: 6,
    paddingTop: 4,
  },
  stepTitle: {
    ...Type.title,
    fontSize: 24,
    lineHeight: 28,
  },
  stepDetail: {
    ...Type.body,
    fontSize: 13.5,
    lineHeight: 20,
    maxWidth: 380,
  },
  doctrine: {
    backgroundColor: Palette.ink,
    borderRadius: 28,
    padding: 24,
    gap: 20,
    overflow: 'hidden',
    boxShadow: '0 30px 60px -38px rgba(22,26,20,0.7)',
  },
  doctrineHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  doctrineQuote: {
    ...Type.quote,
    fontSize: 31,
    lineHeight: 38,
    letterSpacing: -1.1,
    maxWidth: 640,
  },
  doctrineQuoteAccent: {
    color: Palette.accent,
  },
  doctrineBody: {
    ...Type.body,
    color: Palette.creamMuted,
    fontSize: 13.5,
    lineHeight: 21,
    maxWidth: 460,
  },
  doctrineFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: Palette.inkLine,
    paddingTop: 18,
  },
  doctrineNote: {
    ...Type.caption,
    color: Palette.creamDim,
    flexShrink: 1,
  },
  doctrineButton: {
    flexShrink: 0,
  },
  doctrineCorner: {
    position: 'absolute',
    right: -18,
    bottom: -56,
  },
  doctrineCornerText: {
    fontFamily: 'CabinetGrotesk-Black',
    fontSize: 220,
    lineHeight: 240,
    color: 'rgba(241,236,224,0.04)',
  },
});
