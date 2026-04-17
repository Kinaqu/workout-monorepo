import { fetchFirst } from "../db/d1";
import {
  RecommendationDraftJson,
  RecommendationDraftStatus,
  validateRecommendationDraftJson,
} from "../domain/recommendation-draft";
import { Env } from "../env";
import { createId } from "../lib/id";
import { nowIso } from "../lib/time";

interface RecommendationDraftRow {
  id: string;
  user_id: string;
  status: RecommendationDraftStatus;
  source_onboarding_answer_id: string | null;
  source_profile_id: string | null;
  generator_version: string;
  catalog_seed_version: string;
  selected_structure_id: string;
  draft_json: string;
  activated_program_id: string | null;
  created_at: string;
  updated_at: string;
  activated_at: string | null;
}

export interface RecommendationDraftRecord {
  id: string;
  userId: string;
  status: RecommendationDraftStatus;
  sourceOnboardingAnswerId: string | null;
  sourceProfileId: string | null;
  generatorVersion: string;
  catalogSeedVersion: string;
  selectedStructureId: string;
  draftJson: RecommendationDraftJson;
  activatedProgramId: string | null;
  createdAt: string;
  updatedAt: string;
  activatedAt: string | null;
}

export interface RecommendationDraftUpsertInput {
  userId: string;
  status?: RecommendationDraftStatus;
  sourceOnboardingAnswerId?: string | null;
  sourceProfileId?: string | null;
  generatorVersion: string;
  catalogSeedVersion: string;
  selectedStructureId: string;
  draftJson: RecommendationDraftJson;
}

export interface RecommendationDraftPatchInput {
  status?: RecommendationDraftStatus;
  sourceOnboardingAnswerId?: string | null;
  sourceProfileId?: string | null;
  generatorVersion?: string;
  catalogSeedVersion?: string;
  selectedStructureId?: string;
  draftJson?: RecommendationDraftJson;
  activatedProgramId?: string | null;
  activatedAt?: string | null;
}

export class RecommendationDraftRepository {
  constructor(private readonly env: Env) {}

  async getByUserId(userId: string): Promise<RecommendationDraftRecord | null> {
    const row = await fetchFirst<RecommendationDraftRow>(
      this.env.DB.prepare(
        `SELECT
           id,
           user_id,
           status,
           source_onboarding_answer_id,
           source_profile_id,
           generator_version,
           catalog_seed_version,
           selected_structure_id,
           draft_json,
           activated_program_id,
           created_at,
           updated_at,
           activated_at
         FROM recommendation_drafts
         WHERE user_id = ?`
      ).bind(userId)
    );

    return row ? mapRecommendationDraftRow(row) : null;
  }

  async upsert(input: RecommendationDraftUpsertInput): Promise<RecommendationDraftRecord> {
    const existing = await this.getByUserId(input.userId);
    const id = existing?.id ?? createId("rd");
    const now = nowIso();
    const status = input.status ?? "draft";
    const payload = buildStoredPayload({
      status,
      sourceOnboardingAnswerId:
        typeof input.sourceOnboardingAnswerId === "undefined"
          ? existing?.sourceOnboardingAnswerId ?? null
          : input.sourceOnboardingAnswerId,
      sourceProfileId:
        typeof input.sourceProfileId === "undefined"
          ? existing?.sourceProfileId ?? null
          : input.sourceProfileId,
      generatorVersion: input.generatorVersion,
      catalogSeedVersion: input.catalogSeedVersion,
      selectedStructureId: input.selectedStructureId,
      draftJson: input.draftJson,
      activatedProgramId: null,
      activatedAt: null,
    });

    await this.env.DB.prepare(
      `INSERT INTO recommendation_drafts (
         id,
         user_id,
         status,
         source_onboarding_answer_id,
         source_profile_id,
         generator_version,
         catalog_seed_version,
         selected_structure_id,
         draft_json,
         activated_program_id,
         created_at,
         updated_at,
         activated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL)
       ON CONFLICT(user_id) DO UPDATE SET
         status = excluded.status,
         source_onboarding_answer_id = excluded.source_onboarding_answer_id,
         source_profile_id = excluded.source_profile_id,
         generator_version = excluded.generator_version,
         catalog_seed_version = excluded.catalog_seed_version,
         selected_structure_id = excluded.selected_structure_id,
         draft_json = excluded.draft_json,
         activated_program_id = NULL,
         updated_at = excluded.updated_at,
         activated_at = NULL`
    )
      .bind(
        id,
        input.userId,
        payload.status,
        payload.sourceOnboardingAnswerId,
        payload.sourceProfileId,
        payload.generatorVersion,
        payload.catalogSeedVersion,
        payload.selectedStructureId,
        payload.draftJsonString,
        existing?.createdAt ?? now,
        now
      )
      .run();

    const saved = await this.getByUserId(input.userId);
    if (!saved) {
      throw new Error("Failed to load recommendation draft after upsert");
    }
    return saved;
  }

