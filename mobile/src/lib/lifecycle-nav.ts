// Maps the web shell's imperative lifecycle transitions onto Expo Router.
// frontend/app/App.tsx flipped `showShellMode` and called `refreshProductState`;
// here each lifecycle state is a route, so a transition is a navigation and the
// gate (app/index.tsx) re-derives the destination from a fresh /me.
import { router } from 'expo-router';

import { updateMeLifecycle } from '@/lib/product-state';
import { queryClient } from '@/lib/query/client';
import { queryKeys } from '@/lib/query/keys';
import type { ApiErrorRouting } from '@/shared/hooks/use-routed-api-error';

// Re-run the lifecycle gate after a flow completes (onboarding done, draft
// activated, program refreshed): drop the cached /me so the gate refetches and
// routes to the now-correct screen.
export async function refreshLifecycle(): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: queryKeys.me });
  router.replace('/');
}

// Shared ApiErrorRouting for the in-tab features. Mirrors app.js: an
// onboarding-incomplete error sends the user into onboarding; a missing-program
// error drops active-program state so the feature renders its recovery UI.
export const lifecycleRouting: ApiErrorRouting = {
  onEnterOnboarding: () => router.replace('/onboarding'),
  onMissingProgram: () => updateMeLifecycle({ has_active_program: false }),
};
