export class AuthRedirectError extends Error {
  constructor(message = 'Session expired. Please sign in again.') {
    super(message);
    this.name = 'AuthRedirectError';
  }
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function isOnboardingIncompleteError(error) {
  return error instanceof ApiError && error.status === 409 && error.message.includes('Onboarding not completed');
}

export function isMissingProgramError(error) {
  return error instanceof ApiError && error.status === 409 && error.message.includes('Active program not found');
}

export function isWorkoutAlreadyLoggedError(error) {
  return error instanceof ApiError && error.status === 409 && /already (logged|saved|exists)/i.test(error.message);
}

export function isWorkoutLogValidationError(error) {
  return error instanceof ApiError && (error.status === 400 || error.status === 422);
}

export function isWorkoutLogServerError(error) {
  return error instanceof ApiError && error.status >= 500;
}
