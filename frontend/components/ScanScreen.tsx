import { Href, useRouter } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AloeRosette } from '@/components/AloeArt';
import { Entry } from '@/components/Entry';
import { FieldButton, Meta, Stamp } from '@/components/FieldUI';
import { ScreenShell } from '@/components/ScreenShell';
import { Palette } from '@/constants/Colors';
import { Type } from '@/constants/Typography';

const scanlines = require('../assets/images/scanlines.png') as number;

export type ScanMode = {
  key: 'diagnosis' | 'maturity' | 'grading';
  label: string;
  href: Href;
  eyebrow: string;
  title: string;
  description: string;
  modeIndex: string;
  reads: { id: string; title: string; note: string }[];
  result: { label: string; value: string }[];
  frameNote: string;
};

export const scanModes: ScanMode[] = [
  {
    key: 'diagnosis',
    label: 'Diagnosis',
    href: '/scan/diagnosis',
    eyebrow: 'Mode 01 / Disease & pests',
    title: 'Look closely.',
    description:
      'Disease and pest symptoms from a single leaf. Hold the frame steady — the model reads it here, on this device.',
    modeIndex: '01 / 03',
    reads: [
      { id: '01', title: 'Leaf surface', note: 'Texture, lesions and discoloration' },
      { id: '02', title: 'Edges & tips', note: 'Browning, curling and pest residue' },
      { id: '03', title: 'Pattern', note: 'Spread across the rosette, not just one leaf' },
    ],
    result: [
      { label: 'Finding', value: '—' },
      { label: 'Confidence', value: '—' },
      { label: 'Response', value: '—' },
    ],
    frameNote: 'Align one leaf · hold 20 cm from the surface',
  },
  {
    key: 'maturity',
    label: 'Maturity',
    href: '/scan/maturity',
    eyebrow: 'Mode 02 / Harvest readiness',
    title: 'Time the cut.',
    description:
      'Estimate harvest readiness from the shape of the plant — leaf count, structure and the weight of the outer leaves.',
    modeIndex: '02 / 03',
    reads: [
      { id: '01', title: 'Leaf count', note: 'Harvestable leaves on the rosette' },
      { id: '02', title: 'Structure', note: 'Spread, height and stem thickness' },
      { id: '03', title: 'Outer leaves', note: 'Firmness and colour at the base' },
    ],
    result: [
      { label: 'Stage', value: '—' },
      { label: 'Window', value: '—' },
      { label: 'Confidence', value: '—' },
    ],
    frameNote: 'Fit the whole rosette · keep the base in frame',
  },
  {
    key: 'grading',
    label: 'Grading',
    href: '/scan/grading',
    eyebrow: 'Mode 03 / Post-harvest',
    title: 'Grade the cut.',
    description:
      'Classify a harvested leaf by its measurable qualities. This is the record that follows the harvest to market.',
    modeIndex: '03 / 03',
    reads: [
      { id: '01', title: 'Length', note: 'Tip to cut, in centimetres' },
      { id: '02', title: 'Width & taper', note: 'Shoulder width and evenness' },
      { id: '03', title: 'Surface', note: 'Blemishes, cuts and handling marks' },
    ],
    result: [
      { label: 'Grade', value: '—' },
      { label: 'Class', value: '—' },
      { label: 'Notes', value: '—' },
    ],
    frameNote: 'Lay the leaf flat · fill the frame corner to corner',
  },
];

