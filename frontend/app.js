import { api, getToken, AuthRedirectError, ApiError } from '/api.js';
import { ensureClerkReady } from '/clerk-bootstrap.js';

const ONBOARDING_QUESTIONNAIRE_VERSION = 'onboarding-v1';
const ONBOARDING_DEFAULTS = {
  questionnaireVersion: ONBOARDING_QUESTIONNAIRE_VERSION,
  goals: ['general_fitness'],
  experienceLevel: 'beginner',
  trainingDaysPerWeek: 3,
  sessionDurationMinutes: 30,
  equipmentAccess: ['bodyweight'],
  focusAreas: ['upper_body', 'lower_body', 'core'],
  limitations: [],
  preferredStyles: ['balanced'],
};

let todayWorkoutType = null;
let todayWorkoutDate = null;
let todayWorkoutSaved = false;
let todaySaveInFlight = false;
let activeExerciseIndex = 0;
let currentShellMode = 'loading';
let onboardingDraftTimer = null;
let onboardingLastSavedSignature = '';
let onboardingHydrating = false;
let onboardingSubmitting = false;

const appState = {
  me: null,
  onboarding: null,
};

const onboardingShell = document.getElementById('onboarding-shell');
const onboardingForm = document.getElementById('onboarding-form');
const onboardingSaveStatus = document.getElementById('onboarding-save-status');
const onboardingSubmitError = document.getElementById('onboarding-submit-error');
const onboardingStatusBadge = document.getElementById('onboarding-status-badge');
const onboardingCompleteButton = document.getElementById('onboarding-complete-button');
const appShell = document.getElementById('app-shell');
const appNav = document.getElementById('app-nav');
const tabs = document.querySelectorAll('.tab-content');
const navItems = document.querySelectorAll('.nav-item');
const todayEmptyState = document.getElementById('today-empty-state');
const programEmptyState = document.getElementById('program-empty-state');
const programMain = document.getElementById('program-main');
const programRegenerateButton = document.getElementById('program-regenerate-button');
const historyEmpty = document.getElementById('history-empty');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    if (currentShellMode !== 'app') return;
    activateTab(item.getAttribute('data-tab'));
  });
});

document.addEventListener('click', event => {
  const actionTarget = event.target.closest('[data-action]');
  if (!actionTarget) return;

  if (actionTarget.dataset.action === 'regenerate-program') {
    handleRegenerateProgram(actionTarget);
  }
});

if (onboardingForm) {
  onboardingForm.addEventListener('change', handleOnboardingChange);
  onboardingForm.addEventListener('submit', handleOnboardingSubmit);
}

function activateTab(tabId) {
  if (!tabId) return;

  navItems.forEach(nav => nav.classList.toggle('active', nav.getAttribute('data-tab') === tabId));
  tabs.forEach(tab => tab.classList.toggle('active', tab.id === `tab-${tabId}`));

  if (tabId === 'history' && !document.getElementById('history-date').value) {
    const today = getTodayDateString();
    document.getElementById('history-date').value = today;
    loadHistory(today);
    return;
  }

  if (tabId === 'program') {
    loadProgram();
  }
}

function setShellMode(mode) {
  currentShellMode = mode;
  const isOnboarding = mode === 'onboarding';
  onboardingShell.classList.toggle('hidden', !isOnboarding);
  appShell.classList.toggle('hidden', isOnboarding);
  appNav.classList.toggle('hidden', isOnboarding);
}

function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function ensureApiObject(data, resourceName) {
  if (data && typeof data === 'object') {
    return data;
  }

  throw new Error(`Invalid ${resourceName} response`);
}

function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

function setTodayError(message = '') {
  document.getElementById('today-error').textContent = message;
}

function setTodayLockedMessage(message = '') {
  document.getElementById('today-locked-message').textContent = message;
}

function setProgramError(message = '') {
  document.getElementById('program-error').textContent = message;
}

function setOnboardingSaveStatus(message, tone = 'neutral') {
  onboardingSaveStatus.textContent = message;
  onboardingSaveStatus.dataset.tone = tone;
}

function setOnboardingSubmitError(message = '') {
  onboardingSubmitError.textContent = message;
}

function getActiveTabId() {
  const active = document.querySelector('.nav-item.active');
  return active?.getAttribute('data-tab') || 'today';
}

function setProgramActionsVisible(visible) {
  programRegenerateButton.classList.toggle('hidden', !visible);
}

