import { createWorkoutPlan } from "../domain/progression";
import { ProgressionRepository } from "../repositories/progression-repository";
import { ProgressionService } from "./progression-service";
import { UserLifecycleService } from "./user-lifecycle-service";

export class WorkoutService {
  constructor(
    private readonly lifecycle: UserLifecycleService,
    private readonly progression: ProgressionRepository,
    private readonly progressionService: ProgressionService
  ) {}

  async getWorkoutForDate(userId: string, username: string, date: string) {
    const program = await this.lifecycle.requireActiveProgram(userId, username);
    await this.progressionService.ensureFreshForProgram(userId, username, program.versionId);
    const states = await this.progression.getByProgram(userId, program.versionId);
    const plan = createWorkoutPlan(program, date, states);

    if (!plan) {
      return {
        type: "rest",
        date,
        message: "Today is a rest day",
      };
    }

    return {
      date,
      type: plan.type,
      name: plan.name,
      exercises: plan.exercises,
      program_id: program.key,
      program_version_id: program.versionId,
    };
  }
}
