import { OnboardingRepository } from "../repositories/onboarding-repository";
import { ProfileRepository } from "../repositories/profile-repository";
import { ProgramRepository } from "../repositories/program-repository";
import { UserLifecycleService } from "./user-lifecycle-service";

export class MeService {
  constructor(
    private readonly lifecycle: UserLifecycleService,
    private readonly onboarding: OnboardingRepository,
    private readonly profiles: ProfileRepository,
    private readonly programs: ProgramRepository
  ) {}

  async getState(userId: string, username: string) {
    const user = await this.lifecycle.ensureUserExists(userId, username);
    const [onboarding, profile, program] = await Promise.all([
      this.onboarding.getState(userId),
      this.profiles.getByUserId(userId),
      this.programs.getActiveProgramSummary(userId),
    ]);

    return {
      user: {
        id: user.user_id,
        username: user.username,
        created_at: user.created_at,
      },
      lifecycle: {
        user_exists: true,
        onboarding_completed: Boolean(user.onboarding_completed_at),
        has_active_program: Boolean(program),
        legacy_kv_migrated_at: user.legacy_kv_migrated_at,
      },
      onboarding,
      profile: profile
        ? {
            version: profile.profile.version,
            primary_goal: profile.profile.primaryGoal,
            experience_level: profile.profile.experienceLevel,
            training_days_per_week: profile.profile.trainingDaysPerWeek,
            session_duration_minutes: profile.profile.sessionDurationMinutes,
            updated_at: profile.updatedAt,
          }
        : null,
      active_program: program
        ? {
            version_id: program.id,
            key: program.program_key,
            name: program.name,
            source: program.source,
            updated_at: program.updated_at,
          }
        : null,
    };
  }
}
