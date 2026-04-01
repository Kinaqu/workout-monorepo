PRAGMA foreign_keys = OFF;
PRAGMA legacy_alter_table = ON;

-- Make program version lineage explicit and enforce a single active version per user.
ALTER TABLE programs RENAME TO programs_old;
DROP INDEX idx_programs_user_active;
DROP INDEX idx_programs_user_key;

CREATE TABLE programs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  program_key TEXT NOT NULL,
  program_family_id TEXT NOT NULL,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  previous_program_id TEXT,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  source TEXT NOT NULL DEFAULT 'api',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  superseded_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (previous_program_id) REFERENCES programs(id) ON DELETE SET NULL
);

INSERT INTO programs (
  id, user_id, program_key, program_family_id, version_number, previous_program_id, name, is_active, source,
  created_at, updated_at, superseded_at
)
SELECT
  id,
  user_id,
  program_key,
  id,
  1,
  NULL,
  name,
  is_active,
  source,
  created_at,
  updated_at,
  CASE WHEN is_active = 1 THEN NULL ELSE updated_at END
FROM programs_old;

CREATE INDEX idx_programs_user_active ON programs(user_id, is_active, updated_at DESC);
CREATE UNIQUE INDEX idx_programs_single_active_per_user ON programs(user_id) WHERE is_active = 1;
CREATE INDEX idx_programs_user_key ON programs(user_id, program_key);
CREATE INDEX idx_programs_family_version ON programs(program_family_id, version_number DESC);
CREATE INDEX idx_programs_previous_program ON programs(previous_program_id);

-- Tighten normalized user profile ranges before building filterable tag tables.
ALTER TABLE user_profiles RENAME TO user_profiles_old;
DROP INDEX idx_user_profiles_goal;

CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  profile_version TEXT NOT NULL,
  source_answer_id TEXT,
  primary_goal TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  training_days_per_week INTEGER NOT NULL CHECK (training_days_per_week BETWEEN 2 AND 5),
  session_duration_minutes INTEGER NOT NULL CHECK (session_duration_minutes BETWEEN 20 AND 75),
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

INSERT INTO user_profiles (
  id, user_id, profile_version, source_answer_id, primary_goal, experience_level, training_days_per_week,
  session_duration_minutes, equipment_json, focus_areas_json, limitation_tags_json, preferred_styles_json,
  profile_json, created_at, updated_at
)
SELECT
  id, user_id, profile_version, source_answer_id, primary_goal, experience_level, training_days_per_week,
  session_duration_minutes, equipment_json, focus_areas_json, limitation_tags_json, preferred_styles_json,
  profile_json, created_at, updated_at
FROM user_profiles_old;

CREATE INDEX idx_user_profiles_goal ON user_profiles(primary_goal, experience_level);

-- Tighten catalog value ranges before adding canonical links from program snapshots.
ALTER TABLE exercise_catalog RENAME TO exercise_catalog_old;
DROP INDEX idx_exercise_catalog_active_key;

