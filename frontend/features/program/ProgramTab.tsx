import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { api } from '../../lib/api/client.ts';
import type { ProgramResponse } from '../../lib/api/contracts.ts';
import { queryKeys } from '../../lib/query/keys.ts';
import { ConfirmDialog, type ConfirmDialogRequest, type ConfirmDialogResult } from '../../shared/components/ConfirmDialog.tsx';
import { EmptyState } from '../../shared/components/EmptyState.tsx';
import { ShellSkeleton } from '../../shared/components/ShellSkeleton.tsx';
import {
  classifyApiError,
  getApiErrorMessage,
  useRoutedApiError,
  type ApiErrorRouting,
} from '../../shared/hooks/use-routed-api-error.ts';
import { hasCompletedOnboarding } from '../../store/app-store.js';
import { formatDateTimeLabel, formatLongDateLabel } from '../../shared/utils/date.js';
import { formatPlanSlotLabel, formatWorkoutTypeLabel, humanizeToken } from '../../shared/utils/format.js';
import { DAY_OPTIONS, buildProgramPayload, cloneProgramForEditor, type EditorState } from './editor-model.ts';
import { ProgramEditor } from './ProgramEditor.tsx';

// Advanced tools (manual editor, regenerate/reset buttons, version
// insights) are compatibility-only and currently disabled, mirroring the
// previous implementation.
const SHOW_PROGRAM_ADVANCED_TOOLS = false;

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

function formatDateOrFallback(value: string | null | undefined, fallback = 'Not yet'): string {
  return value ? formatDateTimeLabel(value) : fallback;
}

function formatGenerationReason(reason: string | undefined, source: string): string {
  if (reason === 'onboarding-complete') return 'Generated when onboarding was completed';
  if (reason === 'regenerate') return 'Regenerated from the saved onboarding profile';
  if (source === 'api') return 'Created from manual edits in the plan editor';
  if (source === 'reset') return 'Reset back to the built-in default template';
  if (source === 'legacy-kv' || source === 'legacy-default') return 'Imported from a legacy snapshot';
  if (source === 'generated') return 'Generated from the saved onboarding profile';
  return `Created from ${humanizeToken(source || 'unknown')}`;
}

function buildGenerationSummary(program: ProgramResponse): string {
  const metadata = program.generated_program_metadata;
  const input = metadata?.input_summary ?? {};
  const primaryGoal = typeof input.primaryGoal === 'string' ? humanizeToken(input.primaryGoal) : '';
  const trainingDays =
    typeof input.trainingDaysPerWeek === 'number' ? `${input.trainingDaysPerWeek} training days/week` : '';
  const sessionDuration =
    typeof input.sessionDurationMinutes === 'number' ? `${input.sessionDurationMinutes} min sessions` : '';
  const details = [primaryGoal, trainingDays, sessionDuration].filter(Boolean);

  const lead = formatGenerationReason(metadata?.generation_reason, program.source);
  return details.length > 0 ? `${lead}. Built around ${details.join(' · ')}.` : `${lead}.`;
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
    <div className="program-summary-stat">
      <div className="program-summary-label">{label}</div>
      <div className="program-summary-value">{value}</div>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="program-detail-stat">
      <div className="program-detail-label">{label}</div>
      <div className="program-detail-value">{value}</div>
    </div>
  );
}

function Pill({ label, className = '' }: { label: string; className?: string }) {
  return <div className={['program-meta-pill', className].filter(Boolean).join(' ')}>{label}</div>;
}

