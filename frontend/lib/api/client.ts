import { getToken as getClerkToken } from '@clerk/shared/getToken';

import { buildApiUrl, API_BASE_URL } from './config.ts';
import { ApiError, AuthRedirectError } from './errors.ts';
import type {
  ApiClient,
  ApiErrorPayload,
  GeneratedProgramResponse,
  JsonLogRequest,
  LegacyLogByDateResponse,
  LogCreateResponse,
  MeResponse,
  OnboardingAnswers,
  OnboardingDraft,
  OnboardingCompleteResponse,
  OnboardingDraftSaveResponse,
  OnboardingStateResponse,
  ProgramDefinition,
  ProgramMutationResponse,
  ProgramResponse,
  ProgressionRunResponse,
  SessionsListResponse,
  WorkoutSessionRecord,
  WorkoutTodayResponse,
} from './types.ts';

const LOGIN_PATH = '/login?reauth=1';
const LEGACY_TOKEN_STORAGE_KEY = 'token';

interface ClerkInstance {
  session?: unknown;
  isSignedIn?: boolean;
}

interface ClerkTokenOptions {
  skipCache?: boolean;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | null;
  authToken?: string | null;
  authTokenOptions?: ClerkTokenOptions;
  noAuth?: boolean;
  __retriedWithFreshToken?: boolean;
}

function getClerkInstance(): ClerkInstance | null {
  if (typeof window === 'undefined' || !('Clerk' in window)) {
    return null;
  }

  return window.Clerk ?? null;
}

function getStoredLegacyToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY);
}

function clearStoredLegacyToken(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
}

export function hasStoredLegacyToken(): boolean {
  return Boolean(getStoredLegacyToken());
}

async function resolveAuthToken(options?: ClerkTokenOptions): Promise<string | null> {
  const clerk = getClerkInstance();
  if (!clerk) {
    return getStoredLegacyToken();
  }

  try {
    const clerkToken = await getClerkToken(options);
    if (clerkToken) {
      return clerkToken;
    }
  } catch (error) {
    console.warn('Unable to resolve Clerk token, falling back to legacy token storage.', error);
  }

  return getStoredLegacyToken();
}

function getErrorMessage(data: ApiErrorPayload, fallbackStatus: number): string {
  const message =
    typeof data?.message === 'string' && data.message.trim()
      ? data.message.trim()
      : typeof data?.error === 'string' && data.error.trim()
        ? data.error.trim()
        : '';

  const detail = typeof data?.detail === 'string' && data.detail.trim() ? data.detail.trim() : '';
  if (message && detail && detail !== message) {
    return `${message}: ${detail}`;
  }
  if (message) {
    return message;
  }
  if (detail) {
    return detail;
  }

  return `API Error: ${fallbackStatus}`;
}

function isExpiredSession(response: Response): boolean {
  return response.status === 401;
}

export function startAuthSessionFlow(message = 'Session expired. Please sign in again.'): never {
  clearStoredLegacyToken();

  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.replace(LOGIN_PATH);
  }

  throw new AuthRedirectError(message);
}

async function request<TResponse>(endpoint: string, options: RequestOptions = {}): Promise<TResponse> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = options.authToken ?? (await resolveAuthToken(options.authTokenOptions));
  if (token && !options.noAuth) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(buildApiUrl(endpoint), config);
    const contentType = response.headers.get('content-type')?.toLowerCase() || '';
    if (!contentType.includes('application/json')) {
      const message = contentType.includes('text/html')
        ? 'Expected JSON API response but received HTML. Check frontend API base URL configuration.'
        : `Expected JSON API response but received ${contentType || 'an unknown content type'}.`;

      throw new ApiError(message, response.status, {
        error: message,
      });
    }

    const data = (await response.json().catch(() => ({}))) as ApiErrorPayload;

    if (isExpiredSession(response) && !options.noAuth) {
      if (!options.__retriedWithFreshToken) {
        const freshToken = await resolveAuthToken({ skipCache: true });
        if (freshToken) {
          return request<TResponse>(endpoint, {
            ...options,
            __retriedWithFreshToken: true,
            authToken: freshToken,
            authTokenOptions: { skipCache: true },
          });
        }
      }

      startAuthSessionFlow(getErrorMessage(data, response.status));
    }

    if (!response.ok) {
      throw new ApiError(getErrorMessage(data, response.status), response.status, data);
    }

    return data as TResponse;
  } catch (error) {
    if (!(error instanceof AuthRedirectError) && !(error instanceof ApiError)) {
      console.error('API request failed:', error);
    }
    throw error;
  }
}

export { API_BASE_URL };

function buildQueryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

export const api: ApiClient = {
  getMe: () => request<MeResponse>('/me'),
  getOnboarding: () => request<OnboardingStateResponse>('/onboarding'),
  saveOnboardingDraft: (payload: OnboardingDraft) =>
    request<OnboardingDraftSaveResponse>('/onboarding', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  completeOnboarding: (payload: OnboardingAnswers) =>
    request<OnboardingCompleteResponse>('/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getTodayWorkout: (date?: string) =>
    request<WorkoutTodayResponse>(`/workout/today${buildQueryString({ date })}`),
  logWorkout: (payload: JsonLogRequest, date?: string) => {
    const headers = new Headers();
    if (date) {
      headers.set('X-Workout-Date', date);
    }

    return request<LogCreateResponse>('/log', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers,
    });
  },
  listSessions: (options = {}) =>
    request<SessionsListResponse>(
      `/sessions${buildQueryString({
        date: options.date,
        limit: options.limit,
      })}`
    ),
  getSession: (id: string) => request<WorkoutSessionRecord>(`/sessions/${id}`),
  getLog: (date: string) => request<LegacyLogByDateResponse>(`/log/${date}`),
  getProgram: () => request<ProgramResponse>('/program'),
  saveProgram: (payload: ProgramDefinition) =>
    request<ProgramMutationResponse>('/program', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resetProgram: (resetToken: string) => {
    const headers = new Headers();
    headers.set('X-Reset-Token', resetToken);

    return request<ProgramMutationResponse>('/program/reset', {
      method: 'POST',
      headers,
    });
  },
  regenerateProgram: () => request<GeneratedProgramResponse>('/program/regenerate', { method: 'POST' }),
  runProgression: () => request<ProgressionRunResponse>('/progression/run', { method: 'POST' }),
};
