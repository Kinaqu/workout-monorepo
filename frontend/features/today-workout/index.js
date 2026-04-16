import {
  api,
  ApiError,
  AuthRedirectError,
  isMissingProgramError,
  isOnboardingIncompleteError,
  isWorkoutAlreadyLoggedError,
  isWorkoutLogServerError,
  isWorkoutLogValidationError,
  startAuthSessionFlow,
} from '/lib/api/index.js';
import { hasActiveProgram } from '/store/app-store.js';
import { el, renderEmptyState } from '/shared/ui/dom.js';
import { getTodayDateString } from '/shared/utils/date.js';
import { formatDateLabel, formatWorkoutTypeLabel } from '/shared/utils/format.js';
import { ensureApiObject } from '/shared/utils/guards.js';

const todayEmptyState = document.getElementById('today-empty-state');
const todayGuidance = document.getElementById('today-guidance');
const todayGuidanceTitle = document.getElementById('today-guidance-title');
const todayGuidanceCopy = document.getElementById('today-guidance-copy');

export function createTodayWorkoutFeature({
  getHistorySelectedDate,
  loadHistoryForDate,
  onEnterOnboarding,
  onMissingProgram,
}) {
  let todayWorkoutType = null;
  let todayWorkoutDate = null;
  let todayWorkoutSaved = false;
  let todaySaveInFlight = false;
  let activeExerciseIndex = 0;

  function setTodayError(message = '') {
    document.getElementById('today-error').textContent = message;
  }

  function setTodayLockedMessage(message = '') {
    document.getElementById('today-locked-message').textContent = message;
  }

  function setTodayGuidanceContent(title = '', copy = '') {
    if (!todayGuidance || !todayGuidanceTitle || !todayGuidanceCopy) return;

    const visible = Boolean(title || copy);
    todayGuidance.classList.toggle('hidden', !visible);
    todayGuidanceTitle.textContent = title;
    todayGuidanceCopy.textContent = copy;
  }

  function clearTodayEmptyState() {
    todayEmptyState.innerHTML = '';
    todayEmptyState.classList.add('hidden');
  }

  function renderRecoveryState() {
    const loader = document.getElementById('today-loader');
    const content = document.getElementById('today-content');
    const exercisesContainer = document.getElementById('today-exercises');
    const restMessage = document.getElementById('today-rest-message');
    const lockedMessage = document.getElementById('today-locked-message');

    loader.classList.add('hidden');
    content.classList.remove('hidden');
    document.getElementById('today-workout-name').textContent = 'No plan yet';
    document.getElementById('today-workout-type').textContent = 'Build one to start';
    exercisesContainer.classList.add('hidden');
    restMessage.classList.add('hidden');
    lockedMessage.classList.add('hidden');
    setTodayError('');
    setTodayLockedMessage('');
    renderEmptyState(
      todayEmptyState,
      'No plan yet',
      'Build a plan first, then today’s workout will appear here.',
      { text: 'Open Plan', type: 'open-tab', targetTab: 'program' }
    );
    setTodayGuidanceContent('', '');
  }

  async function getExistingSession(date) {
    try {
      const response = await api.listSessions({ date, limit: 1 });
      return response.sessions[0] ?? null;
    } catch (error) {
      if (error instanceof AuthRedirectError) throw error;
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
    if (footerHint) footerHint.textContent = 'Saving...';

    try {
      const existingSession = await getExistingSession(todayWorkoutDate);
      if (existingSession) {
        todayWorkoutSaved = true;
        await load();
        return;
      }

      const exercises = collectWorkoutExercises();
      await api.logWorkout({ workout_type: todayWorkoutType, exercises, note: '' }, todayWorkoutDate);
      todayWorkoutSaved = true;

      if (getHistorySelectedDate() === todayWorkoutDate) {
        await loadHistoryForDate(todayWorkoutDate);
      }

      await load();
    } catch (error) {
      if (error instanceof AuthRedirectError) return;

      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        try {
          startAuthSessionFlow(error.message);
        } catch (redirectError) {
          if (redirectError instanceof AuthRedirectError) return;
          throw redirectError;
        }
      }

      if (isWorkoutAlreadyLoggedError(error)) {
        todayWorkoutSaved = true;
        await load();
        setTodayLockedMessage('This workout has already been saved for that date.');
        return;
      }

      if (isWorkoutLogValidationError(error)) {
        setTodayError(error.message);
        return;
      }

      if (isWorkoutLogServerError(error)) {
        setTodayError('Could not save workout right now. Please try again in a moment.');
        return;
      }

      setTodayError('Could not save workout: ' + error.message);
    } finally {
      todaySaveInFlight = false;
      if (triggerBtn && triggerBtn.isConnected) triggerBtn.disabled = false;
      if (footerHint && footerHint.isConnected) footerHint.textContent = footerHint.dataset.defaultText || '';
    }
  }

  function formatTodayExerciseTarget(exercise) {
    if (exercise.type === 'reps') {
      return formatTodayTargetRange(exercise.reps, 'reps');
    }

    if (exercise.type === 'time') {
      return formatTodayTargetRange(exercise.duration, 'sec');
    }

    return formatTodayTargetRange(exercise.cycles, 'cycles');
  }

  function formatTodayTargetRange(range, unit) {
    if (!range) {
      return '';
    }

    const min = Number.isInteger(range.min) ? range.min : null;
    const max = Number.isInteger(range.max) ? range.max : null;
    if (min === null && max === null) {
      return '';
    }
    if (min !== null && max !== null) {
      return min === max ? `${max} ${unit}` : `${min}-${max} ${unit}`;
    }

    return `${min ?? max} ${unit}`;
  }

  function resolveTodayExerciseSets(exercise) {
    const currentSets = Number.isInteger(exercise.sets) ? exercise.sets : null;
    const maxSets = Number.isInteger(exercise.max_sets) ? exercise.max_sets : null;
    return Math.max(1, currentSets ?? maxSets ?? 1);
  }

  function formatTodayExerciseSetsLabel(exercise, currentSets = resolveTodayExerciseSets(exercise)) {
    const maxSets = Number.isInteger(exercise.max_sets) ? exercise.max_sets : null;
    if (maxSets && maxSets > currentSets) {
      return `${currentSets}/${maxSets} sets`;
    }

    return `${currentSets} sets`;
  }

  function createSetRow(index, type) {
    const row = el('div', 'set-row');
    row.appendChild(el('div', 'set-label', `Set ${index}`));

    const input = el('input', 'set-input');
    input.type = 'number';
    input.min = '0';
    input.placeholder = type === 'time' ? 'Sec' : type === 'cycles' ? 'Cycles' : 'Reps';
    row.appendChild(input);

    return row;
  }

  function syncExerciseStack() {
    const container = document.getElementById('today-exercises');
    if (!container) return;

    const cards = Array.from(container.querySelectorAll('.exercise-card'));
    const remaining = Math.max(cards.length - activeExerciseIndex - 1, 0);
    container.style.setProperty('--stack-depth', String(Math.min(remaining, 2)));
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
    const footerHint = card.querySelector('.exercise-footer-hint');
    const isComplete = inputs.every(input => input.value.trim() !== '');
    if (!isComplete) {
      if (footerHint) {
        footerHint.textContent = 'Enter every set first.';
        window.setTimeout(() => {
          if (footerHint.isConnected) {
            footerHint.textContent = footerHint.dataset.defaultText || '';
          }
        }, 1400);
      }
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
    await saveTodayWorkout(confirmBtn, footerHint);
  }

  async function load() {
    const loader = document.getElementById('today-loader');
    const content = document.getElementById('today-content');
    const exercisesContainer = document.getElementById('today-exercises');
    const restMessage = document.getElementById('today-rest-message');
    const lockedMessage = document.getElementById('today-locked-message');

    setTodayError('');
    setTodayLockedMessage('');
    setTodayGuidanceContent('', '');
    clearTodayEmptyState();
    loader.classList.remove('hidden');
    content.classList.add('hidden');
    exercisesContainer.classList.remove('hidden');
    restMessage.classList.add('hidden');
    lockedMessage.classList.add('hidden');

    if (!hasActiveProgram()) {
      renderRecoveryState();
      return;
    }

    try {
      const data = ensureApiObject(await api.getTodayWorkout(), 'workout');
      const existingSession = await getExistingSession(data.date);

      loader.classList.add('hidden');
      content.classList.remove('hidden');

      todayWorkoutDate = data.date;
      todayWorkoutType = data.type === 'rest' ? null : data.type;
      todayWorkoutSaved = Boolean(existingSession);

      document.getElementById('today-workout-name').textContent = data.name || 'Today’s workout';
      document.getElementById('today-workout-type').textContent = formatWorkoutTypeLabel(data.type);

      exercisesContainer.classList.remove('hidden');
      exercisesContainer.innerHTML = '';

      if (todayWorkoutSaved) {
        exercisesContainer.classList.add('hidden');
        setTodayGuidanceContent('Workout already logged', 'Open History if you want to review the saved sets.');
        setTodayLockedMessage(
          data.date === getTodayDateString()
            ? 'Today is already done.'
            : `${formatDateLabel(data.date)} is already logged.`
        );
        lockedMessage.classList.remove('hidden');
        return;
      }

      if (data.type === 'rest') {
        exercisesContainer.classList.add('hidden');
        setTodayGuidanceContent('Recovery day', 'No logging needed today.');
        restMessage.classList.remove('hidden');
        return;
      }

      if (!data.exercises || data.exercises.length === 0) {
        exercisesContainer.innerHTML = '<div class="text-center text-secondary">No exercises</div>';
        setTodayGuidanceContent('Nothing to log', 'Today’s workout is empty.');
        return;
      }

      setTodayGuidanceContent('Log each set', 'Enter reps or seconds, then move to the next exercise.');
      activeExerciseIndex = 0;

      data.exercises.forEach((exercise, index) => {
        const isLastExercise = index === data.exercises.length - 1;
        const card = el('section', `card exercise-card${index === 0 ? ' active' : ''}`);
        card.dataset.id = exercise.id;
        card.dataset.index = String(index);
        card.dataset.total = String(data.exercises.length);
        const currentSets = resolveTodayExerciseSets(exercise);
        const targetText = formatTodayExerciseTarget(exercise);

        const progress = el('div', 'exercise-progress');
        progress.appendChild(el('span', 'exercise-progress-current', `${index + 1}/${data.exercises.length}`));
        progress.appendChild(el('span', 'exercise-progress-label', 'Exercise'));
        card.appendChild(progress);

        card.appendChild(el('div', 'card-title exercise-title', exercise.name || exercise.id));

        const chips = el('div', 'exercise-header-chips');
        if (targetText) chips.appendChild(el('div', 'exercise-chip', targetText));
        chips.appendChild(el('div', 'exercise-chip exercise-chip-accent', formatTodayExerciseSetsLabel(exercise, currentSets)));
        card.appendChild(chips);

        const helper = el('div', 'exercise-helper');
        helper.textContent =
          exercise.type === 'time'
            ? 'Enter seconds for each set.'
            : exercise.type === 'cycles'
              ? 'Enter cycles for each set.'
              : 'Enter reps for each set.';
        card.appendChild(helper);

        const setsContainer = el('div', 'sets-container');
        for (let indexOfSet = 0; indexOfSet < currentSets; indexOfSet += 1) {
          setsContainer.appendChild(createSetRow(indexOfSet + 1, exercise.type));
        }
        card.appendChild(setsContainer);

        const footer = el('div', 'exercise-card-footer');
        const footerHint = el(
          'div',
          'exercise-footer-hint',
          isLastExercise ? 'Fill every set to save.' : 'Fill every set to continue.'
        );
        footerHint.dataset.defaultText = footerHint.textContent;
        const confirmBtn = el('button', 'exercise-complete-btn', isLastExercise ? 'Save workout' : 'Next exercise');
        confirmBtn.type = 'button';
        confirmBtn.setAttribute('aria-label', isLastExercise ? 'Save workout' : 'Open next exercise');
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
        await onEnterOnboarding();
        return;
      }

      if (isMissingProgramError(error)) {
        onMissingProgram();
        renderRecoveryState();
        return;
      }

      setTodayError('Could not load today: ' + error.message);
    }
  }

  return {
    load,
    renderRecoveryState,
  };
}
