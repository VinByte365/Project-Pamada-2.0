import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius } from '@/constants/Metrics';
import { Type } from '@/constants/Typography';

export function Eyebrow({ label }: { label: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.dot} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.accent,
  },
  text: {
    ...Type.caption,
  },
});