CREATE TABLE exercise_catalog (
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
  max_sets INTEGER NOT NULL CHECK (max_sets > 0),
  default_target_min INTEGER NOT NULL CHECK (default_target_min > 0),
  default_target_max INTEGER NOT NULL CHECK (default_target_max >= default_target_min),
  progression_enabled INTEGER NOT NULL DEFAULT 1 CHECK (progression_enabled IN (0, 1)),
  progression_step INTEGER NOT NULL DEFAULT 1 CHECK (progression_step > 0),
  deload_step INTEGER NOT NULL DEFAULT 1 CHECK (deload_step > 0),
  seed_version TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO exercise_catalog (
  id, exercise_key, name, type, category, difficulty, equipment_json, workout_tags_json, goal_tags_json,
  focus_areas_json, contraindication_tags_json, experience_levels_json, max_sets, default_target_min,
  default_target_max, progression_enabled, progression_step, deload_step, seed_version, is_active, created_at, updated_at
)
SELECT
  id, exercise_key, name, type, category, difficulty, equipment_json, workout_tags_json, goal_tags_json,
  focus_areas_json, contraindication_tags_json, experience_levels_json, max_sets, default_target_min,
  default_target_max, progression_enabled, progression_step, deload_step, seed_version, is_active, created_at, updated_at
FROM exercise_catalog_old;

CREATE INDEX idx_exercise_catalog_active_key ON exercise_catalog(is_active, exercise_key);

-- Strengthen workout ordering and prepare composite lookups used by progression and schedule constraints.
ALTER TABLE workouts RENAME TO workouts_old;

CREATE TABLE workouts (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL,
  workout_key TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  created_at TEXT NOT NULL,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  UNIQUE (program_id, workout_key),
  UNIQUE (program_id, sort_order)
);

INSERT INTO workouts (id, program_id, workout_key, name, sort_order, created_at)
SELECT id, program_id, workout_key, name, sort_order, created_at
FROM workouts_old;

CREATE UNIQUE INDEX idx_workouts_program_id_id ON workouts(program_id, id);

-- Program exercises become immutable snapshots linked back to the canonical catalog when possible.
ALTER TABLE exercises RENAME TO exercises_old;

CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL,
  catalog_exercise_id TEXT,
  exercise_key TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reps', 'time', 'cycles')),
  progression_enabled INTEGER NOT NULL DEFAULT 1 CHECK (progression_enabled IN (0, 1)),
  progression_step INTEGER NOT NULL DEFAULT 1 CHECK (progression_step > 0),
  deload_step INTEGER NOT NULL DEFAULT 1 CHECK (deload_step > 0),
  created_at TEXT NOT NULL,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  FOREIGN KEY (catalog_exercise_id) REFERENCES exercise_catalog(id) ON DELETE SET NULL,
  UNIQUE (program_id, exercise_key)
);

INSERT INTO exercises (
  id, program_id, catalog_exercise_id, exercise_key, name, type, progression_enabled, progression_step, deload_step, created_at
)
SELECT
  exercises_old.id,
  exercises_old.program_id,
  exercise_catalog.id,
  exercises_old.exercise_key,
  exercises_old.name,
  exercises_old.type,
  exercises_old.progression_enabled,
  exercises_old.progression_step,
  exercises_old.deload_step,
  exercises_old.created_at
FROM exercises_old
LEFT JOIN exercise_catalog ON exercise_catalog.exercise_key = exercises_old.exercise_key;

CREATE UNIQUE INDEX idx_exercises_program_id_id ON exercises(program_id, id);
CREATE INDEX idx_exercises_catalog_exercise ON exercises(catalog_exercise_id);

ALTER TABLE workout_exercises RENAME TO workout_exercises_old;
DROP INDEX idx_workout_exercises_workout_order;
DROP INDEX idx_workout_exercises_workout_exercise;

CREATE TABLE workout_exercises (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  max_sets INTEGER NOT NULL CHECK (max_sets > 0),
  target_min INTEGER NOT NULL CHECK (target_min > 0),
  target_max INTEGER NOT NULL CHECK (target_max >= target_min),
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
  UNIQUE (workout_id, sort_order),
  UNIQUE (workout_id, exercise_id)
);

INSERT INTO workout_exercises (id, workout_id, exercise_id, sort_order, max_sets, target_min, target_max)
SELECT id, workout_id, exercise_id, sort_order, max_sets, target_min, target_max
FROM workout_exercises_old;

CREATE INDEX idx_workout_exercises_workout_order ON workout_exercises(workout_id, sort_order);
CREATE INDEX idx_workout_exercises_workout_exercise ON workout_exercises(workout_id, exercise_id);

-- Keep the existing program/day shape, but let triggers enforce cross-table ownership correctly.
ALTER TABLE program_schedule RENAME TO program_schedule_old;

CREATE TABLE program_schedule (
  program_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  workout_id TEXT,
  PRIMARY KEY (program_id, day_of_week),
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE SET NULL
);

INSERT INTO program_schedule (program_id, day_of_week, workout_id)
SELECT program_id, day_of_week, workout_id
FROM program_schedule_old;

ALTER TABLE exercise_progression_state RENAME TO exercise_progression_state_old;
DROP INDEX idx_progression_user_program;

