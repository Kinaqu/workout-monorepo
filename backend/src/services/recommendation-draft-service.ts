import { filterCatalogForProfile } from "../domain/catalog";
import {
  buildExerciseOptionsForStructure,
  materializeProgramDefinitionFromDraftSelection,
} from "../domain/generator";
import {
  RecommendationDraftJson,
  RecommendationDraftProfileSnapshot,
  validateRecommendationDraftJson,
} from "../domain/recommendation-draft";
import { PROFILE_VERSION, NormalizedUserProfile } from "../domain/profile";
import { programTemplateToApi } from "../domain/program";
import { conflict, notFound } from "../lib/app-error";
import { nowIso } from "../lib/time";
import { CatalogRepository } from "../repositories/catalog-repository";
import { GeneratedProgramMetadataRepository } from "../repositories/generated-program-metadata-repository";
import {
  RecommendationDraftRecord,
  RecommendationDraftRepository,
} from "../repositories/recommendation-draft-repository";
import { ProgramRepository } from "../repositories/program-repository";
import { ProgramGeneratorService } from "./program-generator-service";
import { UserLifecycleService } from "./user-lifecycle-service";

export interface RecommendationDraftResponseDto {
  id: string;
  status: RecommendationDraftRecord["status"];
  source_onboarding_answer_id: string | null;
  source_profile_id: string | null;
  generator_version: string;
  catalog_seed_version: string;
  selected_structure_id: string;
  activated_program_id: string | null;
  created_at: string;
  updated_at: string;
  activated_at: string | null;
  draft: RecommendationDraftJson;
}

export interface RecommendationDraftActivationResponseDto {
  ok: true;
  message: string;
  program: ReturnType<typeof programTemplateToApi> & {
    version_id: string;
    source: string;
  };
  generator: {
    version: string;
    catalog_seed_version: string;
  };
  recommendation_draft: {
    id: string;
    status: "activated";
    selected_structure_id: string;
    activated_program_id: string;
    activated_at: string;
    updated_at: string;
  };
}

export class RecommendationDraftService {
  constructor(
    private readonly lifecycle: UserLifecycleService,
    private readonly programGenerator: ProgramGeneratorService,
    private readonly recommendationDrafts: RecommendationDraftRepository,
    private readonly catalog: CatalogRepository,
    private readonly programs: ProgramRepository,
    private readonly metadata: GeneratedProgramMetadataRepository
  ) {}

  async createFromStoredProfile(userId: string, username: string): Promise<RecommendationDraftResponseDto> {
    await this.lifecycle.ensureUserExists(userId, username);
    const built = await this.programGenerator.buildRecommendationDraftFromStoredProfile(userId, username);
    const saved = await this.recommendationDrafts.upsert({
      userId,
      sourceOnboardingAnswerId: built.sourceOnboardingAnswerId,
      sourceProfileId: built.sourceProfileId,
      generatorVersion: built.draft.generator_version,
      catalogSeedVersion: built.draft.catalog_seed_version,
      selectedStructureId: built.draft.selected_structure_id,
      draftJson: built.draft,
    });

    return mapDraftRecordToApi(saved);
  }

  async getCurrentDraft(userId: string, username: string): Promise<RecommendationDraftResponseDto> {
    await this.lifecycle.ensureUserExists(userId, username);
    return mapDraftRecordToApi(await this.requireDraft(userId));
  }

  async chooseStructure(
    userId: string,
    username: string,
    draftId: string,
    structureId: string
  ): Promise<RecommendationDraftResponseDto> {
    await this.lifecycle.ensureUserExists(userId, username);
    const draft = await this.requireEditableDraft(userId, draftId);
    const selectedStructure = draft.draftJson.structures.find(structure => structure.id === structureId);
    if (!selectedStructure) {
      conflict("Recommendation draft structure not found");
    }

    const profile = snapshotToNormalizedProfile(draft.draftJson.profile_snapshot);
    const catalog = await this.loadDraftCatalog(profile, draft.catalogSeedVersion);
    const nextDraft = validateRecommendationDraftJson({
      ...draft.draftJson,
      selected_structure_id: selectedStructure.id,
      exercise_slots: buildExerciseOptionsForStructure(profile, catalog, selectedStructure),
    });

    const updated = await this.recommendationDrafts.updateDraft(userId, {
      selectedStructureId: selectedStructure.id,
      draftJson: nextDraft,
    });

    return mapDraftRecordToApi(updated);
  }

