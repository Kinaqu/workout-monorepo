// Feature controller for the onboarding shell; ported verbatim from
// frontend/features/onboarding/index.ts (only import paths changed). enter()
// decides between resuming the form and short-circuiting to onCompleted, exactly
// like the old loadOnboardingState flow.
import {
  selectMe,
  selectOnboarding,
  setOnboarding,
  type OnboardingSnapshot,
} from '@/lib/product-state';
import { api } from '@/lib/api/client';
import { AuthRedirectError } from '@/lib/api/errors';
import { ensureApiObject } from '@/shared/utils/guards';
import {
  ONBOARDING_QUESTIONNAIRE_VERSION,
  createDefaultOnboardingData,
} from '@/shared/utils/onboarding';
import type { OnboardingFormData, OnboardingHydration, OnboardingShellProps } from './OnboardingShell';

interface OnboardingControllerOptions {
  showShellMode: (mode: 'onboarding') => void;
  onCompleted: () => Promise<void>;
}

function isCompletedOnboardingState(onboarding: OnboardingSnapshot | null = selectOnboarding()): boolean {
  const me = selectMe();
  return Boolean(
    onboarding?.completed ||
      onboarding?.status === 'completed' ||
      me?.lifecycle?.onboarding_completed ||
      me?.onboarding?.completed
  );
}

export function createOnboardingController({ showShellMode, onCompleted }: OnboardingControllerOptions) {
  let hydration: OnboardingHydration | null = null;
  let nonce = 0;
  const listeners = new Set<() => void>();

  const getHydration = () => hydration;
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  const pushHydration = (onboarding: OnboardingSnapshot, loadFailed: boolean) => {
    nonce += 1;
    hydration = { nonce, onboarding: onboarding as OnboardingHydration['onboarding'], loadFailed };
    listeners.forEach((listener) => listener());
  };

  const props: OnboardingShellProps = {
    subscribe,
    getHydration,
    isCompleted: () => isCompletedOnboardingState(),
    onDraftSaved: (payload: OnboardingFormData) => {
      setOnboarding({
        ...(selectOnboarding() || {}),
        status: 'draft',
        completed: false,
        questionnaireVersion: payload.questionnaireVersion,
        answers: payload,
      });
    },
    onCompleted,
  };

  async function enter() {
    const probingCompletedState = isCompletedOnboardingState();
    if (!probingCompletedState) {
      showShellMode('onboarding');
    }

    try {
      const onboarding = ensureApiObject(await api.getOnboarding(), 'onboarding') as OnboardingSnapshot;
      if (isCompletedOnboardingState(onboarding)) {
        setOnboarding(onboarding);
        await onCompleted();
        return;
      }

      setOnboarding({
        ...onboarding,
        questionnaireVersion: onboarding.questionnaireVersion || ONBOARDING_QUESTIONNAIRE_VERSION,
      });
      pushHydration(onboarding, false);
    } catch (error) {
      if (error instanceof AuthRedirectError) throw error;

      if (isCompletedOnboardingState()) {
        await onCompleted();
        return;
      }

      pushHydration(
        {
          status: 'not_started',
          completed: false,
          questionnaireVersion: ONBOARDING_QUESTIONNAIRE_VERSION,
          answers: createDefaultOnboardingData(),
        },
        true
      );
    }

    showShellMode('onboarding');
  }

  return { props, enter };
}
