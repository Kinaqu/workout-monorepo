// Coexistence bridge for the Program tab; see features/history/index.tsx.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '../../lib/query/client.ts';
import { queryKeys } from '../../lib/query/keys.ts';
import type { ApiErrorRouting } from '../../shared/hooks/use-routed-api-error.ts';
import { hasActiveProgram, hasCompletedOnboarding } from '../../store/app-store.js';
import { ProgramTab, type ProgramViewState } from './ProgramTab.tsx';

export function createProgramFeature({
  onEnterOnboarding,
  onMissingProgram,
  onRefreshProductState,
}: ApiErrorRouting & { onRefreshProductState: () => Promise<void> }) {
  let state: ProgramViewState = { status: 'idle', actionsVisible: false, pendingRegenerate: 0 };
  const listeners = new Set<() => void>();

  const getViewState = () => state;
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  const setState = (patch: Partial<ProgramViewState>) => {
    state = { ...state, ...patch };
    listeners.forEach(listener => listener());
  };

  const container = document.getElementById('tab-program');
  if (container) {
    createRoot(container).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <ProgramTab
            subscribe={subscribe}
            getViewState={getViewState}
            enterRecovery={() => setState({ status: 'recovery' })}
            routing={{ onEnterOnboarding, onMissingProgram }}
            refreshProductState={onRefreshProductState}
          />
        </QueryClientProvider>
      </StrictMode>
    );
  }

  return {
    init() {},
    // App-driven loads always refetch, matching the old imperative load().
    load: async () => {
      const status = hasActiveProgram() ? 'active' : 'recovery';
      setState({
        status,
        actionsVisible: hasCompletedOnboarding() && hasActiveProgram(),
      });
      if (status === 'active') {
        await queryClient.invalidateQueries({ queryKey: queryKeys.program });
      }
    },
    renderRecoveryState: () => setState({ status: 'recovery' }),
    setActionsVisible: (visible: boolean) => setState({ actionsVisible: visible }),
    handleRegenerateProgram: async () => {
      setState({ pendingRegenerate: state.pendingRegenerate + 1 });
    },
  };
}
