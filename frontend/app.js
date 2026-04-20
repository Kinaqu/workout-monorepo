import {
  AuthRedirectError,
  isMissingProgramError,
  isOnboardingIncompleteError,
  isRecommendationDraftUnsupportedError,
} from '/lib/api/index.js';
import { ensureClerkReady } from '/clerk-bootstrap.js';
import { createHistoryFeature } from '/features/history/index.js';
import { createOnboardingFeature } from '/features/onboarding/index.js';
import { createProgramFeature } from '/features/program/index.js';
import { createRecommendationFeature } from '/features/recommendation/index.js';
import { createProfileFeature } from '/features/settings-or-profile/index.js';
import { createTodayWorkoutFeature } from '/features/today-workout/index.js';
import { primeVisibleBoneyardLoaders } from '/shared/ui/boneyard.js';
import { selectShellMode, setShellMode, updateMeLifecycle } from '/store/app-store.js';

const onboardingShell = document.getElementById('onboarding-shell');
const recommendationShell = document.getElementById('recommendation-shell');
const appShell = document.getElementById('app-shell');
const appNav = document.getElementById('app-nav');
const tabs = document.querySelectorAll('.tab-content');
const navItems = document.querySelectorAll('.nav-item');

function showShellMode(mode) {
  setShellMode(mode);
  const isOnboarding = mode === 'onboarding';
  const isRecommendation = mode === 'recommendation';
  const isApp = mode === 'app';
  onboardingShell.classList.toggle('hidden', !isOnboarding);
  recommendationShell.classList.toggle('hidden', !isRecommendation);
  appShell.classList.toggle('hidden', !isApp);
  appNav.classList.toggle('hidden', !isApp);
}

primeVisibleBoneyardLoaders();

function getActiveTabId() {
  const active = document.querySelector('.nav-item.active');
  return active?.getAttribute('data-tab') || 'today';
}

const profileFeature = createProfileFeature();

let onboardingFeature;
let todayWorkoutFeature;
let historyFeature;
let programFeature;
let recommendationFeature;

function handleMissingProgram() {
  updateMeLifecycle({ has_active_program: false });
  programFeature.setActionsVisible(false);
}

async function activateTab(tabId) {
  if (!tabId) return;

  navItems.forEach(nav => nav.classList.toggle('active', nav.getAttribute('data-tab') === tabId));
  tabs.forEach(tab => tab.classList.toggle('active', tab.id === `tab-${tabId}`));

  if (tabId === 'history') {
    await historyFeature.loadSelected();
    return;
  }

  if (tabId === 'program') {
    await programFeature.load();
  }
}

async function refreshProductState() {
  await profileFeature.loadProductState();

  if (profileFeature.hasActiveProgram()) {
    recommendationFeature.reset();
    showShellMode('app');
    programFeature.setActionsVisible(true);

    const activeTabId = getActiveTabId();
    await activateTab(activeTabId);
    await todayWorkoutFeature.load();
    return;
  }

  if (!profileFeature.hasCompletedOnboarding()) {
    recommendationFeature.reset();
    await onboardingFeature.enter();
    return;
  }

  if (!profileFeature.hasActiveProgram()) {
    try {
      await recommendationFeature.enter();
      return;
    } catch (error) {
      if (error instanceof AuthRedirectError) {
        throw error;
      }

      if (isRecommendationDraftUnsupportedError(error)) {
        recommendationFeature.markUnsupported();
        console.warn('Recommendation draft flow is unavailable, falling back to legacy app shell.', error);
      } else {
        throw error;
      }
    }
  }

  recommendationFeature.reset();
  showShellMode('app');
  programFeature.setActionsVisible(false);

  const activeTabId = getActiveTabId();
  await activateTab(activeTabId);

  todayWorkoutFeature.renderRecoveryState();
  if (activeTabId === 'program') {
    programFeature.renderRecoveryState();
  }
  if (activeTabId === 'history') {
    historyFeature.renderRecoveryState();
  }
}

historyFeature = createHistoryFeature({
  onEnterOnboarding: () => onboardingFeature.enter(),
  onMissingProgram: handleMissingProgram,
});

todayWorkoutFeature = createTodayWorkoutFeature({
  getHistorySelectedDate: () => historyFeature.getSelectedDate(),
  loadHistoryForDate: date => historyFeature.load(date),
  onEnterOnboarding: () => onboardingFeature.enter(),
  onMissingProgram: handleMissingProgram,
});

programFeature = createProgramFeature({
  getActiveTabId,
  onEnterOnboarding: () => onboardingFeature.enter(),
  onMissingProgram: handleMissingProgram,
  onRefreshProductState: refreshProductState,
});

onboardingFeature = createOnboardingFeature({
  showShellMode,
  onCompleted: refreshProductState,
});

recommendationFeature = createRecommendationFeature({
  showShellMode,
  onActivated: refreshProductState,
});

historyFeature.init();
todayWorkoutFeature.init();
programFeature.init();

navItems.forEach(item => {
  item.addEventListener('click', () => {
    if (selectShellMode() !== 'app') return;
    void activateTab(item.getAttribute('data-tab'));
  });
});

document.addEventListener('click', event => {
  const actionTarget = event.target.closest('[data-action]');
  if (!actionTarget) return;

  if (actionTarget.dataset.action === 'regenerate-program') {
    void programFeature.handleRegenerateProgram(actionTarget);
    return;
  }

  if (actionTarget.dataset.action === 'open-tab' && selectShellMode() === 'app') {
    void activateTab(actionTarget.dataset.targetTab);
  }
});

async function bootstrapApp() {
  try {
    const { isSignedIn } = await ensureClerkReady();

    if (!isSignedIn) {
      window.location.replace('/login');
      return;
    }
  } catch (error) {
    console.error('Failed to initialize Clerk on the main app page:', error);
    window.location.replace('/login');
    return;
  }

  try {
    await refreshProductState();
  } catch (error) {
    if (error instanceof AuthRedirectError) return;

    if (isOnboardingIncompleteError(error)) {
      await onboardingFeature.enter();
      return;
    }

    if (isMissingProgramError(error)) {
      showShellMode('app');
      programFeature.setActionsVisible(false);
      todayWorkoutFeature.renderRecoveryState();
      return;
    }

    showShellMode('app');
    document.getElementById('today-error').textContent = 'Error loading app: ' + error.message;
  }
}

bootstrapApp();
