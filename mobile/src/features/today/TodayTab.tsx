import { useState, useSyncExternalStore } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { DateField } from '@/components/ui/DateField';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { api, startAuthSessionFlow } from '@/lib/api/client';
import type { ProgressionRunResponse, WorkoutTodayResponse } from '@/lib/api/contracts';
import {
  ApiError,
  AuthRedirectError,
  isWorkoutAlreadyLoggedError,
  isWorkoutLogServerError,
  isWorkoutLogValidationError,
} from '@/lib/api/errors';
import { queryKeys } from '@/lib/query/keys';
import {
  classifyApiError,
  getApiErrorMessage,
  useRoutedApiError,
  type ApiErrorRouting,
} from '@/shared/hooks/use-routed-api-error';
import { getTodayDateString, shiftDateString } from '@/shared/utils/date';
import { formatDateLabel, formatLongDateLabel, formatWorkoutTypeLabel } from '@/shared/utils/format';
import { ExerciseStack } from './ExerciseStack';

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

function getLatestProgressionDate(
  progressionState: Record<string, { last_progression: string | null }>
): string {
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
      <View style={styles.feedback}>
        <AppText variant="title">Updating your plan…</AppText>
        <AppText variant="subtitle">
          Checking recent workouts and refreshing the next recommended targets.
        </AppText>
      </View>
    );
  }

  if (!lastRun) {
    if (!lastProgressionDate) {
      return null;
    }
    return (
      <View style={styles.feedback}>
        <AppText variant="title">Your plan is up to date</AppText>
        <AppText variant="subtitle">{`Last updated on ${formatLongDateLabel(lastProgressionDate)}.`}</AppText>
      </View>
    );
  }

  const changed = lastRun.result?.changed ?? [];
  const skipped = lastRun.result?.skipped ?? [];

  return (
    <View style={styles.feedback}>
      <AppText variant="title">{`Plan updated for ${formatLongDateLabel(lastRun.progression_date)}`}</AppText>
      <View style={styles.feedbackPills}>
        <View style={styles.feedbackPill}>
          <Text style={styles.feedbackPillText}>{`${changed.length} ${changed.length === 1 ? 'update' : 'updates'}`}</Text>
        </View>
        <View style={[styles.feedbackPill, styles.feedbackPillMuted]}>
          <Text style={styles.feedbackPillText}>{`${skipped.length} unchanged`}</Text>
        </View>
      </View>
      {changed.length > 0 ? (
        <View style={styles.feedbackList}>
          {changed.slice(0, 4).map((change) => (
            <View style={styles.feedbackItem} key={change.id}>
              <AppText style={styles.feedbackItemTitle}>{change.name || change.id}</AppText>
              <AppText variant="secondary">
                {`${change.before.min}-${change.before.max} -> ${change.after.min}-${change.after.max}, ${change.before.sets} -> ${change.after.sets} sets`}
              </AppText>
              <AppText variant="secondary">{change.reason}</AppText>
            </View>
          ))}
        </View>
      ) : (
        <AppText variant="subtitle">No targets changed this time. Your next workout stays the same.</AppText>
      )}
    </View>
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
    mutationFn: async (input: { workoutType: string; exercises: { id: string; sets: number[] }[] }) => {
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
    onError: (error) => {
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
    onSuccess: (result) => {
      setLastRun(result);
      void queryClient.invalidateQueries({ queryKey: ['workout'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.program });
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (error) => {
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
  const lastProgressionDate =
    [progressionStateDate, lastRun?.progression_date ?? '']
      .filter(Boolean)
      .sort()
      .at(-1) ?? '';

  const unhandledLoadError =
    loadError && classifyApiError(loadError) === 'unhandled'
      ? `Could not load workout: ${getApiErrorMessage(loadError)}`
      : '';
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
    <View style={styles.container}>
      <AppText style={styles.heading}>Today</AppText>

      {view.status === 'idle' || isLoading ? (
        <View style={styles.loader}>
          <Skeleton width="60%" height={22} />
          <Skeleton width="100%" height={120} radius={24} />
          <Skeleton width="100%" height={180} radius={24} />
        </View>
      ) : null}

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      {showContent ? (
        <View style={styles.content}>
          <Card style={styles.overviewCard}>
            <View style={styles.overviewCopy}>
              <AppText variant="title">
                {showRecovery ? 'No plan yet' : isRest ? 'Rest day' : plan?.name || 'Today’s workout'}
              </AppText>
              <AppText variant="muted">
                {formatLongDateLabel(showRecovery ? view.date : workout?.date ?? view.date)}
              </AppText>
            </View>
            <View style={styles.overviewBadge}>
              <Text style={styles.overviewBadgeText}>
                {showRecovery ? 'Build one to start' : formatWorkoutTypeLabel(workout?.type ?? '')}
              </Text>
            </View>
          </Card>

          {guidance ? (
            <Card style={styles.guidanceCard}>
              <AppText variant="title" style={styles.guidanceTitle}>
                {guidance.title}
              </AppText>
              <AppText variant="subtitle">{guidance.copy}</AppText>
            </Card>
          ) : null}

          {showRecovery ? (
            <EmptyState
              title="No plan yet"
              message="Build your first plan, then today’s workout will show up here."
              action={{ label: 'Open Plan', onPress: () => {} }}
            />
          ) : null}

          {showExercises && plan ? (
            <ExerciseStack
              key={`${plan.date}:${plan.type}`}
              plan={plan}
              saving={saveMutation.isPending}
              onSave={(exercises) => {
                setSaveError('');
                saveMutation.mutate({ workoutType: plan.type, exercises });
              }}
            />
          ) : null}

          {plan && plan.exercises.length === 0 ? (
            <AppText variant="secondary" style={styles.centered}>
              No exercises
            </AppText>
          ) : null}

          {isRest && !saved ? (
            <AppText variant="secondary" style={styles.centered}>
              No workout today. Recover and come back tomorrow.
            </AppText>
          ) : null}

          {lockedMessage ? (
            <Card style={styles.statusCard}>
              <AppText variant="secondary" style={styles.centered}>
                {lockedMessage}
              </AppText>
            </Card>
          ) : null}

          <Card style={styles.controlsCard}>
            <View style={styles.controlsHeader}>
              <View style={styles.controlsHeaderCopy}>
                <AppText variant="title">Plan tools</AppText>
                <AppText variant="subtitle">
                  {view.date
                    ? `${isToday ? 'Today' : 'Viewing'} · ${formatLongDateLabel(view.date)}`
                    : 'Choose a date or refresh your plan.'}
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={progressionDisabled}
                onPress={() => progressionMutation.mutate()}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.pressed,
                  progressionDisabled && styles.disabled,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Update plan</Text>
              </Pressable>
            </View>

            <View style={styles.dateToolbar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous day"
                disabled={dateControlsDisabled}
                onPress={() => handleDateChange(shiftDateString(view.date, -1))}
                style={({ pressed }) => [styles.dateButton, pressed && styles.pressed, dateControlsDisabled && styles.disabled]}
              >
                <Text style={styles.secondaryButtonText}>Prev</Text>
              </Pressable>
              <View style={styles.dateFieldWrap}>
                <DateField value={view.date} onChange={handleDateChange} disabled={dateControlsDisabled} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next day"
                disabled={dateControlsDisabled}
                onPress={() => handleDateChange(shiftDateString(view.date, 1))}
                style={({ pressed }) => [styles.dateButton, pressed && styles.pressed, dateControlsDisabled && styles.disabled]}
              >
                <Text style={styles.secondaryButtonText}>Next</Text>
              </Pressable>
            </View>

            <View style={styles.shortcuts}>
              <Pressable
                accessibilityRole="button"
                disabled={dateControlsDisabled}
                onPress={() => handleDateChange(getTodayDateString())}
                style={({ pressed }) => [styles.dateButton, pressed && styles.pressed, dateControlsDisabled && styles.disabled]}
              >
                <Text style={styles.secondaryButtonText}>Jump to today</Text>
              </Pressable>
              {lastProgressionDate ? (
                <View style={styles.inlineMeta}>
                  <Text style={styles.inlineMetaText}>{`Last run: ${formatLongDateLabel(lastProgressionDate)}`}</Text>
                </View>
              ) : null}
            </View>

            <ProgressionFeedback
              pending={progressionMutation.isPending}
              lastRun={lastRun}
              lastProgressionDate={lastProgressionDate}
            />
          </Card>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.space.md,
  },
  heading: {
    fontFamily: theme.fonts.displaySemiBold,
    fontSize: 26,
    color: theme.colors.foreground,
    marginBottom: theme.space.xs,
  },
  loader: {
    gap: theme.space.md,
    marginVertical: theme.space.md,
  },
  error: {
    color: theme.colors.error,
    textAlign: 'center',
    fontFamily: theme.fonts.body,
    marginVertical: theme.space.sm,
  },
  content: {
    gap: theme.space.md,
  },
  overviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space.md,
  },
  overviewCopy: {
    flexShrink: 1,
    gap: theme.space.xs,
  },
  overviewBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(111, 182, 255, 0.12)',
  },
  overviewBadgeText: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 12,
  },
  guidanceCard: {
    gap: theme.space.xs,
    borderColor: 'rgba(111, 182, 255, 0.16)',
  },
  guidanceTitle: {
    fontSize: 16,
  },
  centered: {
    textAlign: 'center',
  },
  statusCard: {
    alignItems: 'center',
  },
  controlsCard: {
    gap: theme.space.md,
  },
  controlsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.space.md,
  },
  controlsHeaderCopy: {
    flexShrink: 1,
    gap: theme.space.xs,
  },
  dateToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  dateFieldWrap: {
    flex: 1,
  },
  shortcuts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space.sm,
  },
  secondaryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  dateButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  secondaryButtonText: {
    color: theme.colors.copyPrimary,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  inlineMeta: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(111, 182, 255, 0.12)',
  },
  inlineMetaText: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
  },
  feedback: {
    gap: theme.space.sm,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  feedbackPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feedbackPill: {
    minHeight: 30,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
  },
  feedbackPillMuted: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  feedbackPillText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.copyPrimary,
  },
  feedbackList: {
    gap: 8,
  },
  feedbackItem: {
    gap: 2,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  feedbackItemTitle: {
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.copyPrimary,
  },
}));
