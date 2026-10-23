import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/Colors';
import { Type } from '@/constants/Typography';

type TabConfig = {
  label: string;
  ios: SFSymbol;
  android: AndroidSymbol;
  web: AndroidSymbol;
};

const config: Record<string, TabConfig> = {
  index: { label: 'Home', ios: 'house', android: 'home', web: 'home' },
  farms: { label: 'Farms', ios: 'leaf', android: 'eco', web: 'eco' },
  plants: {
    label: 'Plants',
    ios: 'camera.macro',
    android: 'potted_plant',
    web: 'potted_plant',
  },
  sensors: {
    label: 'Sensors',
    ios: 'gauge.with.needle',
    android: 'sensors',
    web: 'sensors',
  },
  settings: {
    label: 'Settings',
    ios: 'gearshape',
    android: 'settings',
    web: 'settings',
  },
};

const ease = Easing.bezier(0.32, 0.72, 0, 1).factory();

function TabButton({
  label,
  symbol,
  focused,
  onPress,
}: {
  label: string;
  symbol: TabConfig;
  focused: boolean;
  onPress: () => void;
}) {
  const active = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    active.value = withTiming(focused ? 1 : 0, { duration: 280, easing: ease });
  }, [active, focused]);

  const activeStyle = useAnimatedStyle(() => ({
    opacity: active.value,
    transform: [{ scale: 0.92 + active.value * 0.08 }],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
    >
      <Animated.View pointerEvents="none" style={[styles.tabActive, activeStyle]} />
      <SymbolView
        name={{ ios: symbol.ios, android: symbol.android, web: symbol.web }}
        size={18}
        weight="light"
        tintColor={focused ? Palette.cream : Palette.muted}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Floating glass dock. Sits above the scroll surface with a paper tint,
 * a hairline rim and a single ink capsule for the active section.
 */
export function FieldTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) + 6 }]}
    >
      <View style={styles.dock}>
        <BlurView
          intensity={38}
          tint="light"
          blurMethod="dimezisBlurViewSdk31Plus"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.tint} />
        <View style={styles.items}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const item = config[route.name];
            if (!item) return null;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TabButton
                key={route.key}
                label={item.label}
                symbol={item}
                focused={focused}
                onPress={onPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  dock: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'rgba(248,244,234,0.64)',
    borderWidth: 1,
    borderColor: 'rgba(22,26,20,0.16)',
    boxShadow:
      '0 24px 48px -24px rgba(22,26,20,0.55), inset 0 1px 0 rgba(255,255,255,0.85)',
    elevation: 12,
  },
  tint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(248,244,234,0.32)',
  },
  items: {
    flexDirection: 'row',
    padding: 6,
    gap: 2,
    height: 66,
  },
  tab: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  tabPressed: {
    transform: [{ scale: 0.96 }],
  },
  tabActive: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    backgroundColor: Palette.ink,
  },
  tabLabel: {
    ...Type.labelSmall,
    fontSize: 9,
    lineHeight: 11,
    color: Palette.muted,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: Palette.cream,
  },
});
