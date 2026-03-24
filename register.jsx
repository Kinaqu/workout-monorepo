import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkLoaded, ClerkLoading, ClerkProvider, Show, SignUp, UserButton } from '@clerk/react';
import { clerkAppearance } from './clerkAppearance.js';

const hasClerkKey = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

function MissingKeyNotice() {
  return (
    <main className="auth-container">
      <section className="card auth-card">
        <h1 className="mb-4">Clerk key is missing</h1>
        <p className="text-secondary">Set VITE_CLERK_PUBLISHABLE_KEY in .env.local and redeploy.</p>
        <p className="mt-4">
          <a href="https://clerk.com/docs/react/getting-started/quickstart">Clerk React quickstart</a>
        </p>
      </section>
    </main>
  );
}

function RegisterPage() {
  return (
    <main className="auth-container">
      <ClerkLoading>
        <section className="card auth-card text-center">Loading sign up…</section>
      </ClerkLoading>
      <ClerkLoaded>
        <Show when="signed-out">
          <SignUp path="/register" routing="path" signInUrl="/login" appearance={clerkAppearance} />
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
