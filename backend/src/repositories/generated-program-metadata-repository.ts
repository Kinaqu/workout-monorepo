import { Env } from "../env";
import { nowIso } from "../lib/time";

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
}
