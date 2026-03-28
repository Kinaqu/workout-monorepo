import { evaluateProgression } from "../domain/progression";
import { daysAgo, nowIso } from "../lib/time";
import { ProgramRepository } from "../repositories/program-repository";
import { ProgressionRepository } from "../repositories/progression-repository";
import { SessionRepository } from "../repositories/session-repository";
import { UserBootstrapService } from "./user-bootstrap-service";

export class ProgressionService {
  constructor(
    private readonly bootstrap: UserBootstrapService,
    private readonly programs: ProgramRepository,
    private readonly progression: ProgressionRepository,
    private readonly sessions: SessionRepository
  ) {}

  async run(userId: string, username: string, lookbackDays = 7) {
    const program = await this.bootstrap.ensureUserReady(userId, username);
    const activeProgram = await this.programs.getProgramById(program.versionId);
    if (!activeProgram) {
      throw new Error("Active program not found");
    }

    const states = await this.progression.getByProgram(userId, activeProgram.versionId);
    const recentSessions = await this.sessions.listRecentPerformance(userId, daysAgo(lookbackDays - 1));

    const result = evaluateProgression({
      program: activeProgram,
      states,
      sessions: recentSessions,
      now: nowIso(),
    });

    await this.progression.replaceProgramStates(userId, activeProgram.versionId, result.nextStates);
    await this.progression.recordEvents(userId, activeProgram.versionId, result.events);

    return {
      ok: true,
      progression_date: nowIso().slice(0, 10),
      result: {
        changed: result.changed,
        skipped: result.skipped,
      },
    };
  }
}
