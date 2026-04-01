import React, { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkLoaded, ClerkProvider, Show } from '@clerk/react';
import { clerkAppearance } from './clerkAppearance.js';
import { clerkPublishableKey, envDiagnostics, hasClerkKey } from './clerk.jsx';

const LazySignIn = lazy(() => import('@clerk/react').then(module => ({ default: module.SignIn })));
const shouldForceReauth = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('reauth') === '1';

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


function SignedInRedirect() {
  React.useEffect(() => {
    window.location.replace('/');
  }, []);

  return <AuthSkeleton label="session" />;
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

function LoginPage() {
  return (
    <main className="auth-container">
      <ClerkLoaded>
        {shouldForceReauth ? (
          <section className="card auth-card" style={{ marginBottom: '16px' }}>
            <h1 className="mb-4">Session expired</h1>
            <p className="text-secondary">Sign in again to continue.</p>
          </section>
        ) : null}
        <Show when="signed-out">
          <Suspense fallback={<AuthSkeleton label="sign in" />}>
            <LazySignIn routing="virtual" signUpUrl="/register" forceRedirectUrl="/" fallbackRedirectUrl="/" appearance={clerkAppearance} />
          </Suspense>
        </Show>
        <Show when="signed-in">
          <SignedInRedirect />
        </Show>
      </ClerkLoaded>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {hasClerkKey ? (
      <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/login">
        <LoginPage />
      </ClerkProvider>
    ) : (
      <MissingKeyNotice />
    )}
  </StrictMode>
);
