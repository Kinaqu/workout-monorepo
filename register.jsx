import React, { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkLoaded, ClerkProvider, Show, UserButton } from '@clerk/react';
import { clerkAppearance } from './clerkAppearance.js';

const LazySignUp = lazy(() => import('@clerk/react').then(module => ({ default: module.SignUp })));

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

const envDiagnostics = {
  hasViteKey: Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY),
  hasClerkKeyAlias: Boolean(import.meta.env.CLERK_PUBLISHABLE_KEY),
  hasNextPublicAlias: Boolean(import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
};

const hasClerkKey = Boolean(clerkPublishableKey);

function MissingKeyNotice() {
  return (
    <main className="auth-container">
      <section className="card auth-card">
        <h1 className="mb-4">Clerk key is missing</h1>
        <p className="text-secondary">Set VITE_CLERK_PUBLISHABLE_KEY in Vercel Project Settings → Environment Variables and redeploy.</p>
        <p className="text-secondary" style={{ marginTop: '8px', fontSize: '12px' }}>
          env check — VITE: {String(envDiagnostics.hasViteKey)}, CLERK_: {String(envDiagnostics.hasClerkKeyAlias)}, NEXT_PUBLIC_: {String(envDiagnostics.hasNextPublicAlias)}
        </p>
        <p className="mt-4">
          <a href="https://clerk.com/docs/react/getting-started/quickstart">Clerk React quickstart</a>
        </p>
      </section>
    </main>
  );
}

function AuthSkeleton({ label }) {
  return (
    <section className="card auth-loader-card" aria-live="polite" aria-busy="true">
      <div className="auth-loader-title">Preparing {label}</div>
      <div className="auth-loader-line" />
      <div className="auth-loader-line auth-loader-line-short" />
      <div className="auth-loader-button" />
    </section>
  );
}

function RegisterPage() {
  return (
    <main className="auth-container">
      <ClerkLoaded>
        <Show when="signed-out">
          <Suspense fallback={<AuthSkeleton label="sign up" />}>
            <LazySignUp path="/register" routing="path" signInUrl="/login" appearance={clerkAppearance} />
          </Suspense>
        </Show>
        <Show when="signed-in">
          <section className="card auth-card text-center">
            <h1 className="mb-4">Account ready</h1>
            <div className="flex justify-between items-center" style={{ gap: '12px' }}>
              <UserButton afterSignOutUrl="/register" />
              <a href="/">Go to dashboard</a>
            </div>
          </section>
        </Show>
      </ClerkLoaded>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {hasClerkKey ? (
      <ClerkProvider afterSignOutUrl="/register">
        <RegisterPage />
      </ClerkProvider>
    ) : (
      <MissingKeyNotice />
    )}
  </StrictMode>
);