  async replaceExercise(
    userId: string,
    username: string,
    draftId: string,
    slotId: string,
    catalogExerciseId: string
  ): Promise<RecommendationDraftResponseDto> {
    await this.lifecycle.ensureUserExists(userId, username);
    const draft = await this.requireEditableDraft(userId, draftId);
    const targetSlot = draft.draftJson.exercise_slots.find(slot => slot.slot_id === slotId);
    if (!targetSlot) {
      conflict("Recommendation draft slot not found");
    }

    const selectedOption = targetSlot.options.find(
      option => option.catalog_exercise_id === catalogExerciseId
    );
    if (!selectedOption) {
      conflict("Replacement exercise is not available for this slot");
    }
    if (
      draft.draftJson.exercise_slots.some(
        slot =>
          slot.slot_id !== targetSlot.slot_id &&
          slot.workout_key === targetSlot.workout_key &&
          slot.selected_exercise_id === selectedOption.exercise_id
      )
    ) {
      conflict("Replacement exercise is already selected in this workout");
    }

    const nextSlots = draft.draftJson.exercise_slots.map(slot =>
      slot.slot_id === slotId
        ? {
            ...slot,
            selected_exercise_id: selectedOption.exercise_id,
          }
        : slot
    );

    const nextDraft = validateRecommendationDraftJson({
      ...draft.draftJson,
      exercise_slots: nextSlots,
    });
    const updated = await this.recommendationDrafts.updateDraft(userId, {
      draftJson: nextDraft,
    });

    return mapDraftRecordToApi(updated);
  }

  async activateDraft(
    userId: string,
    username: string,
    draftId: string
  ): Promise<RecommendationDraftActivationResponseDto> {
    await this.lifecycle.ensureUserExists(userId, username);
    const currentDraft = await this.requireDraft(userId);
    this.assertCurrentDraftId(currentDraft, draftId);

    if (currentDraft.status === "activated") {
      return this.buildActivatedResponseFromRecord(currentDraft);
    }

    const recoveredMetadata = await this.metadata.getLatestByRecommendationDraftId(userId, currentDraft.id);
    if (recoveredMetadata) {
      const recoveredProgram = await this.programs.getProgramById(recoveredMetadata.programId);
      if (recoveredProgram) {
        const marked = await this.recommendationDrafts.markActivated({
          userId,
          activatedProgramId: recoveredMetadata.programId,
          activatedAt: currentDraft.activatedAt ?? recoveredMetadata.createdAt,
        });
        return buildActivationResponse(marked, recoveredProgram);
      }
    }

    const generated = materializeProgramDefinitionFromDraftSelection(currentDraft.draftJson);
    const created = await this.programGenerator.persistGeneratedProgramVersion({
      userId,
      source: "generated",
      generationReason: "recommendation-draft-activate",
      generated,
      profileId: currentDraft.sourceProfileId,
      profileVersion: PROFILE_VERSION,
      onboardingAnswerId: currentDraft.sourceOnboardingAnswerId,
      inputSummary: {
        recommendationDraftId: currentDraft.id,
        primaryGoal: currentDraft.draftJson.profile_snapshot.primaryGoal,
        trainingDaysPerWeek: currentDraft.draftJson.profile_snapshot.trainingDaysPerWeek,
        sessionDurationMinutes: currentDraft.draftJson.profile_snapshot.sessionDurationMinutes,
        selectedStructureId: currentDraft.selectedStructureId,
      },
    });

    const marked = await this.recommendationDrafts.markActivated({
      userId,
      activatedProgramId: created.versionId,
      activatedAt: nowIso(),
    });

    return buildActivationResponse(marked, created);
  }

  private async requireDraft(userId: string): Promise<RecommendationDraftRecord> {
    const draft = await this.recommendationDrafts.getByUserId(userId);
    if (!draft) {
      notFound("Recommendation draft not found");
    }
    return draft;
  }

