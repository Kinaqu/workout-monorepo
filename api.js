import { Clerk } from '@clerk/clerk-js';

export const BASE_URL = 'https://workout-api.dimer133745.workers.dev';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
let clerkClient = null;
let clerkLoadPromise = null;

async function getClerkClient() {
  if (!clerkPublishableKey) return null;

  if (!clerkClient) {
    clerkClient = new Clerk(clerkPublishableKey);
    clerkLoadPromise = clerkClient.load();
  }

  if (clerkLoadPromise) {
    await clerkLoadPromise;
  }

  return clerkClient;
}

async function getClerkToken() {
  try {
    const clerk = await getClerkClient();
    if (!clerk || !clerk.session) return null;
    return await clerk.session.getToken();
  } catch (error) {
    console.warn('Failed to get Clerk token:', error);
    return null;
  }
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
  if (typeof document === 'undefined') return false;
  return /(?:^|;\s*)__session=/.test(document.cookie);
}

async function resolveAuthToken() {
  const localToken = getToken();
  if (localToken) return localToken;

  if (!hasClerkSession()) return null;
  return await getClerkToken();
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
    if (response.status === 401) {
      removeToken();
      if (!hasClerkSession()) {
        window.location.href = '/login';
      }
      return null;
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || `API Error: ${response.status}`);
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
