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
import { renderBoneyardLoader } from '/shared/ui/boneyard.js';
import { el, renderEmptyState } from '/shared/ui/dom.js';
import { getTodayDateString, shiftDateString } from '/shared/utils/date.js';
import { formatDateLabel, formatLongDateLabel, formatWorkoutTypeLabel } from '/shared/utils/format.js';
import { ensureApiObject } from '/shared/utils/guards.js';

const todayEmptyState = document.getElementById('today-empty-state');
const todayGuidance = document.getElementById('today-guidance');
const todayGuidanceTitle = document.getElementById('today-guidance-title');
const todayGuidanceCopy = document.getElementById('today-guidance-copy');
const todayDateInput = document.getElementById('today-date');
const todayDateLabel = document.getElementById('today-selected-date-label');
const todayDatePrevButton = document.getElementById('today-date-prev-button');
const todayDateNextButton = document.getElementById('today-date-next-button');
const todayDateResetButton = document.getElementById('today-date-reset-button');
const todayWorkoutDateLabel = document.getElementById('today-workout-date');
const todayRunProgressionButton = document.getElementById('today-run-progression-button');
const todayProgressionLastRun = document.getElementById('today-progression-last-run');
const todayProgressionFeedback = document.getElementById('today-progression-feedback');

function getLatestProgressionDate(progressionState = {}) {
  return Object.values(progressionState).reduce((latest, state) => {
    if (!state?.last_progression) {
      return latest;
    }

    if (!latest || state.last_progression > latest) {
      return state.last_progression;
    }

    return latest;
  }, '');
}

