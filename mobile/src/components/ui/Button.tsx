import { Pressable, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export type ButtonTone = 'primary' | 'secondary';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  tone?: ButtonTone;
  disabled?: boolean;
}

export function Button({ title, onPress, tone = 'primary', disabled = false }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        tone === 'secondary' ? styles.secondary : styles.primary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, tone === 'secondary' && styles.labelSecondary]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  base: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.sm,
    paddingHorizontal: theme.space.lg,
    borderRadius: theme.radii.pill,
  },
  primary: {
    backgroundColor: theme.colors.accent,
  },
  secondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    color: theme.colors.onAccent,
  },
  labelSecondary: {
    color: theme.colors.copyPrimary,
  },
}));
