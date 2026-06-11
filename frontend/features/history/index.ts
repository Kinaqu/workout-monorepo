// Feature controller: owns the History tab's imperative surface (driven
// by the app shell) and the external view state its component renders.
import { hasActiveProgram } from '../../app/product-state.ts';
import { queryClient } from '../../lib/query/client.ts';
import type { ApiErrorRouting } from '../../shared/hooks/use-routed-api-error.ts';
import { getTodayDateString } from '../../shared/utils/date.js';
import type { HistoryTabProps, HistoryViewState } from './HistoryTab.tsx';

export function createHistoryController(routing: ApiErrorRouting) {
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

  function load(date: string) {
    if (!date) return;
    const recovery = !hasActiveProgram();
    setState({ date, recovery });
    if (!recovery) {
      // App-driven loads always refetch, matching the old imperative load().
      void queryClient.invalidateQueries({ queryKey: ['sessions', { date, limit: 50 }] });
    }
  }

  const props: HistoryTabProps = {
    subscribe,
    getViewState,
    onDateChange: date => load(date),
    enterRecovery: () => setState({ recovery: true }),
    routing,
  };

  return {
    props,
    getSelectedDate: () => state.date,
    load: async (date: string) => load(date),
    loadSelected: async () => {
      load(state.date || getTodayDateString());
    },
    renderRecoveryState: () => setState({ recovery: true }),
  };
}
