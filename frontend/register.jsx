import React, { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkLoaded, ClerkProvider, Show } from '@clerk/react';
import { AuthLinkRow, AuthMessageCard, AuthMetaList, AuthShell, AuthSkeleton } from './auth-shell.jsx';
import { clerkAppearance } from './clerkAppearance.js';
import { clerkPublishableKey, envDiagnostics, hasClerkKey } from './clerk.jsx';

const LazySignUp = lazy(() => import('@clerk/react').then(module => ({ default: module.SignUp })));

function MissingKeyNotice() {
  return (
    <main className="auth-container">
      <AuthShell
        eyebrow="Access configuration"
        title="Kinova sign-up is blocked until the Clerk publishable key is available."
        description="Once the key is present, new users can move from account creation into onboarding without leaving the product shell."
        stageLabel="Configuration required"
      >
        <AuthMessageCard
          title="Clerk key is missing"
          copy="Set VITE_CLERK_PUBLISHABLE_KEY in Vercel Project Settings and redeploy this frontend."
          tone="warning"
        >
          <AuthMetaList
            items={[
              { label: 'VITE', value: String(envDiagnostics.hasViteKey) },
              { label: 'CLERK_', value: String(envDiagnostics.hasClerkKeyAlias) },
              { label: 'NEXT_PUBLIC_', value: String(envDiagnostics.hasNextPublicAlias) },
            ]}
          />
          <AuthLinkRow href="https://clerk.com/docs/react/getting-started/quickstart">
            Open Clerk React quickstart
          </AuthLinkRow>
        </AuthMessageCard>
      </AuthShell>
    </main>
  );
}


function SignedInRedirect() {
  React.useEffect(() => {
    window.location.replace('/');
  }, []);

  return null;
}

function RegisterPage() {
  return (
    <main className="auth-container">
      <AuthShell
        eyebrow="New member setup"
        title="Create a Kinova account and move straight into the adaptive plan setup."
        description="Account creation should feel like the first step of the product, not a detached third-party screen."
        stageLabel="Sign up"
      >
        <ClerkLoaded>
          <Show when="signed-out">
            <Suspense fallback={<AuthSkeleton label="sign up" />}>
              <LazySignUp routing="virtual" signInUrl="/login" appearance={clerkAppearance} />
            </Suspense>
          </Show>
          <Show when="signed-in">
            <SignedInRedirect />
          </Show>
        </ClerkLoaded>
      </AuthShell>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {hasClerkKey ? (
      <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/login">
        <RegisterPage />
      </ClerkProvider>
    ) : (
      <MissingKeyNotice />
    )}
  </StrictMode>
);
