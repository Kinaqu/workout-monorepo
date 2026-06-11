import { filterCatalogForProfile } from "../domain/catalog";
import {
  buildRecommendationDraftFromProfile,
  GeneratedProgramResult,
  materializeProgramDefinitionFromDraftSelection,
} from "../domain/generator";
import { normalizeOnboardingAnswers } from "../domain/profile";
import { createProgramDraft, programTemplateToApi } from "../domain/program";
import { seedProgressionStates } from "../domain/progression";
import { conflict } from "../lib/app-error";
import { nowIso } from "../lib/time";
import type { GeneratedProgramResponse } from "../openapi/schemas";
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

  private async loadStoredProfileGenerationInputs(userId: string, username: string) {
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

    return { user, onboarding, profileRecord, catalog };
  }

  async buildRecommendationDraftFromStoredProfile(userId: string, username: string) {
    const { onboarding, profileRecord, catalog } = await this.loadStoredProfileGenerationInputs(userId, username);

    return {
      sourceOnboardingAnswerId: onboarding.id,
      sourceProfileId: profileRecord.id,
      draft: buildRecommendationDraftFromProfile(profileRecord.profile, catalog),
    };
  }

  async generateFromStoredProfile(
    userId: string,
    username: string,
    reason: "onboarding-complete" | "regenerate"
  ): Promise<GeneratedProgramResponse> {
    const { user, onboarding, profileRecord, catalog } = await this.loadStoredProfileGenerationInputs(userId, username);

    const draft = buildRecommendationDraftFromProfile(profileRecord.profile, catalog);
    const generated = materializeProgramDefinitionFromDraftSelection(draft);
    const created = await this.persistGeneratedProgramVersion({
      userId,
      source: "generated",
      generationReason: reason,
      generated,
      profileId: profileRecord.id,
      profileVersion: profileRecord.profile.version,
      onboardingAnswerId: onboarding.id,
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

  async persistGeneratedProgramVersion(input: {
    userId: string;
    source: string;
    generationReason: string;
    generated: GeneratedProgramResult;
    profileId: string | null;
    profileVersion: string | null;
    onboardingAnswerId: string | null;
    inputSummary: Record<string, unknown>;
  }) {
    const current = await this.programs.getActiveProgram(input.userId);
    const previousStates = current
      ? await this.progression.getByProgram(input.userId, current.versionId)
      : new Map();
    const created = await this.programs.createProgramVersion(
      input.userId,
      createProgramDraft(input.generated.definition),
      input.source
    );

    const seeded = seedProgressionStates(created, previousStates, nowIso(), null);
    await this.progression.replaceProgramStates(input.userId, created.versionId, seeded);
    await this.metadata.save({
      programId: created.versionId,
      userId: input.userId,
      generatorVersion: input.generated.generatorVersion,
      generationReason: input.generationReason,
      profileId: input.profileId,
      profileVersion: input.profileVersion,
      onboardingAnswerId: input.onboardingAnswerId,
      catalogSeedVersion: input.generated.catalogSeedVersion,
      inputSummary: input.inputSummary,
    });

    return created;
  }
}
