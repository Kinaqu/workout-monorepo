ALTER TABLE workout_sessions ADD COLUMN raw_text TEXT;
ALTER TABLE workout_sessions ADD COLUMN unmatched_text TEXT;

UPDATE workout_sessions
SET
  raw_text = (
    SELECT workout_session_imports.raw_text
    FROM workout_session_imports
    WHERE workout_session_imports.session_id = workout_sessions.id
  ),
  unmatched_text = (
    SELECT workout_session_imports.unmatched_text
    FROM workout_session_imports
    WHERE workout_session_imports.session_id = workout_sessions.id
  )
WHERE EXISTS (
  SELECT 1
  FROM workout_session_imports
  WHERE workout_session_imports.session_id = workout_sessions.id
);

CREATE TRIGGER sync_workout_sessions_import_columns_after_insert
AFTER INSERT ON workout_sessions
WHEN NEW.raw_text IS NOT NULL OR NEW.unmatched_text IS NOT NULL
BEGIN
  INSERT INTO workout_session_imports (session_id, raw_text, unmatched_text, created_at, updated_at)
  VALUES (NEW.id, NEW.raw_text, NEW.unmatched_text, NEW.created_at, NEW.updated_at)
  ON CONFLICT(session_id) DO UPDATE SET
    raw_text = excluded.raw_text,
    unmatched_text = excluded.unmatched_text,
    updated_at = excluded.updated_at;
END;

CREATE TRIGGER sync_workout_sessions_import_columns_after_update
AFTER UPDATE OF raw_text, unmatched_text, updated_at ON workout_sessions
WHEN NEW.raw_text IS NOT OLD.raw_text OR NEW.unmatched_text IS NOT OLD.unmatched_text
BEGIN
  INSERT INTO workout_session_imports (session_id, raw_text, unmatched_text, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.raw_text,
    NEW.unmatched_text,
    COALESCE(
      (SELECT workout_session_imports.created_at FROM workout_session_imports WHERE workout_session_imports.session_id = NEW.id),
      NEW.created_at
    ),
    NEW.updated_at
  )
  ON CONFLICT(session_id) DO UPDATE SET
    raw_text = excluded.raw_text,
    unmatched_text = excluded.unmatched_text,
    updated_at = excluded.updated_at;
END;

CREATE TRIGGER sync_workout_session_imports_inline_columns_after_insert
AFTER INSERT ON workout_session_imports
BEGIN
  UPDATE workout_sessions
  SET
    raw_text = NEW.raw_text,
    unmatched_text = NEW.unmatched_text
  WHERE id = NEW.session_id;
END;

CREATE TRIGGER sync_workout_session_imports_inline_columns_after_update
AFTER UPDATE OF raw_text, unmatched_text ON workout_session_imports
BEGIN
  UPDATE workout_sessions
  SET
    raw_text = NEW.raw_text,
    unmatched_text = NEW.unmatched_text
  WHERE id = NEW.session_id;
END;
