import { useState, useSyncExternalStore } from 'react';
import { Alert, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api/client';
import type { ProgramResponse } from '@/lib/api/contracts';
import { queryKeys } from '@/lib/query/keys';
import {
  classifyApiError,
  getApiErrorMessage,
  useRoutedApiError,
  type ApiErrorRouting,
} from '@/shared/hooks/use-routed-api-error';
import { hasCompletedOnboarding } from '@/lib/product-state';
import { formatLongDateLabel } from '@/shared/utils/date';
import { formatPlanSlotLabel, formatWorkoutTypeLabel, humanizeToken } from '@/shared/utils/format';

// The web app ships ProgramEditor / regenerate-reset toolbar / version insights
// behind SHOW_PROGRAM_ADVANCED_TOOLS = false (disabled), so this port covers the
// live behaviour only: the read-only plan view + the recovery regenerate flow.
const DAY_OPTIONS: [string, string][] = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
];

export type ProgramStatus = 'idle' | 'active' | 'recovery';

export interface ProgramViewState {
  status: ProgramStatus;
  actionsVisible: boolean;
  pendingRegenerate: number;
}

export interface ProgramTabProps {
  subscribe: (listener: () => void) => () => void;
  getViewState: () => ProgramViewState;
  enterRecovery: () => void;
  routing: ApiErrorRouting;
  refreshProductState: () => Promise<void>;
}

type ProgressionStateValue = ProgramResponse['progressionState'][string];
type ProgramExercise = ProgramResponse['workouts'][string]['exercises'][number];

function countProgramExercises(program: ProgramResponse): number {
  return Object.values(program.workouts ?? {}).reduce(
    (count, workout) => count + (Array.isArray(workout.exercises) ? workout.exercises.length : 0),
    0
  );
}

function getLatestProgressionDate(progressionState: Record<string, ProgressionStateValue>): string {
  return Object.values(progressionState).reduce((latest, state) => {
    if (!state?.last_progression) return latest;
    if (!latest || state.last_progression > latest) return state.last_progression;
    return latest;
  }, '');
}

function formatVersionStatus(program: ProgramResponse): string {
  const versionNumber = program.active_version?.version_number;
  return Number.isInteger(versionNumber) ? `Active · v${versionNumber}` : 'Active';
}

function formatProgramTarget(exercise: ProgramExercise, progressionState: ProgressionStateValue | null): string {
  const min = progressionState?.min;
  const max = progressionState?.max;
  const fallback =
    exercise.type === 'reps' ? exercise.reps : exercise.type === 'time' ? exercise.duration : exercise.cycles;
  const unit = exercise.type === 'reps' ? 'reps' : exercise.type === 'time' ? 'sec' : 'cycles';
  const from = Number.isInteger(min) ? min : fallback?.min;
  const to = Number.isInteger(max) ? max : fallback?.max;
  return from && to ? `${from}-${to} ${unit}` : 'Custom target';
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="label">{label}</AppText>
      <AppText style={styles.statValue}>{value}</AppText>
    </View>
  );
}

