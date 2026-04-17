import {
  AuthRedirectError,
  isMissingProgramError,
  isOnboardingIncompleteError,
} from '/lib/api/index.js';
import { ensureClerkReady } from '/clerk-bootstrap.js';
import { createHistoryFeature } from '/features/history/index.js';
import { createOnboardingFeature } from '/features/onboarding/index.js';
import { createProgramFeature } from '/features/program/index.js';
import { createProfileFeature } from '/features/settings-or-profile/index.js';
import { createTodayWorkoutFeature } from '/features/today-workout/index.js';
import { selectShellMode, setShellMode, updateMeLifecycle } from '/store/app-store.js';

const onboardingShell = document.getElementById('onboarding-shell');
const appShell = document.getElementById('app-shell');
const appNav = document.getElementById('app-nav');
const tabs = document.querySelectorAll('.tab-content');
const navItems = document.querySelectorAll('.nav-item');

function showShellMode(mode) {
  setShellMode(mode);
  const isOnboarding = mode === 'onboarding';
  onboardingShell.classList.toggle('hidden', !isOnboarding);
  appShell.classList.toggle('hidden', isOnboarding);
  appNav.classList.toggle('hidden', isOnboarding);
}

function getActiveTabId() {
  const active = document.querySelector('.nav-item.active');
  return active?.getAttribute('data-tab') || 'today';
}

const profileFeature = createProfileFeature();

let onboardingFeature;
let todayWorkoutFeature;
let historyFeature;
let programFeature;

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

  if (!profileFeature.hasCompletedOnboarding()) {
    await onboardingFeature.enter();
    return;
  }

  showShellMode('app');
  programFeature.setActionsVisible(profileFeature.hasActiveProgram());

  const activeTabId = getActiveTabId();
  await activateTab(activeTabId);

  if (!profileFeature.hasActiveProgram()) {
    todayWorkoutFeature.renderRecoveryState();
    if (activeTabId === 'program') {
      programFeature.renderRecoveryState();
    }
    if (activeTabId === 'history') {
      historyFeature.renderRecoveryState();
    }
    return;
  }

  await todayWorkoutFeature.load();
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
