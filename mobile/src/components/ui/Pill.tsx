import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export type PillTone = 'neutral' | 'accent';

export interface PillProps {
  children: ReactNode;
  tone?: PillTone;
}

export function Pill({ children, tone = 'neutral' }: PillProps) {
  return (
    <View style={[styles.pill, tone === 'accent' && styles.pillAccent]}>
      <Text style={[styles.text, tone === 'accent' && styles.textAccent]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  pill: {
    alignSelf: 'flex-start',
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surfacePanelStrong,
  },
  pillAccent: {
    backgroundColor: 'rgba(18, 91, 255, 0.12)',
  },
  text: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.copySecondary,
  },
  textAccent: {
    color: theme.colors.accentSoft,
  },
}));
