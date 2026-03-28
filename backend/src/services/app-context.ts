import { Env } from "../env";
import { LegacyKvRepository } from "../repositories/legacy-kv-repository";
import { ProgramRepository } from "../repositories/program-repository";
import { ProgressionRepository } from "../repositories/progression-repository";
import { SessionRepository } from "../repositories/session-repository";
import { UserRepository } from "../repositories/user-repository";
import { ProgramService } from "./program-service";
import { ProgressionService } from "./progression-service";
import { SessionService } from "./session-service";
import { UserBootstrapService } from "./user-bootstrap-service";
import { WorkoutService } from "./workout-service";

export function createAppContext(env: Env) {
  const users = new UserRepository(env);
  const programs = new ProgramRepository(env);
  const progression = new ProgressionRepository(env);
  const sessions = new SessionRepository(env);
  const legacy = new LegacyKvRepository(env);
  const bootstrap = new UserBootstrapService(users, programs, progression, sessions, legacy);

  return {
    programService: new ProgramService(bootstrap, programs, progression),
    workoutService: new WorkoutService(bootstrap, progression),
    sessionService: new SessionService(bootstrap, sessions),
    progressionService: new ProgressionService(bootstrap, programs, progression, sessions),
  };
}