function isOnboardingIncompleteError(error) {
  return error instanceof ApiError && error.status === 409 && error.message.includes('Onboarding not completed');
}

function isMissingProgramError(error) {
  return error instanceof ApiError && error.status === 409 && error.message.includes('Active program not found');
}

function createDefaultOnboardingData() {
  return {
    questionnaireVersion: ONBOARDING_DEFAULTS.questionnaireVersion,
    goals: ONBOARDING_DEFAULTS.goals.slice(),
    experienceLevel: ONBOARDING_DEFAULTS.experienceLevel,
    trainingDaysPerWeek: ONBOARDING_DEFAULTS.trainingDaysPerWeek,
    sessionDurationMinutes: ONBOARDING_DEFAULTS.sessionDurationMinutes,
    equipmentAccess: ONBOARDING_DEFAULTS.equipmentAccess.slice(),
    focusAreas: ONBOARDING_DEFAULTS.focusAreas.slice(),
    limitations: ONBOARDING_DEFAULTS.limitations.slice(),
    preferredStyles: ONBOARDING_DEFAULTS.preferredStyles.slice(),
  };
}

function mergeOnboardingData(answers) {
  const defaults = createDefaultOnboardingData();
  const source = answers && typeof answers === 'object' ? answers : {};

  return {
    questionnaireVersion:
      typeof source.questionnaireVersion === 'string' && source.questionnaireVersion.trim()
        ? source.questionnaireVersion.trim()
        : defaults.questionnaireVersion,
    goals: Array.isArray(source.goals) ? source.goals.slice() : defaults.goals,
    experienceLevel: typeof source.experienceLevel === 'string' ? source.experienceLevel : defaults.experienceLevel,
    trainingDaysPerWeek:
      Number.isInteger(source.trainingDaysPerWeek) ? source.trainingDaysPerWeek : defaults.trainingDaysPerWeek,
    sessionDurationMinutes:
      Number.isInteger(source.sessionDurationMinutes) ? source.sessionDurationMinutes : defaults.sessionDurationMinutes,
    equipmentAccess: Array.isArray(source.equipmentAccess) ? source.equipmentAccess.slice() : defaults.equipmentAccess,
    focusAreas: Array.isArray(source.focusAreas) ? source.focusAreas.slice() : defaults.focusAreas,
    limitations: Array.isArray(source.limitations) ? source.limitations.slice() : defaults.limitations,
    preferredStyles: Array.isArray(source.preferredStyles) ? source.preferredStyles.slice() : defaults.preferredStyles,
  };
}

function setCheckedValues(name, values) {
  const allowed = new Set(values);
  document
    .querySelectorAll(`input[name="${name}"]`)
    .forEach(input => {
      input.checked = allowed.has(input.value);
    });
}

function setRadioValue(name, value) {
  document
    .querySelectorAll(`input[name="${name}"]`)
    .forEach(input => {
      input.checked = input.value === String(value);
    });
}

function getCheckedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(input => input.value);
}

function getRadioValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || '';
}

function getNumberValue(name) {
  const value = Number.parseInt(getRadioValue(name), 10);
  return Number.isInteger(value) ? value : null;
}

function clearOnboardingErrors() {
  document.querySelectorAll('[data-error-for]').forEach(node => {
    node.textContent = '';
  });
}

function renderOnboardingErrors(errors) {
  clearOnboardingErrors();
  Object.entries(errors).forEach(([field, message]) => {
    const target = document.querySelector(`[data-error-for="${field}"]`);
    if (target) target.textContent = message;
  });
}

function buildOnboardingPayload() {
  return {
    questionnaireVersion:
      appState.onboarding?.questionnaireVersion ||
      appState.me?.onboarding?.questionnaireVersion ||
      ONBOARDING_QUESTIONNAIRE_VERSION,
    goals: getCheckedValues('goals'),
    experienceLevel: getRadioValue('experienceLevel'),
    trainingDaysPerWeek: getNumberValue('trainingDaysPerWeek'),
    sessionDurationMinutes: getNumberValue('sessionDurationMinutes'),
    equipmentAccess: getCheckedValues('equipmentAccess'),
    focusAreas: getCheckedValues('focusAreas'),
    limitations: getCheckedValues('limitations'),
    preferredStyles: getCheckedValues('preferredStyles'),
  };
}

