import { createWorkoutPlan } from "../domain/progression";
import { ProgressionRepository } from "../repositories/progression-repository";
import { UserBootstrapService } from "./user-bootstrap-service";

export class WorkoutService {
  constructor(
    private readonly bootstrap: UserBootstrapService,
    private readonly progression: ProgressionRepository
  ) {}

  async getWorkoutForDate(userId: string, username: string, date: string) {
    const program = await this.bootstrap.ensureUserReady(userId, username);
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
