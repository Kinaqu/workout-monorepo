// Feature controller for the Program tab; ported verbatim from
// frontend/features/program/index.ts (only import paths changed).
import { hasActiveProgram, hasCompletedOnboarding } from '@/lib/product-state';
import { queryClient } from '@/lib/query/client';
import { queryKeys } from '@/lib/query/keys';
import type { ApiErrorRouting } from '@/shared/hooks/use-routed-api-error';
import type { ProgramTabProps, ProgramViewState } from './ProgramTab';

export function createProgramController({
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
    listeners.forEach((listener) => listener());
  };

  const props: ProgramTabProps = {
    subscribe,
    getViewState,
    enterRecovery: () => setState({ status: 'recovery' }),
    routing: { onEnterOnboarding, onMissingProgram },
    refreshProductState: onRefreshProductState,
  };

  return {
    props,
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
