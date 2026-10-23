import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AloeMark } from '@/components/AloeArt';
import {
  Card,
  FieldButton,
  Meta,
  Rule,
  SectionHead,
  Stamp,
} from '@/components/FieldUI';
import { PaperBackground } from '@/components/PaperBackground';
import { Palette } from '@/constants/Colors';
import { Layout } from '@/constants/Metrics';
import { Type } from '@/constants/Typography';
import { useAppStore } from '@/stores/useAppStore';

export default function ModalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { localProfileId, accountStatus, setLocalProfile } = useAppStore();

  const createProfile = () => {
    if (!localProfileId) {
      setLocalProfile(`local-${Date.now().toString(36)}`);
    }
  };

  return (
    <View style={styles.screen}>
      <PaperBackground />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.frame}>
          <View style={styles.handle} />

          <View style={styles.masthead}>
            <View style={styles.brand}>
              <AloeMark size={24} color={Palette.moss} />
              <Meta tone="ink">FarmSystem</Meta>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={12}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              style={styles.close}
            >
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={16}
                weight="light"
                tintColor={Palette.text}
              />
            </Pressable>
          </View>

          <Rule />

          <View style={styles.head}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowRule} />
              <Meta>Local identity</Meta>
            </View>
            <Text style={styles.title}>Offline, by default.</Text>
            <Text style={styles.body}>
              The whole app works without an account. A local profile simply keeps your
              records together until you decide to sync.
            </Text>
          </View>

          <Card tone="ink">
            <View style={styles.statusHead}>
              <View style={styles.headerCopy}>
                <Meta tone="cream">Account status</Meta>
                <Text style={styles.statusTitle}>
                  {accountStatus === 'synced' ? 'Linked to the cloud.' : 'This device only.'}
                </Text>
              </View>
              <Stamp
                label={localProfileId ? 'Profile active' : 'No profile'}
                tone="cream"
              />
            </View>

            <View style={styles.idRow}>
              <View style={{ gap: 4, flex: 1 }}>
                <Meta tone="cream">Profile ID</Meta>
                <Text style={styles.id}>{localProfileId ?? 'not created'}</Text>
              </View>
              <View style={styles.statusDotWrap}>
                <View style={styles.statusDot} />
              </View>
            </View>

            <Text style={styles.idNote}>
              {localProfileId
                ? 'Records created from now on attach to this identifier.'
                : 'No email, password or connection is required to create one.'}
            </Text>
          </Card>

          <View style={styles.actions}>
            {!localProfileId ? (
              <FieldButton
                label="Create local profile"
                onPress={createProfile}
                variant="accent"
                style={{ flexGrow: 1 }}
              />
            ) : (
              <FieldButton
                label="Done"
                onPress={() => router.back()}
                variant="ink"
                style={{ flexGrow: 1 }}
              />
            )}
          </View>

          <View style={styles.section}>
            <SectionHead
              index="01 / Later, if you want"
              title="What syncing adds."
              aside="Optional"
            />
            <View>
              {[
                ['Cloud backup', 'A second copy of farms, plants and scans.'],
                ['Multi-device access', 'See the same ledger from another phone.'],
                ['Community', 'Publish field notes when the signal returns.'],
              ].map(([title, note], index) => (
                <View key={title} style={[styles.row, index === 0 && styles.rowFirst]}>
                  <Text style={styles.rowId}>0{index + 1}</Text>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.rowTitle}>{title}</Text>
                    <Text style={styles.rowNote}>{note}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              You can close this sheet and keep working. Nothing here expires and nothing
              is sent.
            </Text>
            <Meta>Group 03 · 2026</Meta>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    paddingHorizontal: Layout.gutter,
  },
  frame: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    gap: 24,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(22,26,20,0.18)',
    alignSelf: 'center',
    marginBottom: 2,
  },
  masthead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  head: {
    gap: 12,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  eyebrowRule: {
    width: 18,
    height: 2,
    backgroundColor: Palette.accent,
  },
  title: {
    ...Type.displaySmall,
    fontSize: 43,
    lineHeight: 45,
  },
  body: {
    ...Type.body,
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 480,
  },
  statusHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  statusTitle: {
    ...Type.title,
    fontSize: 25,
    color: Palette.cream,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: Palette.inkLine,
    paddingTop: 16,
    marginTop: 4,
  },
  id: {
    ...Type.monoLarge,
    fontSize: 14,
    color: Palette.cream,
  },
  statusDotWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(241,236,224,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.accent,
  },
  idNote: {
    ...Type.caption,
    fontSize: 8,
    lineHeight: 13,
    color: Palette.creamDim,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  section: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  rowFirst: {
    borderTopColor: Palette.border,
  },
  rowId: {
    ...Type.caption,
    color: Palette.accent,
    width: 24,
    paddingTop: 2,
  },
  rowTitle: {
    ...Type.label,
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
  },
  rowNote: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.muted,
  },
  footer: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    paddingTop: 16,
  },
  footerNote: {
    ...Type.body,
    fontSize: 12,
    lineHeight: 18,
    color: Palette.muted,
  },
});
