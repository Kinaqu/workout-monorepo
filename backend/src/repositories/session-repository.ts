import { fetchAll, fetchFirst } from "../db/d1";
import { ProgramTemplate } from "../domain/program";
import { WorkoutSessionRecord } from "../domain/session";
import { Env } from "../env";
import { createId } from "../lib/id";
import { nowIso } from "../lib/time";

interface SessionRow {
  id: string;
  session_date: string;
  workout_key: string | null;
  workout_name: string | null;
  note: string;
  source: "json" | "text" | "legacy-kv";
  created_at: string;
  updated_at: string;
}

interface SessionExerciseRow {
  id: string;
  session_id: string;
  program_exercise_id: string | null;
  catalog_exercise_id: string | null;
  exercise_key: string | null;
  exercise_name: string;
  exercise_type: "reps" | "time" | "cycles" | null;
  matched: number;
  sort_order: number;
}

interface SessionImportRow {
  raw_text: string | null;
  unmatched_text: string | null;
}

interface SessionSetRow {
  session_exercise_id: string;
  set_order: number;
  value: number;
}

export class SessionRepository {
  constructor(private readonly env: Env) {}

  async createSession(
    userId: string,
    program: ProgramTemplate,
    session: Omit<WorkoutSessionRecord, "id" | "createdAt" | "updatedAt">,
    sessionIdOverride?: string
  ): Promise<WorkoutSessionRecord> {
    const now = nowIso();
    const sessionId = sessionIdOverride ?? createId("session");
    if (sessionIdOverride) {
      const existing = await this.getSession(userId, sessionIdOverride);
      if (existing) {
        return existing;
      }
    }

    const workout = session.workoutType ? program.workouts[session.workoutType] ?? null : null;
    const statements: D1PreparedStatement[] = [
      this.env.DB.prepare(
        `INSERT INTO workout_sessions (
          id, user_id, program_id, workout_id, session_date, workout_key, workout_name, note, source, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        sessionId,
        userId,
        program.versionId,
        workout?.id ?? null,
        session.sessionDate,
        session.workoutType,
        session.workoutName,
        session.note,
        session.source,
        now,
        now
      ),
    ];

    if (session.rawText || session.unmatched.length > 0) {
      statements.push(
        this.env.DB.prepare(
          `INSERT INTO workout_session_imports (session_id, raw_text, unmatched_text, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(sessionId, session.rawText, session.unmatched.join("\n") || null, now, now)
      );
    }

    for (const exercise of session.exercises) {
      const sessionExerciseId = createId("se");
      statements.push(
        this.env.DB.prepare(
          `INSERT INTO workout_session_exercises (
            id, session_id, program_exercise_id, catalog_exercise_id, exercise_key, exercise_name, exercise_type,
            matched, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          sessionExerciseId,
          sessionId,
          exercise.programExerciseId,
          exercise.catalogExerciseId,
          exercise.exerciseKey,
          exercise.exerciseName,
          exercise.exerciseType,
          exercise.matched ? 1 : 0,
          exercise.sortOrder
        )
      );

      for (const [setOrder, value] of exercise.sets.entries()) {
        statements.push(
          this.env.DB.prepare(
            `INSERT INTO workout_session_sets (id, session_exercise_id, set_order, value)
             VALUES (?, ?, ?, ?)`
          ).bind(createId("set"), sessionExerciseId, setOrder, value)
        );
      }
    }

    await this.env.DB.batch(statements);
    const created = await this.getSession(userId, sessionId);
    if (!created) {
      throw new Error("Failed to load created session");
    }
    return created;
  }

  async getSession(userId: string, sessionId: string): Promise<WorkoutSessionRecord | null> {
    const session = await fetchFirst<SessionRow>(
      this.env.DB.prepare(
        `SELECT id, session_date, workout_key, workout_name, note, source, created_at, updated_at
         FROM workout_sessions
         WHERE user_id = ? AND id = ?`
      ).bind(userId, sessionId)
    );

    if (!session) return null;
    return this.loadSessionAggregate(session);
  }

  async getLatestSessionByDate(userId: string, sessionDate: string): Promise<WorkoutSessionRecord | null> {
    const session = await fetchFirst<SessionRow>(
      this.env.DB.prepare(
        `SELECT id, session_date, workout_key, workout_name, note, source, raw_text, unmatched_text, created_at, updated_at
         FROM workout_sessions
         WHERE user_id = ? AND session_date = ?
         ORDER BY created_at DESC
         LIMIT 1`
      ).bind(userId, sessionDate)
    );

    if (!session) return null;
    return this.loadSessionAggregate(session);
  }

  async listSessionsByDate(userId: string, sessionDate: string): Promise<WorkoutSessionRecord[]> {
    const sessions = await fetchAll<SessionRow>(
      this.env.DB.prepare(
        `SELECT id, session_date, workout_key, workout_name, note, source, created_at, updated_at
         FROM workout_sessions
         WHERE user_id = ? AND session_date = ?
         ORDER BY created_at DESC`
      ).bind(userId, sessionDate)
    );

    return Promise.all(sessions.map(session => this.loadSessionAggregate(session)));
  }

  async listSessions(userId: string, limit: number, sessionDate?: string): Promise<WorkoutSessionRecord[]> {
    const query = sessionDate
      ? this.env.DB.prepare(
          `SELECT id, session_date, workout_key, workout_name, note, source, created_at, updated_at
           FROM workout_sessions
           WHERE user_id = ? AND session_date = ?
           ORDER BY session_date DESC, created_at DESC
           LIMIT ?`
        ).bind(userId, sessionDate, limit)
      : this.env.DB.prepare(
          `SELECT id, session_date, workout_key, workout_name, note, source, created_at, updated_at
           FROM workout_sessions
           WHERE user_id = ?
           ORDER BY session_date DESC, created_at DESC
           LIMIT ?`
        ).bind(userId, limit);

    const sessions = await fetchAll<SessionRow>(query);
    return Promise.all(sessions.map(session => this.loadSessionAggregate(session)));
  }

  async listRecentPerformance(
    userId: string,
    sinceDate: string
  ): Promise<Array<{ sessionDate: string; exercises: Array<{ exerciseKey: string; catalogExerciseId: string | null; sets: number[] }> }>> {
    const sessions = await fetchAll<SessionRow>(
      this.env.DB.prepare(
        `SELECT id, session_date, workout_key, workout_name, note, source, created_at, updated_at
         FROM workout_sessions
         WHERE user_id = ? AND session_date >= ?
         ORDER BY session_date DESC, created_at DESC`
      ).bind(userId, sinceDate)
    );

    const exerciseRows = await fetchAll<SessionExerciseRow>(
      this.env.DB.prepare(
        `SELECT id, session_id, program_exercise_id, catalog_exercise_id, exercise_key, exercise_name, exercise_type,
                matched, sort_order
         FROM workout_session_exercises
         WHERE session_id IN (
           SELECT id FROM workout_sessions WHERE user_id = ? AND session_date >= ?
         )`
      ).bind(userId, sinceDate)
    );

    const setRows = await fetchAll<SessionSetRow>(
      this.env.DB.prepare(
        `SELECT workout_session_sets.session_exercise_id, workout_session_sets.set_order, workout_session_sets.value
         FROM workout_session_sets
         INNER JOIN workout_session_exercises ON workout_session_exercises.id = workout_session_sets.session_exercise_id
         INNER JOIN workout_sessions ON workout_sessions.id = workout_session_exercises.session_id
         WHERE workout_sessions.user_id = ? AND workout_sessions.session_date >= ?`
      ).bind(userId, sinceDate)
    );

    const setsByExercise = new Map<string, number[]>();
    for (const row of setRows) {
      const sets = setsByExercise.get(row.session_exercise_id) ?? [];
      sets[row.set_order] = row.value;
      setsByExercise.set(row.session_exercise_id, sets);
    }

    const exercisesBySession = new Map<string, Array<{ exerciseKey: string; catalogExerciseId: string | null; sets: number[] }>>();
    for (const exercise of exerciseRows) {
      if (!exercise.exercise_key) continue;
      const list = exercisesBySession.get(exercise.session_id) ?? [];
      list.push({
        exerciseKey: exercise.exercise_key,
        catalogExerciseId: exercise.catalog_exercise_id,
        sets: (setsByExercise.get(exercise.id) ?? []).filter(value => typeof value === "number"),
      });
      exercisesBySession.set(exercise.session_id, list);
    }

    return sessions.map(session => ({
      sessionDate: session.session_date,
      exercises: exercisesBySession.get(session.id) ?? [],
    }));
  }

  private async loadSessionAggregate(session: SessionRow): Promise<WorkoutSessionRecord> {
    const [exerciseRows, importRow, setRows] = await Promise.all([
      fetchAll<SessionExerciseRow>(
        this.env.DB.prepare(
          `SELECT id, session_id, program_exercise_id, catalog_exercise_id, exercise_key, exercise_name, exercise_type,
                  matched, sort_order
           FROM workout_session_exercises
           WHERE session_id = ?
           ORDER BY sort_order ASC`
        ).bind(session.id)
      ),
      fetchFirst<SessionImportRow>(
        this.env.DB.prepare(
          `SELECT raw_text, unmatched_text
           FROM workout_session_imports
           WHERE session_id = ?`
        ).bind(session.id)
      ),
      fetchAll<SessionSetRow>(
        this.env.DB.prepare(
          `SELECT session_exercise_id, set_order, value
           FROM workout_session_sets
           WHERE session_exercise_id IN (
             SELECT id FROM workout_session_exercises WHERE session_id = ?
           )
           ORDER BY set_order ASC`
        ).bind(session.id)
      ),
    ]);

    const setsByExercise = new Map<string, number[]>();
    for (const set of setRows) {
      const values = setsByExercise.get(set.session_exercise_id) ?? [];
      values[set.set_order] = set.value;
      setsByExercise.set(set.session_exercise_id, values);
    }

    return {
      id: session.id,
      sessionDate: session.session_date,
      workoutType: session.workout_key,
      workoutName: session.workout_name,
      note: session.note,
      source: session.source,
      rawText: importRow?.raw_text ?? null,
      unmatched: importRow?.unmatched_text ? importRow.unmatched_text.split("\n").filter(Boolean) : [],
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      exercises: exerciseRows.map(exercise => ({
        id: exercise.id,
        programExerciseId: exercise.program_exercise_id,
        catalogExerciseId: exercise.catalog_exercise_id,
        exerciseKey: exercise.exercise_key,
        exerciseName: exercise.exercise_name,
        exerciseType: exercise.exercise_type,
        matched: Boolean(exercise.matched),
        sortOrder: exercise.sort_order,
        sets: (setsByExercise.get(exercise.id) ?? []).filter(value => typeof value === "number"),
      })),
    };
  }
}