function validateOnboardingPayload(payload) {
  const errors = {};

  if (payload.goals.length === 0) {
    errors.goals = 'Choose at least one goal.';
  }
  if (!payload.experienceLevel) {
    errors.experienceLevel = 'Choose your current experience level.';
  }
  if (!payload.trainingDaysPerWeek || payload.trainingDaysPerWeek < 2 || payload.trainingDaysPerWeek > 5) {
    errors.trainingDaysPerWeek = 'Pick a weekly training rhythm between 2 and 5 days.';
  }
  if (
    !payload.sessionDurationMinutes ||
    payload.sessionDurationMinutes < 20 ||
    payload.sessionDurationMinutes > 75
  ) {
    errors.sessionDurationMinutes = 'Pick a session length between 20 and 75 minutes.';
  }
  if (payload.equipmentAccess.length === 0) {
    errors.equipmentAccess = 'Choose at least one equipment option.';
  }
  if (payload.focusAreas.length === 0) {
    errors.focusAreas = 'Pick at least one focus area.';
  }
  if (payload.preferredStyles.length === 0) {
    errors.preferredStyles = 'Pick at least one style preference.';
  }

  return errors;
}

function updateOnboardingBadge(onboarding) {
  const status = onboarding?.status || 'not_started';

  if (status === 'draft') {
    onboardingStatusBadge.textContent = 'Draft saved';
    onboardingStatusBadge.classList.remove('hidden');
    return;
  }

  if (status === 'completed') {
    onboardingStatusBadge.textContent = 'Completed';
    onboardingStatusBadge.classList.remove('hidden');
    return;
  }

  onboardingStatusBadge.classList.add('hidden');
}

function hydrateOnboardingForm(onboarding) {
  const data = mergeOnboardingData(onboarding?.answers);

  onboardingHydrating = true;
  setCheckedValues('goals', data.goals);
  setRadioValue('experienceLevel', data.experienceLevel);
  setRadioValue('trainingDaysPerWeek', data.trainingDaysPerWeek);
  setRadioValue('sessionDurationMinutes', data.sessionDurationMinutes);
  setCheckedValues('equipmentAccess', data.equipmentAccess);
  setCheckedValues('focusAreas', data.focusAreas);
  setCheckedValues('limitations', data.limitations);
  setCheckedValues('preferredStyles', data.preferredStyles);
  onboardingHydrating = false;

  appState.onboarding = {
    ...onboarding,
    questionnaireVersion: onboarding?.questionnaireVersion || data.questionnaireVersion,
  };
  onboardingLastSavedSignature = JSON.stringify(buildOnboardingPayload());
  updateOnboardingBadge(appState.onboarding);
  clearOnboardingErrors();
  setOnboardingSubmitError('');
  setOnboardingSaveStatus(
    onboarding?.status === 'draft' ? 'Draft restored. We save updates as you go.' : 'We save your setup as you go.',
    'neutral'
  );
}

async function loadOnboardingState() {
  try {
    const onboarding = ensureApiObject(await api.getOnboarding(), 'onboarding');
    hydrateOnboardingForm(onboarding);
  } catch (error) {
    if (error instanceof AuthRedirectError) throw error;

    hydrateOnboardingForm({
      status: 'not_started',
      completed: false,
      questionnaireVersion: ONBOARDING_QUESTIONNAIRE_VERSION,
      answersUpdatedAt: null,
      completedAt: null,
      answers: createDefaultOnboardingData(),
    });
    setOnboardingSaveStatus('Could not load a saved draft. You can still continue.', 'error');
  }
}

async function enterOnboardingMode() {
  setShellMode('onboarding');
  await loadOnboardingState();
}

function renderEmptyState(container, title, message, actionText = '') {
  container.innerHTML = '';
  container.classList.remove('hidden');

  const titleEl = el('div', 'empty-state-title', title);
  const copyEl = el('p', 'empty-state-copy', message);
  container.appendChild(titleEl);
  container.appendChild(copyEl);

  if (actionText) {
    const action = el('button', 'secondary-button', actionText);
    action.type = 'button';
    action.dataset.action = 'regenerate-program';
    container.appendChild(action);
  }
}

function clearTodayEmptyState() {
  todayEmptyState.innerHTML = '';
  todayEmptyState.classList.add('hidden');
}

function clearProgramEmptyState() {
  programEmptyState.innerHTML = '';
  programEmptyState.classList.add('hidden');
}