function confirmRegenerate(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Build a new generated plan?',
      'This creates a fresh program version from your saved onboarding profile. Your current plan stays in history, but the active plan is replaced.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Build new plan', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

export function ProgramTab({ subscribe, getViewState, enterRecovery, routing, refreshProductState }: ProgramTabProps) {
  const view = useSyncExternalStore(subscribe, getViewState);
  const queryClient = useQueryClient();

  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const enabled = view.status === 'active';
  const programQuery = useQuery({
    queryKey: queryKeys.program,
    queryFn: () => api.getProgram(),
    enabled,
  });

  useRoutedApiError(programQuery.error, routing, enterRecovery);

  const program = programQuery.data ?? null;

  async function runRegenerate() {
    if (!hasCompletedOnboarding() || busy) return;

    const confirmed = await confirmRegenerate();
    if (!confirmed) return;

    setBusy(true);
    setActionError('');

    try {
      await api.regenerateProgram();
      await queryClient.invalidateQueries({ queryKey: queryKeys.program });
      await refreshProductState();
    } catch (error) {
      const kind = classifyApiError(error);
      if (kind === 'auth-redirect') return;
      if (kind === 'onboarding-incomplete') {
        void routing.onEnterOnboarding();
        return;
      }
      setActionError(`Could not build a new plan: ${getApiErrorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }

  const isLoading = enabled && programQuery.isLoading;
  const unhandledLoadError =
    programQuery.error && classifyApiError(programQuery.error) === 'unhandled'
      ? `Could not load plan: ${getApiErrorMessage(programQuery.error)}`
      : '';
  const errorMessage = unhandledLoadError || actionError;

  const showRecovery = view.status === 'recovery';
  const showMain = enabled && !isLoading && Boolean(program);

  const latestProgressionDate = program ? getLatestProgressionDate(program.progressionState ?? {}) : '';
  const workoutCount = program ? Object.keys(program.workouts ?? {}).length : 0;
  const exerciseCount = program ? countProgramExercises(program) : 0;
  const cadenceLabel = `${workoutCount} ${workoutCount === 1 ? 'session' : 'sessions'} · ${exerciseCount} exercises`;

  return (
    <View style={styles.container}>
      <AppText style={styles.heading}>Plan</AppText>

      {view.status === 'idle' || isLoading ? (
        <View style={styles.loader}>
          <Skeleton width="60%" height={22} />
          <Skeleton width="100%" height={120} radius={24} />
          <Skeleton width="100%" height={180} radius={24} />
        </View>
      ) : null}

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      {showRecovery ? (
        <EmptyState
          title="No plan available"
          message="Build a fresh plan from your saved preferences."
          action={{ label: busy ? 'Building…' : 'Build plan', onPress: () => void runRegenerate() }}
        />
      ) : null}

      {showMain && program ? (
        <View style={styles.content}>
          <Card style={styles.cardGap}>
            <View style={styles.rowBetween}>
              <View style={styles.flexShrink}>
                <AppText variant="title">Current plan</AppText>
                <AppText variant="secondary">{cadenceLabel}</AppText>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{formatVersionStatus(program)}</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <Stat label="Plan" value={program.name} />
              <Stat label="Schedule" value={cadenceLabel} />
              <Stat
                label="Last update"
                value={latestProgressionDate ? formatLongDateLabel(latestProgressionDate) : 'Not yet'}
              />
            </View>
          </Card>

          <Card style={styles.cardGap}>
            <AppText variant="title">Week</AppText>
            <View style={styles.scheduleList}>
              {DAY_OPTIONS.map(([key, label]) => (
                <View style={styles.scheduleRow} key={key}>
                  <Text style={styles.scheduleDay}>{label.slice(0, 3)}</Text>
                  <Text style={styles.scheduleValue}>
                    {formatPlanSlotLabel(program.schedule[key as keyof typeof program.schedule] || 'rest')}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          <AppText variant="title" style={styles.sessionsHeading}>
            Sessions
          </AppText>
          {Object.entries(program.workouts ?? {}).map(([type, workout]) => (
            <Card key={type} style={styles.cardGap}>
              <View style={styles.rowBetween}>
                <AppText variant="title">{workout.name || type}</AppText>
                <Text style={styles.workoutType}>{formatWorkoutTypeLabel(type)}</Text>
              </View>
              {workout.exercises && workout.exercises.length > 0 ? (
                <View style={styles.exerciseList}>
                  {workout.exercises.map((exercise) => {
                    const exerciseProgression = program.progressionState?.[exercise.id] ?? null;
                    const currentSets = exerciseProgression?.sets ?? program.userSets?.[exercise.id] ?? 1;
                    return (
                      <View style={styles.exerciseRow} key={exercise.id}>
                        <View style={styles.flexShrink}>
                          <AppText style={styles.exerciseName}>{exercise.name || humanizeToken(exercise.id)}</AppText>
                          <AppText variant="secondary">{formatProgramTarget(exercise, exerciseProgression)}</AppText>
                          <AppText variant="muted">
                            {exerciseProgression?.last_progression
                              ? `Updated ${exerciseProgression.last_progression}`
                              : 'No recent changes'}
                          </AppText>
                        </View>
                        <View style={styles.setsPill}>
                          <Text style={styles.setsPillText}>{`${currentSets}/${exercise.max_sets} sets`}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <AppText variant="secondary">No exercises in this session.</AppText>
              )}
            </Card>
          ))}
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
  cardGap: {
    gap: theme.space.md,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.space.sm,
  },
  flexShrink: {
    flexShrink: 1,
    gap: theme.space.xs,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(111, 182, 255, 0.12)',
  },
  badgeText: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 12,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  stat: {
    flexGrow: 1,
    flexBasis: '30%',
    gap: 2,
    padding: theme.space.sm,
    borderRadius: theme.radii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.copyPrimary,
  },
  scheduleList: {
    gap: theme.space.xs,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.space.xs,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  scheduleDay: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.copySecondary,
  },
  scheduleValue: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
    color: theme.colors.copyPrimary,
  },
  sessionsHeading: {
    fontSize: 18,
    marginTop: theme.space.sm,
  },
  workoutType: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.accentSoft,
  },
  exerciseList: {
    gap: theme.space.sm,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space.sm,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  exerciseName: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 15,
    color: theme.colors.copyPrimary,
  },
  setsPill: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surfacePanelStrong,
  },
  setsPillText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.copyPrimary,
  },
}));
