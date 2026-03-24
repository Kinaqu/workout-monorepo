import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider, Show, SignUp, UserButton } from '@clerk/react';
import { clerkAppearance } from './clerkAppearance.js';

function RegisterPage() {
  return (
    <main className="auth-container">
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
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider afterSignOutUrl="/register">
      <RegisterPage />
    </ClerkProvider>
  </StrictMode>
);
