import { addDays } from "../lib/time";
import { ProgramTemplate, WorkoutExerciseTemplate } from "./program";

export interface ExerciseProgressionState {
  id: string;
  exerciseId: string;
  catalogExerciseId: string | null;
  exerciseKey: string;
  currentSets: number;
  currentTargetMin: number;
  currentTargetMax: number;
  lastProgressionAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WorkoutExerciseViewBase {
  id: string;
  name: string;
  sets: number;
  max_sets: number;
}

// Discriminated like the wire contract: each variant carries exactly the
// range field for its type.
export type WorkoutExerciseView =
  | (WorkoutExerciseViewBase & { type: "reps"; reps: { min: number; max: number } })
  | (WorkoutExerciseViewBase & { type: "time"; duration: { min: number; max: number } })
  | (WorkoutExerciseViewBase & { type: "cycles"; cycles: { min: number; max: number } });

export interface WorkoutPlan {
  date: string;
  type: string;
  name: string;
  exercises: WorkoutExerciseView[];
}

export interface SessionPerformance {
  exerciseKey: string;
  catalogExerciseId: string | null;
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
  lookbackDays?: number;
}

export interface ProgressionChange {
  id: string;
  name: string;
  direction: "up" | "down";
  reason: string;
  before: { sets: number; min: number; max: number };
  after: { sets: number; min: number; max: number };
}

export interface ProgressionEventRecord {
  exerciseId: string;
  catalogExerciseId: string | null;
  exerciseKey: string;
  exerciseName: string;
  direction: "up" | "down";
  reason: string;
  before: { sets: number; min: number; max: number };
  after: { sets: number; min: number; max: number };
}

export interface ProgressionEvaluationResult {
  changed: ProgressionChange[];
  skipped: Array<{ id: string; reason: string }>;
  nextStates: ExerciseProgressionState[];
  events: ProgressionEventRecord[];
}

export function seedProgressionStates(
  program: ProgramTemplate,
  previous: Map<string, ExerciseProgressionState>,
  now: string,
  lastProgressionAt: string | null,
  reset = false
): ExerciseProgressionState[] {
  const templates = listDistinctExercises(program);
  const previousByCatalogExerciseId = new Map<string, ExerciseProgressionState>();
  const previousByExerciseKey = new Map<string, ExerciseProgressionState>();

  for (const state of previous.values()) {
    if (state.catalogExerciseId && !previousByCatalogExerciseId.has(state.catalogExerciseId)) {
      previousByCatalogExerciseId.set(state.catalogExerciseId, state);
    }
    if (!previousByExerciseKey.has(state.exerciseKey)) {
      previousByExerciseKey.set(state.exerciseKey, state);
    }
  }

  return templates.map(template => {
    const previousState = reset
      ? null
      : (template.exercise.catalogExerciseId
          ? previousByCatalogExerciseId.get(template.exercise.catalogExerciseId) ?? null
          : null) ?? previousByExerciseKey.get(template.exercise.key) ?? null;
    return {
      id: "",
      exerciseId: template.exercise.id,
      catalogExerciseId: template.exercise.catalogExerciseId,
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
    sets: state?.currentSets ?? 1,
    max_sets: template.maxSets,
  };

  const min = state?.currentTargetMin ?? template.targetMin;
  const max = state?.currentTargetMax ?? template.targetMax;

  if (template.exercise.type === "reps") {
    return { ...base, type: "reps", reps: { min, max } };
  }
  if (template.exercise.type === "time") {
    return { ...base, type: "time", duration: { min, max } };
  }

  return { ...base, type: "cycles", cycles: { min, max } };
}

export function evaluateProgression(input: ProgressionEvaluationInput): ProgressionEvaluationResult {
  const lookbackDays = Math.max(1, input.lookbackDays ?? 7);
  const nextStates = new Map<string, ExerciseProgressionState>();
  const changed: ProgressionChange[] = [];
  const skipped: Array<{ id: string; reason: string }> = [];
  const events: ProgressionEventRecord[] = [];
  const today = input.now.slice(0, 10);
  const completedSessions = input.sessions.filter(session =>
    isWorkoutSessionFullyCompleted(input.program, input.states, session)
  );
  const plannedWorkoutCount = countPlannedWorkoutDays(input.program, today, lookbackDays);
  const requiredCompletedWorkouts = plannedWorkoutCount > 0 ? Math.ceil(plannedWorkoutCount * 0.5) : 0;

  if (requiredCompletedWorkouts > 0 && completedSessions.length < requiredCompletedWorkouts) {
    return {
      changed: [],
      skipped: listDistinctExercises(input.program).map(template => ({
        id: template.exercise.key,
        reason: `completed ${completedSessions.length}/${plannedWorkoutCount} planned workouts in last ${lookbackDays} days`,
      })),
      nextStates: Array.from(input.states.values()).map(state => ({ ...state, updatedAt: input.now })),
      events: [],
    };
  }

  for (const template of listDistinctExercises(input.program)) {
    const current = input.states.get(template.exercise.key);
    if (!current) {
      skipped.push({ id: template.exercise.key, reason: "missing progression state" });
      continue;
    }

    const sessionResults = completedSessions
      .map(session => session.exercises.find(exercise => matchesSessionPerformance(template, exercise)) ?? null)
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
    if (aboveTarget >= 1) {
      const targetStep = resolveTargetStep(template);
      const initialTargetCeiling = template.targetMax + targetStep;
      if (current.currentTargetMax >= initialTargetCeiling && current.currentSets < template.maxSets) {
        nextState.currentSets += 1;
      } else {
        nextState.currentTargetMin += targetStep;
        nextState.currentTargetMax += targetStep;
      }
      nextState.lastProgressionAt = input.now.slice(0, 10);
      change = {
        id: template.exercise.key,
        name: template.exercise.name,
        direction: "up",
        reason: `completed weekly workload gate and met target in ${aboveTarget} workouts`,
        before,
        after: {
          sets: nextState.currentSets,
          min: nextState.currentTargetMin,
          max: nextState.currentTargetMax,
        },
      };
      events.push({
        exerciseId: template.exercise.id,
        catalogExerciseId: template.exercise.catalogExerciseId,
        exerciseKey: template.exercise.key,
        exerciseName: template.exercise.name,
        direction: "up",
        reason: change.reason,
        before,
        after: change.after,
      });
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
      events.push({
        exerciseId: template.exercise.id,
        catalogExerciseId: template.exercise.catalogExerciseId,
        exerciseKey: template.exercise.key,
        exerciseName: template.exercise.name,
        direction: "down",
        reason: change.reason,
        before,
        after: change.after,
      });
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
    events,
  };
}

function listDistinctExercises(program: ProgramTemplate): WorkoutExerciseTemplate[] {
  const distinct = new Map<string, WorkoutExerciseTemplate>();
  for (const workout of Object.values(program.workouts)) {
    for (const exercise of workout.exercises) {
      if (!distinct.has(exercise.exercise.id)) {
        distinct.set(exercise.exercise.id, exercise);
      }
    }
  }
  return Array.from(distinct.values());
}

function matchesSessionPerformance(template: WorkoutExerciseTemplate, performance: SessionPerformance): boolean {
  if (template.exercise.catalogExerciseId && performance.catalogExerciseId) {
    return template.exercise.catalogExerciseId === performance.catalogExerciseId;
  }

  return template.exercise.key === performance.exerciseKey;
}

function countPlannedWorkoutDays(program: ProgramTemplate, endDate: string, lookbackDays: number): number {
  let count = 0;
  const startDate = addDays(endDate, -(lookbackDays - 1));

  for (let cursor = startDate; cursor <= endDate; cursor = addDays(cursor, 1)) {
    if (program.schedule[getDayNameForPlan(cursor)]) {
      count += 1;
    }
  }

  return count;
}

function isWorkoutSessionFullyCompleted(
  program: ProgramTemplate,
  states: Map<string, ExerciseProgressionState>,
  session: { sessionDate: string; exercises: SessionPerformance[] }
): boolean {
  const workoutKey = program.schedule[getDayNameForPlan(session.sessionDate)];
  if (!workoutKey) {
    return false;
  }

  const workout = program.workouts[workoutKey];
  if (!workout || workout.exercises.length === 0) {
    return false;
  }

  return workout.exercises.every(template => {
    const performance =
      session.exercises.find(exercise => matchesSessionPerformance(template, exercise)) ?? null;
    const requiredSets = states.get(template.exercise.key)?.currentSets ?? 1;
    return Boolean(performance && performance.sets.length >= requiredSets);
  });
}

function resolveTargetStep(template: WorkoutExerciseTemplate): number {
  if (template.exercise.type === "time") {
    return Math.max(template.exercise.progressionStep, 10);
  }

  return Math.max(template.exercise.progressionStep, 2);
}
