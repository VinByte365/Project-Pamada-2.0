import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  Card,
  FieldButton,
  Meta,
  Rule,
  SectionHead,
  Stamp,
  Stat,
} from '@/components/FieldUI';
import { ScreenShell } from '@/components/ScreenShell';
import { Palette } from '@/constants/Colors';
import { Type } from '@/constants/Typography';

type Farm = {
  id: string;
  name: string;
  area: string;
  status: 'Active' | 'Fallow';
};

type Filter = 'All' | 'Active' | 'Fallow';

const filters: Filter[] = ['All', 'Active', 'Fallow'];

function PlotGrid() {
  return (
    <View style={styles.plotGrid}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.plot,
            index === 2 && styles.plotEmpty,
            index === 5 && styles.plotReserved,
          ]}
        >
          <Text style={styles.plotLabel}>Plot 0{index + 1}</Text>
        </View>
      ))}
    </View>
  );
}

function FarmForm({ onCancel, onSave }: { onCancel: () => void; onSave: (farm: Farm) => void }) {
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [focused, setFocused] = useState<'name' | 'area' | null>(null);

  const save = () => {
    const label = name.trim() || 'Untitled plot';
    const size = area.trim() || '—';
    onSave({ id: `${Date.now()}`, name: label, area: size, status: 'Active' });
  };

  return (
    <Card style={styles.formCard}>
      <View style={styles.formHead}>
        <View style={styles.formHeadCopy}>
          <Meta tone="accent">New record</Meta>
          <Text style={styles.formTitle}>Register a farm</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onCancel} hitSlop={10}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
      </View>
      <View style={styles.fields}>
        <View style={styles.field}>
          <Meta>Farm name</Meta>
          <TextInput
            value={name}
            onChangeText={setName}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
            placeholder="e.g. North plot"
            placeholderTextColor={Palette.dim}
            style={[styles.input, focused === 'name' && styles.inputFocused]}
            selectionColor={Palette.accent}
          />
        </View>
        <View style={styles.field}>
          <Meta>Area · hectares</Meta>
          <TextInput
            value={area}
            onChangeText={setArea}
            onFocus={() => setFocused('area')}
            onBlur={() => setFocused(null)}
            placeholder="0.0"
            placeholderTextColor={Palette.dim}
            keyboardType="decimal-pad"
            style={[styles.input, focused === 'area' && styles.inputFocused]}
            selectionColor={Palette.accent}
          />
        </View>
      </View>
      <View style={styles.formFoot}>
        <Text style={styles.formNote}>
          Preview only — records are held for this session until local storage lands in Phase 2.
        </Text>
        <FieldButton label="Save draft" onPress={save} variant="accent" compact />
      </View>
    </Card>
  );
}

