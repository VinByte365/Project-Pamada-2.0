import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AloeMark } from '@/components/AloeArt';
import { Meta } from '@/components/FieldUI';
import { PaperBackground } from '@/components/PaperBackground';
import { Palette } from '@/constants/Colors';
import { Type } from '@/constants/Typography';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <PaperBackground />
      <View style={styles.center}>
        <AloeMark size={42} color={Palette.moss} />
        <Meta tone="accent">404 / Wrong turn</Meta>
        <Text style={styles.title}>This row is blank.</Text>
        <Text style={styles.body}>
          The page you were looking for is not in the ledger. Head back to the field and
          start again.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/')}
          style={styles.link}
        >
          <Text style={styles.linkText}>Back to home ↗</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 14,
  },
  title: {
    ...Type.displaySmall,
    textAlign: 'center',
  },
  body: {
    ...Type.body,
    textAlign: 'center',
    maxWidth: 340,
  },
  link: {
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: Palette.hairline,
    paddingBottom: 3,
  },
  linkText: {
    ...Type.label,
    fontFamily: 'Satoshi-Bold',
  },
});
