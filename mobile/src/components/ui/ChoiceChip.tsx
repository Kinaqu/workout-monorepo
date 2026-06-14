import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from './AppText';

export interface ChoiceChipProps {
  label: string;
  description?: string;
  selected?: boolean;
  onPress?: () => void;
}

export function ChoiceChip({ label, description, selected = false, onPress }: ChoiceChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <AppText style={[styles.label, selected && styles.labelSelected]}>{label}</AppText>
      {description ? <AppText variant="muted">{description}</AppText> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  chip: {
    minWidth: 96,
    gap: 4,
    padding: theme.space.md,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfacePanel,
  },
  chipSelected: {
    borderColor: 'rgba(111, 182, 255, 0.42)',
    backgroundColor: 'rgba(111, 182, 255, 0.12)',
  },
  label: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 13,
    color: theme.colors.copyPrimary,
  },
  labelSelected: {
    color: theme.colors.foreground,
  },
}));
