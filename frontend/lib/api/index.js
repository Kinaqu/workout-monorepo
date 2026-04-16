export { api, BASE_URL, getToken, hasClerkSession, removeToken, setToken, startAuthSessionFlow } from '/lib/api/client.js';
export {
  ApiError,
  AuthRedirectError,
  isMissingProgramError,
  isOnboardingIncompleteError,
  isWorkoutAlreadyLoggedError,
  isWorkoutLogServerError,
  isWorkoutLogValidationError,
} from '/lib/api/errors.js';
