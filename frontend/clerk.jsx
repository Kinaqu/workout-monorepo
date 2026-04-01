import { loadClerkJsScript } from '@clerk/shared/loadClerkJsScript';

export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

export const envDiagnostics = {
  hasViteKey: Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY),
  hasClerkKeyAlias: Boolean(import.meta.env.CLERK_PUBLISHABLE_KEY),
  hasNextPublicAlias: Boolean(import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
};

export const hasClerkKey = Boolean(clerkPublishableKey);

let clerkBootstrapPromise = null;

function getClerkInstance() {
  if (typeof window === 'undefined' || !('Clerk' in window)) {
    return null;
  }

  return window.Clerk ?? null;
}

function isClerkReady(clerk) {
  if (!clerk) return false;
  if (clerk.status === 'ready' || clerk.status === 'degraded') return true;
  return Boolean(clerk.loaded && !clerk.status);
}

export function ensureClerkReady() {
  if (!hasClerkKey || typeof document === 'undefined') {
    return Promise.resolve({ isLoaded: false, isSignedIn: false });
  }

  const readyClerk = getClerkInstance();
  if (isClerkReady(readyClerk)) {
    return Promise.resolve({
      isLoaded: true,
      isSignedIn: Boolean(readyClerk.session || readyClerk.isSignedIn),
    });
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
