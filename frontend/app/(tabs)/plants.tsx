import { Href } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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
import { useAppStore } from '@/stores/useAppStore';
import {
  createPlant,
  listPlants,
  type PlantRecord,
  type PlantStatus,
} from '@/lib/db/plants';
import { enqueuePlantSync } from '@/lib/sync/syncManager';

type Filter = 'All' | PlantStatus;

type PlantDraft = {
  label: string;
  status: PlantStatus;
};

const filters: Filter[] = ['All', 'Needs scan', 'Ready', 'Archived'];
const statuses: PlantStatus[] = ['Needs scan', 'Ready', 'Archived'];

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

function countFor(item: Filter, plants: PlantRecord[]): number {
  if (item === 'All') return plants.length;
  return plants.filter((plant) => plant.status === item).length;
}

function statusTone(status: PlantStatus): 'outline' | 'accent' | 'moss' {
  if (status === 'Ready') return 'moss';
  if (status === 'Archived') return 'outline';
  return 'accent';
}

function specimenCode(id: string): string {
  return `#${id.slice(-6).toUpperCase()}`;
}

function filedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'date unknown';
  return date.toISOString().slice(0, 10);
}

function PlantForm({
  onCancel,
  onSave,
  saving,
  error,
}: {
  onCancel: () => void;
  onSave: (draft: PlantDraft) => void;
  saving: boolean;
  error: string | null;
}) {
  const [label, setLabel] = useState('');
  const [status, setStatus] = useState<PlantStatus>('Needs scan');
  const [labelFocused, setLabelFocused] = useState(false);
  const [focusedOption, setFocusedOption] = useState<PlantStatus | null>(null);
  const [cancelFocused, setCancelFocused] = useState(false);

  const submit = () => {
    if (saving) return;
    onSave({ label, status });
  };

  return (
    <Card style={styles.formCard}>
      <View style={styles.formHead}>
        <View style={styles.formHeadCopy}>
          <Meta tone="accent">New specimen</Meta>
          <Text style={styles.formTitle}>Register a plant</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel plant registration"
          hitSlop={10}
          onFocus={() => setCancelFocused(true)}
          onBlur={() => setCancelFocused(false)}
          onPress={onCancel}
          style={[styles.cancelButton, cancelFocused && styles.cancelButtonFocused]}
        >
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
      </View>

      <View style={styles.formFields}>
        <View style={styles.formField}>
          <Meta>Specimen label</Meta>
          <TextInput
            accessibilityLabel="Specimen label"
            value={label}
            onChangeText={setLabel}
            onFocus={() => setLabelFocused(true)}
            onBlur={() => setLabelFocused(false)}
            onSubmitEditing={submit}
            returnKeyType="done"
            placeholder="e.g. Bed 3 · Plant 07"
            placeholderTextColor={Palette.dim}
            maxLength={80}
            style={[styles.input, labelFocused && styles.inputFocused]}
            selectionColor={Palette.accent}
          />
        </View>
      </View>

      <View style={styles.statusField}>
        <Meta>Opening status</Meta>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Opening status"
          style={styles.statusOptions}
        >
          {statuses.map((option) => {
            const selected = status === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityLabel={option}
                accessibilityState={{ checked: selected }}
                onFocus={() => setFocusedOption(option)}
                onBlur={() => setFocusedOption(null)}
                onPress={() => setStatus(option)}
                style={[
                  styles.statusOption,
                  selected && styles.statusOptionActive,
                  focusedOption === option && styles.statusOptionFocused,
                ]}
              >
                <Text
                  style={[styles.statusOptionText, selected && styles.statusOptionTextActive]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {error ? (
        <Text style={styles.formError} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <View style={styles.formFoot}>
        <Text style={styles.formNote}>Stored on this device. No account needed.</Text>
        <FieldButton
          label={saving ? 'Saving…' : 'Register plant'}
          onPress={submit}
          variant="accent"
          compact
          disabled={saving}
          accessibilityLabel={saving ? 'Saving plant record' : 'Register plant'}
        />
      </View>
    </Card>
  );
}

export default function PlantsScreen() {
  const [filter, setFilter] = useState<Filter>('All');
  const [focusedFilter, setFocusedFilter] = useState<Filter | null>(null);
  const [plants, setPlants] = useState<PlantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const ownerId = useAppStore((state) => (state.accountStatus === 'synced' ? state.supabaseUserId : state.localProfileId));

  const loadPlants = useCallback(async () => {
    setLoading(true);
    setLoadError(false);

    try {
      const rows = await listPlants(ownerId);
      setPlants(rows);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    void loadPlants();
  }, [loadPlants]);

  useFocusEffect(
    useCallback(() => {
      void loadPlants();
    }, [loadPlants]),
  );

  const openForm = () => {
    setSaveError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setSaveError(null);
  };

  const savePlant = async (draft: PlantDraft) => {
    if (saving) return;

    setSaving(true);
    setSaveError(null);

    try {
      const saved = await createPlant(draft, ownerId);
      await enqueuePlantSync(saved, ownerId);
      setPlants((current) => [saved, ...current]);
      setFilter('All');
      setShowForm(false);
    } catch {
      setSaveError('The record could not be saved to this device. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const counts: Record<Filter, number> = {
    All: plants.length,
    'Needs scan': countFor('Needs scan', plants),
    Ready: countFor('Ready', plants),
    Archived: countFor('Archived', plants),
  };

  const flagged = counts['Needs scan'];
  const ready = counts.Ready;
  const countsKnown = !loading && !loadError;
  const visible = plants.filter((plant) => filter === 'All' || plant.status === filter);

  return (
    <ScreenShell
      eyebrow="03 / Plant archive"
      title="Every leaf has a history."
      description="One plant, one record. Scans attach to the specimen so the next decision has evidence behind it."
      index="03 / 05"
      actions={
        <>
          <FieldButton label="Scan a plant" href="/scan/diagnosis" />
          <FieldButton
            label="Register plant"
            onPress={openForm}
            variant="outline"
            disabled={showForm}
          />
        </>
      }
    >
      {showForm ? (
        <PlantForm
          onCancel={closeForm}
          onSave={(draft) => {
            void savePlant(draft);
          }}
          saving={saving}
          error={saveError}
        />
      ) : null}

      <View style={styles.stats}>
        <View style={styles.statCell}>
          <Stat
            label="Specimens"
            value={countsKnown ? String(plants.length) : '—'}
            note="on file"
          />
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Stat
            label="Flagged"
            value={countsKnown ? String(flagged) : '—'}
            note="awaiting scan"
          />
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Stat
            label="Ready"
            value={countsKnown ? String(ready) : '—'}
            note="to harvest"
          />
        </View>
      </View>

      <View style={styles.filters}>
        {filters.map((item) => {
          const active = filter === item;
          const count = countsKnown ? String(counts[item]) : '—';
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={
                countsKnown
                  ? `${item} filter, ${counts[item]} specimen${counts[item] === 1 ? '' : 's'}`
                  : loading
                    ? `${item} filter, reading records`
                    : `${item} filter, records unavailable`
              }
              accessibilityState={{ selected: active }}
              onFocus={() => setFocusedFilter(item)}
              onBlur={() => setFocusedFilter(null)}
              onPress={() => setFilter(item)}
              style={[
                styles.filter,
                active && styles.filterActive,
                focusedFilter === item && styles.filterFocused,
              ]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text>
              <Text style={[styles.filterCount, active && styles.filterCountActive]}>
                {count}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loadError ? (
        <Card style={styles.archive}>
          <View style={styles.archiveHead}>
            <Meta tone="accent">Specimen archive</Meta>
            <Stamp label="Unavailable" />
          </View>
          <View style={styles.statePanel}>
            <Text style={styles.archiveTitle} accessibilityRole="alert">
              The ledger could not be read.
            </Text>
            <Text style={styles.archiveText}>
              Plant records are kept in local storage on this device. Nothing has been changed.
              Try opening the ledger again.
            </Text>
            <View style={styles.emptyFoot}>
              <FieldButton
                label="Try again"
                onPress={() => setReloadKey((key) => key + 1)}
                compact
              />
            </View>
          </View>
        </Card>
      ) : loading ? (
        <Card style={styles.archive}>
          <View style={styles.archiveHead}>
            <Meta tone="accent">Specimen archive</Meta>
            <Stamp label="Reading" />
          </View>
          <View style={styles.statePanel}>
            <Text style={styles.archiveTitle}>Opening the local ledger…</Text>
            <Text style={styles.archiveText}>
              Reading specimen records stored on this device.
            </Text>
          </View>
        </Card>
      ) : plants.length === 0 ? (
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
                ].map(([recordLabel, value]) => (
                  <View key={recordLabel} style={styles.recordRow}>
                    <Text style={styles.recordLabel}>{recordLabel}</Text>
                    <Text style={styles.recordValue}>{value}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.emptyFoot}>
                <FieldButton label="Open the scanner" href="/scan/diagnosis" compact />
                <FieldButton
                  label="Register a plant"
                  onPress={openForm}
                  variant="outline"
                  compact
                />
              </View>
            </View>
          </View>
        </Card>
      ) : visible.length === 0 ? (
        <Card style={styles.archive}>
          <View style={styles.archiveHead}>
            <Meta tone="accent">Specimen archive</Meta>
            <Stamp label="Empty view" />
          </View>
          <View style={styles.statePanel}>
            <Text style={styles.archiveTitle}>No specimens marked “{filter}”.</Text>
            <Text style={styles.archiveText}>
              Switch the filter to see the rest of the archive, or register another specimen.
            </Text>
            <View style={styles.emptyFoot}>
              <FieldButton label="Show all" onPress={() => setFilter('All')} compact />
              <FieldButton
                label="Register a plant"
                onPress={openForm}
                variant="outline"
                compact
              />
            </View>
          </View>
        </Card>
      ) : (
        <Card style={styles.archive}>
          <View style={styles.archiveHead}>
            <View style={styles.archiveHeadCopy}>
              <Meta tone="accent">Specimen archive</Meta>
              <Meta>{filter === 'All' ? 'All records' : `${filter} filter`}</Meta>
            </View>
            <Stamp label={`${visible.length} on file`} tone="ink" />
          </View>

          <View style={styles.plantList}>
            {visible.map((plant) => {
              const created = filedDate(plant.createdAt);
              return (
                <View
                  key={plant.id}
                  accessible
                  accessibilityLabel={`${plant.label}. ${plant.status}. Filed ${created}.`}
                  style={styles.plantRow}
                >
                  <View style={styles.plantCopy}>
                    <Text style={styles.plantName}>{plant.label}</Text>
                    <Text style={styles.plantMeta} numberOfLines={1}>
                      {specimenCode(plant.id)} · Filed {created}
                    </Text>
                  </View>
                  <Stamp label={plant.status} tone={statusTone(plant.status)} />
                </View>
              );
            })}
          </View>

          <Text style={styles.archiveFootnote}>
            Read directly from this device’s local ledger. No network required.
          </Text>
        </Card>
      )}

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
  filterFocused: {
    borderColor: Palette.accent,
    boxShadow: '0 0 0 3px rgba(196,86,45,0.20)',
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
  archiveHeadCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
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
  emptyFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  statePanel: {
    gap: 12,
    paddingTop: 18,
    maxWidth: 520,
  },
  plantList: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  plantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  plantCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  plantName: {
    ...Type.subtitle,
    fontSize: 18,
    lineHeight: 22,
  },
  plantMeta: {
    ...Type.mono,
    fontSize: 10,
    lineHeight: 15,
    color: Palette.muted,
  },
  archiveFootnote: {
    ...Type.meta,
    fontSize: 8.5,
    lineHeight: 13,
    color: Palette.dim,
    paddingTop: 12,
  },
  formCard: {
    marginTop: 2,
  },
  formHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  formHeadCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  formTitle: {
    ...Type.subtitle,
    fontSize: 24,
  },
  cancelButton: {
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 6,
  },
  cancelButtonFocused: {
    borderColor: Palette.accent,
    boxShadow: '0 0 0 3px rgba(196,86,45,0.20)',
  },
  cancel: {
    ...Type.labelSmall,
    color: Palette.accentDeep,
  },
  formFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    marginTop: 12,
  },
  formField: {
    flex: 1,
    minWidth: 160,
    gap: 4,
  },
  input: {
    ...Type.bodyStrong,
    fontSize: 16,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: Palette.hairline,
    color: Palette.text,
    outlineWidth: 0,
    outlineStyle: 'none' as unknown as 'solid',
  },
  inputFocused: {
    borderBottomColor: Palette.accent,
  },
  statusField: {
    gap: 7,
    marginTop: 14,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  statusOptionActive: {
    backgroundColor: Palette.ink,
    borderColor: Palette.ink,
  },
  statusOptionFocused: {
    borderColor: Palette.accent,
    boxShadow: '0 0 0 3px rgba(196,86,45,0.20)',
  },
  statusOptionText: {
    ...Type.labelSmall,
    color: Palette.muted,
  },
  statusOptionTextActive: {
    color: Palette.cream,
  },
  formError: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.warn,
    marginTop: 12,
  },
  formFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    flexWrap: 'wrap',
    marginTop: 16,
  },
  formNote: {
    ...Type.body,
    fontSize: 11.5,
    lineHeight: 17,
    color: Palette.muted,
    flex: 1,
    minWidth: 200,
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
