export const BASE_URL = 'https://workout-api.dimer133745.workers.dev';
const LOGIN_PATH = '/login?reauth=1';

export class AuthRedirectError extends Error {
  constructor(message = 'Session expired. Please sign in again.') {
    super(message);
    this.name = 'AuthRedirectError';
  }
}

function getCookieValue(name) {
  if (typeof document === 'undefined') return null;

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escapedName}=([^;]*)`));

  if (!match || match.length < 2) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function getClerkTokenFromCookie() {
  return getCookieValue('__session');
}

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  localStorage.setItem('token', token);
}

export function removeToken() {
  localStorage.removeItem('token');
}

export function hasClerkSession() {
  return Boolean(getClerkTokenFromCookie());
}

async function resolveAuthToken() {
  const clerkToken = getClerkTokenFromCookie();
  if (clerkToken) return clerkToken;

  return getToken();
}

function getErrorMessage(data, fallbackStatus) {
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (typeof data?.error === 'string' && data.error.trim()) return data.error;

  return `API Error: ${fallbackStatus}`;
}

function isAuthFailure(response, data) {
  if (response.status === 401 || response.status === 403) {
    return true;
  }

  if (response.status !== 400) {
    return false;
  }

  const errorMessage = getErrorMessage(data, response.status).toLowerCase();
  return /(unauthor|auth|token|bearer|session|expired|forbidden)/i.test(errorMessage);
}

function redirectToLogin(message) {
  removeToken();

  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.replace(LOGIN_PATH);
  }

  throw new AuthRedirectError(message);
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = await resolveAuthToken();
  if (token && !options.noAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { ...options, headers };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (isAuthFailure(response, data)) {
      redirectToLogin(getErrorMessage(data, response.status));
    }

    if (!response.ok) {
      throw new Error(getErrorMessage(data, response.status));
    }

    return data;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
}

export const api = {
  login: (username, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    noAuth: true
  }),
  register: (username, password) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    noAuth: true
  }),
  getTodayWorkout: () => request('/workout/today'),
  logWorkout: (data, date) => {
    const headers = {};
    if (date) headers['X-Workout-Date'] = date;
    return request('/log', {
      method: 'POST',
      body: JSON.stringify(data),
      headers
    });
  },
  getLog: (date) => request(`/log/${date}`),
  getProgram: () => request('/program'),
  runProgression: () => request('/progression/run', { method: 'POST' })
};
