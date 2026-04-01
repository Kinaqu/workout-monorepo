DROP TABLE IF EXISTS __postflight_0004_assertions;

CREATE TABLE __postflight_0004_assertions (
  ok INTEGER NOT NULL CHECK (ok = 1)
);

INSERT INTO __postflight_0004_assertions
SELECT CASE WHEN (SELECT COUNT(*) FROM pragma_foreign_key_check) = 0 THEN 1 ELSE 0 END;

INSERT INTO __postflight_0004_assertions
SELECT CASE WHEN (SELECT COUNT(*) FROM exercise_catalog_equipment)
  = (SELECT COUNT(*) FROM exercise_catalog, json_each(exercise_catalog.equipment_json))
THEN 1 ELSE 0 END;

INSERT INTO __postflight_0004_assertions
SELECT CASE WHEN (SELECT COUNT(*) FROM exercise_catalog_workout_tags)
  = (SELECT COUNT(*) FROM exercise_catalog, json_each(exercise_catalog.workout_tags_json))
THEN 1 ELSE 0 END;

INSERT INTO __postflight_0004_assertions
SELECT CASE WHEN (SELECT COUNT(*) FROM exercise_catalog_goal_tags)
  = (SELECT COUNT(*) FROM exercise_catalog, json_each(exercise_catalog.goal_tags_json))
THEN 1 ELSE 0 END;

INSERT INTO __postflight_0004_assertions
SELECT CASE WHEN (SELECT COUNT(*) FROM exercise_catalog_focus_areas)
  = (SELECT COUNT(*) FROM exercise_catalog, json_each(exercise_catalog.focus_areas_json))
THEN 1 ELSE 0 END;

INSERT INTO __postflight_0004_assertions
SELECT CASE WHEN (SELECT COUNT(*) FROM exercise_catalog_contraindication_tags)
  = (SELECT COUNT(*) FROM exercise_catalog, json_each(exercise_catalog.contraindication_tags_json))
THEN 1 ELSE 0 END;

INSERT INTO __postflight_0004_assertions
SELECT CASE WHEN (SELECT COUNT(*) FROM exercise_catalog_experience_levels)
  = (SELECT COUNT(*) FROM exercise_catalog, json_each(exercise_catalog.experience_levels_json))
THEN 1 ELSE 0 END;

INSERT INTO __postflight_0004_assertions
SELECT CASE WHEN (SELECT COUNT(*) FROM user_profile_equipment)
  = (SELECT COUNT(*) FROM user_profiles, json_each(user_profiles.equipment_json))
THEN 1 ELSE 0 END;

INSERT INTO __postflight_0004_assertions
SELECT CASE WHEN (SELECT COUNT(*) FROM user_profile_focus_areas)
  = (SELECT COUNT(*) FROM user_profiles, json_each(user_profiles.focus_areas_json))
THEN 1 ELSE 0 END;

INSERT INTO __postflight_0004_assertions
SELECT CASE WHEN (SELECT COUNT(*) FROM user_profile_limitation_tags)
  = (SELECT COUNT(*) FROM user_profiles, json_each(user_profiles.limitation_tags_json))
THEN 1 ELSE 0 END;

INSERT INTO __postflight_0004_assertions
SELECT CASE WHEN (SELECT COUNT(*) FROM user_profile_preferred_styles)
  = (SELECT COUNT(*) FROM user_profiles, json_each(user_profiles.preferred_styles_json))
THEN 1 ELSE 0 END;

SELECT '0004 postflight passed' AS status;

DROP TABLE __postflight_0004_assertions;
