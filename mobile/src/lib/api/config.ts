// API base URL resolution for React Native.
//
// Unlike the web app there is no same-origin / Vercel-preview logic: a native
// app always talks to an absolute backend URL. Configure it per build with the
// EXPO_PUBLIC_API_BASE_URL env var (Expo inlines EXPO_PUBLIC_* at build time);
// otherwise fall back to the hosted Cloudflare Worker.
//
// Note: on a physical device, localhost/127.0.0.1 will NOT reach a `wrangler
// dev` server on your machine — use your machine's LAN IP, or the hosted URL.
const HOSTED_DEFAULT_API_BASE_URL = 'https://workout-api.dimer133745.workers.dev';

function normalizeBaseUrl(value: string | undefined | null): string {
  return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
}

export function resolveApiBaseUrl(): string {
  return normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL) || HOSTED_DEFAULT_API_BASE_URL;
}

export function buildApiUrl(endpoint: string): string {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${resolveApiBaseUrl()}${normalizedEndpoint}`;
}

export const API_BASE_URL = resolveApiBaseUrl();
