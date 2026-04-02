PRAGMA defer_foreign_keys = ON;

ALTER TABLE generated_program_metadata RENAME TO generated_program_metadata_old;

DROP INDEX IF EXISTS idx_generated_program_metadata_user_created;
DROP INDEX IF EXISTS idx_generated_program_metadata_profile_created;
DROP INDEX IF EXISTS idx_generated_program_metadata_generator_created;
DROP INDEX IF EXISTS idx_generated_program_metadata_reason_created;

CREATE TABLE generated_program_metadata (
  program_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  generator_version TEXT NOT NULL,
  generation_reason TEXT NOT NULL,
  profile_id TEXT,
  profile_version TEXT,
  onboarding_answer_id TEXT,
  catalog_seed_version TEXT NOT NULL,
  input_summary_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (onboarding_answer_id) REFERENCES onboarding_answers(id) ON DELETE SET NULL
);

INSERT INTO generated_program_metadata (
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
)
SELECT
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
FROM generated_program_metadata_old;

CREATE INDEX idx_generated_program_metadata_user_created ON generated_program_metadata(user_id, created_at DESC);
CREATE INDEX idx_generated_program_metadata_profile_created ON generated_program_metadata(profile_id, created_at DESC);
CREATE INDEX idx_generated_program_metadata_generator_created ON generated_program_metadata(generator_version, created_at DESC);
CREATE INDEX idx_generated_program_metadata_reason_created ON generated_program_metadata(generation_reason, created_at DESC);

DROP TABLE generated_program_metadata_old;

PRAGMA defer_foreign_keys = OFF;
