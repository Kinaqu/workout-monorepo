import { fetchFirst } from "../db/d1";
import { NormalizedUserProfile } from "../domain/profile";
import { Env } from "../env";
import { createId } from "../lib/id";
import { nowIso } from "../lib/time";

interface ProfileRow {
  id: string;
  profile_version: string;
  primary_goal: string;
  experience_level: string;
  training_days_per_week: number;
  session_duration_minutes: number;
  equipment_json: string;
  focus_areas_json: string;
  limitation_tags_json: string;
  preferred_styles_json: string;
  profile_json: string;
  updated_at: string;
}

export class ProfileRepository {
  constructor(private readonly env: Env) {}

  async getByUserId(userId: string): Promise<{
    id: string;
    profile: NormalizedUserProfile;
    updatedAt: string;
  } | null> {
    const row = await fetchFirst<ProfileRow>(
      this.env.DB.prepare(
        `SELECT id, profile_version, primary_goal, experience_level, training_days_per_week, session_duration_minutes,
                equipment_json, focus_areas_json, limitation_tags_json, preferred_styles_json, profile_json, updated_at
         FROM user_profiles
         WHERE user_id = ?`
      ).bind(userId)
    );

    if (!row) return null;

    return {
      id: row.id,
      profile: JSON.parse(row.profile_json) as NormalizedUserProfile,
      updatedAt: row.updated_at,
    };
  }

  async upsert(
    userId: string,
    profile: NormalizedUserProfile,
    sourceAnswerId: string | null
  ): Promise<{ id: string; updatedAt: string }> {
    const existing = await this.getByUserId(userId);
    const now = nowIso();
    const id = existing?.id ?? createId("profile");

    if (existing) {
      await this.env.DB.prepare(
        `UPDATE user_profiles
         SET profile_version = ?, source_answer_id = ?, primary_goal = ?, experience_level = ?,
             training_days_per_week = ?, session_duration_minutes = ?, equipment_json = ?, focus_areas_json = ?,
             limitation_tags_json = ?, preferred_styles_json = ?, profile_json = ?, updated_at = ?
         WHERE id = ?`
      )
        .bind(
          profile.version,
          sourceAnswerId,
          profile.primaryGoal,
          profile.experienceLevel,
          profile.trainingDaysPerWeek,
          profile.sessionDurationMinutes,
          JSON.stringify(profile.equipmentAccess),
          JSON.stringify(profile.focusAreas),
          JSON.stringify(profile.limitationTags),
          JSON.stringify(profile.preferredStyles),
          JSON.stringify(profile),
          now,
          id
        )
        .run();
    } else {
      await this.env.DB.prepare(
        `INSERT INTO user_profiles (
          id, user_id, profile_version, source_answer_id, primary_goal, experience_level, training_days_per_week,
          session_duration_minutes, equipment_json, focus_areas_json, limitation_tags_json, preferred_styles_json,
          profile_json, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          id,
          userId,
          profile.version,
          sourceAnswerId,
          profile.primaryGoal,
          profile.experienceLevel,
          profile.trainingDaysPerWeek,
          profile.sessionDurationMinutes,
          JSON.stringify(profile.equipmentAccess),
          JSON.stringify(profile.focusAreas),
          JSON.stringify(profile.limitationTags),
          JSON.stringify(profile.preferredStyles),
          JSON.stringify(profile),
          now,
          now
        )
        .run();
    }

    return {
      id,
      updatedAt: now,
    };
  }
}

