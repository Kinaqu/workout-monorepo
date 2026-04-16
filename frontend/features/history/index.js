import {
  api,
  ApiError,
  AuthRedirectError,
  isMissingProgramError,
  isOnboardingIncompleteError,
} from '/lib/api/index.js';
import { hasActiveProgram } from '/store/app-store.js';
import { el } from '/shared/ui/dom.js';
import { formatDateLabel, formatWorkoutTypeLabel, humanizeToken } from '/shared/utils/format.js';

const historyEmpty = document.getElementById('history-empty');
const historyNoteCard = document.getElementById('history-note-card');
const historyDateInput = document.getElementById('history-date');

export function createHistoryFeature({ onEnterOnboarding, onMissingProgram }) {
  function init() {
    historyDateInput?.addEventListener('change', event => {
      load(event.target.value);
    });
  }

  function renderRecoveryState() {
    document.getElementById('history-loader').classList.add('hidden');
    document.getElementById('history-data').classList.add('hidden');
    historyEmpty.textContent = 'No plan yet. Build one first to start logging workouts.';
    historyEmpty.classList.remove('hidden');
    document.getElementById('history-error').textContent = '';
  }

  function getSelectedDate() {
    return historyDateInput?.value || '';
  }

  async function loadSelected() {
    if (!historyDateInput) return;

    if (!historyDateInput.value) {
      historyDateInput.value = new Date().toISOString().split('T')[0];
    }

    await load(historyDateInput.value);
  }

  async function load(date) {
    if (!date) return;

    const loader = document.getElementById('history-loader');
    const errorEl = document.getElementById('history-error');
    const content = document.getElementById('history-data');
    const empty = document.getElementById('history-empty');

    loader.classList.remove('hidden');
    content.classList.add('hidden');
    empty.classList.add('hidden');
    errorEl.textContent = '';

    if (!hasActiveProgram()) {
      renderRecoveryState();
      return;
    }

    try {
      const data = await api.getLog(date);
      loader.classList.add('hidden');

      if (!data || !data.workout_type) {
        empty.textContent = 'No workout logged for this day.';
        empty.classList.remove('hidden');
        return;
      }

      content.classList.remove('hidden');
      document.getElementById('history-workout-type').textContent =
        `${formatWorkoutTypeLabel(data.workout_type)} · ${formatDateLabel(date)}`;

      const exercisesContainer = document.getElementById('history-exercises');
      exercisesContainer.innerHTML = '';

      if (data.exercises && data.exercises.length > 0) {
        data.exercises.forEach((exercise, index) => {
          const card = el('article', 'card history-exercise-card');

          const header = el('div', 'history-exercise-header');
          header.appendChild(el('div', 'history-exercise-index', `#${index + 1}`));
          header.appendChild(el('div', 'card-title', humanizeToken(exercise.id)));
          card.appendChild(header);

          const chips = el('div', 'history-set-chips');
          exercise.sets.forEach((setValue, setIndex) => {
            chips.appendChild(el('div', 'history-set-chip', `Set ${setIndex + 1}: ${setValue}`));
          });
          card.appendChild(chips);
          exercisesContainer.appendChild(card);
        });
      } else {
        exercisesContainer.innerHTML = '<div class="card history-empty-card">No exercises logged.</div>';
      }

      historyNoteCard?.classList.toggle('hidden', !data.note);
      document.getElementById('history-note').textContent = data.note || '';
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

      if (error instanceof ApiError && error.status === 404) {
        empty.textContent = 'No workout logged for this day.';
        empty.classList.remove('hidden');
      } else {
        errorEl.textContent = 'Could not load history: ' + error.message;
      }
    }
  }

  return {
    getSelectedDate,
    init,
    load,
    loadSelected,
    renderRecoveryState,
  };
}
