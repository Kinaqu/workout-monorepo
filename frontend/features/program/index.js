import {
  api,
  AuthRedirectError,
  isMissingProgramError,
  isOnboardingIncompleteError,
} from '/lib/api/index.js';
import { hasActiveProgram, hasCompletedOnboarding } from '/store/app-store.js';
import { el, renderEmptyState } from '/shared/ui/dom.js';
import { formatDateTimeLabel, formatLongDateLabel } from '/shared/utils/date.js';
import { formatPlanSlotLabel, formatWorkoutTypeLabel, humanizeToken } from '/shared/utils/format.js';
import { ensureApiObject } from '/shared/utils/guards.js';

const DAY_OPTIONS = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
];

const EXERCISE_TYPE_OPTIONS = [
  ['reps', 'Reps'],
  ['time', 'Seconds'],
  ['cycles', 'Cycles'],
];

const programEmptyState = document.getElementById('program-empty-state');
const programMain = document.getElementById('program-main');
const programRegenerateButton = document.getElementById('program-regenerate-button');
const programEditButton = document.getElementById('program-edit-button');
const programResetButton = document.getElementById('program-reset-button');
const programSummaryCopy = document.getElementById('program-summary-copy');
const programSummaryBadge = document.getElementById('program-summary-badge');
const programSummaryMeta = document.getElementById('program-summary-meta');
const programGenerationSummary = document.getElementById('program-generation-summary');
const programGenerationMeta = document.getElementById('program-generation-meta');
const programRuntimeSummary = document.getElementById('program-runtime-summary');
const programRuntimeMeta = document.getElementById('program-runtime-meta');
const programVersionMeta = document.getElementById('program-version-meta');
const programChangesSummary = document.getElementById('program-changes-summary');
const programChangesStats = document.getElementById('program-changes-stats');
const programChangesList = document.getElementById('program-changes-list');
const programTimelineList = document.getElementById('program-timeline-list');
const programEditor = document.getElementById('program-editor');
const programEditorStatus = document.getElementById('program-editor-status');
const programEditorIdInput = document.getElementById('program-editor-id');
const programEditorNameInput = document.getElementById('program-editor-name');
const programEditorSchedule = document.getElementById('program-editor-schedule');
const programEditorWorkouts = document.getElementById('program-editor-workouts');
const programSaveButton = document.getElementById('program-save-button');
const programCancelEditButton = document.getElementById('program-cancel-edit-button');
const programAddWorkoutButton = document.getElementById('program-add-workout-button');
const programAdvancedDetails = document.getElementById('program-advanced-details');
const confirmDialog = document.getElementById('confirm-dialog');
const confirmDialogTitle = document.getElementById('confirm-dialog-title');
const confirmDialogCopy = document.getElementById('confirm-dialog-copy');
const confirmDialogInputWrap = document.getElementById('confirm-dialog-input-wrap');
const confirmDialogInputLabel = document.getElementById('confirm-dialog-input-label');
const confirmDialogInput = document.getElementById('confirm-dialog-input');
const confirmDialogCancel = document.getElementById('confirm-dialog-cancel');
const confirmDialogConfirm = document.getElementById('confirm-dialog-confirm');
const SHOW_PROGRAM_ADVANCED_TOOLS = false;

function createStat(label, value) {
  const item = el('div', 'program-summary-stat');
  item.appendChild(el('div', 'program-summary-label', label));
  item.appendChild(el('div', 'program-summary-value', value));
  return item;
}

function createDetailStat(label, value) {
  const item = el('div', 'program-detail-stat');
  item.appendChild(el('div', 'program-detail-label', label));
  item.appendChild(el('div', 'program-detail-value', value));
  return item;
}

function createPill(label, className = '') {
  return el('div', ['program-meta-pill', className].filter(Boolean).join(' '), label);
}

function countProgramExercises(program) {
  return Object.values(program.workouts ?? {}).reduce(
    (count, workout) => count + (Array.isArray(workout.exercises) ? workout.exercises.length : 0),
    0
  );
}

function formatDateOrFallback(value, fallback = 'Not yet') {
  return value ? formatDateTimeLabel(value) : fallback;
}

function formatDirectionLabel(direction) {
  return direction === 'down' ? 'Reduced' : 'Increased';
}

function formatGenerationReason(reason, source) {
  if (reason === 'onboarding-complete') {
    return 'Generated when onboarding was completed';
  }

  if (reason === 'regenerate') {
    return 'Regenerated from the saved onboarding profile';
  }

  if (source === 'api') {
    return 'Created from manual edits in the plan editor';
  }

  if (source === 'reset') {
    return 'Reset back to the built-in default template';
  }

  if (source === 'legacy-kv' || source === 'legacy-default') {
    return 'Imported from a legacy snapshot';
  }

  if (source === 'generated') {
    return 'Generated from the saved onboarding profile';
  }

  return `Created from ${humanizeToken(source || 'unknown')}`;
}

