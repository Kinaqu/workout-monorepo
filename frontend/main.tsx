import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';

import { App } from './app/App.tsx';
import { ensureClerkReady } from './lib/auth/clerk.ts';
import { queryClient } from './lib/query/client.ts';

async function bootstrap() {
  try {
    const { isSignedIn } = await ensureClerkReady();

    if (!isSignedIn) {
      window.location.replace('/login');
      return;
    }
  } catch (error) {
    console.error('Failed to initialize Clerk on the main app page:', error);
    window.location.replace('/login');
    return;
  }

  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Missing #root container');
  }

  createRoot(container).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  );
}

void bootstrap();
