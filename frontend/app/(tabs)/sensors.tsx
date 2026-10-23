import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import {
  Card,
  FieldButton,
  Meta,
  SectionHead,
  Stamp,
  Stat,
} from '@/components/FieldUI';
import { ScreenShell } from '@/components/ScreenShell';
import { Palette } from '@/constants/Colors';
import { Type } from '@/constants/Typography';

const ease = Easing.bezier(0.32, 0.72, 0, 1).factory();

type Channel = {
  code: string;
  label: string;
  unit: string;
  value: number;
  display: string;
  max: number;
};

const channels: Channel[] = [
  { code: 'MOI', label: 'Soil moisture', unit: '%', value: 32, display: '32', max: 100 },
  { code: 'PH', label: 'pH level', unit: '', value: 6.3, display: '6.3', max: 14 },
  { code: 'EC', label: 'Conductivity', unit: 'mS/cm', value: 1.4, display: '1.4', max: 4 },
  { code: 'N', label: 'Nitrogen', unit: 'mg/kg', value: 42, display: '42', max: 100 },
  { code: 'P', label: 'Phosphorus', unit: 'mg/kg', value: 18, display: '18', max: 100 },
  { code: 'K', label: 'Potassium', unit: 'mg/kg', value: 27, display: '27', max: 100 },
];

function PulseDot({ active }: { active: boolean }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: 2600, easing: ease }), -1, false);
  }, [active, pulse]);

  const ring = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 2.1 }],
  }));

  return (
    <View style={styles.pulse}>
      {active ? <Animated.View style={[styles.pulseRing, ring]} /> : null}
      <View style={[styles.pulseCore, !active && styles.pulseCoreIdle]} />
    </View>
  );
}

