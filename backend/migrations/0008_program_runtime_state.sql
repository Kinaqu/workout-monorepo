CREATE TABLE IF NOT EXISTS program_runtime_state (
  program_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  last_session_logged_at TEXT CHECK (
    last_session_logged_at IS NULL
    OR last_session_logged_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'
  ),
  last_progression_run_at TEXT CHECK (
    last_progression_run_at IS NULL
    OR last_progression_run_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'
  ),
  created_at TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),
  updated_at TEXT NOT NULL CHECK (updated_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_program_runtime_state_user_updated
ON program_runtime_state(user_id, updated_at DESC);
