import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useSyncExternalStore } from 'react';

import { api } from '../../lib/api/client.ts';
import type { ProgressionRunResponse, WorkoutTodayResponse } from '../../lib/api/contracts.ts';
import { ApiError, AuthRedirectError, isWorkoutAlreadyLoggedError, isWorkoutLogServerError, isWorkoutLogValidationError } from '../../lib/api/errors.ts';
import { startAuthSessionFlow } from '../../lib/api/client.ts';
import { queryKeys } from '../../lib/query/keys.ts';
import { EmptyState } from '../../shared/components/EmptyState.tsx';
import { ShellSkeleton } from '../../shared/components/ShellSkeleton.tsx';
import {
  classifyApiError,
  getApiErrorMessage,
  useRoutedApiError,
  type ApiErrorRouting,
} from '../../shared/hooks/use-routed-api-error.ts';
import { getTodayDateString, shiftDateString } from '../../shared/utils/date.js';
import { formatDateLabel, formatLongDateLabel, formatWorkoutTypeLabel } from '../../shared/utils/format.js';
import { ExerciseStack } from './ExerciseStack.tsx';

export type TodayStatus = 'idle' | 'active' | 'recovery';

export interface TodayViewState {
  date: string;
  status: TodayStatus;
  // Bootstrap-level errors the app shell surfaces through this tab.
  externalError: string;
}

export interface TodayTabProps {
  subscribe: (listener: () => void) => () => void;
  getViewState: () => TodayViewState;
  setDate: (date: string) => void;
  enterRecovery: () => void;
  routing: ApiErrorRouting;
}

type WorkoutPlan = Extract<WorkoutTodayResponse, { exercises: unknown }>;

function getLatestProgressionDate(progressionState: Record<string, { last_progression: string | null }>): string {
  return Object.values(progressionState).reduce((latest, state) => {
    if (!state?.last_progression) return latest;
    if (!latest || state.last_progression > latest) return state.last_progression;
    return latest;
  }, '');
}

