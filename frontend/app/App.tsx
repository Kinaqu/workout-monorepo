import { useEffect, useRef, useState } from 'react';

import { api } from '../lib/api/client.ts';
import type { MeResponse } from '../lib/api/contracts.ts';
import {
  AuthRedirectError,
  isMissingProgramError,
  isOnboardingIncompleteError,
  isRecommendationDraftUnsupportedError,
} from '../lib/api/errors.ts';
import { createHistoryController } from '../features/history/index.ts';
import { HistoryTab } from '../features/history/HistoryTab.tsx';
import { createOnboardingController } from '../features/onboarding/index.ts';
import { OnboardingShell } from '../features/onboarding/OnboardingShell.tsx';
import { createProgramController } from '../features/program/index.ts';
import { ProgramTab } from '../features/program/ProgramTab.tsx';
import { createRecommendationController } from '../features/recommendation/index.ts';
import { RecommendationShell } from '../features/recommendation/RecommendationShell.tsx';
import { createTodayController } from '../features/today/index.ts';
import { TodayTab } from '../features/today/TodayTab.tsx';
import { getApiErrorMessage } from '../shared/hooks/use-routed-api-error.ts';
import { ensureApiObject } from '../shared/utils/guards.ts';
import {
  hasActiveProgram,
  hasCompletedOnboarding,
  selectShellMode,
  setMe,
  setShellMode as setProductShellMode,
  updateMeLifecycle,
  type ShellMode,
} from './product-state.ts';
import { BottomNav, type TabId } from './BottomNav.tsx';

interface ShellBindings {
  setShellMode: (mode: ShellMode) => void;
  setActiveTab: (tab: TabId) => void;
}

// The orchestration that used to live in app.js: lifecycle refresh,
// shell-mode routing, tab activation, and the bootstrap error ladder.
function createAppController(bindings: ShellBindings) {
  let currentTab: TabId = 'today';
  let started = false;

  function showShellMode(mode: ShellMode) {
    setProductShellMode(mode);
    bindings.setShellMode(mode);
  }

  function handleMissingProgram() {
    updateMeLifecycle({ has_active_program: false });
    program.setActionsVisible(false);
  }

  async function activateTab(tabId: TabId) {
    currentTab = tabId;
    bindings.setActiveTab(tabId);

    if (tabId === 'history') {
      await history.loadSelected();
      return;
    }

    if (tabId === 'program') {
      await program.load();
    }
  }

  async function refreshProductState() {
    const me = ensureApiObject(await api.getMe(), 'product state') as MeResponse;
    setMe(me);

    if (hasActiveProgram()) {
      recommendation.reset();
      showShellMode('app');
      program.setActionsVisible(true);
      await activateTab(currentTab);
      await today.load();
      return;
    }

    if (!hasCompletedOnboarding()) {
      recommendation.reset();
      await onboarding.enter();
      return;
    }

    try {
      await recommendation.enter();
      return;
    } catch (error) {
      if (error instanceof AuthRedirectError) {
        throw error;
      }

      if (isRecommendationDraftUnsupportedError(error)) {
        recommendation.markUnsupported();
        console.warn('Recommendation draft flow is unavailable, falling back to legacy app shell.', error);
      } else {
        throw error;
      }
    }

    recommendation.reset();
    showShellMode('app');
    program.setActionsVisible(false);
    await activateTab(currentTab);

    today.renderRecoveryState();
    if (currentTab === 'program') {
      program.renderRecoveryState();
    }
    if (currentTab === 'history') {
      history.renderRecoveryState();
    }
  }

  const routing = {
    onEnterOnboarding: () => onboarding.enter(),
    onMissingProgram: handleMissingProgram,
  };

  const history = createHistoryController(routing);
  const today = createTodayController(routing);
  const program = createProgramController({ ...routing, onRefreshProductState: refreshProductState });
  const onboarding = createOnboardingController({ showShellMode, onCompleted: refreshProductState });
  const recommendation = createRecommendationController({ showShellMode, onActivated: refreshProductState });

  async function bootstrap() {
    if (started) return;
    started = true;

    try {
      await refreshProductState();
    } catch (error) {
      if (error instanceof AuthRedirectError) return;

      if (isOnboardingIncompleteError(error)) {
        await onboarding.enter();
        return;
      }

      if (isMissingProgramError(error)) {
        showShellMode('app');
        program.setActionsVisible(false);
        today.renderRecoveryState();
        return;
      }

      showShellMode('app');
      today.setExternalError(`Error loading app: ${getApiErrorMessage(error)}`);
    }
  }

  // Empty-state buttons render [data-action] attributes; the shell owns
  // the delegation, as app.js did.
  function handleDocumentClick(event: MouseEvent) {
    const actionTarget = (event.target as Element | null)?.closest?.('[data-action]') as HTMLElement | null;
    if (!actionTarget) return;

    if (actionTarget.dataset.action === 'regenerate-program') {
      void program.handleRegenerateProgram();
      return;
    }

    if (actionTarget.dataset.action === 'open-tab' && selectShellMode() === 'app') {
      void activateTab((actionTarget.dataset.targetTab as TabId) || 'today');
    }
  }

  return { history, today, program, onboarding, recommendation, activateTab, bootstrap, handleDocumentClick };
}

export function App() {
  const [shellMode, setShellMode] = useState<ShellMode>('loading');
  const [activeTab, setActiveTab] = useState<TabId>('today');

  const controllerRef = useRef<ReturnType<typeof createAppController> | null>(null);
  // useState setters are stable, so the controller can be built once.
  controllerRef.current ??= createAppController({ setShellMode, setActiveTab });
  const controller = controllerRef.current;

  useEffect(() => {
    void controller.bootstrap();
    document.addEventListener('click', controller.handleDocumentClick);
    return () => document.removeEventListener('click', controller.handleDocumentClick);
    // The controller never changes identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="container">
        <section
          id="onboarding-shell"
          className={shellMode === 'onboarding' ? '' : 'hidden'}
          aria-labelledby="onboarding-title"
        >
          <OnboardingShell {...controller.onboarding.props} />
        </section>

        <section
          id="recommendation-shell"
          className={shellMode === 'recommendation' ? '' : 'hidden'}
          aria-labelledby="recommendation-title"
        >
          <RecommendationShell {...controller.recommendation.props} />
        </section>

        <div id="app-shell" className={shellMode === 'app' ? '' : 'hidden'}>
          <div id="tab-today" className={`tab-content${activeTab === 'today' ? ' active' : ''}`}>
            <TodayTab {...controller.today.props} />
          </div>
          <div id="tab-history" className={`tab-content${activeTab === 'history' ? ' active' : ''}`}>
            <HistoryTab {...controller.history.props} />
          </div>
          <div id="tab-program" className={`tab-content${activeTab === 'program' ? ' active' : ''}`}>
            <ProgramTab {...controller.program.props} />
          </div>
        </div>
      </div>

      <BottomNav
        visible={shellMode === 'app'}
        activeTab={activeTab}
        onSelect={tab => void controller.activateTab(tab)}
      />
    </>
  );
}
