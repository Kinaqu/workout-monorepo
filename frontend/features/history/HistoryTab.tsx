import { useQuery } from '@tanstack/react-query';
import { useState, useSyncExternalStore, type ReactNode } from 'react';

import { api } from '../../lib/api/client.ts';
import type { WorkoutSessionRecord } from '../../lib/api/contracts.ts';
import { queryKeys } from '../../lib/query/keys.ts';
import { ShellSkeleton } from '../../shared/components/ShellSkeleton.tsx';
import {
  classifyApiError,
  getApiErrorMessage,
  useRoutedApiError,
  type ApiErrorRouting,
} from '../../shared/hooks/use-routed-api-error.ts';
import { formatDateLabel, formatWorkoutTypeLabel, humanizeToken } from '../../shared/utils/format.ts';

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

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="history-meta-stat">
      <div className="history-meta-label">{label}</div>
      <div className="history-meta-value">{value}</div>
    </div>
  );
}

function EmptyCard({ title, message }: { title: string; message: string }) {
  return (
    <article className="card history-empty-card">
      <div className="card-title">{title}</div>
      <p className="history-detail-copy">{message}</p>
    </article>
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
    <article className="card history-detail-card history-detail-overview-card">
      <div className="history-detail-header">
        <div className="history-detail-title-wrap">
          <div className="history-detail-kicker">{formatDateLabel(session.sessionDate)}</div>
          <div className="card-title">{getSessionTitle(session)}</div>
        </div>
        <div className="history-meta-pill">{`Source: ${formatSourceLabel(session.source)}`}</div>
      </div>
      <div className="history-meta-grid">
        <MetaStat
          label="Plan day"
          value={session.workoutType ? formatWorkoutTypeLabel(session.workoutType) : 'Not assigned'}
        />
        <MetaStat label="Saved" value={formatDateTime(session.createdAt)} />
        <MetaStat label="Updated" value={formatDateTime(session.updatedAt)} />
        <MetaStat label="Extra lines" value={session.unmatched.length ? `${session.unmatched.length}` : 'None'} />
      </div>
      <div className="history-pill-row">
        <div className="history-stat-pill">{`${matched.length} tracked`}</div>
        <div className="history-stat-pill history-stat-pill-warning">{`${unmatched.length} extra`}</div>
        <div className="history-stat-pill history-stat-pill-neutral">{`${session.exercises.length} saved`}</div>
      </div>
    </article>
  );
}

