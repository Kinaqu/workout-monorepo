import { badRequest } from "../lib/app-error";

export const ONBOARDING_QUESTIONNAIRE_VERSION = "onboarding-v1";

export const ONBOARDING_GOALS = ["strength", "muscle", "general_fitness", "mobility"] as const;
export const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const EQUIPMENT_ACCESS = ["bodyweight", "dumbbells", "bands", "bench", "pullup_bar"] as const;
export const FOCUS_AREAS = ["upper_body", "lower_body", "core", "mobility"] as const;
export const LIMITATION_TAGS = ["wrist_sensitive", "knee_sensitive", "lower_back_sensitive", "shoulder_sensitive"] as const;
export const PREFERRED_STYLES = ["balanced", "strength_bias", "mobility_bias", "low_impact"] as const;

export type OnboardingGoal = (typeof ONBOARDING_GOALS)[number];
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];
export type EquipmentAccess = (typeof EQUIPMENT_ACCESS)[number];
export type FocusArea = (typeof FOCUS_AREAS)[number];
export type LimitationTag = (typeof LIMITATION_TAGS)[number];
export type PreferredStyle = (typeof PREFERRED_STYLES)[number];

export interface OnboardingAnswers {
  questionnaireVersion: string;
  goals: OnboardingGoal[];
  experienceLevel: ExperienceLevel;
  trainingDaysPerWeek: number;
  sessionDurationMinutes: number;
  equipmentAccess: EquipmentAccess[];
  focusAreas: FocusArea[];
  limitations: LimitationTag[];
  preferredStyles: PreferredStyle[];
}

export interface OnboardingDraft {
  questionnaireVersion: string;
  goals?: OnboardingGoal[];
  experienceLevel?: ExperienceLevel;
  trainingDaysPerWeek?: number;
  sessionDurationMinutes?: number;
  equipmentAccess?: EquipmentAccess[];
  focusAreas?: FocusArea[];
  limitations?: LimitationTag[];
  preferredStyles?: PreferredStyle[];
}

export interface OnboardingState {
  status: "not_started" | "draft" | "completed";
  completed: boolean;
  questionnaireVersion: string | null;
  answersUpdatedAt: string | null;
  completedAt: string | null;
  answers: OnboardingDraft | null;
}

type ArrayValidator<T extends string> = readonly T[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readEnum<T extends string>(value: unknown, fieldName: string, allowed: ArrayValidator<T>): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    badRequest(`Invalid ${fieldName}`);
  }

  return value as T;
}

function readOptionalEnum<T extends string>(value: unknown, fieldName: string, allowed: ArrayValidator<T>): T | undefined {
  if (typeof value === "undefined") return undefined;
  return readEnum(value, fieldName, allowed);
}

function readOptionalEnumArray<T extends string>(
  value: unknown,
  fieldName: string,
  allowed: ArrayValidator<T>
): T[] | undefined {
  if (typeof value === "undefined") return undefined;
  if (!Array.isArray(value)) {
    badRequest(`Invalid ${fieldName}`);
  }

  const normalized = Array.from(
    new Set(value.map((item, index) => readEnum(item, `${fieldName}[${index}]`, allowed)))
  );

  return normalized.sort();
}

function readIntegerInRange(value: unknown, fieldName: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    badRequest(`Invalid ${fieldName}`);
  }

  return value;
}

function readOptionalIntegerInRange(value: unknown, fieldName: string, min: number, max: number): number | undefined {
  if (typeof value === "undefined") return undefined;
  return readIntegerInRange(value, fieldName, min, max);
}

export function validateOnboardingDraft(input: unknown): OnboardingDraft {
  if (!isRecord(input)) {
    badRequest("Onboarding body must be an object");
  }

  return {
    questionnaireVersion:
      typeof input.questionnaireVersion === "string" && input.questionnaireVersion.trim().length > 0
        ? input.questionnaireVersion.trim()
        : ONBOARDING_QUESTIONNAIRE_VERSION,
    goals: readOptionalEnumArray(input.goals, "goals", ONBOARDING_GOALS),
    experienceLevel: readOptionalEnum(input.experienceLevel, "experienceLevel", EXPERIENCE_LEVELS),
    trainingDaysPerWeek: readOptionalIntegerInRange(input.trainingDaysPerWeek, "trainingDaysPerWeek", 2, 5),
    sessionDurationMinutes: readOptionalIntegerInRange(input.sessionDurationMinutes, "sessionDurationMinutes", 20, 75),
    equipmentAccess: readOptionalEnumArray(input.equipmentAccess, "equipmentAccess", EQUIPMENT_ACCESS),
    focusAreas: readOptionalEnumArray(input.focusAreas, "focusAreas", FOCUS_AREAS),
    limitations: readOptionalEnumArray(input.limitations, "limitations", LIMITATION_TAGS),
    preferredStyles: readOptionalEnumArray(input.preferredStyles, "preferredStyles", PREFERRED_STYLES),
  };
}

export function validateOnboardingAnswers(input: unknown): OnboardingAnswers {
  const draft = validateOnboardingDraft(input);

  if (!draft.goals || draft.goals.length === 0) {
    badRequest("Invalid goals");
  }
  if (!draft.experienceLevel) {
    badRequest("Invalid experienceLevel");
  }
  if (!draft.trainingDaysPerWeek) {
    badRequest("Invalid trainingDaysPerWeek");
  }
  if (!draft.sessionDurationMinutes) {
    badRequest("Invalid sessionDurationMinutes");
  }
  if (!draft.equipmentAccess || draft.equipmentAccess.length === 0) {
    badRequest("Invalid equipmentAccess");
  }
  if (!draft.focusAreas || draft.focusAreas.length === 0) {
    badRequest("Invalid focusAreas");
  }
  if (!draft.preferredStyles || draft.preferredStyles.length === 0) {
    badRequest("Invalid preferredStyles");
  }

  return {
    questionnaireVersion: draft.questionnaireVersion,
    goals: draft.goals,
    experienceLevel: draft.experienceLevel,
    trainingDaysPerWeek: draft.trainingDaysPerWeek,
    sessionDurationMinutes: draft.sessionDurationMinutes,
    equipmentAccess: draft.equipmentAccess,
    focusAreas: draft.focusAreas,
    limitations: draft.limitations ?? [],
    preferredStyles: draft.preferredStyles,
  };
}

