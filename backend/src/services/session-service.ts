import { ProgramTemplate } from "../domain/program";
import { enrichSessionInput, parseLogText, sessionToLegacyLogResponse, SessionWriteInput, WorkoutSessionRecord } from "../domain/session";
import { isValidDate, todayDate } from "../lib/time";
import { SessionRepository } from "../repositories/session-repository";
import { UserBootstrapService } from "./user-bootstrap-service";

export class SessionAlreadyExistsError extends Error {
  constructor(
    public readonly sessionDate: string,
    public readonly sessionId: string
  ) {
    super(`Workout log for ${sessionDate} already exists`);
    this.name = "SessionAlreadyExistsError";
  }
}

export class SessionService {
  constructor(
    private readonly bootstrap: UserBootstrapService,
    private readonly sessions: SessionRepository
  ) {}

  async createFromJson(userId: string, username: string, payload: unknown, requestedDate?: string) {
    const program = await this.bootstrap.ensureUserReady(userId, username);
    const body = validateJsonLogPayload(payload);
    const sessionDate = requestedDate ?? body.session_date ?? todayDate();
    if (!isValidDate(sessionDate)) {
      throw new Error("Invalid date in X-Workout-Date header");
    }

    const created = await this.createSession(userId, program, {
      sessionDate,
      note: body.note ?? "",
      workoutType: body.workout_type ?? null,
      source: "json",
      rawText: null,
      unmatched: [],
      exercises: body.exercises ?? [],
    });

    return {
      ok: true,
      date: sessionDate,
      entry: sessionToLegacyLogResponse(created),
      session: created,
    };
  }

  async createFromText(userId: string, username: string, text: string, requestedDate?: string) {
    if (!text.trim()) {
      throw new Error("Empty body");
    }

    const program = await this.bootstrap.ensureUserReady(userId, username);
    const sessionDate = requestedDate ?? todayDate();
    if (!isValidDate(sessionDate)) {
      throw new Error("Invalid date in X-Workout-Date header");
    }

    const parsed = parseLogText(text, program);
    const created = await this.createSession(userId, program, {
      sessionDate,
      note: parsed.note,
      workoutType: null,
      source: "text",
      rawText: text,
      unmatched: parsed.unmatched,
      exercises: parsed.exercises,
    });

    return {
      ok: true,
      date: sessionDate,
      entry: sessionToLegacyLogResponse(created),
      session: created,
    };
  }

  async getLegacyLogByDate(userId: string, username: string, date: string) {
    if (!isValidDate(date)) {
      throw new Error("Invalid date. Use format: 2026-03-11");
    }

    await this.bootstrap.ensureUserReady(userId, username);
    const sessions = await this.sessions.listSessionsByDate(userId, date);
    if (sessions.length === 0) {
      return null;
    }

    return {
      ...sessionToLegacyLogResponse(sessions[0]),
      date,
      session_count: sessions.length,
      sessions,
    };
  }

  async listSessions(userId: string, username: string, limit: number, date?: string) {
    if (date && !isValidDate(date)) {
      throw new Error("Invalid date. Use format: 2026-03-11");
    }

    await this.bootstrap.ensureUserReady(userId, username);
    const sessions = await this.sessions.listSessions(userId, limit, date);
    return {
      sessions,
      count: sessions.length,
    };
  }

  async getSession(userId: string, username: string, sessionId: string): Promise<WorkoutSessionRecord | null> {
    await this.bootstrap.ensureUserReady(userId, username);
    return this.sessions.getSession(userId, sessionId);
  }

  async listRecentPerformance(userId: string, username: string, sinceDate: string) {
    await this.bootstrap.ensureUserReady(userId, username);
    return this.sessions.listRecentPerformance(userId, sinceDate);
  }

  private async createSession(userId: string, program: ProgramTemplate, input: SessionWriteInput) {
    const existing = await this.sessions.getLatestSessionByDate(userId, input.sessionDate);
    if (existing) {
      throw new SessionAlreadyExistsError(input.sessionDate, existing.id);
    }

    return this.sessions.createSession(userId, program, enrichSessionInput(program, input));
  }
}

function validateJsonLogPayload(input: unknown): {
  session_date?: string;
  note?: string;
  workout_type?: string | null;
  exercises?: Array<{ id: string; name?: string; sets: number[] }>;
} {
  if (typeof input !== "object" || input === null) {
    throw new Error("Invalid JSON");
  }

  const body = input as Record<string, unknown>;
  const exercises = Array.isArray(body.exercises)
    ? body.exercises.map(exercise => {
        if (typeof exercise !== "object" || exercise === null) {
          throw new Error("Invalid exercises payload");
        }
        const value = exercise as Record<string, unknown>;
        if (typeof value.id !== "string" || !Array.isArray(value.sets)) {
          throw new Error("Invalid exercises payload");
        }
        return {
          id: value.id,
          name: typeof value.name === "string" ? value.name : undefined,
          sets: value.sets.filter(item => typeof item === "number").map(item => Math.round(item)),
        };
      })
    : undefined;

  return {
    session_date: typeof body.session_date === "string" ? body.session_date : undefined,
    note: typeof body.note === "string" ? body.note : undefined,
    workout_type: typeof body.workout_type === "string" ? body.workout_type : null,
    exercises,
  };
}
