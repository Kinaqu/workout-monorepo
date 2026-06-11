// Feature controller for the recommendation shell; see features/history/index.ts.
// enter() keeps the old throwing contract: AuthRedirect and
// draft-unsupported errors propagate so the shell can fall back to the
// legacy plan-recovery flow.
import { api } from '../../lib/api/client.ts';
import type { RecommendationDraftResponse } from '../../lib/api/contracts.ts';
import {
  ApiError,
  AuthRedirectError,
  isRecommendationDraftNotFoundError,
  isRecommendationDraftUnsupportedError,
} from '../../lib/api/errors.ts';
import { ensureApiObject } from '../../shared/utils/guards.ts';
import type {
  RecommendationShellProps,
  RecommendationStep,
  RecommendationViewState,
} from './RecommendationShell.tsx';

interface RecommendationControllerOptions {
  showShellMode: (mode: 'recommendation') => void;
  onActivated: (activation: unknown) => void | Promise<void>;
}

const INITIAL_STATE: RecommendationViewState = {
  supported: true,
  status: 'idle',
  step: 'structure',
  draft: null,
  activeSlotId: null,
  pickerOpen: false,
  errorMessage: '',
  activationErrorMessage: '',
};

function getReadableErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function createRecommendationController({ showShellMode, onActivated }: RecommendationControllerOptions) {
  let state: RecommendationViewState = { ...INITIAL_STATE };
  const listeners = new Set<() => void>();

  const getViewState = () => state;
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  const setState = (patch: Partial<RecommendationViewState>) => {
    state = { ...state, ...patch };
    listeners.forEach(listener => listener());
  };

  async function loadOrCreateDraft(): Promise<RecommendationDraftResponse> {
    try {
      const currentDraft = ensureApiObject(
        await api.getRecommendationDraft(),
        'recommendation draft'
      ) as RecommendationDraftResponse;
      if (currentDraft.status === 'activated') {
        return ensureApiObject(await api.createRecommendationDraft(), 'recommendation draft') as RecommendationDraftResponse;
      }
      return currentDraft;
    } catch (error) {
      if (isRecommendationDraftNotFoundError(error)) {
        return ensureApiObject(await api.createRecommendationDraft(), 'recommendation draft') as RecommendationDraftResponse;
      }
      throw error;
    }
  }

  async function enter(prefetchedDraft: RecommendationDraftResponse | null = null): Promise<boolean> {
    setState({
      status: prefetchedDraft ? 'ready' : 'loading',
      errorMessage: '',
      activationErrorMessage: '',
    });

    showShellMode('recommendation');

    try {
      const draftResponse = prefetchedDraft ?? (await loadOrCreateDraft());
      setState({
        supported: true,
        status: 'ready',
        draft: draftResponse,
        errorMessage: '',
        activationErrorMessage: '',
      });
      return true;
    } catch (error) {
      if (error instanceof AuthRedirectError || isRecommendationDraftUnsupportedError(error)) {
        throw error;
      }

      setState({
        status: 'idle',
        draft: null,
        errorMessage: getReadableErrorMessage(error, 'Unable to load recommendations right now.'),
        activationErrorMessage: '',
      });
      return false;
    }
  }

  async function handleSelectStructure(structureId: string) {
    const draftResponse = state.draft;
    if (!draftResponse || !structureId) return;

    setState({ status: 'updating', errorMessage: '', activationErrorMessage: '' });

    try {
      const nextDraft = await api.selectRecommendationStructure({
        draft_id: draftResponse.id,
        structure_id: structureId,
      });
      setState({ status: 'ready', step: 'structure', draft: nextDraft, errorMessage: '' });
    } catch (error) {
      setState({
        status: 'ready',
        errorMessage: getReadableErrorMessage(error, 'Unable to change structure right now.'),
      });
    }
  }

  async function handleReplaceExercise(slotId: string, catalogExerciseId: string) {
    const draftResponse = state.draft;
    if (!draftResponse || !slotId || !catalogExerciseId) return;

    setState({ status: 'updating', errorMessage: '', activationErrorMessage: '' });

    try {
      const nextDraft = await api.replaceRecommendationExercise({
        draft_id: draftResponse.id,
        slot_id: slotId,
        catalog_exercise_id: catalogExerciseId,
      });
      setState({
        status: 'ready',
        step: 'exercise',
        draft: nextDraft,
        errorMessage: '',
        activeSlotId: null,
        pickerOpen: false,
      });
    } catch (error) {
      setState({
        status: 'ready',
        errorMessage: getReadableErrorMessage(error, 'Unable to replace this exercise right now.'),
      });
    }
  }

  async function handleActivateDraft() {
    const draftResponse = state.draft;
    if (!draftResponse) return;

    setState({ status: 'activating', errorMessage: '', activationErrorMessage: '' });

    try {
      const activation = await api.activateRecommendationDraft({ draft_id: draftResponse.id });
      setState({ status: 'ready', activationErrorMessage: '', activeSlotId: null, pickerOpen: false });
      await onActivated(activation);
    } catch (error) {
      setState({
        status: 'ready',
        activationErrorMessage: getReadableErrorMessage(error, 'Unable to activate this draft right now.'),
      });
    }
  }

  const props: RecommendationShellProps = {
    subscribe,
    getViewState,
    onSelectStructure: structureId => void handleSelectStructure(structureId),
    onOpenSlotPicker: slotId => setState({ activeSlotId: slotId, pickerOpen: true }),
    onPickExercise: (slotId, catalogExerciseId) => void handleReplaceExercise(slotId, catalogExerciseId),
    onClosePicker: () => setState({ activeSlotId: null, pickerOpen: false }),
    onGoToStep: (step: RecommendationStep) => setState({ step, errorMessage: '', activationErrorMessage: '' }),
    onActivate: () => void handleActivateDraft(),
    onRetry: () => void enter(),
  };

  return {
    props,
    enter,
    loadOrCreateDraft,
    markUnsupported: () => setState({ supported: false, status: 'idle', activeSlotId: null, pickerOpen: false }),
    reset: ({ preserveSupport = false }: { preserveSupport?: boolean } = {}) => {
      const supported = preserveSupport ? state.supported : true;
      state = { ...INITIAL_STATE, supported };
      listeners.forEach(listener => listener());
    },
  };
}
