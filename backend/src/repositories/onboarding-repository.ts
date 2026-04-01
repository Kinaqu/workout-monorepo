import { fetchFirst } from "../db/d1";
import { OnboardingDraft, OnboardingState } from "../domain/onboarding";
import { Env } from "../env";
import { createId } from "../lib/id";
import { nowIso } from "../lib/time";

interface OnboardingRow {
  id: string;
  questionnaire_version: string;
  answers_json: string;
  completed_at: string | null;
  updated_at: string;
}

export class OnboardingRepository {
  constructor(private readonly env: Env) {}

  async getByUserId(userId: string): Promise<{
    id: string;
    questionnaireVersion: string;
    answers: OnboardingDraft;
    completedAt: string | null;
    updatedAt: string;
  } | null> {
    const row = await fetchFirst<OnboardingRow>(
      this.env.DB.prepare(
        `SELECT id, questionnaire_version, answers_json, completed_at, updated_at
         FROM onboarding_answers
         WHERE user_id = ?`
      ).bind(userId)
    );

    if (!row) return null;

    return {
      id: row.id,
      questionnaireVersion: row.questionnaire_version,
      answers: JSON.parse(row.answers_json) as OnboardingDraft,
      completedAt: row.completed_at,
      updatedAt: row.updated_at,
    };
  }

  async upsertDraft(
    userId: string,
    draft: OnboardingDraft,
    options: {
      completedAt?: string | null;
    } = {}
  ): Promise<{ id: string; updatedAt: string; completedAt: string | null }> {
    const existing = await this.getByUserId(userId);
    const now = nowIso();
    const id = existing?.id ?? createId("onboarding");
    const completedAt = typeof options.completedAt === "undefined" ? existing?.completedAt ?? null : options.completedAt;

    if (existing) {
      await this.env.DB.prepare(
        `UPDATE onboarding_answers
         SET questionnaire_version = ?, answers_json = ?, completed_at = ?, updated_at = ?
         WHERE id = ?`
      )
        .bind(draft.questionnaireVersion, JSON.stringify(draft), completedAt, now, id)
        .run();
    } else {
      await this.env.DB.prepare(
        `INSERT INTO onboarding_answers (
          id, user_id, questionnaire_version, answers_json, source, completed_at, created_at, updated_at
         ) VALUES (?, ?, ?, ?, 'api', ?, ?, ?)`
      )
        .bind(id, userId, draft.questionnaireVersion, JSON.stringify(draft), completedAt, now, now)
        .run();
    }

    return {
      id,
      updatedAt: now,
      completedAt,
    };
  }

  async getState(userId: string): Promise<OnboardingState> {
    const row = await this.getByUserId(userId);
    if (!row) {
      return {
        status: "not_started",
        completed: false,
        questionnaireVersion: null,
        answersUpdatedAt: null,
        completedAt: null,
        answers: null,
      };
    }

    return {
      status: row.completedAt ? "completed" : "draft",
      completed: Boolean(row.completedAt),
      questionnaireVersion: row.questionnaireVersion,
      answersUpdatedAt: row.updatedAt,
      completedAt: row.completedAt,
      answers: row.answers,
    };
  }
}

