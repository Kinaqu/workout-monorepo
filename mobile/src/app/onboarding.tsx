import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Screen } from '@/components/ui/Screen';
import { createOnboardingController } from '@/features/onboarding';
import { OnboardingShell } from '@/features/onboarding/OnboardingShell';
import { AuthRedirectError } from '@/lib/api/errors';
import { refreshLifecycle } from '@/lib/lifecycle-nav';
import { setShellMode } from '@/lib/product-state';

// Onboarding flow route. The gate sends users here when onboarding is incomplete.
// showShellMode flips the product-state snapshot (the shell's autosave guard
// reads it); onCompleted re-runs the lifecycle gate (→ recommendation or today).
export default function OnboardingScreen() {
  const [controller] = useState(() =>
    createOnboardingController({
      showShellMode: (mode) => setShellMode(mode),
      onCompleted: async () => {
        await refreshLifecycle();
      },
    })
  );

  useEffect(() => {
    void (async () => {
      try {
        await controller.enter();
      } catch (error) {
        if (error instanceof AuthRedirectError) return;
        // Non-auth errors are handled inside enter() (hydrates with loadFailed).
      }
    })();
    // controller identity is stable for the screen's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <OnboardingShell {...controller.props} />
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