export default function FarmsScreen() {
  const [filter, setFilter] = useState<Filter>('All');
  const [farms, setFarms] = useState<Farm[]>([]);
  const [showForm, setShowForm] = useState(false);

  const visible = farms.filter((farm) => filter === 'All' || farm.status === filter);
  const hectares = farms.reduce((total, farm) => {
    const value = Number.parseFloat(farm.area);
    return Number.isFinite(value) ? total + value : total;
  }, 0);

  return (
    <ScreenShell
      eyebrow="02 / Farm records"
      title="The places you grow."
      description="Keep every plot on one ledger. A farm record can start here, offline, and join the cloud only when you decide."
      index="02 / 05"
      actions={
        <FieldButton
          label="Register a farm"
          onPress={() => setShowForm(true)}
          disabled={showForm}
        />
      }
    >
      {showForm ? (
        <FarmForm
          onCancel={() => setShowForm(false)}
          onSave={(farm) => {
            setFarms((current) => [...current, farm]);
            setShowForm(false);
          }}
        />
      ) : null}

      <View style={styles.stats}>
        <View style={styles.statCell}>
          <Stat label="Farms" value={String(farms.length)} note="on the ledger" />
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Stat
            label="Hectares"
            value={farms.length ? hectares.toFixed(1) : '0.0'}
            note="under record"
          />
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Stat label="Plants" value="0" note="linked" />
        </View>
      </View>

      {showForm ? (
        <FarmForm
          onCancel={() => setShowForm(false)}
          onSave={(farm) => {
            setFarms((current) => [...current, farm]);
            setShowForm(false);
          }}
        />
      ) : null}

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
              <Text style={[styles.filterCount, active && styles.filterCountActive]}>
                {item === 'All' ? farms.length : farms.filter((farm) => farm.status === item).length}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {visible.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyHead}>
            <View style={styles.emptyHeadCopy}>
              <Meta tone="accent">Plot register</Meta>
              <Text style={styles.emptyTitle}>
                {farms.length === 0 ? 'No farms on the ledger yet.' : 'Nothing in this filter.'}
              </Text>
            </View>
            <Stamp label={farms.length === 0 ? 'Blank page' : 'Empty view'} />
          </View>
          <PlotGrid />
          <Text style={styles.emptyBody}>
            {farms.length === 0
              ? 'Start with one plot. Name it the way you know it in the field — the rest of the record can follow after the first scan.'
              : 'Add another plot or switch filters to see the records you have already drafted.'}
          </Text>
          <View style={styles.emptyFoot}>
            <FieldButton
              label={farms.length === 0 ? 'Register your first farm' : 'Register another farm'}
              onPress={() => setShowForm(true)}
              variant="outline"
              compact
            />
            <Text style={styles.emptyNote}>Stored locally · no account needed</Text>
          </View>
        </Card>
      ) : (
        <View>
          <View style={styles.listHead}>
            <Meta>Farm</Meta>
            <Meta>Area</Meta>
          </View>
          {visible.map((farm) => (
            <View key={farm.id} style={styles.farmRow}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.farmName}>{farm.name}</Text>
                <Text style={styles.farmNote}>Registered this session · preview</Text>
              </View>
              <Text style={styles.farmArea}>{farm.area} ha</Text>
              <Stamp label={farm.status} tone="moss" />
            </View>
          ))}
        </View>
      )}

      <SectionHead
        index="Record rules"
        title="Local is the original."
        note="The phone keeps the working copy. The cloud, when it arrives, is only a second copy."
      />
      <View style={styles.rules}>
        {[
          ['01', 'Write offline', 'Every farm is created and edited on the device first.'],
          ['02', 'Sync on your terms', 'Nothing leaves the phone until you register and connect.'],
          ['03', 'One source of truth', 'The local ledger stays authoritative when the signal drops.'],
        ].map(([id, title, note], index) => (
          <View key={id} style={[styles.ruleRow, index === 0 && styles.ruleRowFirst]}>
            <Text style={styles.ruleId}>{id}</Text>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.ruleTitle}>{title}</Text>
              <Text style={styles.ruleNote}>{note}</Text>
            </View>
          </View>
        ))}
      </View>
      <Rule />
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
    paddingHorizontal: 13,
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
  emptyCard: {
    marginTop: 2,
  },
  head: {
    gap: 12,
  },
  emptyHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  emptyHeadCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  emptyTitle: {
    ...Type.title,
    fontSize: 25,
  },
  plotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  plot: {
    width: '31.5%',
    aspectRatio: 1.7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: 'rgba(46,70,51,0.05)',
    padding: 7,
    justifyContent: 'flex-end',
  },
  plotEmpty: {
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  plotReserved: {
    backgroundColor: 'rgba(196,86,45,0.05)',
    borderColor: 'rgba(196,86,45,0.3)',
  },
  plotLabel: {
    ...Type.caption,
    fontSize: 7.5,
    color: Palette.muted,
  },
  emptyBody: {
    ...Type.body,
    fontSize: 13.5,
    lineHeight: 21,
    maxWidth: 460,
  },
  emptyFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  emptyNote: {
    ...Type.meta,
    fontSize: 8.5,
    color: Palette.dim,
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
  cancel: {
    ...Type.labelSmall,
    color: Palette.accentDeep,
  },
  fields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    marginTop: 8,
  },
  field: {
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
  },
  inputFocused: {
    borderBottomColor: Palette.accent,
  },
  formFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  formNote: {
    ...Type.body,
    fontSize: 11.5,
    lineHeight: 17,
    color: Palette.muted,
    flex: 1,
    minWidth: 200,
  },
  listHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  farmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  farmName: {
    ...Type.subtitle,
    fontSize: 18,
  },
  farmNote: {
    ...Type.body,
    fontSize: 11.5,
    color: Palette.muted,
  },
  farmArea: {
    ...Type.mono,
    fontSize: 12,
    color: Palette.muted,
  },
  rules: {
    marginTop: -12,
  },
  ruleRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  ruleRowFirst: {
    borderTopWidth: 0,
  },
  ruleId: {
    ...Type.caption,
    color: Palette.accent,
    width: 24,
  },
  ruleTitle: {
    ...Type.label,
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
  },
  ruleNote: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.muted,
  },
});
