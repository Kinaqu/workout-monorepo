import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { Screen } from '@/components/ui/Screen';
import { createRecommendationController } from '@/features/recommendation';
import { RecommendationShell } from '@/features/recommendation/RecommendationShell';
import { AuthRedirectError, isRecommendationDraftUnsupportedError } from '@/lib/api/errors';
import { refreshLifecycle } from '@/lib/lifecycle-nav';

// Recommendation flow route. The gate sends users here when they have no active
// program but finished onboarding. enter() loads/creates the draft; on activation
// we re-run the lifecycle gate (→ today). If the backend doesn't support the
// draft flow, fall back to the Today recovery state, mirroring App.tsx.
export default function RecommendationScreen() {
  const [controller] = useState(() =>
    createRecommendationController({
      showShellMode: () => {},
      onActivated: () => {
        void refreshLifecycle();
      },
    })
  );

  useEffect(() => {
    void (async () => {
      try {
        await controller.enter();
      } catch (error) {
        if (error instanceof AuthRedirectError) return;
        if (isRecommendationDraftUnsupportedError(error)) {
          controller.markUnsupported();
          router.replace('/today');
          return;
        }
        // Other errors are surfaced inside the shell via view state.
      }
    })();
    // controller identity is stable for the screen's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <RecommendationShell {...controller.props} />
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
