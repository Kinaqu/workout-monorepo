import { CatalogRepository } from "../repositories/catalog-repository";
import { GeneratedProgramMetadataRepository } from "../repositories/generated-program-metadata-repository";
import { Env } from "../env";
import { LegacyKvRepository } from "../repositories/legacy-kv-repository";
import { OnboardingRepository } from "../repositories/onboarding-repository";
import { ProfileRepository } from "../repositories/profile-repository";
import { ProgramRepository } from "../repositories/program-repository";
import { ProgramRuntimeStateRepository } from "../repositories/program-runtime-state-repository";
import { ProgressionRepository } from "../repositories/progression-repository";
import { RecommendationDraftRepository } from "../repositories/recommendation-draft-repository";
import { SessionRepository } from "../repositories/session-repository";
import { UserRepository } from "../repositories/user-repository";
import { MeService } from "./me-service";
import { OnboardingService } from "./onboarding-service";
import { ProgramService } from "./program-service";
import { ProgramGeneratorService } from "./program-generator-service";
import { ProgressionService } from "./progression-service";
import { RecommendationDraftService } from "./recommendation-draft-service";
import { SessionService } from "./session-service";
import { UserLifecycleService } from "./user-lifecycle-service";
import { WorkoutService } from "./workout-service";

export function createAppContext(env: Env) {
  const users = new UserRepository(env);
  const programs = new ProgramRepository(env);
  const runtime = new ProgramRuntimeStateRepository(env);
  const progression = new ProgressionRepository(env);
  const sessions = new SessionRepository(env);
  const legacy = new LegacyKvRepository(env);
  const onboarding = new OnboardingRepository(env);
  const profiles = new ProfileRepository(env);
  const catalog = new CatalogRepository(env);
  const metadata = new GeneratedProgramMetadataRepository(env);
  const recommendationDrafts = new RecommendationDraftRepository(env);
  const lifecycle = new UserLifecycleService(users, programs, progression, sessions, legacy);
  const progressionService = new ProgressionService(lifecycle, programs, runtime, progression, sessions);
  const programGeneratorService = new ProgramGeneratorService(
    lifecycle,
    users,
    onboarding,
    profiles,
    catalog,
    programs,
    progression,
    metadata
  );
  const recommendationDraftService = new RecommendationDraftService(
    lifecycle,
    programGeneratorService,
    recommendationDrafts,
    catalog,
    programs,
    metadata
  );

  return {
    programService: new ProgramService(lifecycle, programs, metadata, runtime, progression, progressionService),
    programGeneratorService,
    recommendationDraftService,
    workoutService: new WorkoutService(lifecycle, progression, progressionService),
    sessionService: new SessionService(lifecycle, sessions, runtime),
    progressionService,
    recommendationDrafts,
    onboardingService: new OnboardingService(
      lifecycle,
      onboarding,
      profiles,
      programGeneratorService,
      recommendationDraftService,
      users
    ),
    meService: new MeService(lifecycle, onboarding, profiles, programs),
  };
}