export function createTodayWorkoutFeature({
  getHistorySelectedDate,
  loadHistoryForDate,
  onEnterOnboarding,
  onMissingProgram,
}) {
  let todayWorkoutType = null;
  let todayWorkoutDate = getTodayDateString();
  let todayWorkoutSaved = false;
  let todaySaveInFlight = false;
  let todayLoadInFlight = false;
  let progressionRunInFlight = false;
  let activeExerciseIndex = 0;
  let lastProgressionDate = '';
  let lastProgressionRun = null;

  function init() {
    setSelectedDate(getTodayDateString());

    todayDateInput?.addEventListener('change', event => {
      void handleSelectedDate(event.target.value);
    });

    todayDatePrevButton?.addEventListener('click', () => {
      void handleSelectedDate(shiftDateString(getSelectedDate(), -1));
    });

    todayDateNextButton?.addEventListener('click', () => {
      void handleSelectedDate(shiftDateString(getSelectedDate(), 1));
    });

    todayDateResetButton?.addEventListener('click', () => {
      void handleSelectedDate(getTodayDateString());
    });

    todayRunProgressionButton?.addEventListener('click', () => {
      void handleRunProgression();
    });
  }

  function getSelectedDate() {
    return todayDateInput?.value || todayWorkoutDate || getTodayDateString();
  }

  function setSelectedDate(value) {
    const safeDate = value || getTodayDateString();
    todayWorkoutDate = safeDate;
    if (todayDateInput) {
      todayDateInput.value = safeDate;
    }

    if (todayDateLabel) {
      todayDateLabel.textContent =
        safeDate === getTodayDateString()
          ? `Today · ${formatLongDateLabel(safeDate)}`
          : `Viewing · ${formatLongDateLabel(safeDate)}`;
    }
  }

  async function handleSelectedDate(value) {
    setSelectedDate(value);
    await load();
  }

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

  function setDateControlsDisabled(disabled) {
    if (todayDateInput) todayDateInput.disabled = disabled;
    if (todayDatePrevButton) todayDatePrevButton.disabled = disabled;
    if (todayDateNextButton) todayDateNextButton.disabled = disabled;
    if (todayDateResetButton) todayDateResetButton.disabled = disabled;
  }

  function renderProgressionFeedback() {
    if (!todayRunProgressionButton) return;

    todayRunProgressionButton.disabled = !hasActiveProgram() || progressionRunInFlight || todayLoadInFlight;

    if (!todayProgressionLastRun) return;

    if (lastProgressionDate) {
      todayProgressionLastRun.textContent = `Last run: ${formatLongDateLabel(lastProgressionDate)}`;
      todayProgressionLastRun.classList.remove('hidden');
    } else {
      todayProgressionLastRun.classList.add('hidden');
      todayProgressionLastRun.textContent = '';
    }

    if (!todayProgressionFeedback) return;

    todayProgressionFeedback.innerHTML = '';

    if (progressionRunInFlight) {
      todayProgressionFeedback.classList.remove('hidden');
      todayProgressionFeedback.appendChild(el('div', 'card-title', 'Updating plan…'));
      todayProgressionFeedback.appendChild(
        el('p', 'card-subtitle', 'Checking recent workouts and adjusting the next targets.')
      );
      return;
    }

    if (!lastProgressionRun) {
      if (lastProgressionDate) {
        todayProgressionFeedback.classList.remove('hidden');
        todayProgressionFeedback.appendChild(el('div', 'card-title', 'Plan is up to date'));
        todayProgressionFeedback.appendChild(
          el('p', 'card-subtitle', `The latest plan update ran on ${formatLongDateLabel(lastProgressionDate)}.`)
        );
      } else {
        todayProgressionFeedback.classList.add('hidden');
      }
      return;
    }

    const changed = Array.isArray(lastProgressionRun.result?.changed) ? lastProgressionRun.result.changed : [];
    const skipped = Array.isArray(lastProgressionRun.result?.skipped) ? lastProgressionRun.result.skipped : [];

    todayProgressionFeedback.classList.remove('hidden');
    todayProgressionFeedback.appendChild(
      el('div', 'card-title', `Plan updated for ${formatLongDateLabel(lastProgressionRun.progression_date)}`)
    );

    const summary = el('div', 'today-progression-summary');
    summary.appendChild(
      el('div', 'today-progression-pill', `${changed.length} ${changed.length === 1 ? 'update' : 'updates'}`)
    );
    summary.appendChild(
      el('div', 'today-progression-pill is-muted', `${skipped.length} unchanged`)
    );
    todayProgressionFeedback.appendChild(summary);

    if (changed.length > 0) {
      const list = el('div', 'today-progression-list');
      changed.slice(0, 4).forEach(change => {
        const item = el('div', 'today-progression-item');
        item.appendChild(el('strong', '', change.name || change.id));
        item.appendChild(
          el(
            'div',
            'text-secondary',
            `${change.before.min}-${change.before.max} -> ${change.after.min}-${change.after.max}, ${change.before.sets} -> ${change.after.sets} sets`
          )
        );
        item.appendChild(el('div', 'text-secondary', change.reason));
        list.appendChild(item);
      });
      todayProgressionFeedback.appendChild(list);
    } else {
      todayProgressionFeedback.appendChild(
        el('p', 'card-subtitle', 'No targets changed this run. Recent workouts did not trigger an update.')
      );
    }
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
    if (todayWorkoutDateLabel) {
      todayWorkoutDateLabel.textContent = formatLongDateLabel(getSelectedDate());
    }
    exercisesContainer.classList.add('hidden');
    restMessage.classList.add('hidden');
    lockedMessage.classList.add('hidden');
    setTodayError('');
    setTodayLockedMessage('');
    renderEmptyState(
      todayEmptyState,
      'No plan yet',
      'Build your first plan, then today’s workout will show up here.',
      { text: 'Open Plan', type: 'open-tab', targetTab: 'program' }
    );
    setTodayGuidanceContent('', '');
    renderProgressionFeedback();
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

  async function handleRunProgression() {
    if (progressionRunInFlight || !hasActiveProgram()) {
      return;
    }

    progressionRunInFlight = true;
    setTodayError('');
    renderProgressionFeedback();

    try {
      const result = ensureApiObject(await api.runProgression(), 'progression run');
      lastProgressionRun = result;
      lastProgressionDate = result.progression_date || lastProgressionDate;
      renderProgressionFeedback();
      await load();
    } catch (error) {
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

      setTodayError('Could not update plan: ' + error.message);
    } finally {
      progressionRunInFlight = false;
      renderProgressionFeedback();
    }
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
    setSelectedDate(getSelectedDate());
    setDateControlsDisabled(true);
    todayLoadInFlight = true;
    renderProgressionFeedback();

    loader.classList.remove('hidden');
    renderBoneyardLoader(loader);
    content.classList.add('hidden');
    exercisesContainer.classList.remove('hidden');
    restMessage.classList.add('hidden');
    lockedMessage.classList.add('hidden');

    if (!hasActiveProgram()) {
      todayLoadInFlight = false;
      setDateControlsDisabled(false);
      renderRecoveryState();
      return;
    }

    try {
      const selectedDate = getSelectedDate();
      const [workoutResponse, programResponse] = await Promise.all([
        api.getTodayWorkout(selectedDate),
        api.getProgram(),
      ]);

      const data = ensureApiObject(workoutResponse, 'workout');
      const program = ensureApiObject(programResponse, 'program');
      const existingSession = await getExistingSession(data.date);

      lastProgressionDate = getLatestProgressionDate(program.progressionState ?? {}) || lastProgressionDate;

      loader.classList.add('hidden');
      content.classList.remove('hidden');

      todayWorkoutDate = data.date;
      todayWorkoutType = data.type === 'rest' ? null : data.type;
      todayWorkoutSaved = Boolean(existingSession);

      document.getElementById('today-workout-name').textContent =
        data.type === 'rest' ? 'Rest day' : data.name || 'Today’s workout';
      document.getElementById('today-workout-type').textContent = formatWorkoutTypeLabel(data.type);
      if (todayWorkoutDateLabel) {
        todayWorkoutDateLabel.textContent = formatLongDateLabel(data.date);
      }

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
        renderProgressionFeedback();
        return;
      }

      if (data.type === 'rest') {
        exercisesContainer.classList.add('hidden');
        setTodayGuidanceContent('Recovery day', 'No logging needed for this date.');
        restMessage.classList.remove('hidden');
        renderProgressionFeedback();
        return;
      }

      if (!data.exercises || data.exercises.length === 0) {
        exercisesContainer.innerHTML = '<div class="text-center text-secondary">No exercises</div>';
        setTodayGuidanceContent('Nothing to log', 'This generated workout is currently empty.');
        renderProgressionFeedback();
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
      renderProgressionFeedback();
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

      setTodayError('Could not load workout: ' + error.message);
    } finally {
      todayLoadInFlight = false;
      setDateControlsDisabled(false);
      renderProgressionFeedback();
    }
  }

  return {
    init,
    load,
    renderRecoveryState,
  };
}
