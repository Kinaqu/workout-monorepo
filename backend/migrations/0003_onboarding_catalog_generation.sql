ALTER TABLE users ADD COLUMN onboarding_completed_at TEXT;

CREATE TABLE IF NOT EXISTS onboarding_answers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  questionnaire_version TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'api',
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_onboarding_answers_completed_at ON onboarding_answers(completed_at);

CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  profile_version TEXT NOT NULL,
  source_answer_id TEXT,
  primary_goal TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  training_days_per_week INTEGER NOT NULL,
  session_duration_minutes INTEGER NOT NULL,
  equipment_json TEXT NOT NULL,
  focus_areas_json TEXT NOT NULL,
  limitation_tags_json TEXT NOT NULL,
  preferred_styles_json TEXT NOT NULL,
  profile_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (source_answer_id) REFERENCES onboarding_answers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_goal ON user_profiles(primary_goal, experience_level);

CREATE TABLE IF NOT EXISTS exercise_catalog (
  id TEXT PRIMARY KEY,
  exercise_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reps', 'time', 'cycles')),
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  equipment_json TEXT NOT NULL,
  workout_tags_json TEXT NOT NULL,
  goal_tags_json TEXT NOT NULL,
  focus_areas_json TEXT NOT NULL,
  contraindication_tags_json TEXT NOT NULL,
  experience_levels_json TEXT NOT NULL,
  max_sets INTEGER NOT NULL,
  default_target_min INTEGER NOT NULL,
  default_target_max INTEGER NOT NULL,
  progression_enabled INTEGER NOT NULL DEFAULT 1 CHECK (progression_enabled IN (0, 1)),
  progression_step INTEGER NOT NULL DEFAULT 1,
  deload_step INTEGER NOT NULL DEFAULT 1,
  seed_version TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exercise_catalog_active_key ON exercise_catalog(is_active, exercise_key);

CREATE TABLE IF NOT EXISTS generated_program_metadata (
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

CREATE INDEX IF NOT EXISTS idx_generated_program_metadata_user_created ON generated_program_metadata(user_id, created_at DESC);

INSERT OR IGNORE INTO exercise_catalog (
  id, exercise_key, name, type, category, difficulty, equipment_json, workout_tags_json, goal_tags_json,
  focus_areas_json, contraindication_tags_json, experience_levels_json, max_sets, default_target_min, default_target_max,
  progression_enabled, progression_step, deload_step, seed_version, is_active, created_at, updated_at
) VALUES
  ('catalog_pushups', 'pushups', 'Push-ups', 'reps', 'strength', 'beginner', '["bodyweight"]', '["upper","push","strength","balanced","wrist_load"]', '["strength","muscle","general_fitness"]', '["upper_body","core"]', '["wrist_sensitive","shoulder_sensitive"]', '["beginner","intermediate","advanced"]', 4, 8, 12, 1, 1, 1, 'catalog-v1', 1, '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('catalog_incline_pushups', 'incline_pushups', 'Incline Push-ups', 'reps', 'strength', 'beginner', '["bodyweight","bench"]', '["upper","push","strength","balanced","low_impact"]', '["strength","muscle","general_fitness"]', '["upper_body","core"]', '["shoulder_sensitive"]', '["beginner","intermediate","advanced"]', 4, 10, 15, 1, 1, 1, 'catalog-v1', 1, '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('catalog_band_row', 'band_row', 'Band Row', 'reps', 'strength', 'beginner', '["bands"]', '["upper","balanced","strength","low_impact"]', '["strength","muscle","general_fitness"]', '["upper_body","core"]', '["shoulder_sensitive"]', '["beginner","intermediate","advanced"]', 4, 10, 14, 1, 1, 1, 'catalog-v1', 1, '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('catalog_squats', 'squats', 'Bodyweight Squats', 'reps', 'strength', 'beginner', '["bodyweight"]', '["lower","strength","balanced","knee_dominant"]', '["strength","muscle","general_fitness"]', '["lower_body","core"]', '["knee_sensitive"]', '["beginner","intermediate","advanced"]', 4, 12, 18, 1, 1, 1, 'catalog-v1', 1, '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('catalog_split_squats', 'split_squats', 'Split Squats', 'reps', 'strength', 'intermediate', '["bodyweight"]', '["lower","strength","knee_dominant"]', '["strength","muscle"]', '["lower_body","core"]', '["knee_sensitive"]', '["intermediate","advanced"]', 4, 8, 12, 1, 1, 1, 'catalog-v1', 1, '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('catalog_reverse_lunges', 'reverse_lunges', 'Reverse Lunges', 'reps', 'strength', 'beginner', '["bodyweight"]', '["lower","balanced","knee_dominant","low_impact"]', '["strength","general_fitness"]', '["lower_body","core"]', '["knee_sensitive"]', '["beginner","intermediate","advanced"]', 4, 8, 12, 1, 1, 1, 'catalog-v1', 1, '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('catalog_glute_bridge', 'glute_bridge', 'Glute Bridge', 'reps', 'strength', 'beginner', '["bodyweight"]', '["lower","balanced","low_impact"]', '["strength","general_fitness","mobility"]', '["lower_body","core"]', '[]', '["beginner","intermediate","advanced"]', 4, 10, 15, 1, 1, 1, 'catalog-v1', 1, '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('catalog_dumbbell_rdl', 'dumbbell_rdl', 'Dumbbell Romanian Deadlift', 'reps', 'strength', 'intermediate', '["dumbbells"]', '["lower","strength","hinge_load"]', '["strength","muscle"]', '["lower_body","core"]', '["lower_back_sensitive"]', '["intermediate","advanced"]', 4, 8, 12, 1, 1, 1, 'catalog-v1', 1, '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('catalog_dead_bug', 'dead_bug', 'Dead Bug', 'reps', 'core', 'beginner', '["bodyweight"]', '["core","balanced","low_impact"]', '["general_fitness","mobility","strength"]', '["core"]', '[]', '["beginner","intermediate","advanced"]', 3, 10, 14, 1, 1, 1, 'catalog-v1', 1, '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('catalog_bird_dog', 'bird_dog', 'Bird Dog', 'reps', 'core', 'beginner', '["bodyweight"]', '["core","balanced","mobility","low_impact"]', '["general_fitness","mobility"]', '["core","mobility"]', '[]', '["beginner","intermediate","advanced"]', 3, 10, 14, 1, 1, 1, 'catalog-v1', 1, '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('catalog_side_plank', 'side_plank', 'Side Plank', 'time', 'core', 'beginner', '["bodyweight"]', '["core","balanced","low_impact"]', '["general_fitness","strength","mobility"]', '["core"]', '["shoulder_sensitive"]', '["beginner","intermediate","advanced"]', 3, 20, 35, 1, 5, 5, 'catalog-v1', 1, '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('catalog_hollow_body', 'hollow_body', 'Hollow Body Hold', 'time', 'core', 'intermediate', '["bodyweight"]', '["core","strength"]', '["strength","general_fitness"]', '["core"]', '["lower_back_sensitive"]', '["intermediate","advanced"]', 3, 20, 40, 1, 5, 5, 'catalog-v1', 1, '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('catalog_balance_hold', 'balance_hold', 'Single-Leg Balance Hold', 'time', 'mobility', 'beginner', '["bodyweight"]', '["mobility","recovery","low_impact","balanced"]', '["mobility","general_fitness"]', '["lower_body","mobility","core"]', '[]', '["beginner","intermediate","advanced"]', 3, 30, 45, 1, 5, 5, 'catalog-v1', 1, '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('catalog_diaphragmatic_breathing', 'diaphragmatic_breathing', 'Diaphragmatic Breathing', 'cycles', 'recovery', 'beginner', '["bodyweight"]', '["mobility","recovery","low_impact"]', '["mobility","general_fitness"]', '["core","mobility"]', '[]', '["beginner","intermediate","advanced"]', 1, 5, 8, 0, 1, 1, 'catalog-v1', 1, '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('catalog_cat_cow', 'cat_cow', 'Cat Cow', 'reps', 'mobility', 'beginner', '["bodyweight"]', '["mobility","recovery","low_impact"]', '["mobility","general_fitness"]', '["mobility","core"]', '[]', '["beginner","intermediate","advanced"]', 2, 8, 12, 0, 1, 1, 'catalog-v1', 1, '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('catalog_figure_four', 'figure_four_stretch', 'Figure Four Stretch', 'time', 'mobility', 'beginner', '["bodyweight"]', '["mobility","recovery","low_impact"]', '["mobility","general_fitness"]', '["lower_body","mobility"]', '[]', '["beginner","intermediate","advanced"]', 2, 25, 35, 0, 5, 5, 'catalog-v1', 1, '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('catalog_chest_wall', 'chest_wall_stretch', 'Chest Wall Stretch', 'time', 'mobility', 'beginner', '["bodyweight"]', '["mobility","recovery","low_impact"]', '["mobility","general_fitness"]', '["upper_body","mobility"]', '[]', '["beginner","intermediate","advanced"]', 2, 25, 35, 0, 5, 5, 'catalog-v1', 1, '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('catalog_hamstring', 'hamstring_stretch', 'Hamstring Stretch', 'time', 'mobility', 'beginner', '["bodyweight"]', '["mobility","recovery","low_impact"]', '["mobility","general_fitness"]', '["lower_body","mobility"]', '[]', '["beginner","intermediate","advanced"]', 2, 25, 35, 0, 5, 5, 'catalog-v1', 1, '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('catalog_band_pull_apart', 'band_pull_apart', 'Band Pull Apart', 'reps', 'mobility', 'beginner', '["bands"]', '["upper","mobility","low_impact"]', '["mobility","general_fitness"]', '["upper_body","mobility"]', '[]', '["beginner","intermediate","advanced"]', 3, 12, 18, 0, 1, 1, 'catalog-v1', 1, '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z');
