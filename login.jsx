import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider, Show, SignIn, UserButton } from '@clerk/react';
import { clerkAppearance } from './clerkAppearance.js';

function LoginPage() {
  return (
    <main className="auth-container">
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
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider afterSignOutUrl="/register">
      <LoginPage />
    </ClerkProvider>
  </StrictMode>
);