function Dial({ preview }: { preview: boolean }) {
  const size = 230;
  const center = size / 2;
  const angle = -135 + (32 / 100) * 270;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: 40 }).map((_, index) => {
        const major = index % 10 === 0;
        return (
          <View
            key={index}
            style={[
              styles.tick,
              {
                left: center - 1,
                top: center - (major ? 6 : 3),
                width: major ? 2 : 1,
                height: major ? 12 : 6,
                backgroundColor: major ? Palette.hairline : Palette.border,
                transform: [{ rotate: `${index * 9}deg` }, { translateY: -(size / 2 - 15) }],
              },
            ]}
          />
        );
      })}
      <View style={[styles.dialInner, { width: size - 62, height: size - 62 }]}>
        <Meta tone="accent">{preview ? 'Soil profile' : 'Awaiting node'}</Meta>
        <Text style={[styles.dialValue, !preview && styles.dialValueIdle]}>
          {preview ? '32' : '—'}
        </Text>
        <Text style={styles.dialUnit}>{preview ? '% moisture' : 'no reading'}</Text>
      </View>
      {preview ? (
        <View
          style={[
            styles.dialMarker,
            {
              left: center - 4,
              top: center - 4,
              transform: [{ rotate: `${angle}deg` }, { translateY: -(size / 2 - 34) }],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

function ChannelCell({ channel, preview }: { channel: Channel; preview: boolean }) {
  const fill = preview ? Math.min(channel.value / channel.max, 1) : 0;

  return (
    <View style={styles.channel}>
      <View style={styles.channelTop}>
        <Text style={styles.channelCode}>{channel.code}</Text>
        <Meta>{channel.label}</Meta>
      </View>
      <View style={styles.channelValueRow}>
        <Text style={[styles.channelValue, !preview && styles.channelValueIdle]}>
          {preview ? channel.display : '—'}
        </Text>
        {channel.unit ? <Text style={styles.channelUnit}>{channel.unit}</Text> : null}
      </View>
      <View style={styles.channelTrack}>
        <View style={[styles.channelFill, { width: `${fill * 100}%` }]} />
      </View>
    </View>
  );
}

export default function SensorsScreen() {
  const [preview, setPreview] = useState(false);
  const { width } = useWindowDimensions();
  const wide = width >= 720;

  return (
    <ScreenShell
      eyebrow="04 / Soil instruments"
      title="Listen to the soil."
      description="Moisture, nitrogen, phosphorus, potassium, conductivity and pH — reported by the Raspberry Pi node and kept as a local record."
      index="04 / 05"
      actions={
        <FieldButton
          label={preview ? 'Hide preview values' : 'Preview values'}
          onPress={() => setPreview((current) => !current)}
          variant={preview ? 'accent' : 'ink'}
        />
      }
    >
      <Card tone="ink">
        <View style={styles.node}>
          <View style={styles.nodeStatusRow}>
            <View style={styles.nodeStatus}>
              <PulseDot active={preview} />
              <Meta tone="cream">Raspberry Pi node</Meta>
            </View>
            <Stamp label={preview ? 'Preview' : 'Not paired'} tone="cream" />
          </View>
          <View style={styles.nodeLeft}>
            <Text style={styles.nodeTitle}>No node paired.</Text>
            <Text style={styles.nodeBody}>
              The six-in-one probe is ready in the field. Pairing is the last step before
              readings begin to arrive.
            </Text>
            <Text style={styles.nodeId}>NODE / — · LAST CONTACT / NEVER</Text>
          </View>
        </View>
        <View style={styles.nodeFoot}>
          {[
            ['Power', '—'],
            ['Probe', '—'],
            ['Last', 'Never'],
          ].map(([label, value], index) => (
            <View key={label} style={[styles.nodeStat, index > 0 && styles.nodeStatBorder]}>
              <Meta tone="cream">{label}</Meta>
              <Text style={styles.nodeStatValue}>{value}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <View style={styles.dialHead}>
          <View style={styles.dialHeadCopy}>
            <Meta tone="accent">Live soil profile</Meta>
            <Text style={styles.dialTitle}>The root zone, at a glance.</Text>
          </View>
          <Stamp label={preview ? 'Preview data' : 'No data'} tone={preview ? 'accent' : 'outline'} />
        </View>
        <View style={[styles.dialBody, wide && styles.dialBodyWide]}>
          <View style={styles.dialWrap}>
            <Dial preview={preview} />
          </View>
          <View style={styles.dialCopy}>
            <Text style={styles.dialLead}>
              {preview
                ? 'A sample profile at 32% moisture — the range aloe prefers after the top soil dries.'
                : 'When the node is paired, this dial holds the latest moisture reading. The six channels below follow.'}
            </Text>
            <View style={styles.dialRows}>
              <View style={styles.dialRow}>
                <Meta>Sampling</Meta>
                <Text style={styles.dialRowValue}>Every 30 min</Text>
              </View>
              <View style={styles.dialRow}>
                <Meta>Transport</Meta>
                <Text style={styles.dialRowValue}>Local first</Text>
              </View>
              <View style={styles.dialRow}>
                <Meta>Payload</Meta>
                <Text style={styles.dialRowValue}>6 channels</Text>
              </View>
            </View>
            <Text style={styles.dialNote}>
              Preview values are illustrative. They are not written to the ledger.
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <SectionHead
          index="01 / Channels"
          title="Six signals, one probe."
          aside={preview ? 'Preview values' : 'Awaiting readings'}
          note="Each reading is stamped locally before any sync attempt."
        />
        <View style={styles.channelGrid}>
          {channels.map((channel) => (
            <ChannelCell key={channel.code} channel={channel} preview={preview} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHead
          index="02 / Node"
          title="Three steps to first light."
          aside="Pairing sequence"
        />
        <View>
          {[
            ['01', 'Power the Pi', 'Boot the node and confirm the status LED is steady.'],
            ['02', 'Seat the probe', 'Insert the six-in-one sensor at root depth, clear of stones.'],
            ['03', 'Pair locally', 'Join the node’s network and let the first reading land on the phone.'],
          ].map(([id, title, note], index) => (
            <View key={id} style={[styles.step, index === 0 && styles.stepFirst]}>
              <Text style={styles.stepId}>{id}</Text>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.stepTitle}>{title}</Text>
                <Text style={styles.stepNote}>{note}</Text>
              </View>
              <Stamp label={index === 0 ? 'Pending' : 'Queued'} />
            </View>
          ))}
        </View>
        <View style={styles.flowNote}>
          <Stat value="A / B" label="Transport decision" note="phone-first vs cloud-first" />
          <Text style={styles.flowText}>
            The Pi-to-phone path is still being finalised. Both options keep the phone able to
            read and store the last known values offline.
          </Text>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  node: {
    gap: 12,
  },
  nodeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  nodeLeft: {
    gap: 10,
  },
  nodeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nodeTitle: {
    ...Type.displaySmall,
    fontSize: 34,
    lineHeight: 37,
    color: Palette.cream,
  },
  nodeBody: {
    ...Type.body,
    color: Palette.creamMuted,
    fontSize: 13.5,
    lineHeight: 21,
    maxWidth: 440,
  },
  nodeId: {
    ...Type.mono,
    fontSize: 9,
    color: Palette.creamDim,
  },
  nodeFoot: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Palette.inkLine,
    paddingTop: 16,
    gap: 16,
    marginTop: 4,
  },
  nodeStat: {
    flex: 1,
    gap: 5,
  },
  nodeStatBorder: {
    borderLeftWidth: 1,
    borderLeftColor: Palette.inkLine,
    paddingLeft: 16,
  },
  nodeStatValue: {
    ...Type.monoLarge,
    color: Palette.cream,
    fontSize: 13,
  },
  pulse: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.accent,
  },
  pulseCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.accent,
  },
  pulseCoreIdle: {
    backgroundColor: Palette.creamDim,
  },
  dialHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  dialHeadCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  dialTitle: {
    ...Type.title,
    fontSize: 26,
  },
  dialBody: {
    alignItems: 'center',
    gap: 10,
  },
  dialBodyWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 34,
  },
  dialWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  tick: {
    position: 'absolute',
    borderRadius: 1,
  },
  dialInner: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: 'rgba(46,70,51,0.035)',
  },
  dialValue: {
    ...Type.numeralLarge,
    fontSize: 58,
    lineHeight: 58,
  },
  dialValueIdle: {
    fontSize: 30,
    lineHeight: 38,
    color: Palette.dim,
  },
  dialUnit: {
    ...Type.labelSmall,
    color: Palette.muted,
  },
  dialMarker: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.accent,
  },
  dialCopy: {
    flex: 1,
    gap: 14,
    minWidth: 220,
  },
  dialLead: {
    ...Type.body,
    fontSize: 14,
    lineHeight: 22,
  },
  dialRows: {
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  dialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  dialRowValue: {
    ...Type.mono,
    fontSize: 11,
    color: Palette.text,
  },
  dialNote: {
    ...Type.caption,
    fontSize: 8,
    lineHeight: 13,
    color: Palette.dim,
  },
  section: {
    gap: 22,
  },
  channelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  channel: {
    flexGrow: 1,
    flexBasis: 150,
    minWidth: 145,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    backgroundColor: 'rgba(248,244,234,0.4)',
  },
  channelTop: {
    gap: 2,
  },
  channelCode: {
    ...Type.mono,
    fontSize: 10,
    color: Palette.accentDeep,
  },
  channelValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },
  channelValue: {
    ...Type.numeral,
    fontSize: 34,
    lineHeight: 35,
  },
  channelValueIdle: {
    fontSize: 24,
    lineHeight: 30,
    color: Palette.dim,
  },
  channelUnit: {
    ...Type.caption,
    fontSize: 8,
    color: Palette.muted,
    paddingBottom: 4,
  },
  channelTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(22,26,20,0.08)',
    overflow: 'hidden',
  },
  channelFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: Palette.moss,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  stepFirst: {
    borderTopWidth: 0,
  },
  stepId: {
    ...Type.caption,
    color: Palette.accent,
    width: 24,
    paddingTop: 2,
  },
  stepTitle: {
    ...Type.label,
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
  },
  stepNote: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 19,
    color: Palette.muted,
  },
  flowNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    flexWrap: 'wrap',
  },
  flowText: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 19,
    color: Palette.muted,
    flex: 1,
    minWidth: 220,
  },
});
