import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkLoaded, ClerkLoading, ClerkProvider, Show, SignIn, UserButton } from '@clerk/react';
import { clerkAppearance } from './clerkAppearance.js';

const clerkPublishableKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.CLERK_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  '';

const hasClerkKey = Boolean(clerkPublishableKey);

function MissingKeyNotice() {
  return (
    <main className="auth-container">
      <section className="card auth-card">
        <h1 className="mb-4">Clerk key is missing</h1>
        <p className="text-secondary">Set one of: VITE_CLERK_PUBLISHABLE_KEY, CLERK_PUBLISHABLE_KEY, or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in Vercel and redeploy.</p>
        <p className="mt-4">
          <a href="https://clerk.com/docs/react/getting-started/quickstart">Clerk React quickstart</a>
        </p>
      </section>
    </main>
  );
}

function LoginPage() {
  return (
    <main className="auth-container">
      <ClerkLoading>
        <section className="card auth-card text-center">Loading sign in…</section>
      </ClerkLoading>
      <ClerkLoaded>
        <Show when="signed-out">
          <SignIn path="/login" routing="path" signUpUrl="/register" appearance={clerkAppearance} />
        </Show>
        <Show when="signed-in">
          <section className="card auth-card text-center">
            <h1 className="mb-4">You are signed in</h1>
            <div className="flex justify-between items-center" style={{ gap: '12px' }}>
              <UserButton afterSignOutUrl="/register" />
              <a href="/">Continue to app</a>
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
        <LoginPage />
      </ClerkProvider>
    ) : (
      <MissingKeyNotice />
    )}
  </StrictMode>
);
