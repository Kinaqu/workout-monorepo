DROP TABLE IF EXISTS __preflight_0004_assertions;

CREATE TABLE __preflight_0004_assertions (
  ok INTEGER NOT NULL CHECK (ok = 1)
);

INSERT INTO __preflight_0004_assertions
SELECT CASE WHEN NOT EXISTS (
  SELECT 1
  FROM (
    SELECT program_id, sort_order
    FROM workouts
    GROUP BY program_id, sort_order
    HAVING COUNT(*) > 1
  )
) THEN 1 ELSE 0 END;

INSERT INTO __preflight_0004_assertions
SELECT CASE WHEN NOT EXISTS (
  SELECT 1
  FROM (
    SELECT workout_id, sort_order
    FROM workout_exercises
    GROUP BY workout_id, sort_order
    HAVING COUNT(*) > 1
  )
) THEN 1 ELSE 0 END;

INSERT INTO __preflight_0004_assertions
SELECT CASE WHEN NOT EXISTS (
  SELECT 1
  FROM (
    SELECT workout_id, exercise_id
    FROM workout_exercises
    GROUP BY workout_id, exercise_id
    HAVING COUNT(*) > 1
  )
) THEN 1 ELSE 0 END;

INSERT INTO __preflight_0004_assertions
SELECT CASE WHEN NOT EXISTS (
  SELECT 1
  FROM (
    SELECT session_id, sort_order
    FROM workout_session_exercises
    GROUP BY session_id, sort_order
    HAVING COUNT(*) > 1
  )
) THEN 1 ELSE 0 END;

INSERT INTO __preflight_0004_assertions
SELECT CASE WHEN NOT EXISTS (
  SELECT 1
  FROM (
    SELECT session_exercise_id, set_order
    FROM workout_session_sets
    GROUP BY session_exercise_id, set_order
    HAVING COUNT(*) > 1
  )
) THEN 1 ELSE 0 END;

INSERT INTO __preflight_0004_assertions
SELECT CASE WHEN NOT EXISTS (
  SELECT 1
  FROM exercise_progression_state
  LEFT JOIN exercises
    ON exercises.program_id = exercise_progression_state.program_id
   AND exercises.exercise_key = exercise_progression_state.exercise_key
  WHERE exercises.id IS NULL
) THEN 1 ELSE 0 END;

INSERT INTO __preflight_0004_assertions
SELECT CASE WHEN NOT EXISTS (
  SELECT 1
  FROM progression_events
  LEFT JOIN exercises
    ON exercises.program_id = progression_events.program_id
   AND exercises.exercise_key = progression_events.exercise_key
  WHERE exercises.id IS NULL
) THEN 1 ELSE 0 END;

INSERT INTO __preflight_0004_assertions
SELECT CASE WHEN NOT EXISTS (
  SELECT 1
  FROM program_schedule
  LEFT JOIN workouts ON workouts.id = program_schedule.workout_id
  WHERE program_schedule.workout_id IS NOT NULL
    AND (workouts.id IS NULL OR workouts.program_id <> program_schedule.program_id)
) THEN 1 ELSE 0 END;

INSERT INTO __preflight_0004_assertions
SELECT CASE WHEN NOT EXISTS (
  SELECT 1
  FROM workout_sessions
  LEFT JOIN workouts ON workouts.id = workout_sessions.workout_id
  WHERE workout_sessions.workout_id IS NOT NULL
    AND workout_sessions.program_id IS NOT NULL
    AND (workouts.id IS NULL OR workouts.program_id <> workout_sessions.program_id)
) THEN 1 ELSE 0 END;

SELECT '0004 preflight passed' AS status;

DROP TABLE __preflight_0004_assertions;
