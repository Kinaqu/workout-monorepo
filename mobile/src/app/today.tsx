import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Screen } from '@/components/ui/Screen';
import { createTodayController } from '@/features/today';
import { TodayTab } from '@/features/today/TodayTab';

const routing = {
  onEnterOnboarding: () => {},
  onMissingProgram: () => {},
};

// Standalone harness for the Today screen until the navigation gate (task #8)
// instantiates the controller from /me. Without a signed-in session the
// controller settles into its recovery state, so this renders offline.
export default function TodayRoute() {
  const [controller] = useState(() => createTodayController(routing));

  useEffect(() => {
    void controller.load();
  }, [controller]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <TodayTab {...controller.props} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.space.xl,
    paddingBottom: theme.space.xxl * 2,
    gap: theme.space.md,
  },
}));
