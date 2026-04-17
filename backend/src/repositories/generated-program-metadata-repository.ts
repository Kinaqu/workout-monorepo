import { Env } from "../env";
import { nowIso } from "../lib/time";
import { fetchFirst } from "../db/d1";

interface GeneratedProgramMetadataRow {
  program_id: string;
  user_id: string;
  generator_version: string;
  generation_reason: string;
  profile_id: string | null;
  profile_version: string | null;
  onboarding_answer_id: string | null;
  catalog_seed_version: string;
  input_summary_json: string;
  created_at: string;
}

export interface GeneratedProgramMetadataRecord {
  programId: string;
  userId: string;
  generatorVersion: string;
  generationReason: string;
  profileId: string | null;
  profileVersion: string | null;
  onboardingAnswerId: string | null;
  catalogSeedVersion: string;
  inputSummary: Record<string, unknown>;
  createdAt: string;
}

export class GeneratedProgramMetadataRepository {
  constructor(private readonly env: Env) {}

  async save(input: {
    programId: string;
    userId: string;
    generatorVersion: string;
    generationReason: string;
    profileId: string | null;
    profileVersion: string | null;
    onboardingAnswerId: string | null;
    catalogSeedVersion: string;
    inputSummary: Record<string, unknown>;
  }): Promise<void> {
    const now = nowIso();

    await this.env.DB.prepare(
      `INSERT INTO generated_program_metadata (
        program_id, user_id, generator_version, generation_reason, profile_id, profile_version, onboarding_answer_id,
        catalog_seed_version, input_summary_json, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(program_id) DO UPDATE SET
         user_id = excluded.user_id,
         generator_version = excluded.generator_version,
         generation_reason = excluded.generation_reason,
         profile_id = excluded.profile_id,
         profile_version = excluded.profile_version,
         onboarding_answer_id = excluded.onboarding_answer_id,
         catalog_seed_version = excluded.catalog_seed_version,
         input_summary_json = excluded.input_summary_json`
    )
      .bind(
        input.programId,
        input.userId,
        input.generatorVersion,
        input.generationReason,
        input.profileId,
        input.profileVersion,
        input.onboardingAnswerId,
        input.catalogSeedVersion,
        JSON.stringify(input.inputSummary),
        now
      )
      .run();
  }

  async getByProgram(userId: string, programId: string): Promise<GeneratedProgramMetadataRecord | null> {
    const row = await fetchFirst<GeneratedProgramMetadataRow>(
      this.env.DB.prepare(
        `SELECT
           program_id,
           user_id,
           generator_version,
           generation_reason,
           profile_id,
           profile_version,
           onboarding_answer_id,
           catalog_seed_version,
           input_summary_json,
           created_at
         FROM generated_program_metadata
         WHERE user_id = ? AND program_id = ?`
      ).bind(userId, programId)
    );

    if (!row) {
      return null;
    }

    return {
      programId: row.program_id,
      userId: row.user_id,
      generatorVersion: row.generator_version,
      generationReason: row.generation_reason,
      profileId: row.profile_id,
      profileVersion: row.profile_version,
      onboardingAnswerId: row.onboarding_answer_id,
      catalogSeedVersion: row.catalog_seed_version,
      inputSummary: parseInputSummary(row.input_summary_json),
      createdAt: row.created_at,
    };
  }

  async getLatestByRecommendationDraftId(
    userId: string,
    recommendationDraftId: string
  ): Promise<GeneratedProgramMetadataRecord | null> {
    const row = await fetchFirst<GeneratedProgramMetadataRow>(
      this.env.DB.prepare(
        `SELECT
           program_id,
           user_id,
           generator_version,
           generation_reason,
           profile_id,
           profile_version,
           onboarding_answer_id,
           catalog_seed_version,
           input_summary_json,
           created_at
         FROM generated_program_metadata
         WHERE user_id = ?
           AND json_extract(input_summary_json, '$.recommendationDraftId') = ?
         ORDER BY created_at DESC
         LIMIT 1`
      ).bind(userId, recommendationDraftId)
    );

    if (!row) {
      return null;
    }

    return {
      programId: row.program_id,
      userId: row.user_id,
      generatorVersion: row.generator_version,
      generationReason: row.generation_reason,
      profileId: row.profile_id,
      profileVersion: row.profile_version,
      onboardingAnswerId: row.onboarding_answer_id,
      catalogSeedVersion: row.catalog_seed_version,
      inputSummary: parseInputSummary(row.input_summary_json),
      createdAt: row.created_at,
    };
  }
}

function parseInputSummary(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }

  return {};
}