function buildGenerationSummary(program) {
  const metadata = program.generated_program_metadata;
  const input = metadata?.input_summary ?? {};
  const primaryGoal = typeof input.primaryGoal === 'string' ? humanizeToken(input.primaryGoal) : '';
  const trainingDays =
    typeof input.trainingDaysPerWeek === 'number' ? `${input.trainingDaysPerWeek} training days/week` : '';
  const sessionDuration =
    typeof input.sessionDurationMinutes === 'number' ? `${input.sessionDurationMinutes} min sessions` : '';
  const details = [primaryGoal, trainingDays, sessionDuration].filter(Boolean);

  const lead = formatGenerationReason(metadata?.generation_reason, program.source);
  return details.length > 0 ? `${lead}. Built around ${details.join(' · ')}.` : `${lead}.`;
}

function formatVersionStatus(program) {
  const versionNumber = program.active_version?.version_number;
  return Number.isInteger(versionNumber) ? `Active · v${versionNumber}` : 'Active';
}

function formatTimelineDelta(event) {
  const before = `${event.before.sets} sets · ${event.before.min}-${event.before.max}`;
  const after = `${event.after.sets} sets · ${event.after.min}-${event.after.max}`;
  return `${before} → ${after}`;
}

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

function cloneProgramForEditor(program) {
  return {
    id: program.id,
    name: program.name,
    schedule: { ...program.schedule },
    workouts: Object.entries(program.workouts ?? {}).map(([key, workout]) => ({
      key,
      name: workout.name,
      exercises: (workout.exercises ?? []).map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        type: exercise.type,
        max_sets: exercise.max_sets,
        target_min:
          exercise.type === 'reps'
            ? exercise.reps?.min
            : exercise.type === 'time'
              ? exercise.duration?.min
              : exercise.cycles?.min,
        target_max:
          exercise.type === 'reps'
            ? exercise.reps?.max
            : exercise.type === 'time'
              ? exercise.duration?.max
              : exercise.cycles?.max,
      })),
    })),
  };
}

function buildProgramPayload(editorState) {
  const id = String(editorState.id || '').trim();
  const name = String(editorState.name || '').trim();

  if (!id) {
    throw new Error('Program id is required.');
  }

  if (!name) {
    throw new Error('Program name is required.');
  }

  const workouts = {};
  const workoutKeys = new Set();

  editorState.workouts.forEach((workout, workoutIndex) => {
    const key = String(workout.key || '').trim();
    const workoutName = String(workout.name || '').trim();

    if (!key) {
      throw new Error(`Session ${workoutIndex + 1} needs a key.`);
    }

    if (key === 'rest') {
      throw new Error(`Session ${key} cannot use the reserved "rest" key.`);
    }

    if (workoutKeys.has(key)) {
      throw new Error(`Session key "${key}" must be unique.`);
    }
    workoutKeys.add(key);

    if (!workoutName) {
      throw new Error(`Session ${key} needs a name.`);
    }

    if (!Array.isArray(workout.exercises) || workout.exercises.length === 0) {
      throw new Error(`Session ${key} needs at least one exercise.`);
    }

    workouts[key] = {
      name: workoutName,
      exercises: workout.exercises.map((exercise, exerciseIndex) => {
        const exerciseId = String(exercise.id || '').trim();
        const exerciseName = String(exercise.name || '').trim();
        const exerciseType = String(exercise.type || '').trim();
        const maxSets = Number.parseInt(String(exercise.max_sets ?? ''), 10);
        const min = Number.parseInt(String(exercise.target_min ?? ''), 10);
        const max = Number.parseInt(String(exercise.target_max ?? ''), 10);

        if (!exerciseId) {
          throw new Error(`Exercise ${exerciseIndex + 1} in session ${key} needs an id.`);
        }
        if (!exerciseName) {
          throw new Error(`Exercise ${exerciseId} in session ${key} needs a name.`);
        }
        if (!['reps', 'time', 'cycles'].includes(exerciseType)) {
          throw new Error(`Exercise ${exerciseId} in session ${key} has an invalid type.`);
        }
        if (!Number.isInteger(maxSets) || maxSets <= 0) {
          throw new Error(`Exercise ${exerciseId} in session ${key} needs a valid max set count.`);
        }
        if (!Number.isInteger(min) || min <= 0 || !Number.isInteger(max) || max <= 0 || max < min) {
          throw new Error(`Exercise ${exerciseId} in session ${key} has invalid targets.`);
        }

        const base = {
          id: exerciseId,
          name: exerciseName,
          type: exerciseType,
          max_sets: maxSets,
        };

        if (exerciseType === 'reps') {
          return { ...base, reps: { min, max } };
        }

        if (exerciseType === 'time') {
          return { ...base, duration: { min, max } };
        }

        return { ...base, cycles: { min, max } };
      }),
    };
  });

  const schedule = {};
  DAY_OPTIONS.forEach(([day]) => {
    const value = String(editorState.schedule?.[day] || '').trim();
    if (!value) {
      throw new Error(`Schedule for ${day} is required.`);
    }
    if (value !== 'rest' && !workoutKeys.has(value)) {
      throw new Error(`Schedule for ${day} references unknown session "${value}".`);
    }

    schedule[day] = value;
  });

  return {
    id,
    name,
    schedule,
    workouts,
  };
}

