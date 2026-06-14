import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { DateField } from '@/components/ui/DateField';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api/client';
import type { WorkoutSessionRecord } from '@/lib/api/contracts';
import { queryKeys } from '@/lib/query/keys';
import {
  classifyApiError,
  getApiErrorMessage,
  useRoutedApiError,
  type ApiErrorRouting,
} from '@/shared/hooks/use-routed-api-error';
import { formatDateLabel, formatWorkoutTypeLabel, humanizeToken } from '@/shared/utils/format';

export interface HistoryViewState {
  date: string;
  recovery: boolean;
}

export interface HistoryTabProps {
  subscribe: (listener: () => void) => () => void;
  getViewState: () => HistoryViewState;
  onDateChange: (date: string) => void;
  enterRecovery: () => void;
  routing: ApiErrorRouting;
}

type SessionExercise = WorkoutSessionRecord['exercises'][number];

function getSessionTitle(session: WorkoutSessionRecord): string {
  return session.workoutName || formatWorkoutTypeLabel(session.workoutType) || 'Logged session';
}

function formatSourceLabel(source: string): string {
  if (source === 'json') return 'Saved workout';
  if (source === 'text') return 'Quick text entry';
  if (source === 'legacy-kv') return 'Imported workout';
  return humanizeToken(source || 'unknown');
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

type TagTone = 'neutral' | 'accent' | 'warning';

function Tag({ label, tone = 'neutral' }: { label: string; tone?: TagTone }) {
  return (
    <View style={[styles.tag, tone === 'accent' && styles.tagAccent, tone === 'warning' && styles.tagWarning]}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaStat}>
      <AppText variant="label">{label}</AppText>
      <AppText style={styles.metaValue}>{value}</AppText>
    </View>
  );
}

function EmptyCard({ title, message }: { title: string; message: string }) {
  return (
    <Card style={styles.gap}>
      <AppText variant="title">{title}</AppText>
      <AppText variant="secondary">{message}</AppText>
    </Card>
  );
}

function OverviewCard({
  session,
  matched,
  unmatched,
}: {
  session: WorkoutSessionRecord;
  matched: SessionExercise[];
  unmatched: SessionExercise[];
}) {
  return (
    <Card style={styles.gap}>
      <View style={styles.detailHeader}>
        <View style={styles.detailTitleWrap}>
          <AppText variant="label">{formatDateLabel(session.sessionDate)}</AppText>
          <AppText variant="title">{getSessionTitle(session)}</AppText>
        </View>
        <Tag label={`Source: ${formatSourceLabel(session.source)}`} />
      </View>
      <View style={styles.metaGrid}>
        <MetaStat
          label="Plan day"
          value={session.workoutType ? formatWorkoutTypeLabel(session.workoutType) : 'Not assigned'}
        />
        <MetaStat label="Saved" value={formatDateTime(session.createdAt)} />
        <MetaStat label="Updated" value={formatDateTime(session.updatedAt)} />
        <MetaStat label="Extra lines" value={session.unmatched.length ? `${session.unmatched.length}` : 'None'} />
      </View>
      <View style={styles.pillRow}>
        <Tag label={`${matched.length} tracked`} tone="accent" />
        <Tag label={`${unmatched.length} extra`} tone="warning" />
        <Tag label={`${session.exercises.length} saved`} />
      </View>
    </Card>
  );
}

