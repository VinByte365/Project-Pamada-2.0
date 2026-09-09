import { Tabs } from 'expo-router';
import { SymbolView, SFSymbol, AndroidSymbol } from 'expo-symbols';
import { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/Colors';
import { Radius } from '@/constants/Metrics';

type TabIconName = {
  ios: SFSymbol;
  android: AndroidSymbol;
  web?: AndroidSymbol;
};

const icon = (name: TabIconName) =>
  ({ color, size }: { color: ColorValue; size: number }) => (
    <SymbolView
      name={{ ios: name.ios, android: name.android, web: name.web ?? name.android }}
      size={size}
      tintColor={color}
    />
  );

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.text,
        tabBarInactiveTintColor: Palette.dim,
        tabBarLabelStyle: {
          fontFamily: 'Satoshi-Medium',
          fontSize: 10,
          letterSpacing: 0.6,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: insets.bottom > 0 ? insets.bottom + 8 : 16,
          height: 66,
          backgroundColor: 'rgba(10,12,18,0.72)',
          backdropFilter: 'blur(24px)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.10)',
          borderLeftWidth: 1,
          borderLeftColor: 'rgba(255,255,255,0.06)',
          borderRightWidth: 1,
          borderRightColor: 'rgba(255,255,255,0.06)',
          borderWidth: 0,
          borderRadius: Radius.float,
          paddingTop: 12,
          paddingBottom: 12,
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 48px -24px rgba(0,0,0,0.85)',
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: icon({ ios: 'house', android: 'home', web: 'home' }),
        }}
      />
      <Tabs.Screen
        name="farms"
        options={{
          title: 'Farms',
          tabBarIcon: icon({ ios: 'leaf', android: 'eco', web: 'eco' }),
        }}
      />
      <Tabs.Screen
        name="plants"
        options={{
          title: 'Plants',
          tabBarIcon: icon({
            ios: 'camera.macro',
            android: 'potted_plant',
            web: 'potted_plant',
          }),
        }}
      />
      <Tabs.Screen
        name="sensors"
        options={{
          title: 'Sensors',
          tabBarIcon: icon({
            ios: 'gauge.with.needle',
            android: 'sensors',
            web: 'sensors',
          }),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: icon({
            ios: 'gearshape',
            android: 'settings',
            web: 'settings',
          }),
        }}
      />
    </Tabs>
  );
}