CREATE TABLE exercise_progression_state (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  catalog_exercise_id TEXT,
  exercise_key TEXT NOT NULL,
  current_sets INTEGER NOT NULL CHECK (current_sets > 0),
  current_target_min INTEGER NOT NULL CHECK (current_target_min > 0),
  current_target_max INTEGER NOT NULL CHECK (current_target_max >= current_target_min),
  last_progression_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id, exercise_id) REFERENCES exercises(program_id, id) ON DELETE CASCADE,
  FOREIGN KEY (catalog_exercise_id) REFERENCES exercise_catalog(id) ON DELETE SET NULL,
  UNIQUE (user_id, program_id, exercise_id)
);

INSERT INTO exercise_progression_state (
  id, user_id, program_id, exercise_id, catalog_exercise_id, exercise_key, current_sets, current_target_min,
  current_target_max, last_progression_at, created_at, updated_at
)
SELECT
  exercise_progression_state_old.id,
  exercise_progression_state_old.user_id,
  exercise_progression_state_old.program_id,
  exercises.id,
  exercises.catalog_exercise_id,
  exercise_progression_state_old.exercise_key,
  exercise_progression_state_old.current_sets,
  exercise_progression_state_old.current_target_min,
  exercise_progression_state_old.current_target_max,
  exercise_progression_state_old.last_progression_at,
  exercise_progression_state_old.created_at,
  exercise_progression_state_old.updated_at
FROM exercise_progression_state_old
INNER JOIN exercises
  ON exercises.program_id = exercise_progression_state_old.program_id
 AND exercises.exercise_key = exercise_progression_state_old.exercise_key;

CREATE INDEX idx_progression_user_program ON exercise_progression_state(user_id, program_id);
CREATE INDEX idx_progression_catalog_exercise ON exercise_progression_state(catalog_exercise_id);

ALTER TABLE progression_events RENAME TO progression_events_old;
DROP INDEX idx_progression_events_user_program;

CREATE TABLE progression_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  catalog_exercise_id TEXT,
  exercise_key TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down')),
  reason TEXT NOT NULL,
  before_sets INTEGER NOT NULL CHECK (before_sets > 0),
  before_target_min INTEGER NOT NULL CHECK (before_target_min > 0),
  before_target_max INTEGER NOT NULL CHECK (before_target_max >= before_target_min),
  after_sets INTEGER NOT NULL CHECK (after_sets > 0),
  after_target_min INTEGER NOT NULL CHECK (after_target_min > 0),
  after_target_max INTEGER NOT NULL CHECK (after_target_max >= after_target_min),
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id, exercise_id) REFERENCES exercises(program_id, id) ON DELETE CASCADE,
  FOREIGN KEY (catalog_exercise_id) REFERENCES exercise_catalog(id) ON DELETE SET NULL
);

INSERT INTO progression_events (
  id, user_id, program_id, exercise_id, catalog_exercise_id, exercise_key, exercise_name, direction, reason,
  before_sets, before_target_min, before_target_max, after_sets, after_target_min, after_target_max, created_at
)
SELECT
  progression_events_old.id,
  progression_events_old.user_id,
  progression_events_old.program_id,
  exercises.id,
  exercises.catalog_exercise_id,
  progression_events_old.exercise_key,
  exercises.name,
  progression_events_old.direction,
  progression_events_old.reason,
  progression_events_old.before_sets,
  progression_events_old.before_target_min,
  progression_events_old.before_target_max,
  progression_events_old.after_sets,
  progression_events_old.after_target_min,
  progression_events_old.after_target_max,
  progression_events_old.created_at
FROM progression_events_old
INNER JOIN exercises
  ON exercises.program_id = progression_events_old.program_id
 AND exercises.exercise_key = progression_events_old.exercise_key;

CREATE INDEX idx_progression_events_user_program ON progression_events(user_id, program_id, created_at DESC);
CREATE INDEX idx_progression_events_user_program_exercise ON progression_events(user_id, program_id, exercise_id, created_at DESC);
CREATE INDEX idx_progression_events_catalog_exercise ON progression_events(catalog_exercise_id, created_at DESC);

-- Split canonical session headers from raw/parser import payloads.
ALTER TABLE workout_sessions RENAME TO workout_sessions_old;
DROP INDEX idx_sessions_user_date;

CREATE TABLE workout_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  program_id TEXT,
  workout_id TEXT,
  session_date TEXT NOT NULL,
  workout_key TEXT,
  workout_name TEXT,
  note TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL CHECK (source IN ('json', 'text', 'legacy-kv')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL,
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE SET NULL
);