function renderTodayRecoveryState() {
  const loader = document.getElementById('today-loader');
  const content = document.getElementById('today-content');
  const exercisesContainer = document.getElementById('today-exercises');
  const restMessage = document.getElementById('today-rest-message');
  const lockedMessage = document.getElementById('today-locked-message');

  loader.classList.add('hidden');
  content.classList.remove('hidden');
  document.getElementById('today-workout-name').textContent = 'Program needed';
  document.getElementById('today-workout-type').textContent = 'Recovery';
  exercisesContainer.classList.add('hidden');
  restMessage.classList.add('hidden');
  lockedMessage.classList.add('hidden');
  setTodayError('');
  setTodayLockedMessage('');
  renderEmptyState(
    todayEmptyState,
    'No active program yet',
    'Your preferences are saved, but there is no active plan to train from right now. Regenerate a plan from your saved setup and the main app will pick it up.',
    'Regenerate from preferences'
  );
}

function renderProgramRecoveryState() {
  const loader = document.getElementById('program-loader');
  const content = document.getElementById('program-content');

  loader.classList.add('hidden');
  content.classList.remove('hidden');
  programMain.classList.add('hidden');
  setProgramError('');
  renderEmptyState(
    programEmptyState,
    'Program not available',
    'We have your onboarding profile, but no active program is currently stored. Regenerate it from your saved preferences.',
    'Regenerate from preferences'
  );
}

function renderHistoryRecoveryState() {
  document.getElementById('history-loader').classList.add('hidden');
  document.getElementById('history-data').classList.add('hidden');
  historyEmpty.textContent = 'No active program yet. Regenerate your plan first.';
  historyEmpty.classList.remove('hidden');
  document.getElementById('history-error').textContent = '';
}

