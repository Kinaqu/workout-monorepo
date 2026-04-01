import { normalizeOnboardingAnswers } from "../domain/profile";
import { validateOnboardingAnswers, validateOnboardingDraft } from "../domain/onboarding";
import { OnboardingRepository } from "../repositories/onboarding-repository";
import { ProfileRepository } from "../repositories/profile-repository";
import { UserLifecycleService } from "./user-lifecycle-service";
import { ProgramGeneratorService } from "./program-generator-service";
import { nowIso } from "../lib/time";

export class OnboardingService {
  constructor(
    private readonly lifecycle: UserLifecycleService,
    private readonly onboarding: OnboardingRepository,
    private readonly profiles: ProfileRepository,
    private readonly programGenerator: ProgramGeneratorService
  ) {}

  async getState(userId: string, username: string) {
    await this.lifecycle.ensureUserExists(userId, username);
    const [onboardingState, profile] = await Promise.all([
      this.onboarding.getState(userId),
      this.profiles.getByUserId(userId),
    ]);

    return {
      ...onboardingState,
      profile: profile
        ? {
            version: profile.profile.version,
            primary_goal: profile.profile.primaryGoal,
            training_days_per_week: profile.profile.trainingDaysPerWeek,
            session_duration_minutes: profile.profile.sessionDurationMinutes,
            updated_at: profile.updatedAt,
          }
        : null,
    };
  }

  async saveDraft(userId: string, username: string, input: unknown) {
    await this.lifecycle.ensureUserExists(userId, username);
    const draft = validateOnboardingDraft(input);
    const saved = await this.onboarding.upsertDraft(userId, draft);

    return {
      ok: true,
      message: "Onboarding draft saved",
      questionnaire_version: draft.questionnaireVersion,
      updated_at: saved.updatedAt,
      completed_at: saved.completedAt,
    };
  }

  async complete(userId: string, username: string, input: unknown) {
    await this.lifecycle.ensureUserExists(userId, username);
    const answers = validateOnboardingAnswers(input);
    const completedAt = nowIso();
    await this.onboarding.upsertDraft(userId, answers, { completedAt: null });
    await this.programGenerator.deriveAndStoreProfileFromAnswers(userId, username, answers);
    const result = await this.programGenerator.generateFromStoredProfile(userId, username, "onboarding-complete");
    await this.onboarding.upsertDraft(userId, answers, { completedAt });
    const profile = normalizeOnboardingAnswers(answers);

    return {
      ...result,
      onboarding: {
        completed: true,
        completed_at: completedAt,
        questionnaire_version: answers.questionnaireVersion,
      },
      profile: {
        version: profile.version,
        primary_goal: profile.primaryGoal,
        training_days_per_week: profile.trainingDaysPerWeek,
        session_duration_minutes: profile.sessionDurationMinutes,
      },
    };
  }
}
