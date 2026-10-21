import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AloeMark } from '@/components/AloeArt';
import { Entry } from '@/components/Entry';
import { Eyebrow } from '@/components/Eyebrow';
import { Rule, ScreenFooter } from '@/components/FieldUI';
import { PaperBackground } from '@/components/PaperBackground';
import { Palette } from '@/constants/Colors';
import { Layout } from '@/constants/Metrics';
import { Type } from '@/constants/Typography';

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  index?: string;
  aside?: string;
  back?: boolean;
  actions?: ReactNode;
  children?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: boolean;
};

export function ScreenShell({
  eyebrow,
  title,
  description,
  index,
  aside,
  back = false,
  actions,
  children,
  contentStyle,
  footer = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  return (
    <View style={styles.screen}>
      <PaperBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 14,
            paddingBottom: back ? 72 : Layout.tabBarInset,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.frame}>
          <View style={styles.masthead}>
            <View style={styles.mastheadLeft}>
              {back ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  hitSlop={10}
                  onPress={goBack}
                  style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                >
                  <SymbolView
                    name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }}
                    size={15}
                    tintColor={Palette.text}
                    weight="light"
                  />
                  <Text style={styles.backLabel}>Back</Text>
                </Pressable>
              ) : (
                <View style={styles.brand}>
                  <AloeMark size={25} color={Palette.moss} />
                  <Text style={styles.brandWord}>FARMSYSTEM</Text>
                </View>
              )}
            </View>
            <Text style={styles.pageIndex}>{index ?? aside ?? 'FIELD LEDGER'}</Text>
          </View>

          <Rule style={styles.topRule} />

          <Entry delay={40} style={styles.head}>
            <Eyebrow label={eyebrow} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
            {actions ? <View style={styles.actions}>{actions}</View> : null}
          </Entry>

          <View style={[styles.body, contentStyle]}>{children}</View>

          {footer ? <ScreenFooter /> : null}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.gutter,
  },
  frame: {
    width: '100%',
    maxWidth: Layout.maxWidth,
    alignSelf: 'center',
    gap: 30,
  },
  masthead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  mastheadLeft: {
    flex: 1,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandWord: {
    ...Type.meta,
    color: Palette.text,
    fontSize: 10,
    letterSpacing: 1.6,
  },
  pageIndex: {
    ...Type.caption,
    color: Palette.dim,
    textAlign: 'right',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  backLabel: {
    ...Type.meta,
    color: Palette.text,
  },
  topRule: {
    marginTop: 12,
  },
  head: {
    gap: 16,
    paddingTop: 10,
  },
  title: {
    ...Type.displaySmall,
    fontSize: 41,
    lineHeight: 43,
    letterSpacing: -1.7,
    maxWidth: 560,
  },
  description: {
    ...Type.body,
    fontSize: 15.5,
    lineHeight: 24,
    maxWidth: 520,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 4,
  },
  body: {
    gap: 38,
  },
  pressed: {
    opacity: 0.55,
  },
});
