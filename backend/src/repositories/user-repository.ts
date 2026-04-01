import { fetchFirst } from "../db/d1";
import { Env } from "../env";
import { nowIso } from "../lib/time";

export interface UserRecord {
  user_id: string;
  username: string | null;
  legacy_kv_migrated_at: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export class UserRepository {
  constructor(private readonly env: Env) {}

  async upsert(userId: string, username: string): Promise<void> {
    const now = nowIso();
    await this.env.DB.prepare(
      `INSERT INTO users (user_id, username, created_at, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         username = excluded.username,
         updated_at = excluded.updated_at`
    )
      .bind(userId, username, now, now)
      .run();
  }

  async get(userId: string): Promise<UserRecord | null> {
    return fetchFirst<UserRecord>(
      this.env.DB.prepare(
        `SELECT user_id, username, legacy_kv_migrated_at, onboarding_completed_at, created_at, updated_at
         FROM users
         WHERE user_id = ?`
      ).bind(userId)
    );
  }

  async markLegacyMigrated(userId: string, migratedAt = nowIso()): Promise<void> {
    await this.env.DB.prepare(
      "UPDATE users SET legacy_kv_migrated_at = ?, updated_at = ? WHERE user_id = ?"
    ).bind(migratedAt, migratedAt, userId).run();
  }

  async markOnboardingCompleted(userId: string, completedAt = nowIso()): Promise<void> {
    await this.env.DB.prepare(
      "UPDATE users SET onboarding_completed_at = ?, updated_at = ? WHERE user_id = ?"
    ).bind(completedAt, completedAt, userId).run();
  }
}
