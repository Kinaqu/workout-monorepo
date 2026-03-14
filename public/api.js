export const BASE_URL = 'https://workout-api.dimer133745.workers.dev';

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  localStorage.setItem('token', token);
}

export function removeToken() {
  localStorage.removeItem('token');
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token && !options.noAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    if (response.status === 401) {
      removeToken();
      window.location.href = '/login.html';
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
    if (date) {
      headers['X-Workout-Date'] = date;
    }
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
