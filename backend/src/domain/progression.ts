import { ProgramTemplate, WorkoutExerciseTemplate } from "./program";

export interface ExerciseProgressionState {
  id: string;
  exerciseKey: string;
  currentSets: number;
  currentTargetMin: number;
  currentTargetMax: number;
  lastProgressionAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutExerciseView {
  id: string;
  name: string;
  type: WorkoutExerciseTemplate["exercise"]["type"];
  sets: number;
  max_sets: number;
  reps?: { min: number; max: number };
  duration?: { min: number; max: number };
  cycles?: { min: number; max: number };
}

export interface WorkoutPlan {
  date: string;
  type: string;
  name: string;
  exercises: WorkoutExerciseView[];
}

export interface SessionPerformance {
  exerciseKey: string;
  sets: number[];
}

export interface ProgressionEvaluationInput {
  program: ProgramTemplate;
  states: Map<string, ExerciseProgressionState>;
  sessions: Array<{
    sessionDate: string;
    exercises: SessionPerformance[];
  }>;
  now: string;
}

export interface ProgressionChange {
  id: string;
  name: string;
  direction: "up" | "down";
  reason: string;
  before: { sets: number; min: number; max: number };
  after: { sets: number; min: number; max: number };
}

export interface ProgressionEvaluationResult {
  changed: ProgressionChange[];
  skipped: Array<{ id: string; reason: string }>;
  nextStates: ExerciseProgressionState[];
  events: ProgressionChange[];
}

export function seedProgressionStates(
  program: ProgramTemplate,
  previous: Map<string, ExerciseProgressionState>,
  now: string,
  lastProgressionAt: string | null,
  reset = false
): ExerciseProgressionState[] {
  const templates = listDistinctExercises(program);

  return templates.map(template => {
    const previousState = reset ? null : previous.get(template.exercise.key);
    return {
      id: previousState?.id ?? "",
      exerciseKey: template.exercise.key,
      currentSets: previousState?.currentSets ?? 1,
      currentTargetMin: previousState?.currentTargetMin ?? template.targetMin,
      currentTargetMax: previousState?.currentTargetMax ?? template.targetMax,
      lastProgressionAt: previousState?.lastProgressionAt ?? lastProgressionAt,
      createdAt: previousState?.createdAt ?? now,
      updatedAt: now,
    };
  });
}

export function createWorkoutPlan(program: ProgramTemplate, date: string, states: Map<string, ExerciseProgressionState>): WorkoutPlan | null {
  const workoutKey = program.schedule[getDayNameForPlan(date)];
  if (!workoutKey) return null;

  const workout = program.workouts[workoutKey];
  if (!workout) return null;

  return {
    date,
    type: workoutKey,
    name: workout.name,
    exercises: workout.exercises.map(template => templateToWorkoutExerciseView(template, states.get(template.exercise.key))),
  };
}

function getDayNameForPlan(date: string): keyof ProgramTemplate["schedule"] {
  const dayIndex = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  return days[dayIndex];
}

export function templateToWorkoutExerciseView(
  template: WorkoutExerciseTemplate,
  state?: ExerciseProgressionState
): WorkoutExerciseView {
  const base = {
    id: template.exercise.key,
    name: template.exercise.name,
    type: template.exercise.type,
    sets: state?.currentSets ?? 1,
    max_sets: template.maxSets,
  };

  const min = state?.currentTargetMin ?? template.targetMin;
  const max = state?.currentTargetMax ?? template.targetMax;

  if (template.exercise.type === "reps") {
    return { ...base, reps: { min, max } };
  }
  if (template.exercise.type === "time") {
    return { ...base, duration: { min, max } };
  }

  return { ...base, cycles: { min, max } };
}

export function evaluateProgression(input: ProgressionEvaluationInput): ProgressionEvaluationResult {
  const nextStates = new Map<string, ExerciseProgressionState>();
  const changed: ProgressionChange[] = [];
  const skipped: Array<{ id: string; reason: string }> = [];

  for (const template of listDistinctExercises(input.program)) {
    const current = input.states.get(template.exercise.key);
    if (!current) {
      skipped.push({ id: template.exercise.key, reason: "missing progression state" });
      continue;
    }

    const sessionResults = input.sessions
      .map(session => session.exercises.find(exercise => exercise.exerciseKey === template.exercise.key) ?? null)
      .filter((entry): entry is SessionPerformance => entry !== null && entry.sets.length > 0);

    if (!template.exercise.progressionEnabled) {
      skipped.push({ id: template.exercise.key, reason: "progression disabled for this exercise" });
      nextStates.set(template.exercise.key, { ...current });
      continue;
    }

    if (sessionResults.length === 0) {
      skipped.push({ id: template.exercise.key, reason: "no recent session data" });
      nextStates.set(template.exercise.key, { ...current });
      continue;
    }

    let aboveTarget = 0;
    let belowTarget = 0;
    for (const result of sessionResults) {
      const average = result.sets.reduce((sum, value) => sum + value, 0) / result.sets.length;
      if (average >= current.currentTargetMax) aboveTarget += 1;
      if (average < current.currentTargetMin) belowTarget += 1;
    }

    const nextState = { ...current, updatedAt: input.now };
    const before = {
      sets: current.currentSets,
      min: current.currentTargetMin,
      max: current.currentTargetMax,
    };

    let change: ProgressionChange | null = null;
    if (aboveTarget >= 2) {
      if (current.currentSets < template.maxSets) {
        nextState.currentSets += 1;
      } else {
        nextState.currentTargetMin += template.exercise.progressionStep;
        nextState.currentTargetMax += template.exercise.progressionStep;
      }
      nextState.lastProgressionAt = input.now.slice(0, 10);
      change = {
        id: template.exercise.key,
        name: template.exercise.name,
        direction: "up",
        reason: `performed above target in ${aboveTarget} sessions`,
        before,
        after: {
          sets: nextState.currentSets,
          min: nextState.currentTargetMin,
          max: nextState.currentTargetMax,
        },
      };
    } else if (belowTarget >= 2) {
      if (current.currentSets > 1) {
        nextState.currentSets -= 1;
      } else {
        nextState.currentTargetMin = Math.max(template.targetMin, current.currentTargetMin - template.exercise.deloadStep);
        nextState.currentTargetMax = Math.max(nextState.currentTargetMin, current.currentTargetMax - template.exercise.deloadStep);
      }
      nextState.lastProgressionAt = input.now.slice(0, 10);
      change = {
        id: template.exercise.key,
        name: template.exercise.name,
        direction: "down",
        reason: `performed below target in ${belowTarget} sessions`,
        before,
        after: {
          sets: nextState.currentSets,
          min: nextState.currentTargetMin,
          max: nextState.currentTargetMax,
        },
      };
    }

    nextStates.set(template.exercise.key, nextState);
    if (change) {
      changed.push(change);
    } else {
      skipped.push({ id: template.exercise.key, reason: "performance stayed within target range" });
    }
  }

  return {
    changed,
    skipped,
    nextStates: Array.from(nextStates.values()),
    events: changed,
  };
}

function listDistinctExercises(program: ProgramTemplate): WorkoutExerciseTemplate[] {
  const distinct = new Map<string, WorkoutExerciseTemplate>();
  for (const workout of Object.values(program.workouts)) {
    for (const exercise of workout.exercises) {
      if (!distinct.has(exercise.exercise.key)) {
        distinct.set(exercise.exercise.key, exercise);
      }
    }
  }
  return Array.from(distinct.values());
}
