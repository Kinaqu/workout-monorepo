import { ExerciseType, ProgramTemplate, WorkoutTemplate } from "./program";

export interface LoggedExerciseInput {
  id: string;
  sets: number[];
  name?: string;
}

export interface SessionWriteInput {
  sessionDate: string;
  note: string;
  workoutType: string | null;
  source: "json" | "text" | "legacy-kv";
  rawText: string | null;
  exercises: LoggedExerciseInput[];
  unmatched: string[];
}

export interface WorkoutSessionExercise {
  id: string;
  exerciseKey: string | null;
  exerciseName: string;
  exerciseType: ExerciseType | null;
  matched: boolean;
  sortOrder: number;
  sets: number[];
}

export interface WorkoutSessionRecord {
  id: string;
  sessionDate: string;
  workoutType: string | null;
  workoutName: string | null;
  note: string;
  source: "json" | "text" | "legacy-kv";
  rawText: string | null;
  unmatched: string[];
  createdAt: string;
  updatedAt: string;
  exercises: WorkoutSessionExercise[];
}

export interface ParsedTextLog {
  exercises: LoggedExerciseInput[];
  note: string;
  unmatched: string[];
}

export function parseLogText(text: string, program: ProgramTemplate): ParsedTextLog {
  const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
  const nameIndex = buildExerciseIndex(program);
  const exercises: LoggedExerciseInput[] = [];
  const noteLines: string[] = [];
  const unmatched: string[] = [];

  for (const line of lines) {
    const values = extractNumbers(line);
    if (values.length === 0) {
      noteLines.push(line);
      continue;
    }

    const matchedExercise = matchExercise(line, nameIndex);
    if (!matchedExercise) {
      unmatched.push(line);
      continue;
    }

    const existing = exercises.find(exercise => exercise.id === matchedExercise.id);
    if (existing) {
      existing.sets.push(...values);
      continue;
    }

    exercises.push({
      id: matchedExercise.id,
      name: matchedExercise.name,
      sets: values,
    });
  }

  return {
    exercises,
    note: noteLines.join(" ").trim(),
    unmatched,
  };
}

export function enrichSessionInput(program: ProgramTemplate, input: SessionWriteInput): Omit<WorkoutSessionRecord, "id" | "createdAt" | "updatedAt"> {
  const workout = input.workoutType ? program.workouts[input.workoutType] ?? null : null;
  return {
    sessionDate: input.sessionDate,
    workoutType: input.workoutType,
    workoutName: workout?.name ?? null,
    note: input.note,
    source: input.source,
    rawText: input.rawText,
    unmatched: input.unmatched,
    exercises: input.exercises.map((exercise, index) => mapExerciseToSession(program, workout, exercise, index)),
  };
}

export function sessionToLegacyLogResponse(session: WorkoutSessionRecord): Record<string, unknown> {
  return {
    date: session.sessionDate,
    workout_type: session.workoutType,
    exercises: session.exercises
      .filter(exercise => exercise.exerciseKey)
      .map(exercise => ({
        id: exercise.exerciseKey,
        name: exercise.exerciseName,
        sets: exercise.sets,
      })),
    note: session.note,
    unmatched: session.unmatched,
    source: session.source,
    session_id: session.id,
    created_at: session.createdAt,
  };
}

function mapExerciseToSession(
  program: ProgramTemplate,
  workout: WorkoutTemplate | null,
  exercise: LoggedExerciseInput,
  sortOrder: number
): WorkoutSessionExercise {
  const template = findExercise(program, exercise.id);
  const workoutExercise = workout?.exercises.find(item => item.exercise.key === exercise.id) ?? template;

  return {
    id: "",
    exerciseKey: workoutExercise?.exercise.key ?? exercise.id,
    exerciseName: exercise.name ?? workoutExercise?.exercise.name ?? exercise.id,
    exerciseType: workoutExercise?.exercise.type ?? null,
    matched: Boolean(workoutExercise),
    sortOrder,
    sets: exercise.sets.filter(value => Number.isFinite(value)).map(value => Math.round(value)),
  };
}

function findExercise(program: ProgramTemplate, exerciseKey: string) {
  for (const workout of Object.values(program.workouts)) {
    const found = workout.exercises.find(item => item.exercise.key === exerciseKey);
    if (found) return found;
  }
  return null;
}

function extractNumbers(line: string): number[] {
  const cleaned = line
    .replace(/сек|sec|раз|повт|x|х/gi, " ")
    .replace(/[^\d\s.,]/g, " ");

  const matches = cleaned.match(/\d+/g);
  return matches ? matches.map(Number) : [];
}

function buildExerciseIndex(program: ProgramTemplate): Map<string, { id: string; name: string }> {
  const index = new Map<string, { id: string; name: string }>();

  for (const workout of Object.values(program.workouts)) {
    for (const template of workout.exercises) {
      const normalized = normalize(template.exercise.name);
      index.set(normalized, { id: template.exercise.key, name: template.exercise.name });

      const shortened = normalized.slice(0, Math.max(5, normalized.length - 2));
      if (!index.has(shortened)) {
        index.set(shortened, { id: template.exercise.key, name: template.exercise.name });
      }
    }
  }

  return index;
}

function matchExercise(line: string, index: Map<string, { id: string; name: string }>): { id: string; name: string } | null {
  const normalizedLine = normalize(line);
  for (const [key, value] of index.entries()) {
    if (normalizedLine.includes(key)) {
      return value;
    }
  }

  return null;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^а-яa-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
