import { useAppStore } from '@/stores/useAppStore';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Palette } from '@/constants/Colors';
import { Radius } from '@/constants/Metrics';
import { Type } from '@/constants/Typography';

export default function ModalScreen() {
  const { localProfileId, accountStatus, setLocalProfile } = useAppStore();

  const createProfile = () => {
    if (!localProfileId) {
      setLocalProfile(`local-${Date.now().toString(36)}`);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <Text style={styles.kicker}>Local profile</Text>
        <Text style={styles.title}>Offline identity</Text>
        <Text style={styles.body}>
          You can use the whole app without an account. Your profile stays on
          this device until you register.
        </Text>
      </View>

      <View style={styles.bezel}>
        <View style={styles.core}>
          <Text style={styles.cardLabel}>Profile ID</Text>
          <Text style={styles.cardValue}>{localProfileId ?? 'Not created yet'}</Text>
        </View>
      </View>
      <View style={styles.bezel}>
        <View style={styles.core}>
          <Text style={styles.cardLabel}>Account status</Text>
          <Text style={styles.cardValue}>{accountStatus}</Text>
        </View>
      </View>

      {!localProfileId ? (
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={createProfile}
        >
          <Text style={styles.buttonLabel}>Create local profile</Text>
          <View style={styles.buttonChip}>
            <Text style={styles.buttonGlyph}>↗</Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
    paddingTop: 70,
    paddingHorizontal: 24,
    gap: 16,
  },
  hero: {
    gap: 10,
    marginBottom: 6,
  },
  kicker: {
    ...Type.caption,
    color: Palette.accent,
  },
  title: {
    ...Type.displaySmall,
  },
  body: {
    ...Type.body,
    maxWidth: 330,
  },
  bezel: {
    borderRadius: Radius.md,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  core: {
    borderRadius: Radius.md - 5,
    backgroundColor: 'rgba(13,15,22,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    gap: 5,
  },
  cardLabel: {
    ...Type.caption,
    color: Palette.dim,
  },
  cardValue: {
    ...Type.label,
    fontSize: 16,
    color: Palette.text,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: Radius.pill,
    backgroundColor: Palette.accent,
    paddingVertical: 14,
    paddingLeft: 22,
    paddingRight: 8,
    marginTop: 10,
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.88,
  },
  buttonLabel: {
    color: Palette.accentContrast,
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
  },
  buttonChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.accentContrast,
  },
  buttonGlyph: {
    color: Palette.accent,
    fontSize: 14,
  },
});