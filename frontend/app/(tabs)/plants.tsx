import { Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AloeRosette } from '@/components/AloeArt';
import {
  Card,
  FieldButton,
  LedgerRow,
  Meta,
  SectionHead,
  Stamp,
  Stat,
} from '@/components/FieldUI';
import { ScreenShell } from '@/components/ScreenShell';
import { Palette } from '@/constants/Colors';
import { Type } from '@/constants/Typography';

type Filter = 'All' | 'Needs scan' | 'Ready' | 'Archived';

const filters: Filter[] = ['All', 'Needs scan', 'Ready', 'Archived'];

const reads: {
  id: string;
  title: string;
  note: string;
  href: Href;
}[] = [
  {
    id: '01',
    title: 'Diagnosis',
    note: 'Disease and pest symptoms from one leaf',
    href: '/scan/diagnosis',
  },
  {
    id: '02',
    title: 'Maturity',
    note: 'Harvest readiness from structure and leaf count',
    href: '/scan/maturity',
  },
  {
    id: '03',
    title: 'Grading',
    note: 'Post-harvest class from size, shape and surface',
    href: '/scan/grading',
  },
];

export default function PlantsScreen() {
  const [filter, setFilter] = useState<Filter>('All');

  return (
    <ScreenShell
      eyebrow="03 / Plant archive"
      title="Every leaf has a history."
      description="One plant, one record. Scans attach to the specimen so the next decision has evidence behind it."
      index="03 / 05"
      actions={
        <>
          <FieldButton label="Scan a plant" href="/scan/diagnosis" />
          <FieldButton label="Register stock" href="/farms" variant="outline" />
        </>
      }
    >
      <View style={styles.stats}>
        <View style={styles.statCell}>
          <Stat label="Specimens" value="0" note="archived" />
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Stat label="Needs care" value="0" note="flagged" />
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Stat label="Ready" value="0" note="to harvest" />
        </View>
      </View>

      <View style={styles.filters}>
        {filters.map((item) => {
          const active = filter === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setFilter(item)}
              style={[styles.filter, active && styles.filterActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text>
              <Text style={[styles.filterCount, active && styles.filterCountActive]}>0</Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={styles.archive}>
        <View style={styles.archiveHead}>
          <Meta tone="accent">Specimen archive</Meta>
          <Stamp label="Empty" />
        </View>

        <View style={styles.archiveBody}>
          <View style={styles.artWell}>
            <AloeRosette height={174} />
            <View style={styles.artTag}>
              <Text style={styles.artTagText}>000</Text>
            </View>
            <View style={styles.artRule} />
            <Text style={styles.artCaption}>Aloe barbadensis · unregistered</Text>
          </View>

          <View style={styles.archiveCopy}>
            <Text style={styles.archiveTitle}>The archive is blank.</Text>
            <Text style={styles.archiveText}>
              A specimen record begins with the plant, not the scan. Register the plot, then
              give each plant an ID you can call out in the field.
            </Text>
            <View style={styles.recordRows}>
              {[
                ['ID', '—'],
                ['Farm', '—'],
                ['Last scan', 'Never'],
              ].map(([label, value]) => (
                <View key={label} style={styles.recordRow}>
                  <Text style={styles.recordLabel}>{label}</Text>
                  <Text style={styles.recordValue}>{value}</Text>
                </View>
              ))}
            </View>
            <FieldButton label="Open the scanner" href="/scan/diagnosis" compact />
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <SectionHead
          index="01 / The three reads"
          title="One leaf, three questions."
          aside="On-device"
          note="Each mode reads a different property of the same frame. No connection is used."
        />
        <View>
          {reads.map((read, index) => (
            <LedgerRow
              key={read.id}
              index={read.id}
              title={read.title}
              note={read.note}
              value="Scan"
              href={read.href}
              last={index === reads.length - 1}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHead
          index="02 / What a record holds"
          title="Small record. Long memory."
          aside="Local schema"
        />
        <View style={styles.fields}>
          {[
            ['Identity', 'Specimen ID, farm link and planting date'],
            ['Readings', 'Diagnosis, maturity and grade with confidence'],
            ['History', 'Every scan kept in order, even offline'],
          ].map(([title, note], index) => (
            <View key={title} style={[styles.fieldRow, index === 0 && styles.fieldRowFirst]}>
              <Text style={styles.fieldId}>0{index + 1}</Text>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.fieldTitle}>{title}</Text>
                <Text style={styles.fieldNote}>{note}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Palette.border,
    paddingVertical: 18,
  },
  statCell: {
    flex: 1,
    paddingRight: 6,
  },
  statDivider: {
    width: 1,
    backgroundColor: Palette.border,
    marginHorizontal: 10,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  filterActive: {
    backgroundColor: Palette.ink,
    borderColor: Palette.ink,
  },
  filterText: {
    ...Type.labelSmall,
    color: Palette.muted,
  },
  filterTextActive: {
    color: Palette.cream,
  },
  filterCount: {
    ...Type.caption,
    fontSize: 8,
    color: Palette.dim,
  },
  filterCountActive: {
    color: Palette.creamMuted,
  },
  archive: {
    marginTop: 2,
  },
  archiveHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  archiveBody: {
    gap: 22,
  },
  artWell: {
    backgroundColor: Palette.surfaceDeep,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Palette.border,
    minHeight: 238,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 18,
    paddingBottom: 14,
    overflow: 'hidden',
  },
  artTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderWidth: 1,
    borderColor: Palette.hairline,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  artTagText: {
    ...Type.mono,
    fontSize: 9,
    color: Palette.muted,
  },
  artRule: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 34,
    height: 1,
    backgroundColor: Palette.border,
  },
  artCaption: {
    ...Type.meta,
    fontSize: 8,
    color: Palette.dim,
    paddingTop: 6,
  },
  archiveCopy: {
    gap: 14,
  },
  archiveTitle: {
    ...Type.title,
    fontSize: 26,
  },
  archiveText: {
    ...Type.body,
    fontSize: 13.5,
    lineHeight: 21,
  },
  recordRows: {
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  recordLabel: {
    ...Type.caption,
    color: Palette.muted,
  },
  recordValue: {
    ...Type.mono,
    fontSize: 11,
    color: Palette.text,
  },
  section: {
    gap: 22,
  },
  fields: {
    marginTop: -14,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  fieldRowFirst: {
    borderTopWidth: 0,
  },
  fieldId: {
    ...Type.caption,
    color: Palette.accent,
    width: 24,
  },
  fieldTitle: {
    ...Type.label,
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
  },
  fieldNote: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.muted,
  },
});
