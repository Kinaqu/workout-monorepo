import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';

export default function App() {
  return (
    <main className="container" style={{ paddingTop: '2rem' }}>
      <header className="card" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <Show when="signed-out">
          <SignInButton />
          <SignUpButton />
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </header>
    </main>
  );
}
