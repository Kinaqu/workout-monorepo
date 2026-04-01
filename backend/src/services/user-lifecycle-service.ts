import { DEFAULT_PROGRAM } from "../domain/default-program";
import { createProgramDraft, ProgramTemplate } from "../domain/program";
import { seedProgressionStates } from "../domain/progression";
import { enrichSessionInput } from "../domain/session";
import { conflict } from "../lib/app-error";
import { nowIso } from "../lib/time";
import { LegacyKvRepository, LegacySnapshot } from "../repositories/legacy-kv-repository";
import { ProgramRepository } from "../repositories/program-repository";
import { ProgressionRepository } from "../repositories/progression-repository";
import { SessionRepository } from "../repositories/session-repository";
import { UserRecord, UserRepository } from "../repositories/user-repository";

export class UserLifecycleService {
  constructor(
    private readonly users: UserRepository,
    private readonly programs: ProgramRepository,
    private readonly progression: ProgressionRepository,
    private readonly sessions: SessionRepository,
    private readonly legacy: LegacyKvRepository
  ) {}

  async ensureUserExists(userId: string, username: string): Promise<UserRecord> {
    await this.users.upsert(userId, username);
    const user = await this.users.get(userId);
    if (!user) {
      throw new Error("Failed to load user after upsert");
    }

    await this.ensureLegacyMigrationHandled(userId, user);
    const refreshed = await this.users.get(userId);
    if (!refreshed) {
      throw new Error("Failed to reload user after bootstrap");
    }

    return refreshed;
  }

  async getActiveProgram(userId: string, username: string): Promise<ProgramTemplate | null> {
    await this.ensureUserExists(userId, username);
    return this.programs.getActiveProgram(userId);
  }

  async requireActiveProgram(userId: string, username: string): Promise<ProgramTemplate> {
    const user = await this.ensureUserExists(userId, username);
    const program = await this.programs.getActiveProgram(userId);
    if (program) {
      return program;
    }

    if (!user.onboarding_completed_at) {
      conflict("Onboarding not completed");
    }

    conflict("Active program not found");
  }

  private async ensureLegacyMigrationHandled(userId: string, user: UserRecord): Promise<void> {
    if (user.legacy_kv_migrated_at) {
      return;
    }

    const existingProgram = await this.programs.getActiveProgram(userId);
    if (existingProgram) {
      if (existingProgram.source === "legacy-kv") {
        const snapshot = await this.legacy.readUserSnapshot(userId);
        await this.importLegacyLogs(userId, existingProgram, snapshot.logs);
      }

      await this.users.markLegacyMigrated(userId);
      return;
    }

    const snapshot = await this.legacy.readUserSnapshot(userId);
    if (!hasLegacyData(snapshot)) {
      await this.users.markLegacyMigrated(userId);
      return;
    }

    const sourceProgram = snapshot.program ?? DEFAULT_PROGRAM;
    const created = await this.programs.createProgramVersion(
      userId,
      createProgramDraft(sourceProgram),
      snapshot.program ? "legacy-kv" : "legacy-default"
    );

    const seeded = seedProgressionStates(
      created,
      new Map(),
      nowIso(),
      snapshot.state?.last_progression ?? null
    ).map(state => ({
      ...state,
      currentSets: snapshot.state?.sets[state.exerciseKey] ?? state.currentSets,
    }));

    await this.progression.replaceProgramStates(userId, created.versionId, seeded);
    await this.importLegacyLogs(userId, created, snapshot.logs);
    await this.users.markLegacyMigrated(userId);
  }

  private async importLegacyLogs(userId: string, program: ProgramTemplate, logs: LegacySnapshot["logs"]) {
    for (const legacyLog of logs) {
      const session = enrichSessionInput(program, {
        sessionDate: legacyLog.date,
        note: legacyLog.note ?? "",
        workoutType: legacyLog.workout_type ?? null,
        source: "legacy-kv",
        rawText: null,
        unmatched: legacyLog.unmatched ?? [],
        exercises: (legacyLog.exercises ?? []).map(exercise => ({
          id: exercise.id,
          name: exercise.name,
          sets: exercise.sets ?? [],
        })),
      });
      await this.sessions.createSession(userId, program, session, buildLegacySessionId(userId, legacyLog.date));
    }
  }
}

function hasLegacyData(snapshot: LegacySnapshot): boolean {
  return Boolean(snapshot.program || snapshot.state || snapshot.logs.length > 0);
}

function buildLegacySessionId(userId: string, date: string): string {
  return `legacy_${userId.replace(/[^a-zA-Z0-9]/g, "_")}_${date}`;
}