  async updateDraft(
    userId: string,
    patch: RecommendationDraftPatchInput
  ): Promise<RecommendationDraftRecord> {
    const existing = await this.getByUserId(userId);
    if (!existing) {
      throw new Error("Recommendation draft not found");
    }

    const nextStatus = patch.status ?? existing.status;
    const nextGeneratorVersion = patch.generatorVersion ?? existing.generatorVersion;
    const nextCatalogSeedVersion = patch.catalogSeedVersion ?? existing.catalogSeedVersion;
    const nextSelectedStructureId =
      patch.selectedStructureId ?? existing.selectedStructureId;
    const nextActivatedProgramId =
      typeof patch.activatedProgramId === "undefined"
        ? existing.activatedProgramId
        : patch.activatedProgramId;
    const nextActivatedAt =
      typeof patch.activatedAt === "undefined" ? existing.activatedAt : patch.activatedAt;

    const nextDraftJson = patch.draftJson
      ? validateRecommendationDraftJson(patch.draftJson)
      : {
          ...existing.draftJson,
          status: nextStatus,
          generator_version: nextGeneratorVersion,
          catalog_seed_version: nextCatalogSeedVersion,
          selected_structure_id: nextSelectedStructureId,
          ...(nextStatus === "activated"
            ? {
                activation_context: {
                  activated_program_id: nextActivatedProgramId,
                  activated_at: nextActivatedAt,
                },
              }
            : { activation_context: undefined }),
        };

    const payload = buildStoredPayload({
      status: nextStatus,
      sourceOnboardingAnswerId:
        typeof patch.sourceOnboardingAnswerId === "undefined"
          ? existing.sourceOnboardingAnswerId
          : patch.sourceOnboardingAnswerId,
      sourceProfileId:
        typeof patch.sourceProfileId === "undefined"
          ? existing.sourceProfileId
          : patch.sourceProfileId,
      generatorVersion: nextGeneratorVersion,
      catalogSeedVersion: nextCatalogSeedVersion,
      selectedStructureId: nextSelectedStructureId,
      draftJson: nextDraftJson,
      activatedProgramId: nextActivatedProgramId,
      activatedAt: nextActivatedAt,
    });

    await this.env.DB.prepare(
      `UPDATE recommendation_drafts
       SET
         status = ?,
         source_onboarding_answer_id = ?,
         source_profile_id = ?,
         generator_version = ?,
         catalog_seed_version = ?,
         selected_structure_id = ?,
         draft_json = ?,
         activated_program_id = ?,
         updated_at = ?,
         activated_at = ?
       WHERE user_id = ?`
    )
      .bind(
        payload.status,
        payload.sourceOnboardingAnswerId,
        payload.sourceProfileId,
        payload.generatorVersion,
        payload.catalogSeedVersion,
        payload.selectedStructureId,
        payload.draftJsonString,
        payload.activatedProgramId,
        nowIso(),
        payload.activatedAt,
        userId
      )
      .run();

    const saved = await this.getByUserId(userId);
    if (!saved) {
      throw new Error("Failed to load recommendation draft after update");
    }
    return saved;
  }

