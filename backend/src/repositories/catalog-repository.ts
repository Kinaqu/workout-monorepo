import { fetchAll } from "../db/d1";
import { ExerciseCatalogEntry } from "../domain/catalog";
import { Env } from "../env";

interface CatalogRow {
  id: string;
  exercise_key: string;
  name: string;
  type: ExerciseCatalogEntry["type"];
  category: string;
  difficulty: ExerciseCatalogEntry["difficulty"];
  equipment_json: string;
  workout_tags_json: string;
  goal_tags_json: string;
  focus_areas_json: string;
  contraindication_tags_json: string;
  experience_levels_json: string;
  max_sets: number;
  default_target_min: number;
  default_target_max: number;
  progression_enabled: number;
  progression_step: number;
  deload_step: number;
  seed_version: string;
}

export class CatalogRepository {
  constructor(private readonly env: Env) {}

  async listActiveEntries(): Promise<ExerciseCatalogEntry[]> {
    const rows = await fetchAll<CatalogRow>(
      this.env.DB.prepare(
        `SELECT id, exercise_key, name, type, category, difficulty, equipment_json, workout_tags_json, goal_tags_json,
                focus_areas_json, contraindication_tags_json, experience_levels_json, max_sets, default_target_min,
                default_target_max, progression_enabled, progression_step, deload_step, seed_version
         FROM exercise_catalog
         WHERE is_active = 1
         ORDER BY exercise_key ASC`
      )
    );

    return rows.map(row => ({
      id: row.id,
      exerciseKey: row.exercise_key,
      name: row.name,
      type: row.type,
      category: row.category,
      difficulty: row.difficulty,
      equipment: JSON.parse(row.equipment_json) as string[],
      workoutTags: JSON.parse(row.workout_tags_json) as string[],
      goalTags: JSON.parse(row.goal_tags_json) as string[],
      focusAreas: JSON.parse(row.focus_areas_json) as string[],
      contraindicationTags: JSON.parse(row.contraindication_tags_json) as string[],
      experienceLevels: JSON.parse(row.experience_levels_json) as string[],
      maxSets: row.max_sets,
      defaultTargetMin: row.default_target_min,
      defaultTargetMax: row.default_target_max,
      progressionEnabled: Boolean(row.progression_enabled),
      progressionStep: row.progression_step,
      deloadStep: row.deload_step,
      seedVersion: row.seed_version,
    }));
  }
}

