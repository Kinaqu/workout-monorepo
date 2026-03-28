import { DEFAULT_PROGRAM } from "../domain/default-program";
import { createProgramDraft } from "../domain/program";
import { enrichSessionInput } from "../domain/session";
import { LegacyKvRepository, LegacySnapshot } from "../repositories/legacy-kv-repository";
import { ProgramRepository } from "../repositories/program-repository";
import { ProgressionRepository } from "../repositories/progression-repository";
import { SessionRepository } from "../repositories/session-repository";
import { UserRepository } from "../repositories/user-repository";
import { seedProgressionStates } from "../domain/progression";
import { nowIso } from "../lib/time";

export class UserBootstrapService {
  constructor(
    private readonly users: UserRepository,
    private readonly programs: ProgramRepository,
    private readonly progression: ProgressionRepository,
    private readonly sessions: SessionRepository,
    private readonly legacy: LegacyKvRepository
  ) {}

  async ensureUserReady(userId: string, username: string) {
    await this.users.upsert(userId, username);
    const user = await this.users.get(userId);

    const existingProgram = await this.programs.getActiveProgram(userId);
    if (existingProgram && user?.legacy_kv_migrated_at) {
      return existingProgram;
    }

    if (existingProgram && !user?.legacy_kv_migrated_at) {
      if (existingProgram.source === "legacy-kv") {
        const snapshot = await this.legacy.readUserSnapshot(userId);
        await this.importLegacyLogs(userId, existingProgram, snapshot.logs);
      }

      await this.users.markLegacyMigrated(userId);
      return existingProgram;
    }

    const snapshot = await this.legacy.readUserSnapshot(userId);
    const sourceProgram = snapshot.program ?? DEFAULT_PROGRAM;
    const created = await this.programs.createProgramVersion(
      userId,
      createProgramDraft(sourceProgram),
      snapshot.program ? "legacy-kv" : "default"
    );

    const previousStates = new Map<string, ReturnType<typeof seedProgressionStates>[number]>();
    const seeded = seedProgressionStates(
      created,
      previousStates,
      nowIso(),
      snapshot.state?.last_progression ?? null
    ).map(state => ({
      ...state,
      currentSets: snapshot.state?.sets[state.exerciseKey] ?? state.currentSets,
    }));

    await this.progression.replaceProgramStates(userId, created.versionId, seeded);
    await this.importLegacyLogs(userId, created, snapshot.logs);
    await this.users.markLegacyMigrated(userId);

    return created;
  }

  private async importLegacyLogs(userId: string, program: Awaited<ReturnType<ProgramRepository["getActiveProgram"]>>, logs: LegacySnapshot["logs"]) {
    if (!program) return;

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

function buildLegacySessionId(userId: string, date: string): string {
  return `legacy_${userId.replace(/[^a-zA-Z0-9]/g, "_")}_${date}`;
}
