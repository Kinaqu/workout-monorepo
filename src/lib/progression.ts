import { Program, UserState, Exercise } from "./types";

interface LogEntry {
  date: string;
  exercises: { id: string; sets: number[] }[];
}

interface ProgressionResult {
  changed: {
    id: string;
    name: string;
    direction: "up" | "down";
    reason: string;
    before: { sets: number; max?: number };
    after:  { sets: number; max?: number };
  }[];
  skipped: { id: string; reason: string }[];
}

export async function runProgression(
  userId: string,
  program: Program,
  state: UserState,
  getLogs: (userId: string, days: number) => Promise<LogEntry[]>
): Promise<{ state: UserState; result: ProgressionResult }> {
  const logs = await getLogs(userId, 7);
  const result: ProgressionResult = { changed: [], skipped: [] };

  if (logs.length === 0) {
    return { state, result };
  }

  const newSets = { ...state.sets };

  for (const workout of Object.values(program.workouts)) {
    for (const exercise of workout.exercises) {
      const decision = evaluateExercise(exercise, logs);

      if (decision.action === "skip") {
        result.skipped.push({ id: exercise.id, reason: decision.reason });
        continue;
      }

      const before = {
        sets: newSets[exercise.id] ?? 1,
        max:  getExerciseMax(exercise),
      };

      if (decision.action === "up") {
        applyProgression(exercise, newSets);
      } else {
        applyRegression(exercise, newSets);
      }

      const after = {
        sets: newSets[exercise.id] ?? 1,
        max:  getExerciseMax(exercise),
      };

      result.changed.push({
        id: exercise.id,
        name: exercise.name,
        direction: decision.action,
        reason: decision.reason,
        before,
        after,
      });
    }
  }

  const newState: UserState = {
    ...state,
    sets: newSets,
    last_progression: new Date().toISOString().split("T")[0],
  };

  return { state: newState, result };
}

function evaluateExercise(
  exercise: Exercise,
  logs: LogEntry[]
): { action: "up" | "down" | "skip"; reason: string } {
  if (exercise.max_sets === 1) {
    return { action: "skip", reason: "no progression for this exercise" };
  }

  if (exercise.type === "cycles") {
    return { action: "skip", reason: "cycles progression not supported" };
  }

  const targetRange = getTargetRange(exercise);
  if (!targetRange) {
    return { action: "skip", reason: "no target range defined" };
  }

  const workoutResults = collectResults(exercise.id, logs);

  if (workoutResults.length === 0) {
    return { action: "skip", reason: "no data this week" };
  }

  let aboveMax = 0;
  let belowMin = 0;

  for (const sessionSets of workoutResults) {
    if (sessionSets.length === 0) continue;
    const avg = sessionSets.reduce((a, b) => a + b, 0) / sessionSets.length;
    if (avg >= targetRange.max) aboveMax++;
    if (avg < targetRange.min) belowMin++;
  }

  if (aboveMax >= 2) {
    return { action: "up",   reason: `performed above max in ${aboveMax} sessions` };
  }
  if (belowMin >= 2) {
    return { action: "down", reason: `performed below min in ${belowMin} sessions` };
  }

  return { action: "skip", reason: "performance within target range" };
}

function applyProgression(exercise: Exercise, sets: Record<string, number>): void {
  const current = sets[exercise.id] ?? 1;
  if (current < exercise.max_sets) {
    sets[exercise.id] = current + 1;
    return;
  }
  if (exercise.type === "reps" && exercise.reps) {
    exercise.reps.max += 1;
  } else if (exercise.type === "time" && exercise.duration) {
    exercise.duration.max += 5;
  }
}

function applyRegression(exercise: Exercise, sets: Record<string, number>): void {
  const current = sets[exercise.id] ?? 1;
  if (current > 1) {
    sets[exercise.id] = current - 1;
    return;
  }
  if (exercise.type === "reps" && exercise.reps) {
    exercise.reps.max = Math.max(exercise.reps.min, exercise.reps.max - 1);
  } else if (exercise.type === "time" && exercise.duration) {
    exercise.duration.max = Math.max(exercise.duration.min, exercise.duration.max - 5);
  }
}

function getTargetRange(exercise: Exercise): { min: number; max: number } | null {
  if (exercise.type === "reps" && exercise.reps)     return exercise.reps;
  if (exercise.type === "time" && exercise.duration) return exercise.duration;
  return null;
}

function getExerciseMax(exercise: Exercise): number | undefined {
  if (exercise.type === "reps" && exercise.reps)     return exercise.reps.max;
  if (exercise.type === "time" && exercise.duration) return exercise.duration.max;
  return undefined;
}

function collectResults(exerciseId: string, logs: LogEntry[]): number[][] {
  return logs
    .map(log => log.exercises.find(e => e.id === exerciseId))
    .filter((entry): entry is { id: string; sets: number[] } => !!entry && entry.sets.length > 0)
    .map(entry => entry.sets);
}