INSERT INTO workout_sessions (
  id, user_id, program_id, workout_id, session_date, workout_key, workout_name, note, source, created_at, updated_at
)
SELECT
  id, user_id, program_id, workout_id, session_date, workout_key, workout_name, note, source, created_at, updated_at
FROM workout_sessions_old;

CREATE TABLE workout_session_imports (
  session_id TEXT PRIMARY KEY,
  raw_text TEXT,
  unmatched_text TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
);

INSERT INTO workout_session_imports (session_id, raw_text, unmatched_text, created_at, updated_at)
SELECT
  id,
  raw_text,
  unmatched_text,
  created_at,
  updated_at
FROM workout_sessions_old
WHERE raw_text IS NOT NULL OR unmatched_text IS NOT NULL;

CREATE INDEX idx_sessions_user_date ON workout_sessions(user_id, session_date, created_at DESC);
CREATE INDEX idx_sessions_user_created ON workout_sessions(user_id, created_at DESC);
CREATE INDEX idx_sessions_program_date ON workout_sessions(program_id, session_date DESC);
CREATE INDEX idx_sessions_workout_date ON workout_sessions(workout_id, session_date DESC);

ALTER TABLE workout_session_exercises RENAME TO workout_session_exercises_old;
DROP INDEX idx_session_exercises_session_order;

CREATE TABLE workout_session_exercises (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  program_exercise_id TEXT,
  catalog_exercise_id TEXT,
  exercise_key TEXT,
  exercise_name TEXT NOT NULL,
  exercise_type TEXT CHECK (exercise_type IN ('reps', 'time', 'cycles')),
  matched INTEGER NOT NULL DEFAULT 1 CHECK (matched IN (0, 1)),
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (program_exercise_id) REFERENCES exercises(id) ON DELETE SET NULL,
  FOREIGN KEY (catalog_exercise_id) REFERENCES exercise_catalog(id) ON DELETE SET NULL,
  UNIQUE (session_id, sort_order)
);

INSERT INTO workout_session_exercises (
  id, session_id, program_exercise_id, catalog_exercise_id, exercise_key, exercise_name, exercise_type, matched, sort_order
)
SELECT
  workout_session_exercises_old.id,
  workout_session_exercises_old.session_id,
  exercises.id,
  exercises.catalog_exercise_id,
  workout_session_exercises_old.exercise_key,
  workout_session_exercises_old.exercise_name,
  workout_session_exercises_old.exercise_type,
  workout_session_exercises_old.matched,
  workout_session_exercises_old.sort_order
FROM workout_session_exercises_old
LEFT JOIN workout_sessions
  ON workout_sessions.id = workout_session_exercises_old.session_id
LEFT JOIN exercises
  ON exercises.program_id = workout_sessions.program_id
 AND exercises.exercise_key = workout_session_exercises_old.exercise_key;

CREATE INDEX idx_session_exercises_session_order ON workout_session_exercises(session_id, sort_order);
CREATE INDEX idx_session_exercises_program_exercise ON workout_session_exercises(program_exercise_id);
CREATE INDEX idx_session_exercises_catalog_exercise ON workout_session_exercises(catalog_exercise_id);

ALTER TABLE workout_session_sets RENAME TO workout_session_sets_old;
DROP INDEX idx_session_sets_exercise_order;

CREATE TABLE workout_session_sets (
  id TEXT PRIMARY KEY,
  session_exercise_id TEXT NOT NULL,
  set_order INTEGER NOT NULL CHECK (set_order >= 0),
  value INTEGER NOT NULL CHECK (value > 0),
  FOREIGN KEY (session_exercise_id) REFERENCES workout_session_exercises(id) ON DELETE CASCADE,
  UNIQUE (session_exercise_id, set_order)
);

INSERT INTO workout_session_sets (id, session_exercise_id, set_order, value)
SELECT id, session_exercise_id, set_order, value
FROM workout_session_sets_old;

CREATE INDEX idx_session_sets_exercise_order ON workout_session_sets(session_exercise_id, set_order);

-- Trigger-based ownership checks preserve SET NULL semantics while blocking mismatched links.
CREATE TRIGGER validate_program_schedule_workout_insert
BEFORE INSERT ON program_schedule
FOR EACH ROW
WHEN NEW.workout_id IS NOT NULL
 AND NOT EXISTS (
   SELECT 1
   FROM workouts
   WHERE workouts.id = NEW.workout_id
     AND workouts.program_id = NEW.program_id
 )
