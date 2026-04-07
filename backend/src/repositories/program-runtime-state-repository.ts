import { fetchFirst } from "../db/d1";
import { Env } from "../env";
import { nowIso } from "../lib/time";

interface ProgramRuntimeStateRow {
  program_id: string;
  user_id: string;
  last_session_logged_at: string | null;
  last_progression_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProgramRuntimeState {
  programId: string;
  userId: string;
  lastSessionLoggedAt: string | null;
  lastProgressionRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ProgramRuntimeStateRepository {
  constructor(private readonly env: Env) {}

  async getByProgram(userId: string, programId: string): Promise<ProgramRuntimeState | null> {
    const row = await fetchFirst<ProgramRuntimeStateRow>(
      this.env.DB.prepare(
        `SELECT program_id, user_id, last_session_logged_at, last_progression_run_at, created_at, updated_at
         FROM program_runtime_state
         WHERE user_id = ? AND program_id = ?`
      ).bind(userId, programId)
    );

    return row ? mapProgramRuntimeState(row) : null;
  }

  async initializeForProgram(
    userId: string,
    programId: string,
    values: {
      lastSessionLoggedAt?: string | null;
      lastProgressionRunAt?: string | null;
    } = {}
  ): Promise<void> {
    const now = nowIso();
    await this.env.DB.prepare(
      `INSERT INTO program_runtime_state (
        program_id, user_id, last_session_logged_at, last_progression_run_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(program_id) DO UPDATE SET
        user_id = excluded.user_id,
        last_session_logged_at = excluded.last_session_logged_at,
        last_progression_run_at = excluded.last_progression_run_at,
        updated_at = excluded.updated_at`
    )
      .bind(
        programId,
        userId,
        values.lastSessionLoggedAt ?? null,
        values.lastProgressionRunAt ?? null,
        now,
        now
      )
      .run();
  }

  async markSessionLogged(userId: string, programId: string, loggedAt = nowIso()): Promise<void> {
    await this.env.DB.prepare(
      `INSERT INTO program_runtime_state (
        program_id, user_id, last_session_logged_at, last_progression_run_at, created_at, updated_at
      ) VALUES (?, ?, ?, NULL, ?, ?)
      ON CONFLICT(program_id) DO UPDATE SET
        user_id = excluded.user_id,
        last_session_logged_at = excluded.last_session_logged_at,
        updated_at = excluded.updated_at`
    )
      .bind(programId, userId, loggedAt, loggedAt, loggedAt)
      .run();
  }

  async markProgressionRun(userId: string, programId: string, runAt = nowIso()): Promise<void> {
    await this.env.DB.prepare(
      `INSERT INTO program_runtime_state (
        program_id, user_id, last_session_logged_at, last_progression_run_at, created_at, updated_at
      ) VALUES (?, ?, NULL, ?, ?, ?)
      ON CONFLICT(program_id) DO UPDATE SET
        user_id = excluded.user_id,
        last_progression_run_at = excluded.last_progression_run_at,
        updated_at = excluded.updated_at`
    )
      .bind(programId, userId, runAt, runAt, runAt)
      .run();
  }
}

function mapProgramRuntimeState(row: ProgramRuntimeStateRow): ProgramRuntimeState {
  return {
    programId: row.program_id,
    userId: row.user_id,
    lastSessionLoggedAt: row.last_session_logged_at,
    lastProgressionRunAt: row.last_progression_run_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
