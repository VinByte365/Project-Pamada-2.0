import { Image, StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/Colors';

const noise = require('../assets/images/noise.png') as number;

/**
 * The paper ground. A flat, warm stock with a fixed film grain.
 * Never attached to a scrolling container, never animated.
 */
export function PaperBackground({ tone = 'paper' }: { tone?: 'paper' | 'ink' }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: tone === 'ink' ? Palette.ink : Palette.background },
        ]}
      />
      <Image source={noise} resizeMode="repeat" style={styles.grain} />
      <View style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  grain: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },
  vignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
  },
});
