import { ExperienceLevel, FocusArea, LimitationTag, OnboardingAnswers, OnboardingGoal, PreferredStyle } from "./onboarding";

export const PROFILE_VERSION = "profile-v1";

export interface NormalizedUserProfile {
  version: string;
  primaryGoal: OnboardingGoal;
  secondaryGoals: OnboardingGoal[];
  experienceLevel: ExperienceLevel;
  trainingDaysPerWeek: number;
  sessionDurationMinutes: number;
  equipmentAccess: string[];
  focusAreas: FocusArea[];
  limitationTags: LimitationTag[];
  preferredStyles: PreferredStyle[];
  splitPreference: "two_day" | "three_day" | "four_day" | "five_day";
  volumeLevel: "low" | "standard" | "high";
  preferredWorkoutTags: string[];
  excludedWorkoutTags: string[];
}

const goalPriority: Record<OnboardingGoal, number> = {
  strength: 0,
  muscle: 1,
  general_fitness: 2,
  mobility: 3,
};

export function normalizeOnboardingAnswers(answers: OnboardingAnswers): NormalizedUserProfile {
  const sortedGoals = answers.goals.slice().sort((left, right) => goalPriority[left] - goalPriority[right]);
  const primaryGoal = sortedGoals[0] ?? "general_fitness";
  const splitPreference =
    answers.trainingDaysPerWeek <= 2
      ? "two_day"
      : answers.trainingDaysPerWeek === 3
        ? "three_day"
        : answers.trainingDaysPerWeek === 4
          ? "four_day"
          : "five_day";

  const volumeLevel =
    answers.sessionDurationMinutes <= 30 ? "low" : answers.sessionDurationMinutes >= 55 ? "high" : "standard";

  return {
    version: PROFILE_VERSION,
    primaryGoal,
    secondaryGoals: sortedGoals.slice(1),
    experienceLevel: answers.experienceLevel,
    trainingDaysPerWeek: answers.trainingDaysPerWeek,
    sessionDurationMinutes: answers.sessionDurationMinutes,
    equipmentAccess: answers.equipmentAccess.slice().sort(),
    focusAreas: answers.focusAreas.slice().sort(),
    limitationTags: answers.limitations.slice().sort(),
    preferredStyles: answers.preferredStyles.slice().sort(),
    splitPreference,
    volumeLevel,
    preferredWorkoutTags: buildPreferredWorkoutTags(answers, primaryGoal),
    excludedWorkoutTags: buildExcludedWorkoutTags(answers.limitations),
  };
}

function buildPreferredWorkoutTags(answers: OnboardingAnswers, primaryGoal: OnboardingGoal): string[] {
  const tags = new Set<string>();

  if (primaryGoal === "strength" || primaryGoal === "muscle") {
    tags.add("strength");
    tags.add("push");
    tags.add("lower");
    tags.add("core");
  }

  if (primaryGoal === "mobility") {
    tags.add("mobility");
    tags.add("recovery");
  }

  if (primaryGoal === "general_fitness") {
    tags.add("balanced");
    tags.add("lower");
    tags.add("upper");
    tags.add("core");
  }

  if (answers.focusAreas.includes("upper_body")) {
    tags.add("upper");
    tags.add("push");
  }
  if (answers.focusAreas.includes("lower_body")) {
    tags.add("lower");
  }
  if (answers.focusAreas.includes("core")) {
    tags.add("core");
  }
  if (answers.focusAreas.includes("mobility")) {
    tags.add("mobility");
  }

  if (answers.preferredStyles.includes("mobility_bias")) {
    tags.add("mobility");
  }
  if (answers.preferredStyles.includes("strength_bias")) {
    tags.add("strength");
  }
  if (answers.preferredStyles.includes("low_impact")) {
    tags.add("low_impact");
  }

  return Array.from(tags).sort();
}

function buildExcludedWorkoutTags(limitations: LimitationTag[]): string[] {
  const tags = new Set<string>();

  if (limitations.includes("wrist_sensitive")) {
    tags.add("wrist_load");
  }
  if (limitations.includes("knee_sensitive")) {
    tags.add("knee_dominant");
  }
  if (limitations.includes("lower_back_sensitive")) {
    tags.add("hinge_load");
  }
  if (limitations.includes("shoulder_sensitive")) {
    tags.add("overhead");
  }

  return Array.from(tags).sort();
}

