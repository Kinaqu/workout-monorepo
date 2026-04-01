import { filterCatalogForProfile } from "../domain/catalog";
import { generateProgramFromProfile } from "../domain/generator";
import { normalizeOnboardingAnswers } from "../domain/profile";
import { createProgramDraft, programTemplateToApi } from "../domain/program";
import { seedProgressionStates } from "../domain/progression";
import { conflict } from "../lib/app-error";
import { nowIso } from "../lib/time";
import { CatalogRepository } from "../repositories/catalog-repository";
import { GeneratedProgramMetadataRepository } from "../repositories/generated-program-metadata-repository";
import { OnboardingRepository } from "../repositories/onboarding-repository";
import { ProfileRepository } from "../repositories/profile-repository";
import { ProgramRepository } from "../repositories/program-repository";
import { ProgressionRepository } from "../repositories/progression-repository";
import { UserRepository } from "../repositories/user-repository";
import { UserLifecycleService } from "./user-lifecycle-service";

export class ProgramGeneratorService {
  constructor(
    private readonly lifecycle: UserLifecycleService,
    private readonly users: UserRepository,
    private readonly onboarding: OnboardingRepository,
    private readonly profiles: ProfileRepository,
    private readonly catalog: CatalogRepository,
    private readonly programs: ProgramRepository,
    private readonly progression: ProgressionRepository,
    private readonly metadata: GeneratedProgramMetadataRepository
  ) {}

  async generateFromStoredProfile(userId: string, username: string, reason: "onboarding-complete" | "regenerate") {
    const user = await this.lifecycle.ensureUserExists(userId, username);
    const onboarding = await this.onboarding.getByUserId(userId);
    const profileRecord = await this.profiles.getByUserId(userId);

    if (!onboarding || !profileRecord) {
      conflict("Onboarding not completed");
    }

    const catalog = filterCatalogForProfile(await this.catalog.listActiveEntries(), profileRecord.profile);
    if (catalog.exercises.length === 0) {
      conflict("Exercise catalog cannot satisfy the current profile");
    }

    const generated = generateProgramFromProfile(profileRecord.profile, catalog);
    const current = await this.programs.getActiveProgram(userId);
    const previousStates = current ? await this.progression.getByProgram(userId, current.versionId) : new Map();
    const created = await this.programs.createProgramVersion(
      userId,
      createProgramDraft(generated.definition),
      "generated"
    );

    const seeded = seedProgressionStates(created, previousStates, nowIso(), null);
    await this.progression.replaceProgramStates(userId, created.versionId, seeded);
    await this.metadata.save({
      programId: created.versionId,
      userId,
      generatorVersion: generated.generatorVersion,
      generationReason: reason,
      profileId: profileRecord.id,
      profileVersion: profileRecord.profile.version,
      onboardingAnswerId: onboarding.id,
      catalogSeedVersion: generated.catalogSeedVersion,
      inputSummary: {
        userId: user.user_id,
        primaryGoal: profileRecord.profile.primaryGoal,
        trainingDaysPerWeek: profileRecord.profile.trainingDaysPerWeek,
        sessionDurationMinutes: profileRecord.profile.sessionDurationMinutes,
      },
    });

    if (reason === "onboarding-complete" && !user.onboarding_completed_at) {
      await this.users.markOnboardingCompleted(userId);
    }

    return {
      ok: true,
      message: reason === "onboarding-complete" ? "Onboarding completed" : "Program regenerated",
      program: {
        ...programTemplateToApi(created),
        version_id: created.versionId,
        source: created.source,
      },
      generator: {
        version: generated.generatorVersion,
        catalog_seed_version: generated.catalogSeedVersion,
      },
    };
  }

  async deriveAndStoreProfileFromAnswers(userId: string, username: string, answers: Parameters<typeof normalizeOnboardingAnswers>[0]) {
    await this.lifecycle.ensureUserExists(userId, username);
    const onboardingRecord = await this.onboarding.getByUserId(userId);
    if (!onboardingRecord) {
      conflict("Onboarding answers not found");
    }

    const profile = normalizeOnboardingAnswers(answers);
    const record = await this.profiles.upsert(userId, profile, onboardingRecord.id);
    return {
      id: record.id,
      profile,
    };
  }
}
