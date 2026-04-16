import {
  api,
  AuthRedirectError,
  isMissingProgramError,
  isOnboardingIncompleteError,
} from '/lib/api/index.js';
import { hasActiveProgram, hasCompletedOnboarding } from '/store/app-store.js';
import { el, renderEmptyState } from '/shared/ui/dom.js';
import { formatPlanSlotLabel, formatWorkoutTypeLabel, humanizeToken } from '/shared/utils/format.js';
import { ensureApiObject } from '/shared/utils/guards.js';

const programEmptyState = document.getElementById('program-empty-state');
const programMain = document.getElementById('program-main');
const programRegenerateButton = document.getElementById('program-regenerate-button');

export function createProgramFeature({
  getActiveTabId,
  onEnterOnboarding,
  onMissingProgram,
  onRefreshProductState,
}) {
  function setProgramError(message = '') {
    document.getElementById('program-error').textContent = message;
  }

  function clearProgramEmptyState() {
    programEmptyState.innerHTML = '';
    programEmptyState.classList.add('hidden');
  }

  function setActionsVisible(visible) {
    programRegenerateButton.classList.toggle('hidden', !visible);
  }

  function renderRecoveryState() {
    const loader = document.getElementById('program-loader');
    const content = document.getElementById('program-content');

    loader.classList.add('hidden');
    content.classList.remove('hidden');
    programMain.classList.add('hidden');
    setProgramError('');
    renderEmptyState(
      programEmptyState,
      'No plan available',
      'Use your saved preferences to build a fresh plan.',
      { text: 'Build plan', type: 'regenerate-program' }
    );
  }

  function formatProgramTarget(exercise, progressionState) {
    const min = progressionState?.min;
    const max = progressionState?.max;

    if (exercise.type === 'reps') {
      const fallback = exercise.reps;
      const from = Number.isInteger(min) ? min : fallback?.min;
      const to = Number.isInteger(max) ? max : fallback?.max;
      return from && to ? `${from}-${to} reps` : 'Custom target';
    }

    if (exercise.type === 'time') {
      const fallback = exercise.duration;
      const from = Number.isInteger(min) ? min : fallback?.min;
      const to = Number.isInteger(max) ? max : fallback?.max;
      return from && to ? `${from}-${to} sec` : 'Custom target';
    }

    const fallback = exercise.cycles;
    const from = Number.isInteger(min) ? min : fallback?.min;
    const to = Number.isInteger(max) ? max : fallback?.max;
    return from && to ? `${from}-${to} cycles` : 'Custom target';
  }

  function formatProgramProgressionNote(progressionState) {
    if (!progressionState?.last_progression) {
      return 'No recent changes';
    }

    return `Updated ${progressionState.last_progression}`;
  }

  async function load() {
    const loader = document.getElementById('program-loader');
    const content = document.getElementById('program-content');
    const scheduleContainer = document.getElementById('program-schedule');
    const workoutsContainer = document.getElementById('program-workouts');

    setProgramError('');
    clearProgramEmptyState();
    setActionsVisible(hasCompletedOnboarding() && hasActiveProgram());

    if (!hasActiveProgram()) {
      renderRecoveryState();
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
      const progressionState = data.progressionState ?? {};
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
          row.appendChild(el('span', 'program-day-value', formatPlanSlotLabel(data.schedule[key] || 'rest')));
          scheduleContainer.appendChild(row);
        });
      }

      if (data.workouts) {
        Object.entries(data.workouts).forEach(([type, workout]) => {
          const card = el('section', 'card program-workout-card');

          const header = el('div', 'program-workout-header');
          header.appendChild(el('div', 'card-title', workout.name || type));
          header.appendChild(el('div', 'program-workout-type', formatWorkoutTypeLabel(type)));
          card.appendChild(header);

          if (workout.exercises && workout.exercises.length > 0) {
            const list = el('div', 'program-exercise-list');
            workout.exercises.forEach(exercise => {
              const row = el('div', 'program-exercise-row');
              const main = el('div', 'program-exercise-main');
              main.appendChild(el('div', 'program-exercise-name', exercise.name || humanizeToken(exercise.id)));

              const exerciseProgression = progressionState[exercise.id] ?? null;
              main.appendChild(el('div', 'program-exercise-detail', formatProgramTarget(exercise, exerciseProgression)));
              main.appendChild(el('div', 'program-exercise-meta', formatProgramProgressionNote(exerciseProgression)));
              row.appendChild(main);

              const currentSets = exerciseProgression?.sets ?? userSets[exercise.id] ?? 1;
              row.appendChild(el('div', 'program-sets-pill', `${currentSets}/${exercise.max_sets} sets`));
              list.appendChild(row);
            });
            card.appendChild(list);
          } else {
            card.appendChild(el('div', 'text-secondary', 'No exercises in this session.'));
          }

          workoutsContainer.appendChild(card);
        });
      }
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

      setProgramError('Could not load plan: ' + error.message);
    }
  }

  async function handleRegenerateProgram(trigger) {
    if (!hasCompletedOnboarding()) return;
    if (trigger.disabled) return;

    const confirmed = window.confirm('Build a new plan from your saved preferences?');
    if (!confirmed) return;

    trigger.disabled = true;
    setProgramError('');
    document.getElementById('today-error').textContent = '';

    try {
      await api.regenerateProgram();
      await onRefreshProductState();

      if (getActiveTabId() === 'program') {
        await load();
      }
    } catch (error) {
      if (error instanceof AuthRedirectError) return;

      if (isOnboardingIncompleteError(error)) {
        await onEnterOnboarding();
        return;
      }

      setProgramError('Could not build a new plan: ' + error.message);
    } finally {
      trigger.disabled = false;
    }
  }

  return {
    handleRegenerateProgram,
    load,
    renderRecoveryState,
    setActionsVisible,
  };
}
