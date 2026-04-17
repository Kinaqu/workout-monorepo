import type { RuntimeAppConfig } from './types.ts';

const HOSTED_DEFAULT_API_BASE_URL = 'https://workout-api.dimer133745.workers.dev';
let didReportApiConfig = false;

function normalizeBaseUrl(value: string | undefined | null): string {
  return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
}

function resolveRuntimeConfig(): RuntimeAppConfig | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.__APP_CONFIG__ ?? null;
}

function getCurrentOrigin(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.origin;
}

function isVercelHostedOrigin(origin: string): boolean {
  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

function isSuspiciousHostedBaseUrl(baseUrl: string): boolean {
  const currentOrigin = getCurrentOrigin();
  return Boolean(baseUrl && currentOrigin && baseUrl === currentOrigin && isVercelHostedOrigin(currentOrigin));
}

function reportApiConfig(message: string, detail: Record<string, unknown> = {}): void {
  if (didReportApiConfig || typeof console === 'undefined') {
    return;
  }

  didReportApiConfig = true;
  console.warn(`[api-config] ${message}`, detail);
}

export function resolveApiBaseUrl(): string {
  const runtimeBaseUrl = normalizeBaseUrl(resolveRuntimeConfig()?.apiBaseUrl);
  if (runtimeBaseUrl && !isSuspiciousHostedBaseUrl(runtimeBaseUrl)) {
    return runtimeBaseUrl;
  }
  if (runtimeBaseUrl) {
    reportApiConfig('Ignoring suspicious same-origin runtime API base URL on a Vercel deployment.', {
      runtimeBaseUrl,
      fallbackBaseUrl: HOSTED_DEFAULT_API_BASE_URL,
    });
  }

  const configuredBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? import.meta.env.NEXT_PUBLIC_API_BASE_URL);
  if (configuredBaseUrl && !isSuspiciousHostedBaseUrl(configuredBaseUrl)) {
    return configuredBaseUrl;
  }
  if (configuredBaseUrl) {
    reportApiConfig('Ignoring suspicious same-origin configured API base URL on a Vercel deployment.', {
      configuredBaseUrl,
      fallbackBaseUrl: HOSTED_DEFAULT_API_BASE_URL,
    });
  }

  if (import.meta.env.DEV) {
    return '';
  }

  reportApiConfig('Falling back to the hosted backend API base URL.', {
    fallbackBaseUrl: HOSTED_DEFAULT_API_BASE_URL,
  });
  return HOSTED_DEFAULT_API_BASE_URL;
}

export function buildApiUrl(endpoint: string): string {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseUrl = resolveApiBaseUrl();
  return baseUrl ? `${baseUrl}${normalizedEndpoint}` : normalizedEndpoint;
}

export const API_BASE_URL = resolveApiBaseUrl();
