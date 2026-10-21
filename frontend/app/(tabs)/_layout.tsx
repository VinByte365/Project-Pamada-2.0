import { Tabs } from 'expo-router/js-tabs';

import { FieldTabBar } from '@/components/FieldTabBar';
import { Palette } from '@/constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FieldTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        animation: 'fade',
        sceneStyle: { backgroundColor: Palette.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="farms" options={{ title: 'Farms' }} />
      <Tabs.Screen name="plants" options={{ title: 'Plants' }} />
      <Tabs.Screen name="sensors" options={{ title: 'Sensors' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
