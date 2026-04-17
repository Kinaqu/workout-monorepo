PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS recommendation_drafts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'activated')),
  source_onboarding_answer_id TEXT,
  source_profile_id TEXT,
  generator_version TEXT NOT NULL,
  catalog_seed_version TEXT NOT NULL,
  selected_structure_id TEXT NOT NULL,
  draft_json TEXT NOT NULL,
  activated_program_id TEXT,
  created_at TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),
  updated_at TEXT NOT NULL CHECK (updated_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),
  activated_at TEXT CHECK (
    activated_at IS NULL
    OR activated_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'
  ),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (source_onboarding_answer_id) REFERENCES onboarding_answers(id) ON DELETE SET NULL,
  FOREIGN KEY (source_profile_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (activated_program_id) REFERENCES programs(id) ON DELETE SET NULL,
  CHECK (length(trim(generator_version)) > 0),
  CHECK (length(trim(catalog_seed_version)) > 0),
  CHECK (length(trim(selected_structure_id)) > 0),
  CHECK (length(trim(draft_json)) > 1),
  CHECK (
    (status = 'draft' AND activated_program_id IS NULL AND activated_at IS NULL)
    OR
    (status = 'activated' AND activated_program_id IS NOT NULL AND activated_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_recommendation_drafts_status_updated
ON recommendation_drafts(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_recommendation_drafts_profile
ON recommendation_drafts(source_profile_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_recommendation_drafts_onboarding
ON recommendation_drafts(source_onboarding_answer_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_recommendation_drafts_activated_program
ON recommendation_drafts(activated_program_id);
