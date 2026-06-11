// Coexistence bridge: app.js keeps driving features through the same
// factory interface while the tab's UI is owned by a React root mounted
// into the #tab-history container. The bridge dies when the app shell
// itself moves to React.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '../../lib/query/client.ts';
import type { ApiErrorRouting } from '../../shared/hooks/use-routed-api-error.ts';
import { getTodayDateString } from '../../shared/utils/date.js';
import { hasActiveProgram } from '../../store/app-store.js';
import { HistoryTab, type HistoryViewState } from './HistoryTab.tsx';

export function createHistoryFeature(routing: ApiErrorRouting) {
  let state: HistoryViewState = { date: '', recovery: false };
  const listeners = new Set<() => void>();

  const getViewState = () => state;
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  const setState = (patch: Partial<HistoryViewState>) => {
    state = { ...state, ...patch };
    listeners.forEach(listener => listener());
  };

  const container = document.getElementById('tab-history');
  if (container) {
    createRoot(container).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <HistoryTab
            subscribe={subscribe}
            getViewState={getViewState}
            onDateChange={date => load(date)}
            enterRecovery={() => setState({ recovery: true })}
            routing={routing}
          />
        </QueryClientProvider>
      </StrictMode>
    );
  }

  function load(date: string) {
    if (!date) return;
    const recovery = !hasActiveProgram();
    setState({ date, recovery });
    if (!recovery) {
      // App-driven loads always refetch, matching the old imperative load().
      void queryClient.invalidateQueries({ queryKey: ['sessions', { date, limit: 50 }] });
    }
  }

  async function loadSelected() {
    load(state.date || getTodayDateString());
  }

  return {
    init() {},
    getSelectedDate: () => state.date,
    load: async (date: string) => load(date),
    loadSelected,
    renderRecoveryState: () => setState({ recovery: true }),
  };
}
