import { useEffect } from 'react';

import {
  AuthRedirectError,
  isMissingProgramError,
  isOnboardingIncompleteError,
} from '@/lib/api/errors';

// The catch-block routing that used to be copy-pasted into every feature's
// load function: auth redirects are swallowed (the API client already
// navigated), onboarding/missing-program errors hand control back to the
// app shell, anything else is the feature's to display.
export interface ApiErrorRouting {
  onEnterOnboarding: () => void | Promise<void>;
  onMissingProgram: () => void;
}

export type ApiErrorKind = 'auth-redirect' | 'onboarding-incomplete' | 'missing-program' | 'unhandled';

export function classifyApiError(error: unknown): ApiErrorKind {
  if (error instanceof AuthRedirectError) return 'auth-redirect';
  if (isOnboardingIncompleteError(error)) return 'onboarding-incomplete';
  if (isMissingProgramError(error)) return 'missing-program';
  return 'unhandled';
}

export function getApiErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

/**
 * Runs the shared routing side effects whenever `error` changes.
 * `onRecovery` is invoked for missing-program errors so the feature can
 * switch to its recovery UI after the shell has been notified.
 */
export function useRoutedApiError(
  error: unknown,
  routing: ApiErrorRouting,
  onRecovery?: () => void
): void {
  useEffect(() => {
    if (!error) return;

    const kind = classifyApiError(error);
    if (kind === 'onboarding-incomplete') {
      void routing.onEnterOnboarding();
    } else if (kind === 'missing-program') {
      routing.onMissingProgram();
      onRecovery?.();
    }
    // routing callbacks are stable for the lifetime of a feature bridge.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);
}
