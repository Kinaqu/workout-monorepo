export { API_BASE_URL, api, startAuthSessionFlow } from '/lib/api/client.ts';
export {
  ApiError,
  AuthRedirectError,
  isMissingProgramError,
  isOnboardingIncompleteError,
  isRecommendationDraftConflictError,
  isRecommendationDraftNotFoundError,
  isRecommendationDraftUnsupportedError,
  isWorkoutAlreadyLoggedError,
  isWorkoutLogServerError,
  isWorkoutLogValidationError,
} from '/lib/api/errors.ts';
