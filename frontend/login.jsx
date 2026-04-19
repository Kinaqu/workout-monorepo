import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkLoaded, ClerkLoading, ClerkProvider, Show, SignIn, useClerk } from '@clerk/react';
import { AuthLinkRow, AuthMessageCard, AuthMetaList, AuthShell, AuthSkeleton, AuthStageSkeleton } from './auth-shell.jsx';
import { clerkAppearance } from './clerkAppearance.js';
import { clerkPublishableKey, envDiagnostics, hasClerkKey } from './clerk.jsx';

const shouldForceReauth = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('reauth') === '1';

function MissingKeyNotice() {
  return (
    <main className="auth-container">
      <AuthShell
        eyebrow="Access configuration"
        title="Kinova auth is ready, but the Clerk publishable key is missing."
        description="Set the environment key once and the secure sign-in screens will render on every preview and production deployment."
        stageLabel="Configuration required"
      >
        <AuthStageSkeleton name="auth-sign-in" mode="sign-in" loading={false}>
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
  const { signOut } = useClerk();

  React.useEffect(() => {
    let isMounted = true;

    async function syncSession() {
      if (shouldForceReauth) {
        try {
          await signOut();
        } catch (error) {
          console.error('Failed to clear expired Clerk session:', error);
        }

        if (isMounted) {
          window.location.replace('/login');
        }
        return;
      }

      window.location.replace('/');
    }

    syncSession();

    return () => {
      isMounted = false;
    };
  }, [signOut]);

  return <AuthSkeleton label="session" />;
}
function LoginPage() {
  return (
    <main className="auth-container">
      <AuthShell
        eyebrow="Member access"
        title="Log back into the training route that adapts with your week."
        description="Kinova keeps your next useful session clear, whether you are training at home, outdoors, or with a compact setup."
        stageLabel={shouldForceReauth ? 'Session refresh' : 'Sign in'}
      >
        <ClerkLoading>
          <AuthStageSkeleton name="auth-sign-in" mode="sign-in" loading />
        </ClerkLoading>
        <ClerkLoaded>
          {shouldForceReauth ? (
            <AuthMessageCard
              title="Session expired"
              copy="Sign in again to continue with your current plan, workout history, and adaptive progression."
              tone="info"
            />
          ) : null}
          <Show when="signed-out">
            <AuthStageSkeleton name="auth-sign-in" mode="sign-in" loading={false}>
              <SignIn
                routing="virtual"
                signUpUrl="/register"
                forceRedirectUrl="/"
                fallbackRedirectUrl="/"
                appearance={clerkAppearance}
              />
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
        <LoginPage />
      </ClerkProvider>
    ) : (
      <MissingKeyNotice />
    )}
  </StrictMode>
);
