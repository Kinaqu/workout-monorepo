// Feature controller for the Today tab. A DOM-free external store, ported
// verbatim from the web app (frontend/features/today/index.ts).
import { hasActiveProgram } from '@/lib/product-state';
import { queryClient } from '@/lib/query/client';
import type { ApiErrorRouting } from '@/shared/hooks/use-routed-api-error';
import { getTodayDateString } from '@/shared/utils/date';
import type { TodayTabProps, TodayViewState } from './TodayTab';

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
    listeners.forEach((listener) => listener());
  };

  const props: TodayTabProps = {
    subscribe,
    getViewState,
    setDate: (date) => setState({ date: date || getTodayDateString(), externalError: '' }),
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
