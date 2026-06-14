import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';

// Stub — real port lands in Step 4 (features/onboarding).
export default function OnboardingScreen() {
  return (
    <Screen>
      <View style={styles.content}>
        <EmptyState title="Onboarding" message="Coming soon." />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { flex: 1, padding: theme.space.xl, justifyContent: 'center' },
}));
