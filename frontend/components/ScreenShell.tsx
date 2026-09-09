import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Eyebrow } from '@/components/Eyebrow';
import { Palette } from '@/constants/Colors';
import { Radius } from '@/constants/Metrics';
import { Type } from '@/constants/Typography';

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function ScreenShell({ eyebrow, title, description, children }: Props) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Eyebrow label={eyebrow} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{description}</Text>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    paddingTop: 96,
    paddingHorizontal: 24,
    paddingBottom: 140,
    gap: 24,
  },
  title: {
    ...Type.displaySmall,
  },
  body: {
    ...Type.body,
    maxWidth: 340,
  },
});