function createWorkoutOption(value, label, selectedValue) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  option.selected = selectedValue === value;
  return option;
}

export function createProgramFeature({
  getActiveTabId,
  onEnterOnboarding,
  onMissingProgram,
  onRefreshProductState,
}) {
  let currentProgram = null;
  let editorState = null;
  let editing = false;
  let actionInFlight = false;
  let editorDirty = false;
  let confirmResolver = null;
  let confirmRequiresInput = false;

  function init() {
    programEditButton?.addEventListener('click', () => {
      if (editing) {
        stopEditing();
        return;
      }

      startEditing();
    });

    programResetButton?.addEventListener('click', () => {
      void handleResetProgram();
    });

    programSaveButton?.addEventListener('click', () => {
      void handleSaveProgram();
    });

    programCancelEditButton?.addEventListener('click', () => {
      stopEditing();
    });

    programAddWorkoutButton?.addEventListener('click', () => {
      addWorkout();
    });

    programEditorIdInput?.addEventListener('input', event => {
      if (!editorState) return;
      editorState.id = event.target.value;
      markEditorDirty();
    });

    programEditorNameInput?.addEventListener('input', event => {
      if (!editorState) return;
      editorState.name = event.target.value;
      markEditorDirty();
    });

    confirmDialogCancel?.addEventListener('click', () => {
      resolveConfirm(null);
    });

    confirmDialogConfirm?.addEventListener('click', () => {
      if (confirmRequiresInput) {
        const value = confirmDialogInput?.value.trim() || '';
        if (!value) {
          confirmDialogInput?.focus();
          return;
        }

        resolveConfirm(value);
        return;
      }

      resolveConfirm(true);
    });

    confirmDialog?.addEventListener('cancel', event => {
      event.preventDefault();
      resolveConfirm(null);
    });
  }

  function resolveConfirm(value) {
    if (!confirmResolver) return;

    const resolver = confirmResolver;
    confirmResolver = null;
    confirmRequiresInput = false;
    if (confirmDialog?.open) {
      confirmDialog.close();
    }
    resolver(value);
  }

  function openConfirmDialog({
    title,
    copy,
    confirmText,
    requireInputLabel = '',
    inputPlaceholder = '',
    danger = false,
  }) {
    if (!confirmDialog) {
      return Promise.resolve(null);
    }

    confirmDialogTitle.textContent = title;
    confirmDialogCopy.textContent = copy;
    confirmDialogConfirm.textContent = confirmText;
    confirmDialogConfirm.classList.toggle('program-inline-danger', danger);
    confirmRequiresInput = Boolean(requireInputLabel);

    if (confirmDialogInputWrap && confirmDialogInput && confirmDialogInputLabel) {
      confirmDialogInputWrap.classList.toggle('hidden', !confirmRequiresInput);
      confirmDialogInputLabel.textContent = requireInputLabel;
      confirmDialogInput.placeholder = inputPlaceholder;
      confirmDialogInput.value = '';
    }

    confirmDialog.showModal();
    if (confirmRequiresInput) {
      window.setTimeout(() => confirmDialogInput?.focus(), 0);
    } else {
      window.setTimeout(() => confirmDialogConfirm?.focus(), 0);
    }

    return new Promise(resolve => {
      confirmResolver = resolve;
    });
  }

  function setProgramError(message = '') {
    document.getElementById('program-error').textContent = message;
  }

  function setEditorStatus(message = '') {
    if (!programEditorStatus) return;

    if (!message) {
      programEditorStatus.textContent = '';
      programEditorStatus.classList.add('hidden');
      return;
    }

    programEditorStatus.textContent = message;
    programEditorStatus.classList.remove('hidden');
  }

  function clearProgramEmptyState() {
    programEmptyState.innerHTML = '';
    programEmptyState.classList.add('hidden');
  }

  function clearMetadataPanels() {
    if (programGenerationSummary) programGenerationSummary.textContent = '';
    if (programGenerationMeta) programGenerationMeta.innerHTML = '';
    if (programRuntimeSummary) programRuntimeSummary.textContent = '';
    if (programRuntimeMeta) programRuntimeMeta.innerHTML = '';
    if (programVersionMeta) programVersionMeta.innerHTML = '';
    if (programChangesSummary) programChangesSummary.textContent = '';
    if (programChangesStats) programChangesStats.innerHTML = '';
    if (programChangesList) programChangesList.innerHTML = '';
    if (programTimelineList) programTimelineList.innerHTML = '';
  }

  function setActionsVisible(visible) {
    const showAdvancedTools = visible && SHOW_PROGRAM_ADVANCED_TOOLS;
    programRegenerateButton.classList.toggle('hidden', !showAdvancedTools);
    programEditButton.classList.toggle('hidden', !showAdvancedTools);
    programResetButton.classList.toggle('hidden', !showAdvancedTools);
    programAdvancedDetails?.classList.toggle('hidden', !showAdvancedTools);

    if (!showAdvancedTools) {
      if (programAdvancedDetails) {
        programAdvancedDetails.open = false;
      }
      stopEditing({ keepStatus: false, keepProgram: true });
    }
  }

  function setActionButtonsDisabled(disabled) {
    actionInFlight = disabled;

    if (programRegenerateButton) programRegenerateButton.disabled = disabled;
    if (programEditButton) programEditButton.disabled = disabled;
    if (programResetButton) programResetButton.disabled = disabled;
    if (programSaveButton) programSaveButton.disabled = disabled;
    if (programCancelEditButton) programCancelEditButton.disabled = disabled;
    if (programAddWorkoutButton) programAddWorkoutButton.disabled = disabled;
  }

  function renderRecoveryState() {
    const loader = document.getElementById('program-loader');
    const content = document.getElementById('program-content');

    loader.classList.add('hidden');
    content.classList.remove('hidden');
    programMain.classList.add('hidden');
    setProgramError('');
    clearMetadataPanels();
    stopEditing({ keepStatus: false, keepProgram: false });
    renderEmptyState(
      programEmptyState,
      'No plan available',
      'Build a fresh plan from your saved preferences.',
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

  function renderSummary(program) {
    const latestProgressionDate = getLatestProgressionDate(program.progressionState ?? {});
    const workoutCount = Object.keys(program.workouts ?? {}).length;
    const exerciseCount = countProgramExercises(program);
    const cadenceLabel = `${workoutCount} ${workoutCount === 1 ? 'session' : 'sessions'} · ${exerciseCount} exercises`;

    if (programSummaryCopy) {
      programSummaryCopy.textContent = cadenceLabel;
    }

    if (programSummaryBadge) {
      programSummaryBadge.textContent = formatVersionStatus(program);
    }

    if (programSummaryMeta) {
      programSummaryMeta.innerHTML = '';
      programSummaryMeta.appendChild(createStat('Plan', program.name));
      programSummaryMeta.appendChild(createStat('Schedule', cadenceLabel));
      programSummaryMeta.appendChild(
        createStat('Last update', latestProgressionDate ? formatLongDateLabel(latestProgressionDate) : 'Not yet')
      );
    }
  }

  function renderMetadataPanels(program) {
    const metadata = program.generated_program_metadata;
    const runtime = program.program_runtime_state;
    const version = program.active_version;
    const changes = program.current_version_changes;
    const progressionEvents = Array.isArray(program.progression_events) ? program.progression_events : [];

    if (programGenerationSummary) {
      programGenerationSummary.textContent = buildGenerationSummary(program);
    }

    if (programGenerationMeta) {
      programGenerationMeta.innerHTML = '';
      programGenerationMeta.appendChild(createPill(`Source: ${humanizeToken(program.source || 'unknown')}`));
      if (metadata?.generation_reason) {
        programGenerationMeta.appendChild(
          createPill(`Reason: ${humanizeToken(metadata.generation_reason)}`, 'is-highlight')
        );
      }
      if (program.generator_metadata?.version) {
        programGenerationMeta.appendChild(createPill(`Generator: ${program.generator_metadata.version}`));
      }
      if (program.generator_metadata?.catalog_seed_version) {
        programGenerationMeta.appendChild(
          createPill(`Catalog: ${program.generator_metadata.catalog_seed_version}`)
        );
      }
    }

    if (programRuntimeSummary) {
      programRuntimeSummary.textContent = runtime?.last_progression_run_at
        ? `Last refresh ran on ${formatDateTimeLabel(runtime.last_progression_run_at)}.`
        : 'Progression refresh has not run yet for this version.';
    }

    if (programRuntimeMeta) {
      programRuntimeMeta.innerHTML = '';
      programRuntimeMeta.appendChild(
        createPill(`Last progression: ${formatDateOrFallback(runtime?.last_progression_run_at)}`, 'is-positive')
      );
      programRuntimeMeta.appendChild(
        createPill(`Last session: ${formatDateOrFallback(runtime?.last_session_logged_at)}`)
      );
    }

    if (programVersionMeta) {
      programVersionMeta.innerHTML = '';
      programVersionMeta.appendChild(createDetailStat('Status', formatVersionStatus(program)));
      programVersionMeta.appendChild(
        createDetailStat(
          'Source',
          version?.source ? humanizeToken(version.source) : humanizeToken(program.source || 'unknown')
        )
      );
      programVersionMeta.appendChild(
        createDetailStat(
          'Version ID',
          version?.version_number ? `v${version.version_number} · ${program.version_id}` : program.version_id
        )
      );
      programVersionMeta.appendChild(
        createDetailStat('Created', formatDateOrFallback(version?.created_at || metadata?.created_at, 'Unknown'))
      );
      programVersionMeta.appendChild(
        createDetailStat('Updated', formatDateOrFallback(version?.updated_at, 'Unknown'))
      );
      programVersionMeta.appendChild(
        createDetailStat('Previous version', version?.previous_version_id || 'None')
      );
    }

    if (programChangesSummary) {
      programChangesSummary.textContent =
        changes?.summary || 'No structural changes were detected in this version.';
    }

    if (programChangesStats) {
      programChangesStats.innerHTML = '';
      if (changes?.stats) {
        programChangesStats.appendChild(
          createPill(`${changes.stats.schedule_changes} schedule updates`, 'is-highlight')
        );
        programChangesStats.appendChild(createPill(`${changes.stats.workouts_added} sessions added`));
        programChangesStats.appendChild(createPill(`${changes.stats.workouts_removed} sessions removed`));
        programChangesStats.appendChild(createPill(`${changes.stats.target_changes} target changes`));
        programChangesStats.appendChild(createPill(`${changes.stats.set_cap_changes} set cap changes`));
      }
    }

    if (programChangesList) {
      programChangesList.innerHTML = '';
      const highlights = Array.isArray(changes?.highlights) ? changes.highlights : [];
      highlights.forEach(item => {
        programChangesList.appendChild(el('div', 'program-change-item', item));
      });
    }

    if (programTimelineList) {
      programTimelineList.innerHTML = '';

      if (progressionEvents.length === 0) {
        programTimelineList.appendChild(
          el('div', 'program-timeline-empty', 'No progression changes have been recorded for this version yet.')
        );
      } else {
        progressionEvents.forEach(event => {
          const item = el('article', 'program-timeline-item');
          const header = el('div', 'program-timeline-header');
          const copy = document.createElement('div');
          copy.appendChild(
            el(
              'div',
              'program-timeline-title',
              `${formatDirectionLabel(event.direction)} ${event.exercise_name || humanizeToken(event.exercise_key)}`
            )
          );
          copy.appendChild(el('div', 'program-timeline-diff', formatTimelineDelta(event)));
          header.appendChild(copy);
          header.appendChild(el('div', 'program-timeline-time', formatDateOrFallback(event.created_at, 'Unknown')));
          item.appendChild(header);
          item.appendChild(el('div', 'program-info-copy', event.reason));
          programTimelineList.appendChild(item);
        });
      }
    }
  }

  function renderReadOnlyProgram(program) {
    const scheduleContainer = document.getElementById('program-schedule');
    const workoutsContainer = document.getElementById('program-workouts');
    const userSets = program.userSets ?? {};
    const progressionState = program.progressionState ?? {};

    renderSummary(program);
    renderMetadataPanels(program);

    scheduleContainer.innerHTML = '';
    workoutsContainer.innerHTML = '';

    DAY_OPTIONS.forEach(([key, label]) => {
      const row = el('div', 'program-schedule-row');
      row.appendChild(el('span', 'program-day', label.slice(0, 3)));
      row.appendChild(el('span', 'program-day-value', formatPlanSlotLabel(program.schedule[key] || 'rest')));
      scheduleContainer.appendChild(row);
    });

    Object.entries(program.workouts ?? {}).forEach(([type, workout]) => {
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

  function markEditorDirty() {
    editorDirty = true;
    setEditorStatus('Unsaved changes');
  }

  function renderEditor() {
    if (!editing || !editorState || !programEditor || !programEditorSchedule || !programEditorWorkouts) {
      return;
    }

    programEditor.classList.remove('hidden');
    if (programEditorIdInput) programEditorIdInput.value = editorState.id || '';
    if (programEditorNameInput) programEditorNameInput.value = editorState.name || '';
    setEditorStatus(editorDirty ? 'Unsaved changes' : 'Editing draft');

    const workoutKeys = editorState.workouts.map(workout => workout.key).filter(Boolean);

    programEditorSchedule.innerHTML = '';
    DAY_OPTIONS.forEach(([day, label]) => {
      const cell = el('label', 'program-schedule-cell');
      cell.appendChild(el('div', 'program-schedule-day', label));

      const select = document.createElement('select');
      select.className = 'program-schedule-select';
      select.appendChild(createWorkoutOption('rest', 'Rest', editorState.schedule[day]));
      workoutKeys.forEach(workoutKey => {
        select.appendChild(createWorkoutOption(workoutKey, workoutKey, editorState.schedule[day]));
      });
      select.addEventListener('change', event => {
        editorState.schedule[day] = event.target.value;
        markEditorDirty();
      });

      cell.appendChild(select);
      programEditorSchedule.appendChild(cell);
    });

    programEditorWorkouts.innerHTML = '';
    editorState.workouts.forEach((workout, workoutIndex) => {
      const workoutCard = el('section', 'program-workout-editor');

      const workoutHeader = el('div', 'program-workout-editor-header');
      const titleWrap = document.createElement('div');
      titleWrap.appendChild(el('div', 'card-title', workout.name || `Session ${workoutIndex + 1}`));
      titleWrap.appendChild(el('div', 'card-subtitle', workout.key || 'Set a session key'));
      workoutHeader.appendChild(titleWrap);

      const removeWorkoutButton = el('button', 'secondary-button program-inline-danger', 'Remove session');
      removeWorkoutButton.type = 'button';
      removeWorkoutButton.disabled = actionInFlight;
      removeWorkoutButton.addEventListener('click', () => {
        removeWorkout(workoutIndex);
      });
      workoutHeader.appendChild(removeWorkoutButton);
      workoutCard.appendChild(workoutHeader);

      const workoutGrid = el('div', 'program-workout-editor-grid');
      const workoutKeyField = el('label', 'program-field');
      workoutKeyField.appendChild(el('span', 'program-field-label', 'Session key'));
      const workoutKeyInput = document.createElement('input');
      workoutKeyInput.className = 'program-exercise-input';
      workoutKeyInput.type = 'text';
      workoutKeyInput.value = workout.key || '';
      workoutKeyInput.placeholder = 'A';
      workoutKeyInput.addEventListener('change', event => {
        const nextKey = event.target.value.trim();
        const previousKey = editorState.workouts[workoutIndex]?.key;
        editorState.workouts[workoutIndex].key = nextKey;
        DAY_OPTIONS.forEach(([day]) => {
          if (editorState.schedule[day] === previousKey) {
            editorState.schedule[day] = nextKey || 'rest';
          }
        });
        markEditorDirty();
        renderEditor();
      });
      workoutKeyField.appendChild(workoutKeyInput);
      workoutGrid.appendChild(workoutKeyField);

      const workoutNameField = el('label', 'program-field');
      workoutNameField.appendChild(el('span', 'program-field-label', 'Session name'));
      const workoutNameInput = document.createElement('input');
      workoutNameInput.className = 'program-exercise-input';
      workoutNameInput.type = 'text';
      workoutNameInput.value = workout.name || '';
      workoutNameInput.placeholder = 'Workout A';
      workoutNameInput.addEventListener('input', event => {
        editorState.workouts[workoutIndex].name = event.target.value;
        markEditorDirty();
      });
      workoutNameField.appendChild(workoutNameInput);
      workoutGrid.appendChild(workoutNameField);
      workoutCard.appendChild(workoutGrid);

      const exerciseList = el('div', 'program-exercise-editor-list');
      workout.exercises.forEach((exercise, exerciseIndex) => {
        const exerciseCard = el('div', 'program-exercise-editor');
        const exerciseGrid = el('div', 'program-exercise-editor-grid');

        const exerciseIdField = el('label', 'program-field');
        exerciseIdField.appendChild(el('span', 'program-field-label', 'Exercise id'));
        const exerciseIdInput = document.createElement('input');
        exerciseIdInput.className = 'program-exercise-input';
        exerciseIdInput.type = 'text';
        exerciseIdInput.value = exercise.id || '';
        exerciseIdInput.placeholder = 'pushups';
        exerciseIdInput.addEventListener('input', event => {
          editorState.workouts[workoutIndex].exercises[exerciseIndex].id = event.target.value;
          markEditorDirty();
        });
        exerciseIdField.appendChild(exerciseIdInput);
        exerciseGrid.appendChild(exerciseIdField);

        const exerciseNameField = el('label', 'program-field');
        exerciseNameField.appendChild(el('span', 'program-field-label', 'Exercise name'));
        const exerciseNameInput = document.createElement('input');
        exerciseNameInput.className = 'program-exercise-input';
        exerciseNameInput.type = 'text';
        exerciseNameInput.value = exercise.name || '';
        exerciseNameInput.placeholder = 'Push-ups';
        exerciseNameInput.addEventListener('input', event => {
          editorState.workouts[workoutIndex].exercises[exerciseIndex].name = event.target.value;
          markEditorDirty();
        });
        exerciseNameField.appendChild(exerciseNameInput);
        exerciseGrid.appendChild(exerciseNameField);

        const typeField = el('label', 'program-field');
        typeField.appendChild(el('span', 'program-field-label', 'Type'));
        const typeSelect = document.createElement('select');
        typeSelect.className = 'program-schedule-select';
        EXERCISE_TYPE_OPTIONS.forEach(([value, label]) => {
          typeSelect.appendChild(createWorkoutOption(value, label, exercise.type));
        });
        typeSelect.addEventListener('change', event => {
          editorState.workouts[workoutIndex].exercises[exerciseIndex].type = event.target.value;
          markEditorDirty();
          renderEditor();
        });
        typeField.appendChild(typeSelect);
        exerciseGrid.appendChild(typeField);

        const maxSetsField = el('label', 'program-field');
        maxSetsField.appendChild(el('span', 'program-field-label', 'Max sets'));
        const maxSetsInput = document.createElement('input');
        maxSetsInput.className = 'program-exercise-input';
        maxSetsInput.type = 'number';
        maxSetsInput.min = '1';
        maxSetsInput.value = String(exercise.max_sets ?? 1);
        maxSetsInput.addEventListener('input', event => {
          editorState.workouts[workoutIndex].exercises[exerciseIndex].max_sets = event.target.value;
          markEditorDirty();
        });
        maxSetsField.appendChild(maxSetsInput);
        exerciseGrid.appendChild(maxSetsField);

        const minField = el('label', 'program-field');
        minField.appendChild(el('span', 'program-field-label', 'Target min'));
        const minInput = document.createElement('input');
        minInput.className = 'program-exercise-input';
        minInput.type = 'number';
        minInput.min = '1';
        minInput.value = String(exercise.target_min ?? '');
        minInput.addEventListener('input', event => {
          editorState.workouts[workoutIndex].exercises[exerciseIndex].target_min = event.target.value;
          markEditorDirty();
        });
        minField.appendChild(minInput);
        exerciseGrid.appendChild(minField);

        const maxField = el('label', 'program-field');
        maxField.appendChild(el('span', 'program-field-label', 'Target max'));
        const maxInput = document.createElement('input');
        maxInput.className = 'program-exercise-input';
        maxInput.type = 'number';
        maxInput.min = '1';
        maxInput.value = String(exercise.target_max ?? '');
        maxInput.addEventListener('input', event => {
          editorState.workouts[workoutIndex].exercises[exerciseIndex].target_max = event.target.value;
          markEditorDirty();
        });
        maxField.appendChild(maxInput);
        exerciseGrid.appendChild(maxField);

        exerciseCard.appendChild(exerciseGrid);

        const exerciseActions = el('div', 'program-workout-editor-actions');
        const removeExerciseButton = el('button', 'secondary-button program-inline-danger', 'Remove exercise');
        removeExerciseButton.type = 'button';
        removeExerciseButton.disabled = actionInFlight;
        removeExerciseButton.addEventListener('click', () => {
          removeExercise(workoutIndex, exerciseIndex);
        });
        exerciseActions.appendChild(removeExerciseButton);
        exerciseCard.appendChild(exerciseActions);
        exerciseList.appendChild(exerciseCard);
      });

      workoutCard.appendChild(exerciseList);

      const workoutActions = el('div', 'program-workout-editor-actions');
      const addExerciseButton = el('button', 'secondary-button', 'Add exercise');
      addExerciseButton.type = 'button';
      addExerciseButton.disabled = actionInFlight;
      addExerciseButton.addEventListener('click', () => {
        addExercise(workoutIndex);
      });
      workoutActions.appendChild(addExerciseButton);
      workoutCard.appendChild(workoutActions);
      programEditorWorkouts.appendChild(workoutCard);
    });
  }

  function startEditing() {
    if (!currentProgram) return;

    editing = true;
    editorDirty = false;
    editorState = cloneProgramForEditor(currentProgram);
    programMain.classList.remove('hidden');
    if (programAdvancedDetails) {
      programAdvancedDetails.open = true;
    }
    programEditButton.textContent = 'Close editor';
    renderEditor();
  }

  function stopEditing({ keepStatus = false, keepProgram = true } = {}) {
    editing = false;
    editorDirty = false;
    if (!keepProgram) {
      currentProgram = null;
    }
    editorState = null;
    if (programEditor) {
      programEditor.classList.add('hidden');
    }
    if (programEditButton) {
      programEditButton.textContent = 'Edit plan';
    }
    if (!keepStatus) {
      setEditorStatus('');
    }
  }

  function addWorkout() {
    if (!editorState) return;

    const baseKey = `session_${editorState.workouts.length + 1}`;
    let nextKey = baseKey;
    let suffix = 2;
    const existingKeys = new Set(editorState.workouts.map(workout => workout.key));
    while (existingKeys.has(nextKey)) {
      nextKey = `${baseKey}_${suffix}`;
      suffix += 1;
    }

    editorState.workouts.push({
      key: nextKey,
      name: `Session ${editorState.workouts.length + 1}`,
      exercises: [
        {
          id: `${nextKey}_exercise_1`,
          name: 'New exercise',
          type: 'reps',
          max_sets: 3,
          target_min: 8,
          target_max: 12,
        },
      ],
    });
    markEditorDirty();
    renderEditor();
  }

  function removeWorkout(workoutIndex) {
    if (!editorState) return;

    const [removed] = editorState.workouts.splice(workoutIndex, 1);
    if (removed?.key) {
      DAY_OPTIONS.forEach(([day]) => {
        if (editorState.schedule[day] === removed.key) {
          editorState.schedule[day] = 'rest';
        }
      });
    }

    markEditorDirty();
    renderEditor();
  }

  function addExercise(workoutIndex) {
    if (!editorState?.workouts[workoutIndex]) return;

    const workout = editorState.workouts[workoutIndex];
    workout.exercises.push({
      id: `${workout.key || 'session'}_exercise_${workout.exercises.length + 1}`,
      name: 'New exercise',
      type: 'reps',
      max_sets: 3,
      target_min: 8,
      target_max: 12,
    });
    markEditorDirty();
    renderEditor();
  }

  function removeExercise(workoutIndex, exerciseIndex) {
    if (!editorState?.workouts[workoutIndex]) return;

    editorState.workouts[workoutIndex].exercises.splice(exerciseIndex, 1);
    markEditorDirty();
    renderEditor();
  }

  async function load(options = {}) {
    const loader = document.getElementById('program-loader');
    const content = document.getElementById('program-content');

    setProgramError('');
    clearProgramEmptyState();
    setActionsVisible(hasCompletedOnboarding() && hasActiveProgram());

    if (!hasActiveProgram()) {
      renderRecoveryState();
      return;
    }

    if (editing && currentProgram && !options.force) {
      loader.classList.add('hidden');
      content.classList.remove('hidden');
      programMain.classList.remove('hidden');
      renderReadOnlyProgram(currentProgram);
      renderEditor();
      return;
    }

    loader.classList.remove('hidden');
    content.classList.add('hidden');
    programMain.classList.add('hidden');

    try {
      const data = ensureApiObject(await api.getProgram(), 'program');
      currentProgram = data;

      loader.classList.add('hidden');
      content.classList.remove('hidden');
      programMain.classList.remove('hidden');

      renderReadOnlyProgram(data);

      if (editing) {
        editorState = cloneProgramForEditor(currentProgram);
        renderEditor();
      } else {
        stopEditing({ keepStatus: false, keepProgram: true });
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
    if (!hasCompletedOnboarding() || actionInFlight) return;

    const confirmed = await openConfirmDialog({
      title: 'Build a new generated plan?',
      copy: 'This will create a fresh program version from the stored onboarding profile. Your current plan will stay in history, but the active plan will be replaced.',
      confirmText: 'Build new plan',
      danger: true,
    });

    if (!confirmed) return;

    setActionButtonsDisabled(true);
    setProgramError('');
    document.getElementById('today-error').textContent = '';

    try {
      await api.regenerateProgram();
      stopEditing({ keepStatus: false, keepProgram: false });
      await onRefreshProductState();

      if (getActiveTabId() === 'program') {
        await load({ force: true });
      }
    } catch (error) {
      if (error instanceof AuthRedirectError) return;

      if (isOnboardingIncompleteError(error)) {
        await onEnterOnboarding();
        return;
      }

      setProgramError('Could not build a new plan: ' + error.message);
    } finally {
      setActionButtonsDisabled(false);
      if (trigger) {
        trigger.disabled = false;
      }
    }
  }

  async function handleResetProgram() {
    if (!hasCompletedOnboarding() || actionInFlight) return;

    const resetToken = await openConfirmDialog({
      title: 'Reset the active plan?',
      copy: 'This will replace the active program with the built-in default template and reset progression seeding. Enter the reset token to confirm.',
      confirmText: 'Reset program',
      requireInputLabel: 'Reset token',
      inputPlaceholder: 'Enter X-Reset-Token',
      danger: true,
    });

    if (!resetToken) return;

    setActionButtonsDisabled(true);
    setProgramError('');

    try {
      await api.resetProgram(resetToken);
      stopEditing({ keepStatus: false, keepProgram: false });
      await onRefreshProductState();

      if (getActiveTabId() === 'program') {
        await load({ force: true });
      }
    } catch (error) {
      if (error instanceof AuthRedirectError) return;

      if (isOnboardingIncompleteError(error)) {
        await onEnterOnboarding();
        return;
      }

      setProgramError('Could not reset the plan: ' + error.message);
    } finally {
      setActionButtonsDisabled(false);
    }
  }

  async function handleSaveProgram() {
    if (!editing || !editorState || actionInFlight) return;

    setProgramError('');

    let payload;
    try {
      payload = buildProgramPayload(editorState);
    } catch (error) {
      setProgramError(error instanceof Error ? error.message : 'Program validation failed.');
      return;
    }

    setActionButtonsDisabled(true);
    setEditorStatus('Saving...');

    try {
      await api.saveProgram(payload);
      stopEditing({ keepStatus: false, keepProgram: false });
      await onRefreshProductState();

      if (getActiveTabId() === 'program') {
        await load({ force: true });
      }
    } catch (error) {
      if (error instanceof AuthRedirectError) return;

      if (isOnboardingIncompleteError(error)) {
        await onEnterOnboarding();
        return;
      }

      setProgramError('Could not save the plan: ' + error.message);
      setEditorStatus('Fix the errors and try again');
    } finally {
      setActionButtonsDisabled(false);
    }
  }

  return {
    init,
    handleRegenerateProgram,
    load,
    renderRecoveryState,
    setActionsVisible,
  };
}
