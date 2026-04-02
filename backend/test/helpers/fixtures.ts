import type { OnboardingAnswers } from "../../src/domain/onboarding";

export const TEST_USER = {
  userId: "user_test_123",
  username: "test-user",
};

export const ONBOARDING_ANSWERS: OnboardingAnswers = {
  questionnaireVersion: "onboarding-v1",
  goals: ["strength", "muscle"],
  experienceLevel: "beginner",
  trainingDaysPerWeek: 3,
  sessionDurationMinutes: 45,
  equipmentAccess: ["bodyweight", "dumbbells", "bands", "bench"],
  focusAreas: ["upper_body", "core"],
  limitations: [],
  preferredStyles: ["balanced", "strength_bias"],
};

export function authHeaders(extra: HeadersInit = {}, token = "mocked-token"): Headers {
  const headers = new Headers(extra);
  headers.set("Authorization", `Bearer ${token}`);
  return headers;
}
