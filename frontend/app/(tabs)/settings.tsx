import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Card,
  FieldButton,
  LedgerRow,
  Meta,
  SectionHead,
  Stamp,
  Toggle,
} from '@/components/FieldUI';
import { ScreenShell } from '@/components/ScreenShell';
import { Palette } from '@/constants/Colors';
import { Type } from '@/constants/Typography';
import { useAppStore } from '@/stores/useAppStore';

function PreferenceRow({
  title,
  note,
  value,
  onChange,
  last = false,
}: {
  title: string;
  note: string;
  value: boolean;
  onChange: (next: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.prefRow, last && styles.prefRowLast]}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.prefTitle}>{title}</Text>
        <Text style={styles.prefNote}>{note}</Text>
      </View>
      <Toggle label={title} value={value} onChange={onChange} />
    </View>
  );
}

export default function SettingsScreen() {
  const { localProfileId, accountStatus } = useAppStore();
  const [wifiOnly, setWifiOnly] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [haptics, setHaptics] = useState(false);

  return (
    <ScreenShell
      eyebrow="05 / Settings"
      title="Keep it yours."
      description="Identity, sync behaviour and the rules this device follows. Defaults are deliberately quiet."
      index="05 / 05"
      actions={
        <FieldButton
          label={localProfileId ? 'View offline identity' : 'Create local profile'}
          href="/modal"
        />
      }
    >
      <Card tone="ink">
        <View style={styles.identityHead}>
          <View style={styles.identityHeadCopy}>
            <Meta tone="cream">Local identity</Meta>
            <Text style={styles.identityTitle}>
              {localProfileId ? 'This device has a name.' : 'No profile on this device.'}
            </Text>
          </View>
          <Stamp
            label={accountStatus === 'synced' ? 'Synced' : 'Local only'}
            tone="cream"
          />
        </View>

        <View style={styles.identityBody}>
          <Text style={styles.identityText}>
            {localProfileId
              ? 'Your scans and records stay attached to this local profile. Registering an account later links the same identity to the cloud.'
              : 'Create a local profile to keep records together. It needs no email, no password and no connection.'}
          </Text>
          <View style={styles.idBlock}>
            <Meta tone="cream">Profile ID</Meta>
            <Text style={styles.idValue}>{localProfileId ?? 'not created'}</Text>
            <Text style={styles.idNote}>Stored on this device only</Text>
          </View>
        </View>

        <View style={styles.identityFoot}>
          <Text style={styles.identityNote}>No account required for any core feature</Text>
        </View>
      </Card>

      <View style={styles.section}>
        <SectionHead
          index="01 / Behaviour"
          title="How the device works."
          aside="Stored locally"
        />
        <View style={styles.prefs}>
          <PreferenceRow
            title="Sync over Wi-Fi only"
            note="Hold the queue until a known network is available."
            value={wifiOnly}
            onChange={setWifiOnly}
          />
          <PreferenceRow
            title="Keep every scan"
            note="Write a local record before any result is shown."
            value={autoSave}
            onChange={setAutoSave}
          />
          <PreferenceRow
            title="Haptic confirmation"
            note="A short tap when a scan is captured."
            value={haptics}
            onChange={setHaptics}
            last
          />
        </View>
        <Text style={styles.prefFootnote}>
          Preferences are held for this preview session until the local settings store lands.
        </Text>
      </View>

      <View style={styles.section}>
        <SectionHead index="02 / Data" title="What is on the device." aside="Ledger" />
        <View style={styles.dataStrip}>
          {[
            ['Records', '0', 'local rows'],
            ['Queue', '0', 'pending sync'],
            ['Last sync', 'Never', '—'],
          ].map(([label, value, note], index) => (
            <View key={label} style={[styles.dataCell, index > 0 && styles.dataCellBorder]}>
              <Meta>{label}</Meta>
              <Text style={styles.dataValue}>{value}</Text>
              <Text style={styles.dataNote}>{note}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHead index="03 / Shortcuts" title="The rest of the system." aside="04 routes" />
        <View>
          <LedgerRow
            index="01"
            title="Offline identity"
            note="Create or inspect the local profile"
            value={localProfileId ? 'Ready' : 'Set up'}
            href="/modal"
          />
          <LedgerRow
            index="02"
            title="Reports"
            note="Yield, grade mix and return on investment"
            value="0 files"
            href="/reports"
          />
          <LedgerRow
            index="03"
            title="Community"
            note="Field notes from other growers, optional"
            value="Optional"
            href="/community"
          />
          <LedgerRow
            index="04"
            title="System plan"
            note="Phase 1 · mobile foundation in progress"
            value="v0.1"
            last
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHead index="04 / About" title="Made for the field." aside="Group 03" />
        <View style={styles.about}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>System</Text>
            <Text style={styles.aboutValue}>FarmSystem · Aloe Ledger</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Capstone</Text>
            <Text style={styles.aboutValue}>
              Integrated IoT & Machine Learning for Aloe Vera Farming
            </Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Build</Text>
            <Text style={styles.aboutValue}>BSIT-NS-3A · Group 03 · 2026</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Adviser</Text>
            <Text style={styles.aboutValue}>Prof. Julius Delfin A. Silang</Text>
          </View>
        </View>
        <Text style={styles.aboutNote}>
          Local when offline. Intelligent on the device. Connected through the cloud.
        </Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  identityHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  identityHeadCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  identityTitle: {
    ...Type.displaySmall,
    fontSize: 31,
    lineHeight: 34,
    color: Palette.cream,
  },
  identityBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 4,
  },
  identityText: {
    ...Type.body,
    color: Palette.creamMuted,
    fontSize: 13.5,
    lineHeight: 21,
    flex: 1,
    minWidth: 220,
    maxWidth: 440,
  },
  idBlock: {
    borderLeftWidth: 1,
    borderLeftColor: Palette.inkLine,
    paddingLeft: 18,
    minWidth: 190,
    gap: 4,
    justifyContent: 'center',
  },
  idValue: {
    ...Type.monoLarge,
    fontSize: 13,
    color: Palette.cream,
  },
  idNote: {
    ...Type.caption,
    fontSize: 8,
    color: Palette.creamDim,
  },
  identityFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.inkLine,
    paddingTop: 16,
    marginTop: 4,
  },
  identityNote: {
    ...Type.caption,
    color: Palette.creamMuted,
    flexShrink: 1,
  },
  section: {
    gap: 22,
  },
  prefs: {
    marginTop: -6,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  prefRowLast: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  prefTitle: {
    ...Type.label,
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
  },
  prefNote: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.muted,
  },
  prefFootnote: {
    ...Type.body,
    fontSize: 11.5,
    lineHeight: 17,
    color: Palette.dim,
    marginTop: -10,
  },
  dataStrip: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Palette.border,
    paddingVertical: 16,
  },
  dataCell: {
    flex: 1,
    gap: 4,
    paddingRight: 8,
  },
  dataCellBorder: {
    borderLeftWidth: 1,
    borderLeftColor: Palette.border,
    paddingLeft: 14,
  },
  dataValue: {
    ...Type.numeral,
    fontSize: 27,
    lineHeight: 30,
  },
  dataNote: {
    ...Type.labelSmall,
    fontSize: 10.5,
    color: Palette.muted,
  },
  about: {
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  aboutLabel: {
    ...Type.caption,
    color: Palette.muted,
    paddingTop: 2,
    width: 70,
  },
  aboutValue: {
    ...Type.label,
    flex: 1,
    textAlign: 'right',
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.body,
  },
  aboutNote: {
    ...Type.body,
    fontSize: 12,
    lineHeight: 18,
    color: Palette.muted,
    maxWidth: 420,
  },
});