function ExerciseCard({ exercise, index }: { exercise: SessionExercise; index: number }) {
  return (
    <Card style={styles.gap}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseIndex}>{`#${index + 1}`}</Text>
        <View style={styles.exerciseTitleWrap}>
          <AppText variant="title">{exercise.exerciseName || humanizeToken(exercise.exerciseKey || 'exercise')}</AppText>
          <AppText variant="secondary">{exercise.matched ? 'Tracked in your plan' : 'Saved as an extra line'}</AppText>
        </View>
      </View>
      <View style={styles.pillRow}>
        <Tag label={exercise.matched ? 'Tracked' : 'Extra line'} tone={exercise.matched ? 'accent' : 'warning'} />
        <Tag label={exercise.exerciseType ? humanizeToken(exercise.exerciseType) : 'Unknown type'} />
        <Tag label={`${exercise.sets.length} ${exercise.sets.length === 1 ? 'set' : 'sets'}`} />
      </View>
      {exercise.sets.length > 0 ? (
        <View style={styles.setList}>
          {exercise.sets.map((setValue, setIndex) => (
            <View style={styles.setRow} key={setIndex}>
              <Text style={styles.setLabel}>{`Set ${setIndex + 1}`}</Text>
              <Text style={styles.setValue}>{String(setValue)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <AppText variant="secondary">No set values were saved for this exercise.</AppText>
      )}
    </Card>
  );
}

function ExerciseSection({
  title,
  exercises,
  description,
}: {
  title: string;
  exercises: SessionExercise[];
  description: string;
}) {
  return (
    <View style={styles.section}>
      <AppText variant="title">{title}</AppText>
      <AppText variant="secondary">{description}</AppText>
      {exercises.length === 0 ? (
        <EmptyCard title="Nothing to show." message="Nothing was saved in this section for the selected workout." />
      ) : (
        <View style={styles.gap}>
          {exercises.map((exercise, index) => (
            <ExerciseCard exercise={exercise} index={index} key={exercise.id || index} />
          ))}
        </View>
      )}
    </View>
  );
}

function TechnicalDetailsSection({
  session,
  matched,
  unmatched,
}: {
  session: WorkoutSessionRecord;
  matched: SessionExercise[];
  unmatched: SessionExercise[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((value) => !value)}
        style={({ pressed }) => [styles.detailsSummary, pressed && styles.pressed]}
      >
        <Text style={styles.detailsSummaryText}>Import and save details</Text>
        <Text style={styles.detailsChevron}>{open ? '–' : '+'}</Text>
      </Pressable>
      {open ? (
        <View style={styles.gap}>
          <Card style={styles.gap}>
            <AppText variant="title">Import details</AppText>
            <AppText variant="secondary">Extra details about how this workout entry was saved.</AppText>
            <View style={styles.metaGrid}>
              <MetaStat label="Tracked exercises" value={String(matched.length)} />
              <MetaStat label="Extra exercises" value={String(unmatched.length)} />
              <MetaStat label="Extra text lines" value={String(session.unmatched.length)} />
              <MetaStat label="Saved note" value={session.note ? 'Yes' : 'No'} />
            </View>
            {session.unmatched.length > 0 ? (
              <View style={styles.gap}>
                <AppText variant="label">Extra text lines</AppText>
                <View style={styles.textList}>
                  {session.unmatched.map((line, index) => (
                    <View style={styles.textChip} key={index}>
                      <Text style={styles.textChipText}>{line}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </Card>
          <Card style={styles.gap}>
            <AppText variant="title">Original text entry</AppText>
            <AppText variant="secondary">
              {session.rawText
                ? 'Original text kept with this workout entry.'
                : 'No original text was saved for this workout entry.'}
            </AppText>
            <View style={styles.rawBlock}>
              <Text style={styles.rawText}>{session.rawText || 'No raw text available.'}</Text>
            </View>
          </Card>
        </View>
      ) : null}
    </View>
  );
}

function SessionDetail({ session }: { session: WorkoutSessionRecord }) {
  const matched = session.exercises.filter((exercise) => exercise.matched);
  const unmatched = session.exercises.filter((exercise) => !exercise.matched);

  return (
    <View style={styles.gap}>
      <OverviewCard session={session} matched={matched} unmatched={unmatched} />
      {session.note ? (
        <Card style={styles.gap}>
          <AppText variant="title">Note</AppText>
          <AppText variant="secondary">{session.note}</AppText>
        </Card>
      ) : null}
      <ExerciseSection title="Saved exercises" exercises={matched} description="Exercises linked to this workout." />
      {unmatched.length > 0 ? (
        <ExerciseSection
          title="Extra saved lines"
          exercises={unmatched}
          description="Saved separately because they are not linked to your plan yet."
        />
      ) : null}
      <TechnicalDetailsSection session={session} matched={matched} unmatched={unmatched} />
    </View>
  );
}

export function HistoryTab({ subscribe, getViewState, onDateChange, enterRecovery, routing }: HistoryTabProps) {
  const view = useSyncExternalStore(subscribe, getViewState);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const sessionsQuery = useQuery({
    queryKey: queryKeys.sessions({ date: view.date, limit: 50 }),
    queryFn: () => api.listSessions({ date: view.date, limit: 50 }),
    enabled: Boolean(view.date) && !view.recovery,
  });

  useRoutedApiError(sessionsQuery.error, routing, enterRecovery);

  const sessions = sessionsQuery.data?.sessions ?? [];
  const effectiveSelectedId = view.recovery
    ? null
    : sessions.some((session) => session.id === selectedSessionId)
      ? selectedSessionId
      : (sessions[0]?.id ?? null);

  const detailQuery = useQuery({
    queryKey: queryKeys.session(effectiveSelectedId ?? ''),
    queryFn: () => api.getSession(effectiveSelectedId as string),
    enabled: Boolean(effectiveSelectedId),
  });

  const isLoading = sessionsQuery.isLoading;
  const unhandledMessage =
    sessionsQuery.error && classifyApiError(sessionsQuery.error) === 'unhandled'
      ? `Could not load history: ${getApiErrorMessage(sessionsQuery.error)}`
      : '';

  const showEmpty = view.recovery || (sessionsQuery.isSuccess && sessions.length === 0);
  const emptyText = view.recovery
    ? 'No plan yet. Build one first to start logging workouts.'
    : 'No sessions stored for this day.';
  const showData = !view.recovery && sessions.length > 0;

  const countLabel = sessions.length === 1 ? '1 session' : `${sessions.length} sessions`;

  let detailContent: ReactNode;
  if (detailQuery.isError && classifyApiError(detailQuery.error) !== 'auth-redirect') {
    detailContent = (
      <EmptyCard title="Could not load this session right now." message={getApiErrorMessage(detailQuery.error)} />
    );
  } else if (detailQuery.data && !detailQuery.isFetching) {
    detailContent = <SessionDetail session={detailQuery.data} />;
  } else if (effectiveSelectedId) {
    detailContent = <EmptyCard title="Loading session details…" message="Fetching the full saved record." />;
  } else {
    detailContent = <EmptyCard title="No session selected." message="Choose a session to inspect the saved details." />;
  }

  return (
    <View style={styles.container}>
      <AppText style={styles.heading}>History</AppText>

      <DateField value={view.date} onChange={onDateChange} />

      {isLoading ? (
        <View style={styles.loader}>
          <Skeleton width="50%" height={20} />
          <Skeleton width="100%" height={120} radius={24} />
          <Skeleton width="100%" height={160} radius={24} />
        </View>
      ) : null}

      {unhandledMessage ? <Text style={styles.error}>{unhandledMessage}</Text> : null}

      {showEmpty ? <EmptyState title={view.recovery ? 'No plan yet' : 'No sessions'} message={emptyText} /> : null}

      {showData ? (
        <View style={styles.data}>
          <View style={styles.summaryHeader}>
            <AppText variant="title">Sessions</AppText>
            <AppText variant="secondary">{`${formatDateLabel(view.date)} · ${countLabel}`}</AppText>
          </View>

          {sessions.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectorRow}
            >
              {sessions.map((session, index) => {
                const active = session.id === effectiveSelectedId;
                return (
                  <Pressable
                    key={session.id}
                    accessibilityRole="button"
                    onPress={() => setSelectedSessionId(session.id)}
                    style={({ pressed }) => [
                      styles.selectorChip,
                      active && styles.selectorChipActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.selectorChipText, active && styles.selectorChipTextActive]}>
                      {`#${index + 1} · ${getSessionTitle(session)}`}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          <View style={styles.gap}>{detailContent}</View>
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
  data: {
    gap: theme.space.md,
  },
  summaryHeader: {
    gap: theme.space.xs,
  },
  selectorRow: {
    gap: theme.space.sm,
    paddingVertical: theme.space.xs,
  },
  selectorChip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  selectorChipActive: {
    backgroundColor: 'rgba(111, 182, 255, 0.14)',
    borderColor: theme.colors.accentSoft,
  },
  selectorChipText: {
    color: theme.colors.copySecondary,
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 13,
  },
  selectorChipTextActive: {
    color: theme.colors.copyPrimary,
  },
  gap: {
    gap: theme.space.md,
  },
  section: {
    gap: theme.space.sm,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.space.sm,
  },
  detailTitleWrap: {
    flexShrink: 1,
    gap: theme.space.xs,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  metaStat: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: 2,
    padding: theme.space.sm,
    borderRadius: theme.radii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  metaValue: {
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.copyPrimary,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  tag: {
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  tagAccent: {
    backgroundColor: 'rgba(111, 182, 255, 0.14)',
  },
  tagWarning: {
    backgroundColor: 'rgba(240, 125, 140, 0.16)',
  },
  tagText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.copyPrimary,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space.sm,
  },
  exerciseIndex: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.accentSoft,
  },
  exerciseTitleWrap: {
    flexShrink: 1,
    gap: theme.space.xs,
  },
  setList: {
    gap: theme.space.xs,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.space.xs,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  setLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    color: theme.colors.copySecondary,
  },
  setValue: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.copyPrimary,
  },
  detailsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailsSummaryText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 14,
    color: theme.colors.copyPrimary,
  },
  detailsChevron: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18,
    color: theme.colors.copySecondary,
  },
  textList: {
    gap: theme.space.xs,
  },
  textChip: {
    paddingVertical: theme.space.xs,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  textChipText: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.copySecondary,
  },
  rawBlock: {
    padding: theme.space.sm,
    borderRadius: theme.radii.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rawText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: theme.colors.copySecondary,
  },
  pressed: {
    opacity: 0.85,
  },
}));
