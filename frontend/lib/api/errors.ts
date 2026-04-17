import type { ApiErrorPayload } from './types.ts';

export class AuthRedirectError extends Error {
  constructor(message = 'Session expired. Please sign in again.') {
    super(message);
    this.name = 'AuthRedirectError';
  }
}

export class ApiError<TData extends ApiErrorPayload = ApiErrorPayload> extends Error {
  status: number;
  data: TData;

  constructor(message: string, status: number, data: TData) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function isOnboardingIncompleteError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 409 && error.message.includes('Onboarding not completed');
}

export function isMissingProgramError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 409 && error.message.includes('Active program not found');
}

export function isRecommendationDraftNotFoundError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 404 && /recommendation draft/i.test(error.message);
}

export function isRecommendationDraftConflictError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 409 && /recommendation draft|slot|structure|replacement/i.test(error.message);
}

export function isRecommendationDraftUnsupportedError(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.status === 404 || error.status === 405 || error.status === 501);
}

export function isWorkoutAlreadyLoggedError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 409 && /already (logged|saved|exists)/i.test(error.message);
}

export function isWorkoutLogValidationError(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.status === 400 || error.status === 422);
}

export function isWorkoutLogServerError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status >= 500;
}
