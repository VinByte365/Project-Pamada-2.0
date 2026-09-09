import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Eyebrow } from '@/components/Eyebrow';
import { Palette } from '@/constants/Colors';
import { Type } from '@/constants/Typography';

type Props = {
  eyebrow: string;
  title: string;
  description: string;
};

export function StubScreen({ eyebrow, title, description }: Props) {
  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title,
          headerShown: true,
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: Palette.background },
          headerTintColor: Palette.text,
          headerTitleStyle: { ...Type.label, color: Palette.muted },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow label={eyebrow} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{description}</Text>
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
    paddingTop: 52,
    paddingHorizontal: 24,
    paddingBottom: 140,
    gap: 24,
  },
  title: {
    ...Type.displaySmall,
    fontSize: 30,
    lineHeight: 34,
  },
  body: {
    ...Type.body,
    maxWidth: 340,
  },
});