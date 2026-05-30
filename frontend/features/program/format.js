import { el } from '/shared/ui/dom.js';
import { formatDateTimeLabel } from '/shared/utils/date.js';
import { humanizeToken } from '/shared/utils/format.js';

export function createStat(label, value) {
  const item = el('div', 'program-summary-stat');
  item.appendChild(el('div', 'program-summary-label', label));
  item.appendChild(el('div', 'program-summary-value', value));
  return item;
}

export function createDetailStat(label, value) {
  const item = el('div', 'program-detail-stat');
  item.appendChild(el('div', 'program-detail-label', label));
  item.appendChild(el('div', 'program-detail-value', value));
  return item;
}

export function createPill(label, className = '') {
  return el('div', ['program-meta-pill', className].filter(Boolean).join(' '), label);
}

export function countProgramExercises(program) {
  return Object.values(program.workouts ?? {}).reduce(
    (count, workout) => count + (Array.isArray(workout.exercises) ? workout.exercises.length : 0),
    0
  );
}

export function formatDateOrFallback(value, fallback = 'Not yet') {
  return value ? formatDateTimeLabel(value) : fallback;
}

export function formatDirectionLabel(direction) {
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

export function buildGenerationSummary(program) {
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

export function formatVersionStatus(program) {
  const versionNumber = program.active_version?.version_number;
  return Number.isInteger(versionNumber) ? `Active · v${versionNumber}` : 'Active';
}

export function formatTimelineDelta(event) {
  const before = `${event.before.sets} sets · ${event.before.min}-${event.before.max}`;
  const after = `${event.after.sets} sets · ${event.after.min}-${event.after.max}`;
  return `${before} → ${after}`;
}

export function formatProgramTarget(exercise, progressionState) {
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

export function formatProgramProgressionNote(progressionState) {
  if (!progressionState?.last_progression) {
    return 'No recent changes';
  }

  return `Updated ${progressionState.last_progression}`;
}
