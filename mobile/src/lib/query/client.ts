import { QueryClient } from '@tanstack/react-query';

// retry/refetchOnWindowFocus are disabled to keep request semantics identical
// to the web app's hand-rolled fetching. A persisted cache (MMKV) is layered on
// top in Phase 5 for the "online + on-disk cache" behavior.
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
