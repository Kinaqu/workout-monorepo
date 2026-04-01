CREATE TRIGGER validate_users_dates_insert
BEFORE INSERT ON users
FOR EACH ROW
WHEN NEW.created_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'
  OR NEW.updated_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'
  OR (NEW.legacy_kv_migrated_at IS NOT NULL AND NEW.legacy_kv_migrated_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z')
  OR (NEW.onboarding_completed_at IS NOT NULL AND NEW.onboarding_completed_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z')
BEGIN
  SELECT RAISE(ABORT, 'users date fields must use UTC ISO-8601 text');
END;

CREATE TRIGGER validate_users_dates_update
BEFORE UPDATE OF created_at, updated_at, legacy_kv_migrated_at, onboarding_completed_at ON users
FOR EACH ROW
WHEN NEW.created_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'
  OR NEW.updated_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'
  OR (NEW.legacy_kv_migrated_at IS NOT NULL AND NEW.legacy_kv_migrated_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z')
  OR (NEW.onboarding_completed_at IS NOT NULL AND NEW.onboarding_completed_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z')
BEGIN
  SELECT RAISE(ABORT, 'users date fields must use UTC ISO-8601 text');
END;

CREATE TRIGGER validate_onboarding_answers_dates_insert
BEFORE INSERT ON onboarding_answers
FOR EACH ROW
WHEN NEW.created_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'
  OR NEW.updated_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'
  OR (NEW.completed_at IS NOT NULL AND NEW.completed_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z')
BEGIN
  SELECT RAISE(ABORT, 'onboarding_answers date fields must use UTC ISO-8601 text');
END;

CREATE TRIGGER validate_onboarding_answers_dates_update
BEFORE UPDATE OF created_at, updated_at, completed_at ON onboarding_answers
FOR EACH ROW
WHEN NEW.created_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'
  OR NEW.updated_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'
  OR (NEW.completed_at IS NOT NULL AND NEW.completed_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z')
BEGIN
  SELECT RAISE(ABORT, 'onboarding_answers date fields must use UTC ISO-8601 text');
END;

CREATE TRIGGER validate_generated_program_metadata_dates_insert
BEFORE INSERT ON generated_program_metadata
FOR EACH ROW
WHEN NEW.created_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'
BEGIN
  SELECT RAISE(ABORT, 'generated_program_metadata.created_at must use UTC ISO-8601 text');
END;

CREATE TRIGGER validate_generated_program_metadata_dates_update
BEFORE UPDATE OF created_at ON generated_program_metadata
FOR EACH ROW
WHEN NEW.created_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'
BEGIN
  SELECT RAISE(ABORT, 'generated_program_metadata.created_at must use UTC ISO-8601 text');
END;