BEGIN
  SELECT RAISE(ABORT, 'program_schedule.workout_id must belong to program_id');
END;

CREATE TRIGGER validate_program_schedule_workout_update
BEFORE UPDATE OF program_id, workout_id ON program_schedule
FOR EACH ROW
WHEN NEW.workout_id IS NOT NULL
 AND NOT EXISTS (
   SELECT 1
   FROM workouts
   WHERE workouts.id = NEW.workout_id
     AND workouts.program_id = NEW.program_id
 )
BEGIN
  SELECT RAISE(ABORT, 'program_schedule.workout_id must belong to program_id');
END;

CREATE TRIGGER validate_workout_sessions_workout_insert
BEFORE INSERT ON workout_sessions
FOR EACH ROW
WHEN NEW.workout_id IS NOT NULL
 AND NEW.program_id IS NOT NULL
 AND NOT EXISTS (
   SELECT 1
   FROM workouts
   WHERE workouts.id = NEW.workout_id
     AND workouts.program_id = NEW.program_id
 )
BEGIN
  SELECT RAISE(ABORT, 'workout_sessions.workout_id must belong to program_id');
END;

CREATE TRIGGER validate_workout_sessions_workout_update
BEFORE UPDATE OF program_id, workout_id ON workout_sessions
FOR EACH ROW
WHEN NEW.workout_id IS NOT NULL
 AND NEW.program_id IS NOT NULL
 AND NOT EXISTS (
   SELECT 1
   FROM workouts
   WHERE workouts.id = NEW.workout_id
     AND workouts.program_id = NEW.program_id
 )
BEGIN
  SELECT RAISE(ABORT, 'workout_sessions.workout_id must belong to program_id');
END;

CREATE TRIGGER validate_session_exercises_program_exercise_insert
BEFORE INSERT ON workout_session_exercises
FOR EACH ROW
WHEN NEW.program_exercise_id IS NOT NULL
 AND NOT EXISTS (
   SELECT 1
   FROM workout_sessions
   INNER JOIN exercises
     ON exercises.id = NEW.program_exercise_id
   WHERE workout_sessions.id = NEW.session_id
     AND workout_sessions.program_id = exercises.program_id
 )
BEGIN
  SELECT RAISE(ABORT, 'workout_session_exercises.program_exercise_id must belong to session program');
END;

CREATE TRIGGER validate_session_exercises_program_exercise_update
BEFORE UPDATE OF session_id, program_exercise_id ON workout_session_exercises
FOR EACH ROW
WHEN NEW.program_exercise_id IS NOT NULL
 AND NOT EXISTS (
   SELECT 1
   FROM workout_sessions
   INNER JOIN exercises
     ON exercises.id = NEW.program_exercise_id
   WHERE workout_sessions.id = NEW.session_id
     AND workout_sessions.program_id = exercises.program_id
 )
BEGIN
  SELECT RAISE(ABORT, 'workout_session_exercises.program_exercise_id must belong to session program');
END;

-- Normalized tables for frequently-filtered catalog tags.
CREATE TABLE exercise_catalog_equipment (
  exercise_id TEXT NOT NULL,
  equipment_tag TEXT NOT NULL,
  PRIMARY KEY (exercise_id, equipment_tag),
  FOREIGN KEY (exercise_id) REFERENCES exercise_catalog(id) ON DELETE CASCADE
);

CREATE TABLE exercise_catalog_workout_tags (
  exercise_id TEXT NOT NULL,
  workout_tag TEXT NOT NULL,
  PRIMARY KEY (exercise_id, workout_tag),
  FOREIGN KEY (exercise_id) REFERENCES exercise_catalog(id) ON DELETE CASCADE
);

CREATE TABLE exercise_catalog_goal_tags (
  exercise_id TEXT NOT NULL,
  goal_tag TEXT NOT NULL,
  PRIMARY KEY (exercise_id, goal_tag),
  FOREIGN KEY (exercise_id) REFERENCES exercise_catalog(id) ON DELETE CASCADE
);

