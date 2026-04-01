import { fetchAll, fetchFirst } from "../db/d1";
import { ProgramDraft, ProgramTemplate, WorkoutExerciseTemplate, WorkoutTemplate, ExerciseDefinition } from "../domain/program";
import { Env } from "../env";
import { createId } from "../lib/id";
import { ALL_DAY_NAMES, DayName, nowIso } from "../lib/time";

interface ProgramRow {
  id: string;
  program_key: string;
  program_family_id: string;
  version_number: number;
  previous_program_id: string | null;
  name: string;
  source: string;
  created_at: string;
  updated_at: string;
}

interface WorkoutRow {
  id: string;
  workout_key: string;
  name: string;
  sort_order: number;
}

interface ScheduleRow {
  day_of_week: number;
  workout_id: string | null;
}

interface ExerciseRow {
  id: string;
  catalog_exercise_id: string | null;
  exercise_key: string;
  name: string;
  type: ExerciseDefinition["type"];
  progression_enabled: number;
  progression_step: number;
  deload_step: number;
}

interface WorkoutExerciseRow {
  id: string;
  workout_id: string;
  exercise_id: string;
  sort_order: number;
  max_sets: number;
  target_min: number;
  target_max: number;
}

export class ProgramRepository {
  constructor(private readonly env: Env) {}

  async getActiveProgramSummary(userId: string): Promise<ProgramRow | null> {
    return fetchFirst<ProgramRow>(
      this.env.DB.prepare(
        `SELECT id, program_key, program_family_id, version_number, previous_program_id, name, source, created_at, updated_at
         FROM programs
         WHERE user_id = ? AND is_active = 1
         ORDER BY updated_at DESC
         LIMIT 1`
      ).bind(userId)
    );
  }

  async getActiveProgram(userId: string): Promise<ProgramTemplate | null> {
    const program = await this.getActiveProgramSummary(userId);

    if (!program) return null;
    return this.getProgramById(program.id);
  }

  async getProgramById(programId: string): Promise<ProgramTemplate | null> {
    const program = await fetchFirst<ProgramRow>(
      this.env.DB.prepare(
        `SELECT id, program_key, program_family_id, version_number, previous_program_id, name, source, created_at, updated_at
         FROM programs
         WHERE id = ?`
      ).bind(programId)
    );

    if (!program) return null;

    const [workouts, scheduleRows, exerciseRows, workoutExerciseRows] = await Promise.all([
      fetchAll<WorkoutRow>(
        this.env.DB.prepare(
          `SELECT id, workout_key, name, sort_order
           FROM workouts
           WHERE program_id = ?
           ORDER BY sort_order ASC`
        ).bind(programId)
      ),
      fetchAll<ScheduleRow>(
        this.env.DB.prepare(
          `SELECT day_of_week, workout_id
           FROM program_schedule
           WHERE program_id = ?`
        ).bind(programId)
      ),
      fetchAll<ExerciseRow>(
        this.env.DB.prepare(
          `SELECT id, catalog_exercise_id, exercise_key, name, type, progression_enabled, progression_step, deload_step
           FROM exercises
           WHERE program_id = ?`
        ).bind(programId)
      ),
      fetchAll<WorkoutExerciseRow>(
        this.env.DB.prepare(
          `SELECT id, workout_id, exercise_id, sort_order, max_sets, target_min, target_max
           FROM workout_exercises
           WHERE workout_id IN (SELECT id FROM workouts WHERE program_id = ?)
           ORDER BY sort_order ASC`
        ).bind(programId)
      ),
    ]);

    const workoutsById = new Map<string, WorkoutTemplate>();
    for (const workout of workouts) {
      workoutsById.set(workout.id, {
        id: workout.id,
        key: workout.workout_key,
        name: workout.name,
        sortOrder: workout.sort_order,
        exercises: [],
      });
    }

    const exerciseById = new Map<string, ExerciseDefinition>();
    for (const exercise of exerciseRows) {
      exerciseById.set(exercise.id, {
        id: exercise.id,
        catalogExerciseId: exercise.catalog_exercise_id,
        key: exercise.exercise_key,
        name: exercise.name,
        type: exercise.type,
        progressionEnabled: Boolean(exercise.progression_enabled),
        progressionStep: exercise.progression_step,
        deloadStep: exercise.deload_step,
      });
    }

    for (const item of workoutExerciseRows) {
      const workout = workoutsById.get(item.workout_id);
      const exercise = exerciseById.get(item.exercise_id);
      if (!workout || !exercise) continue;

      const workoutExercise: WorkoutExerciseTemplate = {
        id: item.id,
        sortOrder: item.sort_order,
        maxSets: item.max_sets,
        targetMin: item.target_min,
        targetMax: item.target_max,
        exercise,
      };

      workout.exercises.push(workoutExercise);
    }

    const schedule = Object.fromEntries(ALL_DAY_NAMES.map(day => [day, null])) as Record<DayName, string | null>;
    const workoutIdToKey = new Map(workouts.map(workout => [workout.id, workout.workout_key]));
    for (const row of scheduleRows) {
      const dayName = dayIndexToName(row.day_of_week);
      schedule[dayName] = row.workout_id ? workoutIdToKey.get(row.workout_id) ?? null : null;
    }

    return {
      versionId: program.id,
      key: program.program_key,
      name: program.name,
      source: program.source,
      createdAt: program.created_at,
      updatedAt: program.updated_at,
      schedule,
      workouts: Object.fromEntries(
        Array.from(workoutsById.values())
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map(workout => [workout.key, workout])
      ),
    };
  }

