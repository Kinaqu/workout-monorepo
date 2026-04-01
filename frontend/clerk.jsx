import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/react';

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

function HiddenClerkBootstrap({ onResolved }) {
  const { isLoaded, isSignedIn } = useAuth();

  React.useEffect(() => {
    if (!isLoaded) return;
    onResolved({ isLoaded: true, isSignedIn: Boolean(isSignedIn) });
  }, [isLoaded, isSignedIn, onResolved]);

  return null;
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
    clerkBootstrapPromise = new Promise(resolve => {
      const existingHost = document.getElementById('clerk-auth-bootstrap');
      const host = existingHost ?? document.createElement('div');

      host.id = 'clerk-auth-bootstrap';
      host.hidden = true;
      host.setAttribute('aria-hidden', 'true');

      if (!existingHost) {
        document.body.appendChild(host);
      }

      const root = createRoot(host);
      const handleResolved = state => resolve(state);

      root.render(
        <StrictMode>
          <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/login">
            <ClerkLoaded>
              <HiddenClerkBootstrap onResolved={handleResolved} />
            </ClerkLoaded>
          </ClerkProvider>
        </StrictMode>
      );
    });
  }

  return clerkBootstrapPromise;
}
