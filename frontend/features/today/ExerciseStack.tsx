import { useState } from 'react';

import type { WorkoutTodayResponse } from '../../lib/api/contracts.ts';

type WorkoutPlan = Extract<WorkoutTodayResponse, { exercises: unknown }>;
type PlanExercise = WorkoutPlan['exercises'][number];

function resolveExerciseSets(exercise: PlanExercise): number {
  const currentSets = Number.isInteger(exercise.sets) ? exercise.sets : null;
  const maxSets = Number.isInteger(exercise.max_sets) ? exercise.max_sets : null;
  return Math.max(1, currentSets ?? maxSets ?? 1);
}

function formatSetsLabel(exercise: PlanExercise, currentSets: number): string {
  const maxSets = Number.isInteger(exercise.max_sets) ? exercise.max_sets : null;
  if (maxSets && maxSets > currentSets) {
    return `${currentSets}/${maxSets} sets`;
  }
  return `${currentSets} sets`;
}

function formatTargetRange(range: { min: number; max: number } | undefined, unit: string): string {
  if (!range) return '';
  const min = Number.isInteger(range.min) ? range.min : null;
  const max = Number.isInteger(range.max) ? range.max : null;
  if (min === null && max === null) return '';
  if (min !== null && max !== null) {
    return min === max ? `${max} ${unit}` : `${min}-${max} ${unit}`;
  }
  return `${min ?? max} ${unit}`;
}

function formatExerciseTarget(exercise: PlanExercise): string {
  if (exercise.type === 'reps') return formatTargetRange(exercise.reps, 'reps');
  if (exercise.type === 'time') return formatTargetRange(exercise.duration, 'sec');
  return formatTargetRange(exercise.cycles, 'cycles');
}

function inputPlaceholder(type: PlanExercise['type']): string {
  if (type === 'time') return 'Sec';
  if (type === 'cycles') return 'Cycles';
  return 'Reps';
}

function helperText(type: PlanExercise['type']): string {
  if (type === 'time') return 'Enter seconds for each set.';
  if (type === 'cycles') return 'Enter cycles for each set.';
  return 'Enter reps for each set.';
}

// One-card-at-a-time logging stack: the active exercise is front and
// center, completed ones collapse behind it, the last card saves.
export function ExerciseStack({
  plan,
  saving,
  onSave,
}: {
  plan: WorkoutPlan;
  saving: boolean;
  onSave: (exercises: Array<{ id: string; sets: number[] }>) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [values, setValues] = useState<string[][]>(() =>
    plan.exercises.map(exercise => Array.from({ length: resolveExerciseSets(exercise) }, () => ''))
  );
  const [invalidIndex, setInvalidIndex] = useState<number | null>(null);

  function setValue(exerciseIndex: number, setIndex: number, value: string) {
    setValues(previous =>
      previous.map((sets, index) => (index === exerciseIndex ? sets.map((v, i) => (i === setIndex ? value : v)) : sets))
    );
  }

  function advance(exerciseIndex: number) {
    if (saving) return;

    const filled = values[exerciseIndex].every(value => value.trim() !== '');
    if (!filled) {
      setInvalidIndex(exerciseIndex);
      window.setTimeout(() => setInvalidIndex(current => (current === exerciseIndex ? null : current)), 1400);
      return;
    }

    if (exerciseIndex < plan.exercises.length - 1) {
      setActiveIndex(exerciseIndex + 1);
      return;
    }

    onSave(
      plan.exercises.map((exercise, index) => ({
        id: exercise.id,
        sets: values[index].map(value => Number.parseInt(value, 10) || 0),
      }))
    );
  }

  const remaining = Math.max(plan.exercises.length - activeIndex - 1, 0);

  return (
    <div id="today-exercises" style={{ ['--stack-depth' as string]: String(Math.min(remaining, 2)) }}>
      {plan.exercises.map((exercise, index) => {
        const isLast = index === plan.exercises.length - 1;
        const isActive = index === activeIndex;
        const currentSets = resolveExerciseSets(exercise);
        const targetText = formatExerciseTarget(exercise);
        const cardClass = [
          'card exercise-card',
          isActive ? 'active' : '',
          index < activeIndex ? 'completed' : '',
          index > activeIndex ? 'upcoming' : '',
          invalidIndex === index ? 'exercise-card-invalid' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <section
            key={exercise.id}
            className={cardClass}
            data-id={exercise.id}
            data-index={String(index)}
            data-total={String(plan.exercises.length)}
            aria-hidden={!isActive}
          >
            <div className="exercise-progress">
              <span className="exercise-progress-current">{`${index + 1}/${plan.exercises.length}`}</span>
              <span className="exercise-progress-label">Exercise</span>
            </div>
            <div className="card-title exercise-title">{exercise.name || exercise.id}</div>
            <div className="exercise-header-chips">
              {targetText ? <div className="exercise-chip">{targetText}</div> : null}
              <div className="exercise-chip exercise-chip-accent">{formatSetsLabel(exercise, currentSets)}</div>
            </div>
            <div className="exercise-helper">{helperText(exercise.type)}</div>
            <div className="sets-container">
              {values[index].map((value, setIndex) => (
                <div className="set-row" key={setIndex}>
                  <div className="set-label">{`Set ${setIndex + 1}`}</div>
                  <input
                    className="set-input"
                    type="number"
                    min="0"
                    placeholder={inputPlaceholder(exercise.type)}
                    value={value}
                    onChange={event => setValue(index, setIndex, event.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="exercise-card-footer">
              <div className="exercise-footer-hint">
                {invalidIndex === index
                  ? 'Enter every set first.'
                  : isLast
                    ? 'Fill every set to save.'
                    : 'Fill every set to continue.'}
              </div>
              <button
                type="button"
                className="exercise-complete-btn"
                aria-label={isLast ? 'Save workout' : 'Open next exercise'}
                disabled={saving}
                onClick={() => advance(index)}
              >
                {isLast ? 'Save workout' : 'Next exercise'}
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
