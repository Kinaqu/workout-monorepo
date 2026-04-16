import type { RuntimeAppConfig } from './types.ts';

function normalizeBaseUrl(value: string | undefined | null): string {
  return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
}

function resolveRuntimeConfig(): RuntimeAppConfig | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.__APP_CONFIG__ ?? null;
}

export function resolveApiBaseUrl(): string {
  const runtimeBaseUrl = normalizeBaseUrl(resolveRuntimeConfig()?.apiBaseUrl);
  if (runtimeBaseUrl) {
    return runtimeBaseUrl;
  }

  return normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? import.meta.env.NEXT_PUBLIC_API_BASE_URL);
}

export function buildApiUrl(endpoint: string): string {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseUrl = resolveApiBaseUrl();
  return baseUrl ? `${baseUrl}${normalizedEndpoint}` : normalizedEndpoint;
}

export const API_BASE_URL = resolveApiBaseUrl();