  async markActivated(input: {
    userId: string;
    activatedProgramId: string;
    activatedAt?: string;
  }): Promise<RecommendationDraftRecord> {
    const existing = await this.getByUserId(input.userId);
    if (!existing) {
      throw new Error("Recommendation draft not found");
    }
    if (existing.status === "activated") {
      throw new Error("Recommendation draft is already activated");
    }

    return this.updateDraft(input.userId, {
      status: "activated",
      activatedProgramId: input.activatedProgramId,
      activatedAt: input.activatedAt ?? nowIso(),
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.env.DB.prepare("DELETE FROM recommendation_drafts WHERE user_id = ?")
      .bind(userId)
      .run();
  }
}

function mapRecommendationDraftRow(row: RecommendationDraftRow): RecommendationDraftRecord {
  const draftJson = parseDraftJson(row.draft_json);
  assertDraftStorageConsistency(row, draftJson);

  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    sourceOnboardingAnswerId: row.source_onboarding_answer_id,
    sourceProfileId: row.source_profile_id,
    generatorVersion: row.generator_version,
    catalogSeedVersion: row.catalog_seed_version,
    selectedStructureId: row.selected_structure_id,
    draftJson,
    activatedProgramId: row.activated_program_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    activatedAt: row.activated_at,
  };
}

function parseDraftJson(value: string): RecommendationDraftJson {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch (error) {
    throw new Error(
      `Failed to parse recommendation draft json: ${
        error instanceof Error ? error.message : "Unknown JSON parse error"
      }`
    );
  }

  return validateRecommendationDraftJson(parsed);
}

function buildStoredPayload(input: {
  status: RecommendationDraftStatus;
  sourceOnboardingAnswerId: string | null;
  sourceProfileId: string | null;
  generatorVersion: string;
  catalogSeedVersion: string;
  selectedStructureId: string;
  draftJson: RecommendationDraftJson;
  activatedProgramId: string | null;
  activatedAt: string | null;
}) {
  const draftJson = validateRecommendationDraftJson(input.draftJson);

  if (draftJson.status !== input.status) {
    throw new Error("Recommendation draft status does not match draft_json.status");
  }
  if (draftJson.generator_version !== input.generatorVersion) {
    throw new Error(
      "Recommendation draft generator version does not match draft_json.generator_version"
    );
  }
  if (draftJson.catalog_seed_version !== input.catalogSeedVersion) {
    throw new Error(
      "Recommendation draft catalog seed version does not match draft_json.catalog_seed_version"
    );
  }
  if (draftJson.selected_structure_id !== input.selectedStructureId) {
    throw new Error(
      "Recommendation draft selected structure id does not match draft_json.selected_structure_id"
    );
  }

  if (input.status === "draft" && (input.activatedProgramId !== null || input.activatedAt !== null)) {
    throw new Error("Draft recommendation rows cannot have activation fields");
  }
  if (
    input.status === "activated" &&
    (!input.activatedProgramId || !input.activatedAt)
  ) {
    throw new Error("Activated recommendation rows require activation fields");
  }

  return {
    ...input,
    draftJsonString: JSON.stringify(draftJson),
  };
}

function assertDraftStorageConsistency(
  row: RecommendationDraftRow,
  draftJson: RecommendationDraftJson
) {
  if (row.status !== draftJson.status) {
    throw new Error("Recommendation draft row status is out of sync with draft_json.status");
  }
  if (row.generator_version !== draftJson.generator_version) {
    throw new Error(
      "Recommendation draft row generator_version is out of sync with draft_json.generator_version"
    );
  }
  if (row.catalog_seed_version !== draftJson.catalog_seed_version) {
    throw new Error(
      "Recommendation draft row catalog_seed_version is out of sync with draft_json.catalog_seed_version"
    );
  }
  if (row.selected_structure_id !== draftJson.selected_structure_id) {
    throw new Error(
      "Recommendation draft row selected_structure_id is out of sync with draft_json.selected_structure_id"
    );
  }
}
