PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  username TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  program_key TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  source TEXT NOT NULL DEFAULT 'api',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_programs_user_active ON programs(user_id, is_active, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_programs_user_key ON programs(user_id, program_key);

CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL,
  workout_key TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workouts_program_key ON workouts(program_id, workout_key);

CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL,
  exercise_key TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reps', 'time', 'cycles')),
  progression_enabled INTEGER NOT NULL DEFAULT 1 CHECK (progression_enabled IN (0, 1)),
  progression_step INTEGER NOT NULL DEFAULT 1,
  deload_step INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_program_key ON exercises(program_id, exercise_key);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  max_sets INTEGER NOT NULL,
  target_min INTEGER NOT NULL,
  target_max INTEGER NOT NULL,
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_order ON workout_exercises(workout_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_exercise ON workout_exercises(workout_id, exercise_id);

CREATE TABLE IF NOT EXISTS program_schedule (
  program_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  workout_id TEXT,
  PRIMARY KEY (program_id, day_of_week),
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS exercise_progression_state (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  exercise_key TEXT NOT NULL,
  current_sets INTEGER NOT NULL,
  current_target_min INTEGER NOT NULL,
  current_target_max INTEGER NOT NULL,
  last_progression_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  UNIQUE (user_id, program_id, exercise_key)
);

CREATE INDEX IF NOT EXISTS idx_progression_user_program ON exercise_progression_state(user_id, program_id);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  program_id TEXT,
  workout_id TEXT,
  session_date TEXT NOT NULL,
  workout_key TEXT,
  workout_name TEXT,
  note TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL CHECK (source IN ('json', 'text', 'legacy-kv')),
  raw_text TEXT,
  unmatched_text TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL,
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON workout_sessions(user_id, session_date, created_at DESC);

CREATE TABLE IF NOT EXISTS workout_session_exercises (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  exercise_key TEXT,
  exercise_name TEXT NOT NULL,
  exercise_type TEXT CHECK (exercise_type IN ('reps', 'time', 'cycles')),
  matched INTEGER NOT NULL DEFAULT 1 CHECK (matched IN (0, 1)),
  sort_order INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_exercises_session_order ON workout_session_exercises(session_id, sort_order);

CREATE TABLE IF NOT EXISTS workout_session_sets (
  id TEXT PRIMARY KEY,
  session_exercise_id TEXT NOT NULL,
  set_order INTEGER NOT NULL,
  value INTEGER NOT NULL,
  FOREIGN KEY (session_exercise_id) REFERENCES workout_session_exercises(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_sets_exercise_order ON workout_session_sets(session_exercise_id, set_order);

CREATE TABLE IF NOT EXISTS progression_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  exercise_key TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down')),
  reason TEXT NOT NULL,
  before_sets INTEGER NOT NULL,
  before_target_min INTEGER NOT NULL,
  before_target_max INTEGER NOT NULL,
  after_sets INTEGER NOT NULL,
  after_target_min INTEGER NOT NULL,
  after_target_max INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_progression_events_user_program ON progression_events(user_id, program_id, created_at DESC);
