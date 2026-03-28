import { DEFAULT_PROGRAM } from "../domain/default-program";
import { createProgramDraft, programTemplateToApi, ProgramDefinitionInput, validateProgramDefinition } from "../domain/program";
import { seedProgressionStates } from "../domain/progression";
import { nowIso } from "../lib/time";
import { ProgramRepository } from "../repositories/program-repository";
import { ProgressionRepository } from "../repositories/progression-repository";
import { UserBootstrapService } from "./user-bootstrap-service";

export class ProgramService {
  constructor(
    private readonly bootstrap: UserBootstrapService,
    private readonly programs: ProgramRepository,
    private readonly progression: ProgressionRepository
  ) {}

  async getCurrentProgram(userId: string, username: string) {
    const program = await this.bootstrap.ensureUserReady(userId, username);
    const states = await this.progression.getByProgram(userId, program.versionId);

    return {
      ...programTemplateToApi(program),
      version_id: program.versionId,
      source: program.source,
      userSets: Object.fromEntries(Array.from(states.values()).map(state => [state.exerciseKey, state.currentSets])),
      progressionState: Object.fromEntries(
        Array.from(states.values()).map(state => [
          state.exerciseKey,
          {
            sets: state.currentSets,
            min: state.currentTargetMin,
            max: state.currentTargetMax,
            last_progression: state.lastProgressionAt,
          },
        ])
      ),
    };
  }

  async saveProgram(userId: string, username: string, input: unknown) {
    await this.bootstrap.ensureUserReady(userId, username);
    const definition = validateProgramDefinition(input);
    return this.createProgramVersion(userId, definition, false, "api");
  }

  async resetProgram(userId: string, username: string) {
    await this.bootstrap.ensureUserReady(userId, username);
    return this.createProgramVersion(userId, DEFAULT_PROGRAM, true, "reset");
  }

  private async createProgramVersion(
    userId: string,
    definition: ProgramDefinitionInput,
    resetProgression: boolean,
    source: string
  ) {
    const current = await this.programs.getActiveProgram(userId);
    const previousStates = current
      ? await this.progression.getByProgram(userId, current.versionId)
      : new Map();

    const created = await this.programs.createProgramVersion(userId, createProgramDraft(definition), source);
    const seeded = seedProgressionStates(created, previousStates, nowIso(), null, resetProgression);
    await this.progression.replaceProgramStates(userId, created.versionId, seeded);

    return {
      ok: true,
      message: resetProgression ? "Program reset to default" : "Program saved",
      program: {
        ...programTemplateToApi(created),
        version_id: created.versionId,
      },
    };
  }
}
