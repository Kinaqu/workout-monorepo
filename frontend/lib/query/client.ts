import { QueryClient } from '@tanstack/react-query';

// retry/refetchOnWindowFocus are disabled to keep request semantics
// identical to the previous hand-rolled fetching (and predictable under
// the smoke-test fetch mocks).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
});
