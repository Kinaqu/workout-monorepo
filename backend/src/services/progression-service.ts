import { evaluateProgression } from "../domain/progression";
import { conflict } from "../lib/app-error";
import type { ProgressionRunResponse } from "../openapi/schemas";
import { daysAgo, diffUtcDays, nowIso } from "../lib/time";
import { ProgramRepository } from "../repositories/program-repository";
import { ProgramRuntimeStateRepository } from "../repositories/program-runtime-state-repository";
import { ProgressionRepository } from "../repositories/progression-repository";
import { SessionRepository } from "../repositories/session-repository";
import { UserLifecycleService } from "./user-lifecycle-service";

export class ProgressionService {
  private static readonly AUTO_REFRESH_TTL_DAYS = 7;

  constructor(
    private readonly lifecycle: UserLifecycleService,
    private readonly programs: ProgramRepository,
    private readonly runtime: ProgramRuntimeStateRepository,
    private readonly progression: ProgressionRepository,
    private readonly sessions: SessionRepository
  ) {}

  async run(userId: string, username: string, lookbackDays = 7): Promise<ProgressionRunResponse> {
    const program = await this.lifecycle.requireActiveProgram(userId, username);
    return this.runForProgram(userId, program.versionId, lookbackDays);
  }

  async ensureFreshForProgram(userId: string, username: string, programId: string, lookbackDays = 7) {
    return this.ensureFreshByRuntime(userId, username, programId, lookbackDays);
  }

  async ensureFreshForToday(userId: string, username: string, programId: string, lookbackDays = 7) {
    return this.ensureFreshByRuntime(userId, username, programId, lookbackDays);
  }

  private async ensureFreshByRuntime(userId: string, username: string, programId: string, lookbackDays = 7) {
    await this.lifecycle.ensureUserExists(userId, username);

    const runtime = await this.runtime.getByProgram(userId, programId);
    if (!runtime) {
      await this.runtime.initializeForProgram(userId, programId, {
        lastProgressionRunAt: nowIso(),
      });
      return false;
    }

    if (runtime.lastProgressionRunAt) {
      const ageInDays = diffUtcDays(runtime.lastProgressionRunAt, nowIso());
      if (ageInDays < ProgressionService.AUTO_REFRESH_TTL_DAYS) {
        return false;
      }
    } else if (!runtime.lastSessionLoggedAt) {
      return false;
    }

    await this.runForProgram(userId, programId, lookbackDays);
    return true;
  }

  private async runForProgram(userId: string, programId: string, lookbackDays = 7): Promise<ProgressionRunResponse> {
    const activeProgram = await this.programs.getProgramById(programId);
    if (!activeProgram) {
      conflict("Active program not found");
    }

    const runAt = nowIso();
    const states = await this.progression.getByProgram(userId, activeProgram.versionId);
    const recentSessions = await this.sessions.listRecentPerformance(userId, daysAgo(lookbackDays - 1));

    const result = evaluateProgression({
      program: activeProgram,
      states,
      sessions: recentSessions,
      now: runAt,
      lookbackDays,
    });

    await this.progression.replaceProgramStates(userId, activeProgram.versionId, result.nextStates);
    await this.progression.recordEvents(userId, activeProgram.versionId, result.events);
    await this.runtime.markProgressionRun(userId, activeProgram.versionId, runAt);

    return {
      ok: true,
      progression_date: runAt.slice(0, 10),
      result: {
        changed: result.changed,
        skipped: result.skipped,
      },
    };
  }
}
