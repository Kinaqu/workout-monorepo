import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkLoaded, ClerkLoading, ClerkProvider, Show, SignUp } from '@clerk/react';
import { AuthLinkRow, AuthMessageCard, AuthMetaList, AuthShell, AuthStageSkeleton } from './auth-shell.jsx';
import { clerkAppearance } from './clerkAppearance.js';
import { clerkPublishableKey, envDiagnostics, hasClerkKey } from './clerk.jsx';

function MissingKeyNotice() {
  return (
    <main className="auth-container">
      <AuthShell
        eyebrow="Access configuration"
        title="Kinova sign-up is blocked until the Clerk publishable key is available."
        description="Once the key is present, new users can move from account creation into onboarding without leaving the product shell."
        stageLabel="Configuration required"
      >
        <AuthStageSkeleton name="auth-sign-up" mode="sign-up" loading={false}>
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
        </AuthStageSkeleton>
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
        <ClerkLoading>
          <AuthStageSkeleton name="auth-sign-up" mode="sign-up" loading />
        </ClerkLoading>
        <ClerkLoaded>
          <Show when="signed-out">
            <AuthStageSkeleton name="auth-sign-up" mode="sign-up" loading={false}>
              <SignUp routing="virtual" signInUrl="/login" appearance={clerkAppearance} />
            </AuthStageSkeleton>
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
