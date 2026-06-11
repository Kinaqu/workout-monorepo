// Feature controller for the Today tab; see features/history/index.ts.
import { hasActiveProgram } from '../../app/product-state.ts';
import { queryClient } from '../../lib/query/client.ts';
import type { ApiErrorRouting } from '../../shared/hooks/use-routed-api-error.ts';
import { getTodayDateString } from '../../shared/utils/date.ts';
import type { TodayTabProps, TodayViewState } from './TodayTab.tsx';

export function createTodayController(routing: ApiErrorRouting) {
  let state: TodayViewState = { date: getTodayDateString(), status: 'idle', externalError: '' };
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

  const props: TodayTabProps = {
    subscribe,
    getViewState,
    setDate: date => setState({ date: date || getTodayDateString(), externalError: '' }),
    enterRecovery: () => setState({ status: 'recovery' }),
    routing,
  };

  return {
    props,
    // App-driven loads always refetch, matching the old imperative load().
    load: async () => {
      const status = hasActiveProgram() ? 'active' : 'recovery';
      setState({ status, externalError: '' });
      if (status === 'active') {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['workout'] }),
          queryClient.invalidateQueries({ queryKey: ['program'] }),
          queryClient.invalidateQueries({ queryKey: ['sessions'] }),
        ]);
      }
    },
    renderRecoveryState: () => setState({ status: 'recovery' }),
    setExternalError: (message: string) => setState({ externalError: message }),
  };
}
