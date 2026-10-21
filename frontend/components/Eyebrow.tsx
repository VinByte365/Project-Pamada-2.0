import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Type } from '@/constants/Typography';

export function Eyebrow({ label }: { label: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.rule} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
  },
  rule: {
    width: 18,
    height: 2,
    backgroundColor: Palette.accent,
  },
  text: {
    ...Type.meta,
    color: Palette.muted,
  },
});