function ProgressionFeedback({
  pending,
  lastRun,
  lastProgressionDate,
}: {
  pending: boolean;
  lastRun: ProgressionRunResponse | null;
  lastProgressionDate: string;
}) {
  if (pending) {
    return (
      <div id="today-progression-feedback" className="today-progression-feedback">
        <div className="card-title">Updating your plan…</div>
        <p className="card-subtitle">Checking recent workouts and refreshing the next recommended targets.</p>
      </div>
    );
  }

  if (!lastRun) {
    if (!lastProgressionDate) {
      return <div id="today-progression-feedback" className="today-progression-feedback hidden"></div>;
    }
    return (
      <div id="today-progression-feedback" className="today-progression-feedback">
        <div className="card-title">Your plan is up to date</div>
        <p className="card-subtitle">{`Last updated on ${formatLongDateLabel(lastProgressionDate)}.`}</p>
      </div>
    );
  }

  const changed = lastRun.result?.changed ?? [];
  const skipped = lastRun.result?.skipped ?? [];

  return (
    <div id="today-progression-feedback" className="today-progression-feedback">
      <div className="card-title">{`Plan updated for ${formatLongDateLabel(lastRun.progression_date)}`}</div>
      <div className="today-progression-summary">
        <div className="today-progression-pill">{`${changed.length} ${changed.length === 1 ? 'update' : 'updates'}`}</div>
        <div className="today-progression-pill is-muted">{`${skipped.length} unchanged`}</div>
      </div>
      {changed.length > 0 ? (
        <div className="today-progression-list">
          {changed.slice(0, 4).map(change => (
            <div className="today-progression-item" key={change.id}>
              <strong>{change.name || change.id}</strong>
              <div className="text-secondary">
                {`${change.before.min}-${change.before.max} -> ${change.after.min}-${change.after.max}, ${change.before.sets} -> ${change.after.sets} sets`}
              </div>
              <div className="text-secondary">{change.reason}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="card-subtitle">No targets changed this time. Your next workout stays the same.</p>
      )}
    </div>
  );
}

export function TodayTab({ subscribe, getViewState, setDate, enterRecovery, routing }: TodayTabProps) {
  const view = useSyncExternalStore(subscribe, getViewState);
  const queryClient = useQueryClient();

  const [saveError, setSaveError] = useState('');
  const [lockedOverride, setLockedOverride] = useState('');
  const [lastRun, setLastRun] = useState<ProgressionRunResponse | null>(null);

  const enabled = view.status === 'active' && Boolean(view.date);

  const workoutQuery = useQuery({
    queryKey: queryKeys.workout(view.date),
    queryFn: () => api.getTodayWorkout(view.date),
    enabled,
  });
  const programQuery = useQuery({
    queryKey: queryKeys.program,
    queryFn: () => api.getProgram(),
    enabled,
  });
  const sessionQuery = useQuery({
    queryKey: queryKeys.sessions({ date: view.date, limit: 1 }),
    queryFn: () => api.listSessions({ date: view.date, limit: 1 }),
    enabled,
  });

  const loadError = workoutQuery.error ?? programQuery.error ?? sessionQuery.error;
  useRoutedApiError(loadError, routing, enterRecovery);

  const saveMutation = useMutation({
    mutationFn: async (input: { workoutType: string; exercises: Array<{ id: string; sets: number[] }> }) => {
      const existing = await api.listSessions({ date: view.date, limit: 1 });
      if (existing.sessions[0]) {
        return { alreadySaved: true as const };
      }

      await api.logWorkout({ workout_type: input.workoutType, exercises: input.exercises, note: '' }, view.date);
      return { alreadySaved: false as const };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: error => {
      if (error instanceof AuthRedirectError) return;

      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        try {
          startAuthSessionFlow(error.message);
        } catch (redirectError) {
          if (redirectError instanceof AuthRedirectError) return;
          throw redirectError;
        }
      }

      if (isWorkoutAlreadyLoggedError(error)) {
        setLockedOverride('This workout has already been saved for that date.');
        void queryClient.invalidateQueries({ queryKey: ['sessions'] });
        return;
      }

      if (isWorkoutLogValidationError(error)) {
        setSaveError(getApiErrorMessage(error));
        return;
      }

      if (isWorkoutLogServerError(error)) {
        setSaveError('Could not save workout right now. Please try again in a moment.');
        return;
      }

      setSaveError(`Could not save workout: ${getApiErrorMessage(error)}`);
    },
  });

  const progressionMutation = useMutation({
    mutationFn: () => api.runProgression(),
    onSuccess: result => {
      setLastRun(result);
      void queryClient.invalidateQueries({ queryKey: ['workout'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.program });
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: error => {
      const kind = classifyApiError(error);
      if (kind === 'auth-redirect') return;
      if (kind === 'onboarding-incomplete') {
        void routing.onEnterOnboarding();
        return;
      }
      if (kind === 'missing-program') {
        routing.onMissingProgram();
        enterRecovery();
        return;
      }
      setSaveError(`Could not update your plan: ${getApiErrorMessage(error)}`);
    },
  });

  const isLoading = enabled && (workoutQuery.isLoading || programQuery.isLoading || sessionQuery.isLoading);
  const workout = workoutQuery.data ?? null;
  const isRest = workout?.type === 'rest';
  const plan = workout && !isRest && 'exercises' in workout ? (workout as WorkoutPlan) : null;
  const saved = Boolean(sessionQuery.data?.sessions?.[0]);

  const progressionStateDate = getLatestProgressionDate(programQuery.data?.progressionState ?? {});
  const lastProgressionDate = [progressionStateDate, lastRun?.progression_date ?? '']
    .filter(Boolean)
    .sort()
    .at(-1) ?? '';

  const unhandledLoadError =
    loadError && classifyApiError(loadError) === 'unhandled' ? `Could not load workout: ${getApiErrorMessage(loadError)}` : '';
  const errorMessage = unhandledLoadError || saveError || view.externalError;

  const showRecovery = view.status === 'recovery';
  const showContent = showRecovery || (enabled && !isLoading && Boolean(workout));
  const isToday = view.date === getTodayDateString();

  const lockedMessage = lockedOverride
    ? lockedOverride
    : saved && workout
      ? workout.date === getTodayDateString()
        ? 'Today is already done.'
        : `${formatDateLabel(workout.date)} is already logged.`
      : '';

  let guidance: { title: string; copy: string } | null = null;
  if (!showRecovery && showContent) {
    if (saved) {
      guidance = { title: 'Workout already logged', copy: 'Open History if you want to review the saved sets.' };
    } else if (isRest) {
      guidance = { title: 'Recovery day', copy: 'No logging needed for this date.' };
    } else if (plan && plan.exercises.length === 0) {
      guidance = { title: 'Nothing to log', copy: 'This generated workout is currently empty.' };
    } else if (plan) {
      guidance = { title: 'Log each set', copy: 'Enter reps or seconds, then move to the next exercise.' };
    }
  }

  const showExercises = Boolean(showContent && !showRecovery && !saved && !isRest && plan);
  const dateControlsDisabled = isLoading;
  const progressionDisabled = view.status !== 'active' || progressionMutation.isPending || isLoading;

  function handleDateChange(value: string) {
    setSaveError('');
    setLockedOverride('');
    setDate(value || getTodayDateString());
  }

  return (
    <>
      <h1 className="section-title mb-4">
        <span className="section-title-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"></path>
            <path d="m2.5 21.5 1.4-1.4"></path>
            <path d="m20.1 3.9 1.4-1.4"></path>
            <path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"></path>
            <path d="m9.6 14.4 4.8-4.8"></path>
          </svg>
        </span>
        <span>Today</span>
      </h1>
      {view.status === 'idle' || isLoading ? (
        <div id="today-loader" className="loader" aria-hidden="true">
          {isLoading ? <ShellSkeleton name="today-shell" /> : null}
        </div>
      ) : null}
      <div id="today-error" className="error-message">
        {errorMessage}
      </div>
      {showContent ? (
        <div id="today-content">
          <div className="card today-overview-card">
            <div className="today-overview-copy">
              <div id="today-workout-name" className="card-title">
                {showRecovery ? 'No plan yet' : isRest ? 'Rest day' : plan?.name || 'Today’s workout'}
              </div>
              <div id="today-workout-date" className="today-overview-date">
                {formatLongDateLabel(showRecovery ? view.date : (workout?.date ?? view.date))}
              </div>
            </div>
            <div id="today-workout-type" className="card-subtitle">
              {showRecovery ? 'Build one to start' : formatWorkoutTypeLabel(workout?.type ?? '')}
            </div>
          </div>
          {guidance ? (
            <div id="today-guidance" className="card today-guidance-card">
              <div id="today-guidance-title" className="card-title">
                {guidance.title}
              </div>
              <p id="today-guidance-copy" className="card-subtitle">
                {guidance.copy}
              </p>
            </div>
          ) : null}
          {showRecovery ? (
            <EmptyState
              id="today-empty-state"
              title="No plan yet"
              message="Build your first plan, then today’s workout will show up here."
              action={{ text: 'Open Plan', type: 'open-tab', targetTab: 'program' }}
            />
          ) : null}
          {showExercises && plan ? (
            <ExerciseStack
              key={`${plan.date}:${plan.type}`}
              plan={plan}
              saving={saveMutation.isPending}
              onSave={exercises => {
                setSaveError('');
                saveMutation.mutate({ workoutType: plan.type, exercises });
              }}
            />
          ) : null}
          {plan && plan.exercises.length === 0 ? (
            <div id="today-exercises">
              <div className="text-center text-secondary">No exercises</div>
            </div>
          ) : null}
          {isRest && !saved ? (
            <div id="today-rest-message" className="text-center mt-4">
              <p>No workout today. Recover and come back tomorrow.</p>
            </div>
          ) : null}
          {lockedMessage ? (
            <div id="today-locked-message" className="card today-status-card">
              {lockedMessage}
            </div>
          ) : null}
          <div className="card today-controls-card">
            <div className="today-controls-header">
              <div>
                <div className="card-title">Plan tools</div>
                <div id="today-selected-date-label" className="card-subtitle">
                  {view.date
                    ? `${isToday ? 'Today' : 'Viewing'} · ${formatLongDateLabel(view.date)}`
                    : 'Choose a date or refresh your plan.'}
                </div>
              </div>
              <button
                id="today-run-progression-button"
                className="secondary-button"
                type="button"
                disabled={progressionDisabled}
                onClick={() => progressionMutation.mutate()}
              >
                Update plan
              </button>
            </div>
            <div className="today-date-toolbar">
              <button
                id="today-date-prev-button"
                className="secondary-button today-date-button"
                type="button"
                aria-label="Previous day"
                disabled={dateControlsDisabled}
                onClick={() => handleDateChange(shiftDateString(view.date, -1))}
              >
                Prev
              </button>
              <input
                type="date"
                id="today-date"
                value={view.date}
                disabled={dateControlsDisabled}
                onChange={event => handleDateChange(event.target.value)}
              />
              <button
                id="today-date-next-button"
                className="secondary-button today-date-button"
                type="button"
                aria-label="Next day"
                disabled={dateControlsDisabled}
                onClick={() => handleDateChange(shiftDateString(view.date, 1))}
              >
                Next
              </button>
            </div>
            <div className="today-date-shortcuts">
              <button
                id="today-date-reset-button"
                className="secondary-button today-date-shortcut"
                type="button"
                disabled={dateControlsDisabled}
                onClick={() => handleDateChange(getTodayDateString())}
              >
                Jump to today
              </button>
              {lastProgressionDate ? (
                <div id="today-progression-last-run" className="today-inline-meta">
                  {`Last run: ${formatLongDateLabel(lastProgressionDate)}`}
                </div>
              ) : null}
            </div>
            <ProgressionFeedback
              pending={progressionMutation.isPending}
              lastRun={lastRun}
              lastProgressionDate={lastProgressionDate}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