function ModeSwitch({ mode }: { mode: ScanMode }) {
  const router = useRouter();

  return (
    <View style={styles.modeSwitch}>
      {scanModes.map((item) => {
        const active = item.key === mode.key;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => router.push(item.href)}
            style={[styles.modeTab, active && styles.modeTabActive]}
          >
            <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>
              {item.label}
            </Text>
            <Text style={[styles.modeIndex, active && styles.modeIndexActive]}>
              0{scanModes.findIndex((entry) => entry.key === item.key) + 1}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ScanFrame({ mode }: { mode: ScanMode }) {
  const scan = useSharedValue(0);

  useEffect(() => {
    scan.value = 0;
    scan.value = withRepeat(
      withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [scan, mode.key]);

  const line = useAnimatedStyle(() => ({
    transform: [{ translateY: 58 + scan.value * 232 }],
    opacity: 0.35 + 0.5 * Math.sin(scan.value * Math.PI),
  }));

  return (
    <View style={styles.frame}>
      <Image source={scanlines} resizeMode="cover" style={styles.scanlines} />
      <View style={styles.frameTop}>
        <View style={styles.frameTag}>
          <View style={styles.frameDot} />
          <Text style={styles.frameTagText}>Camera · offline</Text>
        </View>
        <Text style={styles.frameZoom}>1×</Text>
      </View>

      <View style={styles.reticle}>
        <View style={styles.reticleCircle} />
        <AloeRosette height={196} tone="ink" />
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </View>

      <Animated.View pointerEvents="none" style={[styles.scanLine, line]} />

      <View style={styles.frameFoot}>
        <Text style={styles.frameNote}>{mode.frameNote}</Text>
        <Text style={styles.frameMeta} numberOfLines={1}>
          2K × 2K
        </Text>
      </View>
    </View>
  );
}

export function ScanScreen({
  mode,
  cameraSymbol,
}: {
  mode: ScanMode;
  cameraSymbol: { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };
}) {
  const [notice, setNotice] = useState(false);
  const modePosition = scanModes.findIndex((item) => item.key === mode.key);
  const nextMode = scanModes[(modePosition + 1) % scanModes.length];

  return (
    <ScreenShell
      eyebrow={mode.eyebrow}
      title={mode.title}
      description={mode.description}
      index={`scan / ${mode.modeIndex}`}
      back
      footer={false}
    >
      <View style={styles.scanBlock}>
        <ModeSwitch mode={mode} />
        <ScanFrame mode={mode} />

        <View style={styles.captureRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Capture leaf"
            onPress={() => setNotice(true)}
            style={({ pressed }) => [styles.capture, pressed && styles.capturePressed]}
          >
            <View style={styles.captureInner}>
              <SymbolView
                name={{ ios: cameraSymbol.ios, android: cameraSymbol.android, web: cameraSymbol.web }}
                size={24}
                weight="light"
                tintColor={Palette.cream}
              />
            </View>
          </Pressable>
          <View style={styles.captureCopy}>
            <Text style={styles.captureTitle}>Capture leaf</Text>
            <Text style={[styles.captureNote, notice && styles.captureNoteNotice]}>
              {notice
                ? 'Preview only. No frame is stored; the camera pipeline arrives in Phase 3.'
                : mode.key === 'grading'
                  ? 'Lay the harvested leaf flat, cut edge at the bottom.'
                  : 'Hold steady. One frame is all the model needs.'}
            </Text>
          </View>
          <Stamp label="Preview" />
        </View>

        {notice ? (
          <Entry distance={10}>
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>Camera pipeline not installed.</Text>
              <Text style={styles.noticeBody}>
                The on-device model arrives in Phase 3. This frame previews the capture
                experience; nothing is recorded.
              </Text>
            </View>
          </Entry>
        ) : null}
      </View>

      <View style={styles.result}>
        <View style={styles.resultHead}>
          <Meta tone="accent">Result ledger</Meta>
          <Meta>No scan on file</Meta>
        </View>
        {mode.result.map((item, index) => (
          <View key={item.label} style={[styles.resultRow, index === 0 && styles.resultRowFirst]}>
            <Text style={styles.resultLabel}>{item.label}</Text>
            <Text style={styles.resultValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.reads}>
        <Text style={styles.readsTitle}>What this mode reads</Text>
        <View>
          {mode.reads.map((read, index) => (
            <View key={read.id} style={[styles.readRow, index === 0 && styles.readRowFirst]}>
              <Text style={styles.readId}>{read.id}</Text>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.readTitle}>{read.title}</Text>
                <Text style={styles.readNote}>{read.note}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.trust}>
        <Text style={styles.trustTitle}>The image never leaves this device.</Text>
        <Text style={styles.trustBody}>
          Inference runs locally. Only the result you choose to keep becomes part of the
          ledger, and only syncs if you register an account.
        </Text>
        <View style={styles.trustActions}>
          <FieldButton label="Try another read" href={nextMode.href} variant="outline" compact />
          <FieldButton label="Plant archive" href="/plants" variant="outline" compact />
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scanBlock: {
    gap: 16,
  },
  modeSwitch: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 16,
    backgroundColor: 'rgba(22,26,20,0.03)',
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
  },
  modeTabActive: {
    backgroundColor: Palette.ink,
  },
  modeLabel: {
    ...Type.labelSmall,
    fontSize: 11.5,
    color: Palette.muted,
  },
  modeLabelActive: {
    color: Palette.cream,
  },
  modeIndex: {
    ...Type.caption,
    fontSize: 7.5,
    color: Palette.dim,
  },
  modeIndexActive: {
    color: Palette.creamMuted,
  },
  frame: {
    position: 'relative',
    height: 352,
    borderRadius: 26,
    backgroundColor: '#101410',
    borderWidth: 1,
    borderColor: 'rgba(22,26,20,0.45)',
    overflow: 'hidden',
    padding: 18,
    justifyContent: 'space-between',
    boxShadow: '0 30px 60px -40px rgba(22,26,20,0.8)',
  },
  scanlines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.16,
  },
  frameTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  frameTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  frameDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Palette.accent,
  },
  frameTagText: {
    ...Type.caption,
    fontSize: 8,
    color: Palette.creamMuted,
  },
  frameZoom: {
    ...Type.mono,
    fontSize: 10,
    color: Palette.creamMuted,
  },
  reticle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleCircle: {
    position: 'absolute',
    width: 226,
    height: 226,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(241,236,224,0.14)',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: 'rgba(241,236,224,0.5)',
  },
  cornerTL: {
    top: 10,
    left: 6,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  cornerTR: {
    top: 10,
    right: 6,
    borderTopWidth: 1,
    borderRightWidth: 1,
  },
  cornerBL: {
    bottom: 10,
    left: 6,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
  },
  cornerBR: {
    bottom: 10,
    right: 6,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  scanLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 0,
    height: 1,
    backgroundColor: Palette.accent,
    boxShadow: '0 0 18px rgba(196,86,45,0.8)',
  },
  frameFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 2,
  },
  frameNote: {
    ...Type.caption,
    fontSize: 8.5,
    color: Palette.creamMuted,
    flexShrink: 1,
  },
  frameMeta: {
    ...Type.caption,
    fontSize: 7.5,
    color: Palette.creamDim,
    flexShrink: 0,
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 2,
  },
  capture: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: Palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 12px 26px -14px rgba(196,86,45,0.85)',
  },
  capturePressed: {
    transform: [{ scale: 0.96 }],
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(22,26,20,0.22)',
    backgroundColor: 'rgba(22,26,20,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureCopy: {
    flex: 1,
    gap: 3,
  },
  captureTitle: {
    ...Type.subtitle,
    fontSize: 19,
  },
  captureNote: {
    ...Type.body,
    fontSize: 12,
    lineHeight: 17,
    color: Palette.muted,
  },
  captureNoteNotice: {
    color: Palette.accentDeep,
  },
  notice: {
    borderWidth: 1,
    borderColor: 'rgba(196,86,45,0.34)',
    backgroundColor: Palette.accentSoft,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  noticeTitle: {
    ...Type.label,
    fontFamily: 'Satoshi-Bold',
    color: Palette.accentDeep,
  },
  noticeBody: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.body,
  },
  result: {
    gap: 6,
  },
  resultHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  resultRowFirst: {
    borderTopColor: Palette.border,
  },
  resultLabel: {
    ...Type.caption,
    color: Palette.muted,
  },
  resultValue: {
    ...Type.mono,
    fontSize: 12,
    color: Palette.text,
  },
  reads: {
    gap: 14,
  },
  readsTitle: {
    ...Type.title,
    fontSize: 24,
  },
  readRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  readRowFirst: {
    borderTopColor: Palette.border,
  },
  readId: {
    ...Type.caption,
    color: Palette.accent,
    width: 24,
    paddingTop: 2,
  },
  readTitle: {
    ...Type.label,
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
  },
  readNote: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.muted,
  },
  trust: {
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    paddingTop: 20,
    gap: 9,
  },
  trustTitle: {
    ...Type.subtitle,
    fontSize: 19,
    maxWidth: 480,
  },
  trustBody: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 19,
    color: Palette.muted,
    maxWidth: 520,
  },
  trustActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 6,
  },
});
