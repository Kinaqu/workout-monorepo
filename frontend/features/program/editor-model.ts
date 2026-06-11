import type { ProgramDefinition, ProgramResponse } from '../../lib/api/contracts.ts';

export const DAY_OPTIONS: Array<[string, string]> = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
];

export const EXERCISE_TYPE_OPTIONS: Array<[string, string]> = [
  ['reps', 'Reps'],
  ['time', 'Seconds'],
  ['cycles', 'Cycles'],
];

export interface EditorExercise {
  id: string;
  name: string;
  type: string;
  max_sets: string | number;
  target_min: string | number | undefined;
  target_max: string | number | undefined;
}

export interface EditorWorkout {
  key: string;
  name: string;
  exercises: EditorExercise[];
}

export interface EditorState {
  id: string;
  name: string;
  schedule: Record<string, string>;
  workouts: EditorWorkout[];
}

export function cloneProgramForEditor(program: ProgramResponse): EditorState {
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

export function buildProgramPayload(editorState: EditorState): ProgramDefinition {
  const id = String(editorState.id || '').trim();
  const name = String(editorState.name || '').trim();

  if (!id) {
    throw new Error('Program id is required.');
  }

  if (!name) {
    throw new Error('Program name is required.');
  }

  const workouts: ProgramDefinition['workouts'] = {};
  const workoutKeys = new Set<string>();

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
        if (exerciseType !== 'reps' && exerciseType !== 'time' && exerciseType !== 'cycles') {
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
          max_sets: maxSets,
        };

        if (exerciseType === 'reps') {
          return { ...base, type: 'reps' as const, reps: { min, max } };
        }

        if (exerciseType === 'time') {
          return { ...base, type: 'time' as const, duration: { min, max } };
        }

        return { ...base, type: 'cycles' as const, cycles: { min, max } };
      }),
    };
  });

  const schedule: Record<string, string> = {};
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
    schedule: schedule as ProgramDefinition['schedule'],
    workouts,
  };
}