function AdvancedPanels({ program }: { program: ProgramResponse }) {
  const metadata = program.generated_program_metadata;
  const runtime = program.program_runtime_state;
  const version = program.active_version;
  const changes = program.current_version_changes;
  const progressionEvents = program.progression_events ?? [];

  return (
    <>
      <div id="program-insights" className="program-insights-grid mb-4">
        <section className="card program-info-card">
          <div className="card-title">Plan details</div>
          <div id="program-generation-summary" className="program-info-copy">
            {buildGenerationSummary(program)}
          </div>
          <div id="program-generation-meta" className="program-pill-row">
            <Pill label={`Source: ${humanizeToken(program.source || 'unknown')}`} />
            {metadata?.generation_reason ? (
              <Pill label={`Reason: ${humanizeToken(metadata.generation_reason)}`} className="is-highlight" />
            ) : null}
            {program.generator_metadata?.version ? (
              <Pill label={`Generator: ${program.generator_metadata.version}`} />
            ) : null}
            {program.generator_metadata?.catalog_seed_version ? (
              <Pill label={`Catalog: ${program.generator_metadata.catalog_seed_version}`} />
            ) : null}
          </div>
        </section>
        <section className="card program-info-card">
          <div className="card-title">Progression refresh</div>
          <div id="program-runtime-summary" className="program-info-copy">
            {runtime?.last_progression_run_at
              ? `Last refresh ran on ${formatDateTimeLabel(runtime.last_progression_run_at)}.`
              : 'Progression refresh has not run yet for this version.'}
          </div>
          <div id="program-runtime-meta" className="program-pill-row">
            <Pill
              label={`Last progression: ${formatDateOrFallback(runtime?.last_progression_run_at)}`}
              className="is-positive"
            />
            <Pill label={`Last session: ${formatDateOrFallback(runtime?.last_session_logged_at)}`} />
          </div>
        </section>
      </div>
      <div className="program-detail-layout mb-4">
        <section className="card program-version-card">
          <div className="card-title">Version details</div>
          <div id="program-version-meta" className="program-detail-grid">
            <DetailStat label="Status" value={formatVersionStatus(program)} />
            <DetailStat
              label="Source"
              value={version?.source ? humanizeToken(version.source) : humanizeToken(program.source || 'unknown')}
            />
            <DetailStat
              label="Version ID"
              value={version?.version_number ? `v${version.version_number} · ${program.version_id}` : program.version_id}
            />
            <DetailStat label="Created" value={formatDateOrFallback(version?.created_at || metadata?.created_at, 'Unknown')} />
            <DetailStat label="Updated" value={formatDateOrFallback(version?.updated_at, 'Unknown')} />
            <DetailStat label="Previous version" value={version?.previous_version_id || 'None'} />
          </div>
        </section>
        <section className="card program-version-card">
          <div className="card-title">Recent changes</div>
          <div id="program-changes-summary" className="program-info-copy">
            {changes?.summary || 'No structural changes were detected in this version.'}
          </div>
          <div id="program-changes-stats" className="program-pill-row">
            {changes?.stats ? (
              <>
                <Pill label={`${changes.stats.schedule_changes} schedule updates`} className="is-highlight" />
                <Pill label={`${changes.stats.workouts_added} sessions added`} />
                <Pill label={`${changes.stats.workouts_removed} sessions removed`} />
                <Pill label={`${changes.stats.target_changes} target changes`} />
                <Pill label={`${changes.stats.set_cap_changes} set cap changes`} />
              </>
            ) : null}
          </div>
          <div id="program-changes-list" className="program-change-list">
            {(changes?.highlights ?? []).map((item, index) => (
              <div className="program-change-item" key={index}>
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="card program-timeline-card mb-4">
        <div className="program-section-header">
          <div>
            <div className="card-title">Progression timeline</div>
            <div className="card-subtitle">Recent progression changes for this version.</div>
          </div>
        </div>
        <div id="program-timeline-list" className="program-timeline-list">
          {progressionEvents.length === 0 ? (
            <div className="program-timeline-empty">No progression changes have been recorded for this version yet.</div>
          ) : (
            progressionEvents.map(event => (
              <article className="program-timeline-item" key={event.id}>
                <div className="program-timeline-header">
                  <div>
                    <div className="program-timeline-title">
                      {`${event.direction === 'down' ? 'Reduced' : 'Increased'} ${event.exercise_name || humanizeToken(event.exercise_key)}`}
                    </div>
                    <div className="program-timeline-diff">
                      {`${event.before.sets} sets · ${event.before.min}-${event.before.max} → ${event.after.sets} sets · ${event.after.min}-${event.after.max}`}
                    </div>
                  </div>
                  <div className="program-timeline-time">{formatDateOrFallback(event.created_at, 'Unknown')}</div>
                </div>
                <div className="program-info-copy">{event.reason}</div>
              </article>
            ))
          )}
        </div>
      </section>
    </>
  );
}

export function ProgramTab({ subscribe, getViewState, enterRecovery, routing, refreshProductState }: ProgramTabProps) {
  const view = useSyncExternalStore(subscribe, getViewState);
  const queryClient = useQueryClient();

  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dialogRequest, setDialogRequest] = useState<ConfirmDialogRequest | null>(null);
  const dialogResolverRef = useRef<((value: ConfirmDialogResult) => void) | null>(null);

  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [editorDirty, setEditorDirty] = useState(false);
  const [editorStatus, setEditorStatus] = useState('');

  const enabled = view.status === 'active';
  const programQuery = useQuery({
    queryKey: queryKeys.program,
    queryFn: () => api.getProgram(),
    enabled,
  });

  useRoutedApiError(programQuery.error, routing, enterRecovery);

  const program = programQuery.data ?? null;
  const editing = editorState !== null;
  const advancedVisible = SHOW_PROGRAM_ADVANCED_TOOLS && view.actionsVisible;

  function openConfirm(request: ConfirmDialogRequest): Promise<ConfirmDialogResult> {
    setDialogRequest(request);
    return new Promise(resolve => {
      dialogResolverRef.current = resolve;
    });
  }

  function resolveDialog(value: ConfirmDialogResult) {
    setDialogRequest(null);
    const resolver = dialogResolverRef.current;
    dialogResolverRef.current = null;
    resolver?.(value);
  }

  async function runRegenerate() {
    if (!hasCompletedOnboarding() || busy || dialogRequest) return;

    const confirmed = await openConfirm({
      title: 'Build a new generated plan?',
      copy: 'This will create a fresh program version from the stored onboarding profile. Your current plan will stay in history, but the active plan will be replaced.',
      confirmText: 'Build new plan',
      danger: true,
    });

    if (!confirmed) return;

    setBusy(true);
    setActionError('');

    try {
      await api.regenerateProgram();
      setEditorState(null);
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

  async function runReset() {
    if (!hasCompletedOnboarding() || busy || dialogRequest) return;

    const resetToken = await openConfirm({
      title: 'Reset the active plan?',
      copy: 'This will replace the active program with the built-in default template and reset progression seeding. Enter the reset token to confirm.',
      confirmText: 'Reset program',
      requireInputLabel: 'Reset token',
      inputPlaceholder: 'Enter X-Reset-Token',
      danger: true,
    });

    if (!resetToken || typeof resetToken !== 'string') return;

    setBusy(true);
    setActionError('');

    try {
      await api.resetProgram(resetToken);
      setEditorState(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.program });
      await refreshProductState();
    } catch (error) {
      const kind = classifyApiError(error);
      if (kind === 'auth-redirect') return;
      if (kind === 'onboarding-incomplete') {
        void routing.onEnterOnboarding();
        return;
      }
      setActionError(`Could not reset the plan: ${getApiErrorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function runSave() {
    if (!editorState || busy) return;

    setActionError('');

    let payload;
    try {
      payload = buildProgramPayload(editorState);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Program validation failed.');
      return;
    }

    setBusy(true);
    setEditorStatus('Saving...');

    try {
      await api.saveProgram(payload);
      setEditorState(null);
      setEditorDirty(false);
      setEditorStatus('');
      await queryClient.invalidateQueries({ queryKey: queryKeys.program });
      await refreshProductState();
    } catch (error) {
      const kind = classifyApiError(error);
      if (kind === 'auth-redirect') return;
      if (kind === 'onboarding-incomplete') {
        void routing.onEnterOnboarding();
        return;
      }
      setActionError(`Could not save the plan: ${getApiErrorMessage(error)}`);
      setEditorStatus('Fix the errors and try again');
    } finally {
      setBusy(false);
    }
  }

  // app.js requests regenerate via the bridge (recovery "Build plan" button).
  const pendingRegenerate = view.pendingRegenerate;
  useEffect(() => {
    if (pendingRegenerate > 0) {
      void runRegenerate();
    }
    // Triggered solely by the counter; the handler reads fresh state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRegenerate]);

  // Closing the advanced section also closes the editor, as before.
  useEffect(() => {
    if (!advancedVisible && editorState) {
      setEditorState(null);
      setEditorDirty(false);
      setEditorStatus('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advancedVisible]);

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
            <path d="M2 6h4"></path>
            <path d="M2 10h4"></path>
            <path d="M2 14h4"></path>
            <path d="M2 18h4"></path>
            <rect width="16" height="20" x="4" y="2" rx="2"></rect>
            <path d="M9.5 8h5"></path>
            <path d="M9.5 12H16"></path>
            <path d="M9.5 16H14"></path>
          </svg>
        </span>
        <span>Plan</span>
      </h1>
      {view.status === 'idle' || isLoading ? (
        <div id="program-loader" className="loader" aria-hidden="true">
          {isLoading ? <ShellSkeleton name="program-shell" /> : null}
        </div>
      ) : null}
      <div id="program-error" className="error-message">
        {errorMessage}
      </div>
      {showRecovery || showMain ? (
        <div id="program-content">
          {showRecovery ? (
            <EmptyState
              id="program-empty-state"
              title="No plan available"
              message="Build a fresh plan from your saved preferences."
              action={{ text: 'Build plan', type: 'regenerate-program' }}
            />
          ) : null}
          {showMain && program ? (
            <div id="program-main">
              <div className="card program-summary-card mb-4">
                <div className="program-summary-header">
                  <div>
                    <div className="card-title">Current plan</div>
                    <div id="program-summary-copy" className="card-subtitle">
                      {cadenceLabel}
                    </div>
                  </div>
                  <div id="program-summary-badge" className="program-summary-badge">
                    {formatVersionStatus(program)}
                  </div>
                </div>
                <div id="program-summary-meta" className="program-summary-meta">
                  <Stat label="Plan" value={program.name} />
                  <Stat label="Schedule" value={cadenceLabel} />
                  <Stat
                    label="Last update"
                    value={latestProgressionDate ? formatLongDateLabel(latestProgressionDate) : 'Not yet'}
                  />
                </div>
              </div>
              <div className="card mb-4">
                <div className="card-title">Week</div>
                <div id="program-schedule">
                  {DAY_OPTIONS.map(([key, label]) => (
                    <div className="program-schedule-row" key={key}>
                      <span className="program-day">{label.slice(0, 3)}</span>
                      <span className="program-day-value">
                        {formatPlanSlotLabel(program.schedule[key as keyof typeof program.schedule] || 'rest')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <h2 className="mb-4">Sessions</h2>
              <div id="program-workouts">
                {Object.entries(program.workouts ?? {}).map(([type, workout]) => (
                  <section className="card program-workout-card" key={type}>
                    <div className="program-workout-header">
                      <div className="card-title">{workout.name || type}</div>
                      <div className="program-workout-type">{formatWorkoutTypeLabel(type)}</div>
                    </div>
                    {workout.exercises && workout.exercises.length > 0 ? (
                      <div className="program-exercise-list">
                        {workout.exercises.map(exercise => {
                          const exerciseProgression = program.progressionState?.[exercise.id] ?? null;
                          const currentSets = exerciseProgression?.sets ?? program.userSets?.[exercise.id] ?? 1;
                          return (
                            <div className="program-exercise-row" key={exercise.id}>
                              <div className="program-exercise-main">
                                <div className="program-exercise-name">{exercise.name || humanizeToken(exercise.id)}</div>
                                <div className="program-exercise-detail">
                                  {formatProgramTarget(exercise, exerciseProgression)}
                                </div>
                                <div className="program-exercise-meta">
                                  {exerciseProgression?.last_progression
                                    ? `Updated ${exerciseProgression.last_progression}`
                                    : 'No recent changes'}
                                </div>
                              </div>
                              <div className="program-sets-pill">{`${currentSets}/${exercise.max_sets} sets`}</div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-secondary">No exercises in this session.</div>
                    )}
                  </section>
                ))}
              </div>
              {advancedVisible ? (
                <details id="program-advanced-details" className="card program-advanced-shell mb-4" open={editing || undefined}>
                  <summary className="program-advanced-summary">
                    <span>Advanced tools</span>
                    <span className="program-advanced-meta">Compatibility only</span>
                  </summary>
                  <div className="program-advanced-content">
                    <div className="program-toolbar">
                      <button
                        id="program-edit-button"
                        className="secondary-button"
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (editing) {
                            setEditorState(null);
                            setEditorDirty(false);
                            setEditorStatus('');
                          } else if (program) {
                            setEditorState(cloneProgramForEditor(program));
                            setEditorDirty(false);
                            setEditorStatus('Editing draft');
                          }
                        }}
                      >
                        {editing ? 'Close editor' : 'Edit plan'}
                      </button>
                      <button
                        id="program-regenerate-button"
                        className="secondary-button"
                        type="button"
                        disabled={busy}
                        data-action="regenerate-program"
                      >
                        Build new plan
                      </button>
                      <button id="program-reset-button" className="secondary-button" type="button" disabled={busy} onClick={() => void runReset()}>
                        Reset to default
                      </button>
                    </div>
                    <AdvancedPanels program={program} />
                    {editing && editorState ? (
                      <ProgramEditor
                        state={editorState}
                        status={editorDirty ? 'Unsaved changes' : editorStatus}
                        busy={busy}
                        onChange={next => {
                          setEditorState(next);
                          setEditorDirty(true);
                        }}
                        onSave={() => void runSave()}
                        onCancel={() => {
                          setEditorState(null);
                          setEditorDirty(false);
                          setEditorStatus('');
                        }}
                      />
                    ) : null}
                  </div>
                </details>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <ConfirmDialog request={dialogRequest} onResolve={resolveDialog} />
    </>
  );
}