  private async requireEditableDraft(userId: string, draftId: string): Promise<RecommendationDraftRecord> {
    const draft = await this.requireDraft(userId);
    this.assertCurrentDraftId(draft, draftId);
    if (draft.status === "activated") {
      conflict("Recommendation draft already activated");
    }
    return draft;
  }

  private assertCurrentDraftId(draft: RecommendationDraftRecord, draftId: string) {
    if (draft.id !== draftId) {
      conflict("Recommendation draft is stale");
    }
  }

  private async loadDraftCatalog(profile: NormalizedUserProfile, expectedSeedVersion: string) {
    const catalog = filterCatalogForProfile(await this.catalog.listActiveEntries(), profile);
    if (catalog.exercises.length === 0) {
      conflict("Exercise catalog cannot satisfy the current draft profile");
    }
    if (catalog.seedVersion !== expectedSeedVersion) {
      conflict("Recommendation draft catalog seed is stale");
    }
    return catalog;
  }

  private async buildActivatedResponseFromRecord(
    draft: RecommendationDraftRecord
  ): Promise<RecommendationDraftActivationResponseDto> {
    if (!draft.activatedProgramId || !draft.activatedAt) {
      conflict("Recommendation draft activation state is incomplete");
    }

    const program = await this.programs.getProgramById(draft.activatedProgramId);
    if (!program) {
      conflict("Activated recommendation draft program not found");
    }

    return buildActivationResponse(draft, program);
  }
}

function mapDraftRecordToApi(record: RecommendationDraftRecord): RecommendationDraftResponseDto {
  return {
    id: record.id,
    status: record.status,
    source_onboarding_answer_id: record.sourceOnboardingAnswerId,
    source_profile_id: record.sourceProfileId,
    generator_version: record.generatorVersion,
    catalog_seed_version: record.catalogSeedVersion,
    selected_structure_id: record.selectedStructureId,
    activated_program_id: record.activatedProgramId,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    activated_at: record.activatedAt,
    draft: record.draftJson,
  };
}

function buildActivationResponse(
  draft: RecommendationDraftRecord,
  program: Awaited<ReturnType<ProgramRepository["getProgramById"]>>
): RecommendationDraftActivationResponseDto {
  if (!program || !draft.activatedProgramId || !draft.activatedAt) {
    conflict("Recommendation draft activation result is incomplete");
  }

  return {
    ok: true,
    message: "Recommendation draft activated",
    program: {
      ...programTemplateToApi(program),
      version_id: program.versionId,
      source: program.source,
    },
    generator: {
      version: draft.generatorVersion,
      catalog_seed_version: draft.catalogSeedVersion,
    },
    recommendation_draft: {
      id: draft.id,
      status: "activated",
      selected_structure_id: draft.selectedStructureId,
      activated_program_id: draft.activatedProgramId,
      activated_at: draft.activatedAt,
      updated_at: draft.updatedAt,
    },
  };
}

function snapshotToNormalizedProfile(
  snapshot: RecommendationDraftProfileSnapshot
): NormalizedUserProfile {
  return {
    version: PROFILE_VERSION,
    primaryGoal: snapshot.primaryGoal as NormalizedUserProfile["primaryGoal"],
    secondaryGoals: [],
    experienceLevel: snapshot.experienceLevel as NormalizedUserProfile["experienceLevel"],
    trainingDaysPerWeek: snapshot.trainingDaysPerWeek,
    sessionDurationMinutes: snapshot.sessionDurationMinutes,
    equipmentAccess: [...snapshot.equipmentAccess],
    focusAreas: [...snapshot.focusAreas] as NormalizedUserProfile["focusAreas"],
    limitationTags: [...snapshot.limitationTags] as NormalizedUserProfile["limitationTags"],
    preferredStyles: [...snapshot.preferredStyles] as NormalizedUserProfile["preferredStyles"],
    splitPreference: snapshot.splitPreference as NormalizedUserProfile["splitPreference"],
    volumeLevel: snapshot.volumeLevel as NormalizedUserProfile["volumeLevel"],
    preferredWorkoutTags: [...snapshot.preferredWorkoutTags],
    excludedWorkoutTags: [...snapshot.excludedWorkoutTags],
  };
}
