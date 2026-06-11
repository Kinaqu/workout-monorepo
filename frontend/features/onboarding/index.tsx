// Coexistence bridge for the onboarding shell; see features/history/index.tsx.
// app.js still owns showing/hiding the #onboarding-shell section; the
// bridge's enter() decides between resuming the form and short-circuiting
// to onCompleted, exactly like the old loadOnboardingState flow.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { api } from '../../lib/api/client.ts';
import { AuthRedirectError } from '../../lib/api/errors.ts';
import { ensureApiObject } from '../../shared/utils/guards.js';
import {
  ONBOARDING_QUESTIONNAIRE_VERSION,
  createDefaultOnboardingData,
} from '../../shared/utils/onboarding.js';
import { selectMe, selectOnboarding, setOnboarding } from '../../store/app-store.js';
import { OnboardingShell, type OnboardingFormData, type OnboardingHydration } from './OnboardingShell.tsx';

interface OnboardingBridgeOptions {
  showShellMode: (mode: string) => void;
  onCompleted: () => Promise<void>;
}

interface OnboardingStateLike {
  status?: string;
  completed?: boolean;
  questionnaireVersion?: string | null;
  answers?: unknown;
}

interface MeStateLike {
  lifecycle?: { onboarding_completed?: boolean };
  onboarding?: { completed?: boolean };
}

function isCompletedOnboardingState(onboarding: OnboardingStateLike | null = selectOnboarding()): boolean {
  const me = selectMe() as MeStateLike | null;
  return Boolean(
    onboarding?.completed ||
      onboarding?.status === 'completed' ||
      me?.lifecycle?.onboarding_completed ||
      me?.onboarding?.completed
  );
}

export function createOnboardingFeature({ showShellMode, onCompleted }: OnboardingBridgeOptions) {
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
  const pushHydration = (onboarding: OnboardingStateLike, loadFailed: boolean) => {
    nonce += 1;
    hydration = { nonce, onboarding: onboarding as OnboardingHydration['onboarding'], loadFailed };
    listeners.forEach(listener => listener());
  };

  const container = document.getElementById('onboarding-shell');
  if (container) {
    createRoot(container).render(
      <StrictMode>
        <OnboardingShell
          subscribe={subscribe}
          getHydration={getHydration}
          isCompleted={() => isCompletedOnboardingState()}
          onDraftSaved={(payload: OnboardingFormData) => {
            setOnboarding({
              ...(selectOnboarding() || {}),
              status: 'draft',
              completed: false,
              questionnaireVersion: payload.questionnaireVersion,
              answers: payload,
            });
          }}
          onCompleted={onCompleted}
        />
      </StrictMode>
    );
  }

  async function enter() {
    const probingCompletedState = isCompletedOnboardingState();
    if (!probingCompletedState) {
      showShellMode('onboarding');
    }

    try {
      const onboarding = ensureApiObject(await api.getOnboarding(), 'onboarding') as OnboardingStateLike;
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

  return { enter };
}
