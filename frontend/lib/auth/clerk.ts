// Clerk bootstrap shared by all three entries (/, /login, /register).
//
// The main app intentionally has no ClerkProvider: it only needs the
// is-signed-in gate and Bearer tokens, both of which work against the
// plain window.Clerk instance. This also keeps the local smoke tests
// (which stub window.Clerk with a plain object and run without a
// publishable key) on the same code path as production.
import { loadClerkJsScript } from '@clerk/shared/loadClerkJsScript';

export const clerkPublishableKey: string = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

export const envDiagnostics = {
  hasViteKey: Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY),
  hasClerkKeyAlias: Boolean(import.meta.env.CLERK_PUBLISHABLE_KEY),
  hasNextPublicAlias: Boolean(import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
};

export const hasClerkKey = Boolean(clerkPublishableKey);

export interface ClerkReadyState {
  isLoaded: boolean;
  isSignedIn: boolean;
}

interface ClerkWindowInstance {
  status?: string;
  loaded?: boolean;
  session?: unknown;
  isSignedIn?: boolean;
  load?: () => Promise<void>;
}

let clerkBootstrapPromise: Promise<ClerkReadyState> | null = null;

function getClerkInstance(): ClerkWindowInstance | null {
  if (typeof window === 'undefined' || !('Clerk' in window)) {
    return null;
  }

  return (window.Clerk as ClerkWindowInstance | undefined) ?? null;
}

function isClerkReady(clerk: ClerkWindowInstance | null): boolean {
  if (!clerk) return false;
  if (clerk.status === 'ready' || clerk.status === 'degraded') return true;
  return Boolean(clerk.loaded && !clerk.status);
}

export function ensureClerkReady(): Promise<ClerkReadyState> {
  const readyClerk = getClerkInstance();
  if (isClerkReady(readyClerk)) {
    return Promise.resolve({
      isLoaded: true,
      isSignedIn: Boolean(readyClerk?.session || readyClerk?.isSignedIn),
    });
  }

  if (!hasClerkKey || typeof document === 'undefined') {
    return Promise.resolve({ isLoaded: false, isSignedIn: false });
  }

  if (!clerkBootstrapPromise) {
    clerkBootstrapPromise = (async () => {
      await loadClerkJsScript({ publishableKey: clerkPublishableKey });

      const clerk = getClerkInstance();
      if (!clerk) {
        throw new Error('Clerk failed to attach to window.');
      }

      if (!isClerkReady(clerk) && typeof clerk.load === 'function') {
        await clerk.load();
      }

      if (!isClerkReady(clerk)) {
        throw new Error('Clerk did not reach a ready state.');
      }

      return {
        isLoaded: true,
        isSignedIn: Boolean(clerk.session || clerk.isSignedIn),
      };
    })().catch(error => {
      clerkBootstrapPromise = null;
      throw error;
    });
  }

  return clerkBootstrapPromise;
}