CREATE TABLE exercise_catalog_focus_areas (
  exercise_id TEXT NOT NULL,
  focus_area TEXT NOT NULL,
  PRIMARY KEY (exercise_id, focus_area),
  FOREIGN KEY (exercise_id) REFERENCES exercise_catalog(id) ON DELETE CASCADE
);

CREATE TABLE exercise_catalog_contraindication_tags (
  exercise_id TEXT NOT NULL,
  contraindication_tag TEXT NOT NULL,
  PRIMARY KEY (exercise_id, contraindication_tag),
  FOREIGN KEY (exercise_id) REFERENCES exercise_catalog(id) ON DELETE CASCADE
);

CREATE TABLE exercise_catalog_experience_levels (
  exercise_id TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  PRIMARY KEY (exercise_id, experience_level),
  FOREIGN KEY (exercise_id) REFERENCES exercise_catalog(id) ON DELETE CASCADE
);

CREATE INDEX idx_exercise_catalog_equipment_tag ON exercise_catalog_equipment(equipment_tag, exercise_id);
CREATE INDEX idx_exercise_catalog_workout_tag ON exercise_catalog_workout_tags(workout_tag, exercise_id);
CREATE INDEX idx_exercise_catalog_goal_tag ON exercise_catalog_goal_tags(goal_tag, exercise_id);
CREATE INDEX idx_exercise_catalog_focus_area ON exercise_catalog_focus_areas(focus_area, exercise_id);
CREATE INDEX idx_exercise_catalog_contraindication_tag ON exercise_catalog_contraindication_tags(contraindication_tag, exercise_id);
CREATE INDEX idx_exercise_catalog_experience_level ON exercise_catalog_experience_levels(experience_level, exercise_id);

INSERT INTO exercise_catalog_equipment (exercise_id, equipment_tag)
SELECT exercise_catalog.id, json_each.value
FROM exercise_catalog, json_each(exercise_catalog.equipment_json);

INSERT INTO exercise_catalog_workout_tags (exercise_id, workout_tag)
SELECT exercise_catalog.id, json_each.value
FROM exercise_catalog, json_each(exercise_catalog.workout_tags_json);

INSERT INTO exercise_catalog_goal_tags (exercise_id, goal_tag)
SELECT exercise_catalog.id, json_each.value
FROM exercise_catalog, json_each(exercise_catalog.goal_tags_json);

INSERT INTO exercise_catalog_focus_areas (exercise_id, focus_area)
SELECT exercise_catalog.id, json_each.value
FROM exercise_catalog, json_each(exercise_catalog.focus_areas_json);

INSERT INTO exercise_catalog_contraindication_tags (exercise_id, contraindication_tag)
SELECT exercise_catalog.id, json_each.value
FROM exercise_catalog, json_each(exercise_catalog.contraindication_tags_json);

INSERT INTO exercise_catalog_experience_levels (exercise_id, experience_level)
SELECT exercise_catalog.id, json_each.value
FROM exercise_catalog, json_each(exercise_catalog.experience_levels_json);

CREATE TRIGGER sync_exercise_catalog_tags_after_insert
AFTER INSERT ON exercise_catalog
FOR EACH ROW
BEGIN
  INSERT INTO exercise_catalog_equipment (exercise_id, equipment_tag)
  SELECT NEW.id, value FROM json_each(NEW.equipment_json);

  INSERT INTO exercise_catalog_workout_tags (exercise_id, workout_tag)
  SELECT NEW.id, value FROM json_each(NEW.workout_tags_json);

  INSERT INTO exercise_catalog_goal_tags (exercise_id, goal_tag)
  SELECT NEW.id, value FROM json_each(NEW.goal_tags_json);

  INSERT INTO exercise_catalog_focus_areas (exercise_id, focus_area)
  SELECT NEW.id, value FROM json_each(NEW.focus_areas_json);

  INSERT INTO exercise_catalog_contraindication_tags (exercise_id, contraindication_tag)
  SELECT NEW.id, value FROM json_each(NEW.contraindication_tags_json);

  INSERT INTO exercise_catalog_experience_levels (exercise_id, experience_level)
  SELECT NEW.id, value FROM json_each(NEW.experience_levels_json);
END;