async function getExistingLog(date) {
  try {
    return await api.getLog(date);
  } catch (error) {
    if (error instanceof AuthRedirectError) throw error;
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

function collectWorkoutExercises() {
  const cards = Array.from(document.querySelectorAll('.exercise-card'));
  const hasMissingValues = cards.some(card =>
    Array.from(card.querySelectorAll('.set-input')).some(input => input.value.trim() === '')
  );

  if (hasMissingValues) {
    throw new Error('Complete every set before saving.');
  }

  return cards.map(card => ({
    id: card.dataset.id,
    sets: Array.from(card.querySelectorAll('.set-input')).map(input => Number.parseInt(input.value, 10) || 0),
  }));
}

async function saveTodayWorkout(triggerBtn, footerHint) {
  if (todaySaveInFlight || todayWorkoutSaved || !todayWorkoutType || !todayWorkoutDate) {
    return;
  }

  setTodayError('');
  todaySaveInFlight = true;

  if (triggerBtn) triggerBtn.disabled = true;
  if (footerHint) footerHint.textContent = 'Saving workout...';

  try {
    const existingLog = await getExistingLog(todayWorkoutDate);
    if (existingLog) {
      todayWorkoutSaved = true;
      await loadToday();
      return;
    }

    const exercises = collectWorkoutExercises();
    await api.logWorkout({ workout_type: todayWorkoutType, exercises, note: '' }, todayWorkoutDate);
    todayWorkoutSaved = true;

    const historyDate = document.getElementById('history-date').value;
    if (historyDate === todayWorkoutDate) {
      await loadHistory(todayWorkoutDate);
    }

    await loadToday();
  } catch (error) {
    if (error instanceof AuthRedirectError) return;

    if (error instanceof ApiError && error.status === 409) {
      todayWorkoutSaved = true;
      await loadToday();
      return;
    }

    setTodayError('Save error: ' + error.message);
  } finally {
    todaySaveInFlight = false;
    if (triggerBtn && triggerBtn.isConnected) triggerBtn.disabled = false;
    if (footerHint && footerHint.isConnected) footerHint.textContent = '';
  }
}

async function loadToday() {
  const loader = document.getElementById('today-loader');
  const content = document.getElementById('today-content');
  const exercisesContainer = document.getElementById('today-exercises');
  const restMessage = document.getElementById('today-rest-message');
  const lockedMessage = document.getElementById('today-locked-message');

  setTodayError('');
  setTodayLockedMessage('');
  clearTodayEmptyState();
  loader.classList.remove('hidden');
  content.classList.add('hidden');
  exercisesContainer.classList.remove('hidden');
  restMessage.classList.add('hidden');
  lockedMessage.classList.add('hidden');

  if (!appState.me?.lifecycle?.has_active_program) {
    renderTodayRecoveryState();
    return;
  }

  try {
    const data = ensureApiObject(await api.getTodayWorkout(), 'workout');
    const existingLog = await getExistingLog(data.date);

    loader.classList.add('hidden');
    content.classList.remove('hidden');

    todayWorkoutDate = data.date;
    todayWorkoutType = data.type === 'rest' ? null : data.type;
    todayWorkoutSaved = Boolean(existingLog);

    document.getElementById('today-workout-name').textContent = data.name || 'Workout';
    document.getElementById('today-workout-type').textContent = `Type: ${data.type}`;

    exercisesContainer.classList.remove('hidden');
    exercisesContainer.innerHTML = '';

    if (todayWorkoutSaved) {
      exercisesContainer.classList.add('hidden');
      setTodayLockedMessage(
        data.date === getTodayDateString()
          ? "Today's workout is already saved. Open History to review it."
          : `Workout for ${data.date} is already saved.`
      );
      lockedMessage.classList.remove('hidden');
      return;
    }

    if (data.type === 'rest') {
      exercisesContainer.classList.add('hidden');
      restMessage.classList.remove('hidden');
      return;
    }

    if (!data.exercises || data.exercises.length === 0) {
      exercisesContainer.innerHTML = '<div class="text-center text-secondary">No exercises</div>';
      return;
    }

    activeExerciseIndex = 0;

    data.exercises.forEach((exercise, index) => {
      const card = el('section', `card exercise-card${index === 0 ? ' active' : ''}`);
      card.dataset.id = exercise.id;
      card.dataset.index = String(index);
      card.dataset.total = String(data.exercises.length);

      let targetText = '';
      if (exercise.type === 'reps' && exercise.reps) targetText = `${exercise.reps.max} reps`;
      else if (exercise.type === 'time' && exercise.duration) targetText = `${exercise.duration.max} sec`;
      else if (exercise.type === 'cycles' && exercise.cycles) targetText = `${exercise.cycles.max} cycles`;

      const progress = el('div', 'exercise-progress');
      progress.appendChild(el('span', 'exercise-progress-current', `${index + 1}/${data.exercises.length}`));
      progress.appendChild(el('span', 'exercise-progress-label', 'Current exercise'));
      card.appendChild(progress);

      card.appendChild(el('div', 'card-title exercise-title', exercise.name || exercise.id));

      const chips = el('div', 'exercise-header-chips');
      if (targetText) chips.appendChild(el('div', 'exercise-chip', targetText));
      chips.appendChild(el('div', 'exercise-chip exercise-chip-accent', `${exercise.max_sets || 1} sets`));
      card.appendChild(chips);

      const helper = el('div', 'exercise-helper');
      helper.textContent = '';
      card.appendChild(helper);

      const setsContainer = el('div', 'sets-container');
      for (let indexOfSet = 0; indexOfSet < (exercise.max_sets || 1); indexOfSet += 1) {
        setsContainer.appendChild(createSetRow(indexOfSet + 1, exercise.type));
      }
      card.appendChild(setsContainer);

      const footer = el('div', 'exercise-card-footer');
      const footerHint = el('div', 'exercise-footer-hint', '');
      const confirmBtn = el('button', 'exercise-complete-btn', '✓');
      confirmBtn.type = 'button';
      confirmBtn.setAttribute(
        'aria-label',
        index === data.exercises.length - 1 ? 'Confirm last exercise' : 'Confirm and open next exercise'
      );
      confirmBtn.addEventListener('click', async () => {
        await advanceExercise(card);
      });
      footer.appendChild(footerHint);
      footer.appendChild(confirmBtn);
      card.appendChild(footer);

      exercisesContainer.appendChild(card);
    });

    syncExerciseStack();
  } catch (error) {
    loader.classList.add('hidden');
    if (error instanceof AuthRedirectError) return;

    if (isOnboardingIncompleteError(error)) {
      appState.me = {
        ...appState.me,
        lifecycle: {
          ...appState.me.lifecycle,
          onboarding_completed: false,
        },
      };
      await enterOnboardingMode();
      return;
    }

    if (isMissingProgramError(error)) {
      appState.me = {
        ...appState.me,
        lifecycle: {
          ...appState.me.lifecycle,
          has_active_program: false,
        },
      };
      renderTodayRecoveryState();
      return;
    }

    setTodayError('Error loading workout: ' + error.message);
  }
}

function createSetRow(index, type) {
  const row = el('div', 'set-row');
  row.appendChild(el('div', 'set-label', `Set ${index}`));

  const input = el('input', 'set-input');
  input.type = 'number';
  input.min = '0';
  input.placeholder = type === 'time' ? 'Sec' : 'Reps';
  row.appendChild(input);

  return row;
}

function setActiveExercise(nextIndex) {
  const cards = Array.from(document.querySelectorAll('.exercise-card'));
  activeExerciseIndex = Math.max(0, Math.min(nextIndex, cards.length - 1));

  cards.forEach((card, index) => {
    const isActive = index === activeExerciseIndex;
    const isCompleted = index < activeExerciseIndex;
    card.classList.toggle('active', isActive);
    card.classList.toggle('completed', isCompleted);
    card.classList.toggle('upcoming', index > activeExerciseIndex);
    card.classList.remove('is-entering');
    card.classList.remove('is-leaving');
    card.setAttribute('aria-hidden', String(!isActive));
  });

  const activeCard = cards[activeExerciseIndex];
  if (activeCard) {
    activeCard.classList.add('is-entering');
    window.setTimeout(() => activeCard.classList.remove('is-entering'), 320);
  }

  syncExerciseStack();
}

async function advanceExercise(card) {
  if (!card.classList.contains('active') || todaySaveInFlight) return;

  const inputs = Array.from(card.querySelectorAll('.set-input'));
  const isComplete = inputs.every(input => input.value.trim() !== '');
  if (!isComplete) {
    card.classList.add('exercise-card-invalid');
    window.setTimeout(() => card.classList.remove('exercise-card-invalid'), 380);
    return;
  }

  const cards = Array.from(document.querySelectorAll('.exercise-card'));
  const currentIndex = cards.indexOf(card);

  if (currentIndex >= 0 && currentIndex < cards.length - 1) {
    card.classList.add('is-leaving');
    window.setTimeout(() => setActiveExercise(currentIndex + 1), 180);
    return;
  }

  card.classList.add('completed-pulse');
  window.setTimeout(() => card.classList.remove('completed-pulse'), 320);
  const confirmBtn = card.querySelector('.exercise-complete-btn');
  const footerHint = card.querySelector('.exercise-footer-hint');
  await saveTodayWorkout(confirmBtn, footerHint);
}

function syncExerciseStack() {
  const container = document.getElementById('today-exercises');
  if (!container) return;

  const cards = Array.from(container.querySelectorAll('.exercise-card'));
  const remaining = Math.max(cards.length - activeExerciseIndex - 1, 0);
  container.style.setProperty('--stack-depth', String(Math.min(remaining, 2)));
}

document.getElementById('history-date').addEventListener('change', event => {
  loadHistory(event.target.value);
});

async function loadHistory(date) {
  const loader = document.getElementById('history-loader');
  const errorEl = document.getElementById('history-error');
  const content = document.getElementById('history-data');
  const empty = document.getElementById('history-empty');

  loader.classList.remove('hidden');
  content.classList.add('hidden');
  empty.classList.add('hidden');
  errorEl.textContent = '';

  if (!appState.me?.lifecycle?.has_active_program) {
    renderHistoryRecoveryState();
    return;
  }

  try {
    const data = await api.getLog(date);
    loader.classList.add('hidden');

    if (!data || !data.workout_type) {
      empty.textContent = 'No data for this day';
      empty.classList.remove('hidden');
      return;
    }

    content.classList.remove('hidden');
    document.getElementById('history-workout-type').textContent = data.workout_type;

    const exercisesContainer = document.getElementById('history-exercises');
    exercisesContainer.innerHTML = '';

    if (data.exercises && data.exercises.length > 0) {
      data.exercises.forEach((exercise, index) => {
        const card = el('article', 'card history-exercise-card');

        const header = el('div', 'history-exercise-header');
        header.appendChild(el('div', 'history-exercise-index', `#${index + 1}`));
        header.appendChild(el('div', 'card-title', exercise.id));
        card.appendChild(header);

        const chips = el('div', 'history-set-chips');
        exercise.sets.forEach((setValue, setIndex) => {
          chips.appendChild(el('div', 'history-set-chip', `Set ${setIndex + 1}: ${setValue}`));
        });
        card.appendChild(chips);
        exercisesContainer.appendChild(card);
      });
    } else {
      exercisesContainer.innerHTML = '<div class="card history-empty-card">No exercises</div>';
    }

    document.getElementById('history-note').textContent = data.note || 'No notes added for this workout.';
  } catch (error) {
    loader.classList.add('hidden');
    if (error instanceof AuthRedirectError) return;

    if (isOnboardingIncompleteError(error)) {
      await enterOnboardingMode();
      return;
    }

    if (isMissingProgramError(error)) {
      appState.me = {
        ...appState.me,
        lifecycle: {
          ...appState.me.lifecycle,
          has_active_program: false,
        },
      };
      renderHistoryRecoveryState();
      return;
    }

    if (error instanceof ApiError && error.status === 404) {
      empty.textContent = 'No data for this day';
      empty.classList.remove('hidden');
    } else {
      errorEl.textContent = 'Error loading history: ' + error.message;
    }
  }
}

async function loadProgram() {
  const loader = document.getElementById('program-loader');
  const content = document.getElementById('program-content');
  const scheduleContainer = document.getElementById('program-schedule');
  const workoutsContainer = document.getElementById('program-workouts');

  setProgramError('');
  clearProgramEmptyState();
  setProgramActionsVisible(Boolean(appState.me?.lifecycle?.onboarding_completed));

  if (!appState.me?.lifecycle?.has_active_program) {
    renderProgramRecoveryState();
    return;
  }

  loader.classList.remove('hidden');
  content.classList.add('hidden');
  programMain.classList.add('hidden');

  try {
    const data = ensureApiObject(await api.getProgram(), 'program');
    loader.classList.add('hidden');
    content.classList.remove('hidden');
    programMain.classList.remove('hidden');

    const userSets = data.userSets ?? {};
    scheduleContainer.innerHTML = '';
    workoutsContainer.innerHTML = '';

    if (data.schedule) {
      const days = [
        ['monday', 'Mon'],
        ['tuesday', 'Tue'],
        ['wednesday', 'Wed'],
        ['thursday', 'Thu'],
        ['friday', 'Fri'],
        ['saturday', 'Sat'],
        ['sunday', 'Sun'],
      ];

      days.forEach(([key, label]) => {
        const row = el('div', 'program-schedule-row');
        row.appendChild(el('span', 'program-day', label));
        row.appendChild(el('span', 'program-day-value', data.schedule[key] || 'Rest'));
        scheduleContainer.appendChild(row);
      });
    }

    if (data.workouts) {
      Object.entries(data.workouts).forEach(([type, workout]) => {
        const card = el('section', 'card program-workout-card');

        const header = el('div', 'program-workout-header');
        header.appendChild(el('div', 'card-title', workout.name || type));
        header.appendChild(el('div', 'program-workout-type', type.toUpperCase()));
        card.appendChild(header);

        if (workout.exercises && workout.exercises.length > 0) {
          const list = el('div', 'program-exercise-list');
          workout.exercises.forEach(exercise => {
            const row = el('div', 'program-exercise-row');
            const main = el('div', 'program-exercise-main');
            main.appendChild(el('div', 'program-exercise-name', exercise.name || exercise.id));

            let target = '';
            if (exercise.type === 'reps' && exercise.reps) target = `${exercise.reps.max} reps`;
            else if (exercise.type === 'time' && exercise.duration) target = `${exercise.duration.max} sec`;
            else if (exercise.type === 'cycles' && exercise.cycles) target = `${exercise.cycles.max} cycles`;

            main.appendChild(el('div', 'program-exercise-detail', target || 'Custom target'));
            row.appendChild(main);

            const currentSets = userSets[exercise.id] ?? 1;
            row.appendChild(el('div', 'program-sets-pill', `${currentSets}/${exercise.max_sets} sets`));
            list.appendChild(row);
          });
          card.appendChild(list);
        } else {
          card.appendChild(el('div', 'text-secondary', 'No exercises'));
        }

        workoutsContainer.appendChild(card);
      });
    }
  } catch (error) {
    loader.classList.add('hidden');
    if (error instanceof AuthRedirectError) return;

    if (isOnboardingIncompleteError(error)) {
      await enterOnboardingMode();
      return;
    }

    if (isMissingProgramError(error)) {
      appState.me = {
        ...appState.me,
        lifecycle: {
          ...appState.me.lifecycle,
          has_active_program: false,
        },
      };
      renderProgramRecoveryState();
      return;
    }

    setProgramError('Error loading program: ' + error.message);
  }
}

function handleOnboardingChange() {
  if (onboardingHydrating) return;

  if (onboardingSubmitError.textContent) {
    renderOnboardingErrors(validateOnboardingPayload(buildOnboardingPayload()));
  }

  setOnboardingSubmitError('');
  scheduleOnboardingDraftSave();
}

function scheduleOnboardingDraftSave() {
  if (currentShellMode !== 'onboarding') return;
  window.clearTimeout(onboardingDraftTimer);
  setOnboardingSaveStatus('Saving draft...', 'pending');

  onboardingDraftTimer = window.setTimeout(async () => {
    const payload = buildOnboardingPayload();
    const signature = JSON.stringify(payload);

    if (signature === onboardingLastSavedSignature) {
      setOnboardingSaveStatus('All changes saved.', 'neutral');
      return;
    }

    try {
      await api.saveOnboardingDraft(payload);
      onboardingLastSavedSignature = signature;
      appState.onboarding = {
        ...(appState.onboarding || {}),
        status: 'draft',
        completed: false,
        questionnaireVersion: payload.questionnaireVersion,
        answers: payload,
      };
      updateOnboardingBadge(appState.onboarding);
      setOnboardingSaveStatus('Draft saved.', 'success');
    } catch (error) {
      if (error instanceof AuthRedirectError) return;
      setOnboardingSaveStatus('Could not save draft right now.', 'error');
    }
  }, 450);
}

async function handleOnboardingSubmit(event) {
  event.preventDefault();
  if (onboardingSubmitting) return;

  window.clearTimeout(onboardingDraftTimer);
  const payload = buildOnboardingPayload();
  const errors = validateOnboardingPayload(payload);

  renderOnboardingErrors(errors);
  if (Object.keys(errors).length > 0) {
    setOnboardingSubmitError('Fill the highlighted fields before we generate your plan.');
    return;
  }

  onboardingSubmitting = true;
  onboardingCompleteButton.disabled = true;
  setOnboardingSubmitError('');
  setOnboardingSaveStatus('Generating your plan...', 'pending');

  try {
    await api.completeOnboarding(payload);
    onboardingLastSavedSignature = JSON.stringify(payload);
    await refreshProductState();
  } catch (error) {
    if (error instanceof AuthRedirectError) return;
    setOnboardingSubmitError(error.message || 'Could not complete onboarding.');
    setOnboardingSaveStatus('We could not generate the plan yet.', 'error');
  } finally {
    onboardingSubmitting = false;
    onboardingCompleteButton.disabled = false;
  }
}

async function handleRegenerateProgram(trigger) {
  if (!appState.me?.lifecycle?.onboarding_completed) return;
  if (trigger.disabled) return;

  const confirmed = window.confirm('Regenerate your current program from your saved preferences?');
  if (!confirmed) return;

  trigger.disabled = true;
  setProgramError('');
  setTodayError('');

  try {
    await api.regenerateProgram();
    await refreshProductState();

    if (getActiveTabId() === 'program') {
      await loadProgram();
    }
  } catch (error) {
    if (error instanceof AuthRedirectError) return;

    if (isOnboardingIncompleteError(error)) {
      await enterOnboardingMode();
      return;
    }

    setProgramError('Could not regenerate program: ' + error.message);
  } finally {
    trigger.disabled = false;
  }
}

async function refreshProductState() {
  const me = ensureApiObject(await api.getMe(), 'product state');
  appState.me = me;

  if (!me.lifecycle.onboarding_completed) {
    await enterOnboardingMode();
    return;
  }

  setShellMode('app');
  setProgramActionsVisible(true);
  activateTab(getActiveTabId());

  if (!me.lifecycle.has_active_program) {
    renderTodayRecoveryState();
    if (getActiveTabId() === 'program') {
      renderProgramRecoveryState();
    }
    return;
  }

  await loadToday();
}

async function bootstrapApp() {
  try {
    const { isSignedIn } = await ensureClerkReady();

    if (!getToken() && !isSignedIn) {
      window.location.replace('/login');
      return;
    }
  } catch (error) {
    console.error('Failed to initialize Clerk on the main app page:', error);

    if (!getToken()) {
      window.location.replace('/login');
      return;
    }
  }

  try {
    await refreshProductState();
  } catch (error) {
    if (error instanceof AuthRedirectError) return;

    if (isOnboardingIncompleteError(error)) {
      await enterOnboardingMode();
      return;
    }

    if (isMissingProgramError(error)) {
      setShellMode('app');
      setProgramActionsVisible(true);
      renderTodayRecoveryState();
      return;
    }

    setShellMode('app');
    setTodayError('Error loading app: ' + error.message);
  }
}

bootstrapApp();
