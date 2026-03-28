import { fetchAll } from "../db/d1";
import { ExerciseProgressionState } from "../domain/progression";
import { Env } from "../env";
import { createId } from "../lib/id";
import { nowIso } from "../lib/time";

interface ProgressionRow {
  id: string;
  exercise_key: string;
  current_sets: number;
  current_target_min: number;
  current_target_max: number;
  last_progression_at: string | null;
  created_at: string;
  updated_at: string;
}

export class ProgressionRepository {
  constructor(private readonly env: Env) {}

  async getByProgram(userId: string, programId: string): Promise<Map<string, ExerciseProgressionState>> {
    const rows = await fetchAll<ProgressionRow>(
      this.env.DB.prepare(
        `SELECT id, exercise_key, current_sets, current_target_min, current_target_max, last_progression_at, created_at, updated_at
         FROM exercise_progression_state
         WHERE user_id = ? AND program_id = ?`
      ).bind(userId, programId)
    );

    return new Map(
      rows.map(row => [
        row.exercise_key,
        {
          id: row.id,
          exerciseKey: row.exercise_key,
          currentSets: row.current_sets,
          currentTargetMin: row.current_target_min,
          currentTargetMax: row.current_target_max,
          lastProgressionAt: row.last_progression_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      ])
    );
  }

  async replaceProgramStates(userId: string, programId: string, states: ExerciseProgressionState[]): Promise<void> {
    const now = nowIso();
    const statements: D1PreparedStatement[] = [
      this.env.DB.prepare(
        "DELETE FROM exercise_progression_state WHERE user_id = ? AND program_id = ?"
      ).bind(userId, programId),
    ];

    for (const state of states) {
      statements.push(
        this.env.DB.prepare(
          `INSERT INTO exercise_progression_state (
            id, user_id, program_id, exercise_key, current_sets, current_target_min, current_target_max,
            last_progression_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          state.id || createId("eps"),
          userId,
          programId,
          state.exerciseKey,
          state.currentSets,
          state.currentTargetMin,
          state.currentTargetMax,
          state.lastProgressionAt,
          state.createdAt || now,
          state.updatedAt || now
        )
      );
    }

    await this.env.DB.batch(statements);
  }

  async recordEvents(
    userId: string,
    programId: string,
    events: Array<{
      id: string;
      direction: "up" | "down";
      reason: string;
      before: { sets: number; min: number; max: number };
      after: { sets: number; min: number; max: number };
    }>
  ): Promise<void> {
    if (events.length === 0) return;

    const now = nowIso();
    const statements = events.map(event =>
      this.env.DB.prepare(
        `INSERT INTO progression_events (
          id, user_id, program_id, exercise_key, direction, reason, before_sets, before_target_min,
          before_target_max, after_sets, after_target_min, after_target_max, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        createId("pe"),
        userId,
        programId,
        event.id,
        event.direction,
        event.reason,
        event.before.sets,
        event.before.min,
        event.before.max,
        event.after.sets,
        event.after.min,
        event.after.max,
        now
      )
    );

    await this.env.DB.batch(statements);
  }
}
