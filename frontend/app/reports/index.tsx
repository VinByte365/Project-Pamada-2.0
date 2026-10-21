import { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

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

const months = ['J', 'F', 'M', 'A', 'M', 'J'];
const sampleBars = [8, 14, 10, 22, 31, 24];

const kpis = [
  { label: 'Yield', sample: '128', empty: '0', note: 'kg · sample harvest' },
  { label: 'Grade A', sample: '72', empty: '0', note: '% of harvest' },
  { label: 'Revenue', sample: '18.4k', empty: '0', note: 'PHP · estimated' },
  { label: 'Return', sample: '34', empty: '0', note: '% on cost' },
];

const gradeMix = [
  { grade: 'A', share: 0.72, color: Palette.moss, note: 'Export quality' },
  { grade: 'B', share: 0.22, color: Palette.gold, note: 'Local market' },
  { grade: 'C', share: 0.06, color: Palette.accent, note: 'Processing' },
];

export default function ReportsIndexScreen() {
  const [preview, setPreview] = useState(false);
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const maxBar = Math.max(...sampleBars, 1);

  return (
    <ScreenShell
      eyebrow="05 / Economics"
      title="A harvest you can count."
      description="Turn grades and harvest weights into a margin you can defend. Reports are built from local records, never from guesses."
      index="reports / 2026"
      back
      actions={
        <>
          <FieldButton
            label={preview ? 'Hide sample report' : 'Show sample report'}
            onPress={() => setPreview((current) => !current)}
            variant={preview ? 'accent' : 'ink'}
          />
          <FieldButton label="Export PDF" variant="outline" disabled />
        </>
      }
    >
      <View style={[styles.banner, preview && styles.bannerPreview]}>
        <View style={styles.bannerBar} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.bannerTitle}>
            {preview ? 'Sample report, clearly labelled.' : 'No harvest on record yet.'}
          </Text>
          <Text style={styles.bannerBody}>
            {preview
              ? 'Illustrative values show how a finished report reads. Nothing here is written to the ledger.'
              : 'The first report is generated once you grade a harvest. Until then, the ledger stays empty.'}
          </Text>
        </View>
        <Stamp label={preview ? 'Sample' : 'Empty'} tone={preview ? 'accent' : 'outline'} />
      </View>

      <View style={[styles.kpiGrid, wide && styles.kpiGridWide]}>
        {kpis.map((kpi, index) => (
          <View
            key={kpi.label}
            style={[
              styles.kpiCell,
              wide ? styles.kpiCellWide : styles.kpiCellHalf,
              index % 2 === 0 && !wide && styles.kpiCellLeft,
              index < 2 && !wide && styles.kpiCellTop,
            ]}
          >
            <Stat
              label={kpi.label}
              value={preview ? kpi.sample : kpi.empty}
              note={preview ? kpi.note : 'awaiting harvest'}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <SectionHead
          index="01 / Yield"
          title="The season, in bars."
          aside={preview ? 'Jan – Jun · sample' : 'No data'}
        />
        <Card>
          <View style={styles.chartHead}>
            <View style={styles.chartHeadCopy}>
              <Meta>Estimated harvest value</Meta>
              <Text style={styles.chartValue}>{preview ? 'PHP 18.4k' : 'PHP 0'}</Text>
            </View>
            <Stamp label="Local estimate" />
          </View>
          <View style={styles.chart}>
            <View style={styles.axis}>
              {['20k', '10k', '0'].map((label) => (
                <Text key={label} style={styles.axisLabel}>
                  {label}
                </Text>
              ))}
            </View>
            <View style={styles.plot}>
              {[0, 1, 2].map((line) => (
                <View key={line} style={[styles.gridLine, { top: `${line * 50}%` }]} />
              ))}
              {!preview ? (
                <View style={styles.chartEmpty} pointerEvents="none">
                  <Text style={styles.chartEmptyTitle}>No harvest to chart yet.</Text>
                  <Text style={styles.chartEmptyNote}>
                    Grade a harvest and the season fills in here.
                  </Text>
                </View>
              ) : null}
              <View style={styles.bars}>
                {months.map((month, index) => {
                  const value = preview ? sampleBars[index] : 0;
                  const height = preview ? Math.max(6, (value / maxBar) * 118) : 2;
                  return (
                    <View key={`${month}-${index}`} style={styles.barColumn}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height,
                            backgroundColor:
                              preview && index === 4 ? Palette.accent : Palette.moss,
                            opacity: preview ? 1 : 0.22,
                          },
                        ]}
                      />
                      <Text style={styles.month}>{month}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHead
          index="02 / Grade mix"
          title="What left the field."
          aside={preview ? 'Sample distribution' : 'No grades'}
        />
        <View style={styles.grades}>
          {gradeMix.map((grade) => {
            const share = preview ? grade.share : 0;
            return (
              <View key={grade.grade} style={styles.gradeRow}>
                <View style={styles.gradeHead}>
                  <View style={styles.gradeLabel}>
                    <Text style={styles.gradeLetter}>{grade.grade}</Text>
                    <Text style={styles.gradeNote}>{grade.note}</Text>
                  </View>
                  <Text style={styles.gradeValue}>
                    {preview ? `${Math.round(grade.share * 100)}%` : '0%'}
                  </Text>
                </View>
                <View style={styles.gradeTrack}>
                  <View
                    style={[
                      styles.gradeFill,
                      { width: `${share * 100}%`, backgroundColor: grade.color },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHead index="03 / Ledger" title="Cost, then return." aside="Per season" />
        <View style={styles.ledger}>
          {[
            ['Seedlings', preview ? 'PHP 2,400' : '—'],
            ['Labour', preview ? 'PHP 5,200' : '—'],
            ['Inputs & energy', preview ? 'PHP 3,100' : '—'],
            ['Grade A revenue', preview ? 'PHP 18,400' : '—'],
          ].map(([label, value]) => (
            <View key={label} style={styles.ledgerRow}>
              <Text style={styles.ledgerLabel}>{label}</Text>
              <Text style={styles.ledgerValue}>{value}</Text>
            </View>
          ))}
          <View style={[styles.ledgerRow, styles.ledgerTotal]}>
            <Text style={styles.ledgerTotalLabel}>Net return</Text>
            <Text style={styles.ledgerTotalValue}>{preview ? 'PHP 7,700' : 'PHP 0'}</Text>
          </View>
        </View>
        <Text style={styles.ledgerNote}>
          Estimates only. Market prices are entered by you; the system never invents a rate.
        </Text>
      </View>

      <View style={styles.section}>
        <SectionHead index="04 / Archive" title="Filed reports." aside="0 documents" />
        <View style={styles.archive}>
          <View style={styles.archiveHead}>
            <Meta>Report</Meta>
            <Meta>Period</Meta>
          </View>
          <View style={styles.archiveEmpty}>
            <Text style={styles.archiveTitle}>No report has been filed.</Text>
            <Text style={styles.archiveBody}>
              Grade one harvest, add the market price, and the first report can be written.
            </Text>
            <FieldButton
              label="Generate after first harvest"
              variant="outline"
              compact
              disabled
            />
          </View>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: 'rgba(248,244,234,0.5)',
  },
  bannerPreview: {
    borderColor: 'rgba(196,86,45,0.28)',
    backgroundColor: Palette.accentSoft,
  },
  bannerBar: {
    width: 2,
    alignSelf: 'stretch',
    backgroundColor: Palette.accent,
    borderRadius: 1,
  },
  bannerTitle: {
    ...Type.label,
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
  },
  bannerBody: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.muted,
    maxWidth: 520,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 20,
    overflow: 'hidden',
  },
  kpiGridWide: {},
  kpiCell: {
    padding: 18,
    backgroundColor: 'rgba(248,244,234,0.4)',
  },
  kpiCellWide: {
    width: '25%',
    borderLeftWidth: 1,
    borderLeftColor: Palette.line,
  },
  kpiCellHalf: {
    width: '50%',
  },
  kpiCellLeft: {
    borderRightWidth: 1,
    borderRightColor: Palette.line,
  },
  kpiCellTop: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  section: {
    gap: 20,
  },
  chartHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  chartHeadCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  chartValue: {
    ...Type.numeral,
    fontSize: 30,
    lineHeight: 32,
  },
  chart: {
    flexDirection: 'row',
    gap: 10,
    height: 160,
    marginTop: 10,
  },
  axis: {
    justifyContent: 'space-between',
    paddingBottom: 18,
    width: 26,
  },
  axisLabel: {
    ...Type.caption,
    fontSize: 7.5,
    color: Palette.dim,
  },
  plot: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Palette.line,
  },
  chartEmpty: {
    position: 'absolute',
    top: 42,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 4,
  },
  chartEmptyTitle: {
    ...Type.labelSmall,
    fontSize: 12,
    color: Palette.muted,
  },
  chartEmptyNote: {
    ...Type.caption,
    fontSize: 7.5,
    color: Palette.dim,
    textAlign: 'center',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    gap: 6,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  bar: {
    width: '62%',
    minWidth: 10,
    maxWidth: 34,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  month: {
    ...Type.caption,
    fontSize: 8,
    color: Palette.muted,
  },
  grades: {
    gap: 16,
  },
  gradeRow: {
    gap: 7,
  },
  gradeHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  gradeLabel: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  gradeLetter: {
    ...Type.subtitle,
    fontSize: 18,
  },
  gradeNote: {
    ...Type.caption,
    fontSize: 8,
    color: Palette.muted,
  },
  gradeValue: {
    ...Type.mono,
    fontSize: 12,
    color: Palette.text,
  },
  gradeTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(22,26,20,0.08)',
    overflow: 'hidden',
  },
  gradeFill: {
    height: 4,
    borderRadius: 2,
  },
  ledger: {
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  ledgerLabel: {
    ...Type.body,
    fontSize: 13,
  },
  ledgerValue: {
    ...Type.mono,
    fontSize: 12,
    color: Palette.text,
  },
  ledgerTotal: {
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: Palette.hairline,
    paddingTop: 14,
    marginTop: 2,
  },
  ledgerTotalLabel: {
    ...Type.label,
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
  },
  ledgerTotalValue: {
    ...Type.numeral,
    fontSize: 24,
    lineHeight: 26,
  },
  ledgerNote: {
    ...Type.caption,
    fontSize: 8,
    lineHeight: 13,
    color: Palette.dim,
    marginTop: -8,
  },
  archive: {
    gap: 14,
  },
  archiveHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  archiveEmpty: {
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
  },
  archiveTitle: {
    ...Type.title,
    fontSize: 23,
  },
  archiveBody: {
    ...Type.body,
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 440,
  },
});
