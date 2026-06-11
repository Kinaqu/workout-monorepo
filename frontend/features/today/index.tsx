// Coexistence bridge for the Today tab; see features/history/index.tsx.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '../../lib/query/client.ts';
import type { ApiErrorRouting } from '../../shared/hooks/use-routed-api-error.ts';
import { getTodayDateString } from '../../shared/utils/date.js';
import { hasActiveProgram } from '../../store/app-store.js';
import { TodayTab, type TodayViewState } from './TodayTab.tsx';

export function createTodayWorkoutFeature(routing: ApiErrorRouting) {
  let state: TodayViewState = { date: getTodayDateString(), status: 'idle' };
  const listeners = new Set<() => void>();

  const getViewState = () => state;
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  const setState = (patch: Partial<TodayViewState>) => {
    state = { ...state, ...patch };
    listeners.forEach(listener => listener());
  };

  const container = document.getElementById('tab-today');
  if (container) {
    createRoot(container).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <TodayTab
            subscribe={subscribe}
            getViewState={getViewState}
            setDate={date => setState({ date: date || getTodayDateString() })}
            enterRecovery={() => setState({ status: 'recovery' })}
            routing={routing}
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
      setState({ status });
      if (status === 'active') {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['workout'] }),
          queryClient.invalidateQueries({ queryKey: ['program'] }),
          queryClient.invalidateQueries({ queryKey: ['sessions'] }),
        ]);
      }
    },
    renderRecoveryState: () => setState({ status: 'recovery' }),
  };
}
