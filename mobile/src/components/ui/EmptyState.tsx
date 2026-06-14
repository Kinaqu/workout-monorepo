import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from './AppText';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.card}>
      <AppText variant="title">{title}</AppText>
      <AppText variant="secondary">{message}</AppText>
      {action ? <Button title={action.label} onPress={action.onPress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    gap: theme.space.md,
    padding: theme.space.lg,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
}));
