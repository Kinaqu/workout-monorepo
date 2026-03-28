import { fetchFirst } from "../db/d1";
import { Env } from "../env";
import { nowIso } from "../lib/time";

interface UserRow {
  user_id: string;
  username: string | null;
  legacy_kv_migrated_at: string | null;
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

  async get(userId: string): Promise<UserRow | null> {
    return fetchFirst<UserRow>(
      this.env.DB.prepare(
        "SELECT user_id, username, legacy_kv_migrated_at FROM users WHERE user_id = ?"
      ).bind(userId)
    );
  }

  async markLegacyMigrated(userId: string, migratedAt = nowIso()): Promise<void> {
    await this.env.DB.prepare(
      "UPDATE users SET legacy_kv_migrated_at = ?, updated_at = ? WHERE user_id = ?"
    ).bind(migratedAt, migratedAt, userId).run();
  }
}