CREATE TRIGGER sync_exercise_catalog_tags_after_update
AFTER UPDATE OF equipment_json, workout_tags_json, goal_tags_json, focus_areas_json, contraindication_tags_json, experience_levels_json
ON exercise_catalog
FOR EACH ROW
BEGIN
  DELETE FROM exercise_catalog_equipment WHERE exercise_id = NEW.id;
  DELETE FROM exercise_catalog_workout_tags WHERE exercise_id = NEW.id;
  DELETE FROM exercise_catalog_goal_tags WHERE exercise_id = NEW.id;
  DELETE FROM exercise_catalog_focus_areas WHERE exercise_id = NEW.id;
  DELETE FROM exercise_catalog_contraindication_tags WHERE exercise_id = NEW.id;
  DELETE FROM exercise_catalog_experience_levels WHERE exercise_id = NEW.id;

  INSERT INTO exercise_catalog_equipment (exercise_id, equipment_tag)
  SELECT NEW.id, value FROM json_each(NEW.equipment_json);

  INSERT INTO exercise_catalog_workout_tags (exercise_id, workout_tag)
  SELECT NEW.id, value FROM json_each(NEW.workout_tags_json);

  INSERT INTO exercise_catalog_goal_tags (exercise_id, goal_tag)
  SELECT NEW.id, value FROM json_each(NEW.goal_tags_json);

  INSERT INTO exercise_catalog_focus_areas (exercise_id, focus_area)
  SELECT NEW.id, value FROM json_each(NEW.focus_areas_json);

  INSERT INTO exercise_catalog_contraindication_tags (exercise_id, contraindication_tag)
  SELECT NEW.id, value FROM json_each(NEW.contraindication_tags_json);

  INSERT INTO exercise_catalog_experience_levels (exercise_id, experience_level)
  SELECT NEW.id, value FROM json_each(NEW.experience_levels_json);
END;