  async createProgramVersion(userId: string, draft: ProgramDraft, source: string): Promise<ProgramTemplate> {
    const now = nowIso();
    const programId = createId("program");
    const current = await this.getActiveProgramSummary(userId);
    const catalogIdsByExerciseKey = await this.getCatalogExerciseIdsForKeys(
      Array.from(new Set(draft.workouts.flatMap(workout => workout.exercises.map(exercise => exercise.exerciseKey))))
    );
    const programFamilyId = current?.program_family_id ?? programId;
    const versionNumber = (current?.version_number ?? 0) + 1;

    const statements: D1PreparedStatement[] = [
      this.env.DB.prepare(
        "UPDATE programs SET is_active = 0, updated_at = ?, superseded_at = ? WHERE user_id = ? AND is_active = 1"
      ).bind(now, now, userId),
      this.env.DB.prepare(
        `INSERT INTO programs (
          id, user_id, program_key, program_family_id, version_number, previous_program_id, name, is_active, source,
          created_at, updated_at, superseded_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, NULL)`
      ).bind(
        programId,
        userId,
        draft.key,
        programFamilyId,
        versionNumber,
        current?.id ?? null,
        draft.name,
        source,
        now,
        now
      ),
    ];

    const workoutIds = new Map<string, string>();
    const exerciseIds = new Map<string, string>();
    for (const workout of draft.workouts) {
      const workoutId = createId("workout");
      workoutIds.set(workout.key, workoutId);
      statements.push(
        this.env.DB.prepare(
          `INSERT INTO workouts (id, program_id, workout_key, name, sort_order, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(workoutId, programId, workout.key, workout.name, workout.sortOrder, now)
      );

      for (const exercise of workout.exercises) {
        const existingExerciseId = exerciseIds.get(exercise.exerciseKey) ?? null;
        const exerciseId = existingExerciseId ?? createId("exercise");
        if (!existingExerciseId) {
          statements.push(
            this.env.DB.prepare(
              `INSERT INTO exercises (
                id, program_id, catalog_exercise_id, exercise_key, name, type, progression_enabled, progression_step,
                deload_step, created_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              exerciseId,
              programId,
              exercise.catalogExerciseId ?? catalogIdsByExerciseKey.get(exercise.exerciseKey) ?? null,
              exercise.exerciseKey,
              exercise.exerciseName,
              exercise.exerciseType,
              exercise.progressionEnabled ? 1 : 0,
              exercise.progressionStep,
              exercise.deloadStep,
              now
            )
          );
          exerciseIds.set(exercise.exerciseKey, exerciseId);
        }

        statements.push(
          this.env.DB.prepare(
            `INSERT INTO workout_exercises (id, workout_id, exercise_id, sort_order, max_sets, target_min, target_max)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            createId("wex"),
            workoutId,
            exerciseId,
            exercise.sortOrder,
            exercise.maxSets,
            exercise.targetMin,
            exercise.targetMax
          )
        );
      }
    }

    for (const [dayIndex, dayName] of ALL_DAY_NAMES.entries()) {
      const workoutKey = draft.schedule[dayName];
      const workoutId = workoutKey ? workoutIds.get(workoutKey) ?? null : null;
      statements.push(
        this.env.DB.prepare(
          `INSERT INTO program_schedule (program_id, day_of_week, workout_id)
           VALUES (?, ?, ?)`
        ).bind(programId, dayNameToIndex(dayName, dayIndex), workoutId)
      );
    }

    await this.env.DB.batch(statements);
    const created = await this.getProgramById(programId);
    if (!created) {
      throw new Error("Failed to load created program");
    }
    return created;
  }

  private async getCatalogExerciseIdsForKeys(exerciseKeys: string[]): Promise<Map<string, string>> {
    if (exerciseKeys.length === 0) {
      return new Map();
    }

    const placeholders = exerciseKeys.map(() => "?").join(", ");
    const statement = this.env.DB.prepare(
      `SELECT id, exercise_key
       FROM exercise_catalog
       WHERE exercise_key IN (${placeholders})`
    ).bind(...exerciseKeys);
    const rows = await fetchAll<{ id: string; exercise_key: string }>(statement);
    return new Map(rows.map(row => [row.exercise_key, row.id]));
  }
}

function dayIndexToName(dayOfWeek: number): DayName {
  const days: DayName[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[dayOfWeek] ?? "sunday";
}

function dayNameToIndex(dayName: DayName, fallback: number): number {
  const lookup: Record<DayName, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  return lookup[dayName] ?? fallback;
}