function ExerciseCard({ exercise, index }: { exercise: SessionExercise; index: number }) {
  return (
    <article className="card history-exercise-card">
      <div className="history-exercise-header">
        <div className="history-exercise-index">{`#${index + 1}`}</div>
        <div className="history-exercise-title-wrap">
          <div className="card-title">{exercise.exerciseName || humanizeToken(exercise.exerciseKey || 'exercise')}</div>
          <div className="card-subtitle">{exercise.matched ? 'Tracked in your plan' : 'Saved as an extra line'}</div>
        </div>
        <div className="history-pill-row">
          <div className={exercise.matched ? 'history-status-pill' : 'history-status-pill history-status-pill-warning'}>
            {exercise.matched ? 'Tracked' : 'Extra line'}
          </div>
          <div className="history-status-pill history-status-pill-neutral">
            {exercise.exerciseType ? humanizeToken(exercise.exerciseType) : 'Unknown type'}
          </div>
          <div className="history-status-pill history-status-pill-neutral">
            {`${exercise.sets.length} ${exercise.sets.length === 1 ? 'set' : 'sets'}`}
          </div>
        </div>
      </div>
      {exercise.sets.length > 0 ? (
        <div className="history-set-list">
          {exercise.sets.map((setValue, setIndex) => (
            <div className="history-set-row" key={setIndex}>
              <div className="history-set-label">{`Set ${setIndex + 1}`}</div>
              <div className="history-set-value">{String(setValue)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="history-detail-copy">No set values were saved for this exercise.</div>
      )}
    </article>
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
    <section className="history-detail-section">
      <div className="history-section-title">{title}</div>
      <p className="history-detail-copy">{description}</p>
      {exercises.length === 0 ? (
        <EmptyCard title="Nothing to show." message="Nothing was saved in this section for the selected workout." />
      ) : (
        <div className="history-exercise-list">
          {exercises.map((exercise, index) => (
            <ExerciseCard exercise={exercise} index={index} key={exercise.id || index} />
          ))}
        </div>
      )}
    </section>
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
  return (
    <details className="history-details-shell">
      <summary className="history-details-summary">Import and save details</summary>
      <div className="history-details-body">
        <article className="card history-detail-card">
          <div className="card-title">Import details</div>
          <p className="history-detail-copy">Extra details about how this workout entry was saved.</p>
          <div className="history-parsed-grid">
            <MetaStat label="Tracked exercises" value={String(matched.length)} />
            <MetaStat label="Extra exercises" value={String(unmatched.length)} />
            <MetaStat label="Extra text lines" value={String(session.unmatched.length)} />
            <MetaStat label="Saved note" value={session.note ? 'Yes' : 'No'} />
          </div>
          {session.unmatched.length > 0 ? (
            <div className="history-block">
              <div className="history-block-title">Extra text lines</div>
              <div className="history-text-list">
                {session.unmatched.map((line, index) => (
                  <div className="history-text-chip" key={index}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </article>
        <article className="card history-detail-card">
          <div className="card-title">Original text entry</div>
          <p className="history-detail-copy">
            {session.rawText
              ? 'Original text kept with this workout entry.'
              : 'No original text was saved for this workout entry.'}
          </p>
          <pre className="history-raw-import">{session.rawText || 'No raw text available.'}</pre>
        </article>
      </div>
    </details>
  );
}

function SessionDetail({ session }: { session: WorkoutSessionRecord }) {
  const matched = session.exercises.filter(exercise => exercise.matched);
  const unmatched = session.exercises.filter(exercise => !exercise.matched);

  return (
    <>
      <OverviewCard session={session} matched={matched} unmatched={unmatched} />
      {session.note ? (
        <article className="card history-detail-card">
          <div className="card-title">Note</div>
          <p className="history-detail-copy">{session.note}</p>
        </article>
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
    </>
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
    : sessions.some(session => session.id === selectedSessionId)
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
    detailContent = (
      <EmptyCard title="Loading session details…" message="Fetching the full record from /sessions/{id}." />
    );
  } else {
    detailContent = (
      <EmptyCard title="No session selected." message="Choose a session from the list to inspect the saved payload." />
    );
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
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
            <path d="M12 7v5l4 2"></path>
          </svg>
        </span>
        <span>History</span>
      </h1>
      <input type="date" id="history-date" value={view.date} onChange={event => onDateChange(event.target.value)} />
      {isLoading ? (
        <div id="history-loader" className="loader" aria-hidden="true">
          <ShellSkeleton name="history-shell" />
        </div>
      ) : null}
      <div id="history-error" className="error-message">
        {unhandledMessage}
      </div>
      <div id="history-content">
        {showEmpty ? (
          <div id="history-empty" className="text-center mt-4">
            {emptyText}
          </div>
        ) : null}
        {showData ? (
          <div id="history-data">
            <div className="history-layout">
              <aside className="history-sidebar">
                <div className="card history-summary-card">
                  <div className="history-panel-header">
                    <div className="card-title">Sessions</div>
                    <div id="history-session-summary" className="card-subtitle">
                      {`${formatDateLabel(view.date)} · ${countLabel}`}
                    </div>
                  </div>
                  <div id="history-session-list" className="history-session-list">
                    {sessions.map((session, index) => (
                      <button
                        key={session.id}
                        type="button"
                        data-session-id={session.id}
                        className={`history-session-item${session.id === effectiveSelectedId ? ' active' : ''}`}
                        onClick={() => setSelectedSessionId(session.id)}
                      >
                        <div className="history-session-item-header">
                          <div className="history-session-item-index">{`#${index + 1}`}</div>
                          <div className="history-session-item-title">{getSessionTitle(session)}</div>
                        </div>
                        <div className="history-session-item-meta">
                          {`${formatSourceLabel(session.source)} · ${formatTime(session.createdAt)}`}
                        </div>
                        <div className="history-session-item-stats">
                          {`${session.exercises.filter(exercise => exercise.matched).length} matched · ${session.exercises.filter(exercise => !exercise.matched).length} unmatched`}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
              <section id="history-detail" className="history-detail">
                {detailContent}
              </section>
            </div>
            <div id="history-note-card" className="card history-note-card hidden">
              <div className="card-title">Note</div>
              <div id="history-note"></div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
