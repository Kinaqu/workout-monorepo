export const ONBOARDING_QUESTIONNAIRE_VERSION = 'onboarding-v1';

export interface OnboardingData {
  questionnaireVersion: string;
  goals: string[];
  experienceLevel: string;
  trainingDaysPerWeek: number | null;
  sessionDurationMinutes: number | null;
  equipmentAccess: string[];
  focusAreas: string[];
  limitations: string[];
  preferredStyles: string[];
}

export const ONBOARDING_DEFAULTS = {
  questionnaireVersion: ONBOARDING_QUESTIONNAIRE_VERSION,
  goals: ['general_fitness'],
  experienceLevel: 'beginner',
  trainingDaysPerWeek: 3,
  sessionDurationMinutes: 30,
  equipmentAccess: ['bodyweight'],
  focusAreas: ['upper_body', 'lower_body', 'core'],
  limitations: [] as string[],
  preferredStyles: ['balanced'],
};

export function createDefaultOnboardingData(): OnboardingData {
  return {
    questionnaireVersion: ONBOARDING_DEFAULTS.questionnaireVersion,
    goals: ONBOARDING_DEFAULTS.goals.slice(),
    experienceLevel: ONBOARDING_DEFAULTS.experienceLevel,
    trainingDaysPerWeek: ONBOARDING_DEFAULTS.trainingDaysPerWeek,
    sessionDurationMinutes: ONBOARDING_DEFAULTS.sessionDurationMinutes,
    equipmentAccess: ONBOARDING_DEFAULTS.equipmentAccess.slice(),
    focusAreas: ONBOARDING_DEFAULTS.focusAreas.slice(),
    limitations: ONBOARDING_DEFAULTS.limitations.slice(),
    preferredStyles: ONBOARDING_DEFAULTS.preferredStyles.slice(),
  };
}

export function mergeOnboardingData(answers: unknown): OnboardingData {
  const defaults = createDefaultOnboardingData();
  const source = (answers && typeof answers === 'object' ? answers : {}) as Partial<Record<keyof OnboardingData, unknown>>;

  return {
    questionnaireVersion:
      typeof source.questionnaireVersion === 'string' && source.questionnaireVersion.trim()
        ? source.questionnaireVersion.trim()
        : defaults.questionnaireVersion,
    goals: Array.isArray(source.goals) ? source.goals.slice() : defaults.goals,
    experienceLevel: typeof source.experienceLevel === 'string' ? source.experienceLevel : defaults.experienceLevel,
    trainingDaysPerWeek: Number.isInteger(source.trainingDaysPerWeek)
      ? (source.trainingDaysPerWeek as number)
      : defaults.trainingDaysPerWeek,
    sessionDurationMinutes: Number.isInteger(source.sessionDurationMinutes)
      ? (source.sessionDurationMinutes as number)
      : defaults.sessionDurationMinutes,
    equipmentAccess: Array.isArray(source.equipmentAccess) ? source.equipmentAccess.slice() : defaults.equipmentAccess,
    focusAreas: Array.isArray(source.focusAreas) ? source.focusAreas.slice() : defaults.focusAreas,
    limitations: Array.isArray(source.limitations) ? source.limitations.slice() : defaults.limitations,
    preferredStyles: Array.isArray(source.preferredStyles) ? source.preferredStyles.slice() : defaults.preferredStyles,
  };
}

export function validateOnboardingPayload(payload: OnboardingData): Record<string, string> {
  const errors: Record<string, string> = {};

  if (payload.goals.length === 0) {
    errors.goals = 'Pick at least one goal.';
  }
  if (!payload.experienceLevel) {
    errors.experienceLevel = 'Choose your level.';
  }
  if (!payload.trainingDaysPerWeek || payload.trainingDaysPerWeek < 2 || payload.trainingDaysPerWeek > 5) {
    errors.trainingDaysPerWeek = 'Choose between 2 and 5 days.';
  }
  if (
    !payload.sessionDurationMinutes ||
    payload.sessionDurationMinutes < 20 ||
    payload.sessionDurationMinutes > 75
  ) {
    errors.sessionDurationMinutes = 'Choose between 20 and 75 minutes.';
  }
  if (payload.equipmentAccess.length === 0) {
    errors.equipmentAccess = 'Pick at least one equipment option.';
  }
  if (payload.focusAreas.length === 0) {
    errors.focusAreas = 'Pick at least one focus area.';
  }
  if (payload.preferredStyles.length === 0) {
    errors.preferredStyles = 'Pick at least one style.';
  }

  return errors;
}