-- Normalized tables for frequently-filtered profile traits.
CREATE TABLE user_profile_goal_tags (
  profile_id TEXT NOT NULL,
  goal_tag TEXT NOT NULL,
  is_primary INTEGER NOT NULL CHECK (is_primary IN (0, 1)),
  PRIMARY KEY (profile_id, goal_tag),
  FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE TABLE user_profile_equipment (
  profile_id TEXT NOT NULL,
  equipment_tag TEXT NOT NULL,
  PRIMARY KEY (profile_id, equipment_tag),
  FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE TABLE user_profile_focus_areas (
  profile_id TEXT NOT NULL,
  focus_area TEXT NOT NULL,
  PRIMARY KEY (profile_id, focus_area),
  FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE TABLE user_profile_limitation_tags (
  profile_id TEXT NOT NULL,
  limitation_tag TEXT NOT NULL,
  PRIMARY KEY (profile_id, limitation_tag),
  FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE TABLE user_profile_preferred_styles (
  profile_id TEXT NOT NULL,
  preferred_style TEXT NOT NULL,
  PRIMARY KEY (profile_id, preferred_style),
  FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_profile_goal_tag ON user_profile_goal_tags(goal_tag, is_primary, profile_id);
CREATE INDEX idx_user_profile_equipment_tag ON user_profile_equipment(equipment_tag, profile_id);
CREATE INDEX idx_user_profile_focus_area ON user_profile_focus_areas(focus_area, profile_id);
CREATE INDEX idx_user_profile_limitation_tag ON user_profile_limitation_tags(limitation_tag, profile_id);
CREATE INDEX idx_user_profile_preferred_style ON user_profile_preferred_styles(preferred_style, profile_id);

INSERT INTO user_profile_goal_tags (profile_id, goal_tag, is_primary)
SELECT id, primary_goal, 1
FROM user_profiles;

INSERT INTO user_profile_goal_tags (profile_id, goal_tag, is_primary)
SELECT user_profiles.id, json_each.value, 0
FROM user_profiles, json_each(json_extract(user_profiles.profile_json, '$.secondaryGoals'));

INSERT INTO user_profile_equipment (profile_id, equipment_tag)
SELECT user_profiles.id, json_each.value
FROM user_profiles, json_each(user_profiles.equipment_json);

INSERT INTO user_profile_focus_areas (profile_id, focus_area)
SELECT user_profiles.id, json_each.value
FROM user_profiles, json_each(user_profiles.focus_areas_json);

INSERT INTO user_profile_limitation_tags (profile_id, limitation_tag)
SELECT user_profiles.id, json_each.value
FROM user_profiles, json_each(user_profiles.limitation_tags_json);

INSERT INTO user_profile_preferred_styles (profile_id, preferred_style)
SELECT user_profiles.id, json_each.value
FROM user_profiles, json_each(user_profiles.preferred_styles_json);

CREATE TRIGGER sync_user_profile_tags_after_insert
AFTER INSERT ON user_profiles
FOR EACH ROW
BEGIN
  INSERT INTO user_profile_goal_tags (profile_id, goal_tag, is_primary)
  VALUES (NEW.id, NEW.primary_goal, 1);

  INSERT INTO user_profile_goal_tags (profile_id, goal_tag, is_primary)
  SELECT NEW.id, value, 0 FROM json_each(json_extract(NEW.profile_json, '$.secondaryGoals'));

  INSERT INTO user_profile_equipment (profile_id, equipment_tag)
  SELECT NEW.id, value FROM json_each(NEW.equipment_json);

  INSERT INTO user_profile_focus_areas (profile_id, focus_area)
  SELECT NEW.id, value FROM json_each(NEW.focus_areas_json);

  INSERT INTO user_profile_limitation_tags (profile_id, limitation_tag)
  SELECT NEW.id, value FROM json_each(NEW.limitation_tags_json);

  INSERT INTO user_profile_preferred_styles (profile_id, preferred_style)
  SELECT NEW.id, value FROM json_each(NEW.preferred_styles_json);
END;

CREATE TRIGGER sync_user_profile_tags_after_update
AFTER UPDATE OF primary_goal, equipment_json, focus_areas_json, limitation_tags_json, preferred_styles_json, profile_json
ON user_profiles
FOR EACH ROW
BEGIN
  DELETE FROM user_profile_goal_tags WHERE profile_id = NEW.id;
  DELETE FROM user_profile_equipment WHERE profile_id = NEW.id;
  DELETE FROM user_profile_focus_areas WHERE profile_id = NEW.id;
  DELETE FROM user_profile_limitation_tags WHERE profile_id = NEW.id;
  DELETE FROM user_profile_preferred_styles WHERE profile_id = NEW.id;

  INSERT INTO user_profile_goal_tags (profile_id, goal_tag, is_primary)
  VALUES (NEW.id, NEW.primary_goal, 1);

  INSERT INTO user_profile_goal_tags (profile_id, goal_tag, is_primary)
  SELECT NEW.id, value, 0 FROM json_each(json_extract(NEW.profile_json, '$.secondaryGoals'));

  INSERT INTO user_profile_equipment (profile_id, equipment_tag)
  SELECT NEW.id, value FROM json_each(NEW.equipment_json);

  INSERT INTO user_profile_focus_areas (profile_id, focus_area)
  SELECT NEW.id, value FROM json_each(NEW.focus_areas_json);

  INSERT INTO user_profile_limitation_tags (profile_id, limitation_tag)
  SELECT NEW.id, value FROM json_each(NEW.limitation_tags_json);

  INSERT INTO user_profile_preferred_styles (profile_id, preferred_style)
  SELECT NEW.id, value FROM json_each(NEW.preferred_styles_json);
END;

DROP TABLE workout_session_sets_old;
DROP TABLE workout_session_exercises_old;
DROP TABLE workout_sessions_old;
DROP TABLE progression_events_old;
DROP TABLE exercise_progression_state_old;
DROP TABLE workout_exercises_old;
DROP TABLE program_schedule_old;
DROP TABLE exercises_old;
DROP TABLE workouts_old;
DROP TABLE programs_old;
DROP TABLE user_profiles_old;
DROP TABLE exercise_catalog_old;

-- Indexes for generation analytics without relying on JSON extraction.
CREATE INDEX idx_generated_program_metadata_profile_created ON generated_program_metadata(profile_id, created_at DESC);
CREATE INDEX idx_generated_program_metadata_generator_created ON generated_program_metadata(generator_version, created_at DESC);
CREATE INDEX idx_generated_program_metadata_reason_created ON generated_program_metadata(generation_reason, created_at DESC);

PRAGMA foreign_keys = ON;
PRAGMA legacy_alter_table = OFF;
