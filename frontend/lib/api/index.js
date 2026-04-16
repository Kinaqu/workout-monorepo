export { API_BASE_URL, api, hasStoredLegacyToken, startAuthSessionFlow } from '/lib/api/client.ts';
export {
  ApiError,
  AuthRedirectError,
  isMissingProgramError,
  isOnboardingIncompleteError,
  isWorkoutAlreadyLoggedError,
  isWorkoutLogServerError,
  isWorkoutLogValidationError,
} from '/lib/api/errors.ts';
