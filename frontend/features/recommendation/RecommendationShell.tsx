import { useEffect, useRef, useSyncExternalStore } from 'react';

import type { RecommendationDraftResponse } from '../../lib/api/contracts.ts';
import { ShellSkeleton } from '../../shared/components/ShellSkeleton.tsx';
import { humanizeToken } from '../../shared/utils/format.js';

export type RecommendationStatus = 'idle' | 'loading' | 'ready' | 'updating' | 'activating';
export type RecommendationStep = 'structure' | 'exercise' | 'review';

export interface RecommendationViewState {
  supported: boolean;
  status: RecommendationStatus;
  step: RecommendationStep;
  draft: RecommendationDraftResponse | null;
  activeSlotId: string | null;
  pickerOpen: boolean;
  errorMessage: string;
  activationErrorMessage: string;
}

export interface RecommendationShellProps {
  subscribe: (listener: () => void) => () => void;
  getViewState: () => RecommendationViewState;
  onSelectStructure: (structureId: string) => void;
  onOpenSlotPicker: (slotId: string) => void;
  onPickExercise: (slotId: string, catalogExerciseId: string) => void;
  onClosePicker: () => void;
  onGoToStep: (step: RecommendationStep) => void;
  onActivate: () => void;
  onRetry: () => void;
}

type DraftJson = NonNullable<RecommendationDraftResponse['draft']>;
type DraftStructure = DraftJson['structures'][number];
type DraftSlot = DraftJson['exercise_slots'][number];
type SlotOption = DraftSlot['options'][number];

const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const FLOW_STEPS: RecommendationStep[] = ['structure', 'exercise', 'review'];

function isBusyStatus(status: RecommendationStatus): boolean {
  return status === 'loading' || status === 'updating' || status === 'activating';
}

function formatStructureScheduleValue(value: string): string {
  if (!value || value === 'rest') return 'Rest';
  if (/^[A-Za-z]$/.test(value)) return value.toUpperCase();
  return humanizeToken(value);
}

function formatTargetLabel(option: SlotOption): string {
  const range = `${option.target_min}-${option.target_max}`;
  if (option.type === 'time') return `${range} sec`;
  if (option.type === 'cycles') return `${range} cycles`;
  return `${range} reps`;
}

function buildSchedulePreview(schedule: Partial<Record<string, string>>): string[] {
  return Object.keys(DAY_LABELS)
    .filter(day => schedule[day] && schedule[day] !== 'rest')
    .map(day => `${DAY_LABELS[day]} ${formatStructureScheduleValue(schedule[day] as string)}`);
}

function getSelectedStructure(draft: DraftJson): DraftStructure | null {
  return draft.structures.find(structure => structure.id === draft.selected_structure_id) ?? null;
}

function getSlotOption(slot: DraftSlot, exerciseId: string): SlotOption | null {
  return slot.options.find(option => option.exercise_id === exerciseId) ?? null;
}

function getSelectedOption(slot: DraftSlot): SlotOption | null {
  return getSlotOption(slot, slot.selected_exercise_id) ?? slot.options[0] ?? null;
}

function getRecommendedOption(slot: DraftSlot): SlotOption | null {
  return getSlotOption(slot, slot.recommended_exercise_id) ?? slot.options[0] ?? null;
}

function SchedulePreview({ schedule, extra }: { schedule: Partial<Record<string, string>>; extra?: string }) {
  return (
    <div className="recommendation-preview-list">
      {buildSchedulePreview(schedule).map(item => (
        <span className="recommendation-preview-chip" key={item}>
          {item}
        </span>
      ))}
      {extra ? <span className="recommendation-preview-chip recommendation-preview-chip-muted">{extra}</span> : null}
    </div>
  );
}

function OptionDialog({
  slot,
  open,
  busy,
  onPick,
  onClose,
}: {
  slot: DraftSlot | null;
  open: boolean;
  busy: boolean;
  onPick: (slotId: string, catalogExerciseId: string) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const showDialog = open && Boolean(slot);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (showDialog) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [showDialog]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
    // onClose is stable for the feature's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <dialog id="recommendation-option-dialog" className="confirm-dialog recommendation-option-dialog" ref={dialogRef}>
      <form method="dialog" className="confirm-dialog-panel" onSubmit={event => event.preventDefault()}>
        <div className="confirm-dialog-kicker">Replace exercise</div>
        <div id="recommendation-option-title" className="card-title">
          {slot ? `${slot.workout_name} · Slot ${slot.slot_index + 1}` : ''}
        </div>
        <p id="recommendation-option-copy" className="confirm-dialog-copy">
          {slot ? 'Choose one of the compatible replacements for this slot.' : ''}
        </p>
        <div id="recommendation-option-list" className="recommendation-option-list">
          {slot
            ? slot.options.map(option => (
                <button
                  type="button"
                  key={option.catalog_exercise_id}
                  className={`recommendation-option-button${option.exercise_id === slot.selected_exercise_id ? ' is-selected' : ''}`}
                  disabled={busy}
                  onClick={() => onPick(slot.slot_id, option.catalog_exercise_id)}
                >
                  <div className="recommendation-option-copy">
                    <strong>{option.name}</strong>
                    <div className="text-secondary">{`${formatTargetLabel(option)} · up to ${option.max_sets} sets`}</div>
                  </div>
                  <div className="recommendation-pill-row">
                    {option.exercise_id === slot.selected_exercise_id ? (
                      <span className="recommendation-pill is-selected">Selected</span>
                    ) : null}
                    {option.recommended ? <span className="recommendation-pill is-accent">Recommended</span> : null}
                    <span className="recommendation-pill is-muted">{humanizeToken(option.type)}</span>
                  </div>
                </button>
              ))
            : null}
        </div>
        <div className="confirm-dialog-actions">
          <button id="recommendation-option-close" className="secondary-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function RecommendationShell({
  subscribe,
  getViewState,
  onSelectStructure,
  onOpenSlotPicker,
  onPickExercise,
  onClosePicker,
  onGoToStep,
  onActivate,
  onRetry,
}: RecommendationShellProps) {
  const view = useSyncExternalStore(subscribe, getViewState);

  const draftResponse = view.draft;
  const draft = draftResponse?.draft ?? null;
  const status = view.status;
  const busy = isBusyStatus(status);
  const showLoader = status === 'loading' && !draft;
  const showContent = Boolean(draft);
  const errorText = view.activationErrorMessage || view.errorMessage || '';
  const showRecovery = !showLoader && !showContent && Boolean(errorText);

  const badgeText =
    status === 'activating'
      ? 'Activating...'
      : status === 'updating'
        ? 'Saving changes...'
        : draftResponse?.status === 'activated'
          ? 'Activated'
          : 'Draft';

  const selectedStructure = draft ? getSelectedStructure(draft) : null;
  const workouts = selectedStructure?.workouts ?? [];
  const changedSlots = (draft?.exercise_slots ?? []).filter(
    slot => slot.selected_exercise_id !== slot.recommended_exercise_id
  );
  const activeSlot = draft?.exercise_slots.find(slot => slot.slot_id === view.activeSlotId) ?? null;

  return (
    <>
      <div className="card recommendation-hero-card">
        <h1 id="recommendation-title" className="section-title mb-4">
          <span className="section-title-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 7h16"></path>
              <path d="M4 12h16"></path>
              <path d="M4 17h10"></path>
              <path d="m16 17 2 2 4-4"></path>
            </svg>
          </span>
          <span>Review your plan</span>
        </h1>
        <p className="onboarding-copy">Start from the recommended draft, then confirm the version you want to activate.</p>
        <div className="recommendation-meta-row">
          <div id="recommendation-status-badge" className="recommendation-pill is-accent">
            {badgeText}
          </div>
        </div>
      </div>

      <div id="recommendation-error" className="error-message">
        {errorText}
      </div>
      {showRecovery ? (
        <section id="recommendation-recovery" className="card recommendation-recovery-card">
          <div className="card-title">Could not load your draft</div>
          <p className="card-subtitle">Try again to reload your recommendations.</p>
          <button id="recommendation-retry-button" className="secondary-button" type="button" disabled={busy} onClick={onRetry}>
            Try again
          </button>
        </section>
      ) : null}
      {showLoader ? (
        <div id="recommendation-loader" className="loader" aria-hidden="true">
          <ShellSkeleton name="recommendation-shell" />
        </div>
      ) : null}

      {showContent && draft ? (
        <div id="recommendation-content">
          <section className="card recommendation-profile-card">
            <div className="card-title">Built from your profile</div>
            <div id="recommendation-profile-summary" className="recommendation-pill-row">
              {[
                humanizeToken(draft.profile_snapshot.primaryGoal),
                `${draft.profile_snapshot.trainingDaysPerWeek} days/week`,
                `${draft.profile_snapshot.sessionDurationMinutes} min`,
                humanizeToken(draft.profile_snapshot.experienceLevel),
              ].map(item => (
                <span className="recommendation-pill" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="card recommendation-step-card">
            <div className="recommendation-stepper">
              {FLOW_STEPS.map((step, index) => (
                <button
                  type="button"
                  key={step}
                  className={`recommendation-step${step === view.step ? ' is-active' : ''}${index < FLOW_STEPS.indexOf(view.step) ? ' is-complete' : ''}`}
                  data-recommendation-step={step}
                  onClick={() => {
                    if (FLOW_STEPS.indexOf(step) <= FLOW_STEPS.indexOf(view.step)) {
                      onGoToStep(step);
                    }
                  }}
                >
                  <span className="recommendation-step-index">{index + 1}</span>
                  <span>{step === 'structure' ? 'Structure' : step === 'exercise' ? 'Exercises' : 'Review'}</span>
                </button>
              ))}
            </div>
          </section>

          <section id="recommendation-structure-panel" className={`recommendation-panel${view.step !== 'structure' ? ' hidden' : ''}`}>
            <div className="recommendation-panel-header">
              <div>
                <div id="recommendation-panel-title" className="card-title">
                  Choose your training structure
                </div>
                <div className="card-subtitle">Pick the split you want to start with.</div>
              </div>
            </div>
            <div id="recommendation-structures" className="recommendation-structure-list">
              {draft.structures.map(structure => {
                const isSelected = structure.id === draft.selected_structure_id;
                return (
                  <article className={`card recommendation-structure-card${isSelected ? ' is-selected' : ''}`} key={structure.id}>
                    <div className="recommendation-structure-header">
                      <div className="recommendation-structure-copy">
                        <div className="card-title">{structure.label}</div>
                        <p className="card-subtitle">{structure.description}</p>
                      </div>
                      <div className="recommendation-pill-row">
                        {structure.recommended ? <span className="recommendation-pill is-accent">Recommended</span> : null}
                        {isSelected ? <span className="recommendation-pill is-selected">Selected</span> : null}
                      </div>
                    </div>
                    <SchedulePreview
                      schedule={structure.schedule}
                      extra={`${structure.workouts.length} ${structure.workouts.length === 1 ? 'session' : 'sessions'}`}
                    />
                    <button
                      type="button"
                      className={isSelected ? 'secondary-button' : ''}
                      disabled={isSelected || busy}
                      onClick={() => onSelectStructure(structure.id)}
                    >
                      {isSelected ? 'Selected' : 'Choose structure'}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          <section id="recommendation-exercise-panel" className={`recommendation-panel${view.step !== 'exercise' ? ' hidden' : ''}`}>
            <div className="recommendation-panel-header">
              <div>
                <div className="card-title">Tune each exercise slot</div>
                <div id="recommendation-exercise-summary" className="card-subtitle">
                  {`${draft.exercise_slots.length} slots across ${workouts.length} sessions.`}
                </div>
              </div>
            </div>
            <div id="recommendation-exercises" className="recommendation-workout-list">
              {workouts.map(workout => {
                const slots = draft.exercise_slots
                  .filter(slot => slot.workout_key === workout.key)
                  .sort((left, right) => left.slot_index - right.slot_index);

                return (
                  <section className="card recommendation-workout-card" key={workout.key}>
                    <div className="recommendation-workout-header">
                      <div className="recommendation-workout-copy">
                        <div className="card-title">{workout.name}</div>
                        <div className="card-subtitle">{`${slots.length} ${slots.length === 1 ? 'slot' : 'slots'}`}</div>
                      </div>
                    </div>
                    {slots.map(slot => {
                      const selectedOption = getSelectedOption(slot);
                      const recommendedOption = getRecommendedOption(slot);
                      if (!selectedOption) return null;
                      const keepingDefault = slot.selected_exercise_id === slot.recommended_exercise_id;

                      return (
                        <div className="recommendation-slot-card" key={slot.slot_id}>
                          <div className="recommendation-slot-header">
                            <div className="recommendation-slot-copy">
                              <div className="recommendation-slot-title">{`Slot ${slot.slot_index + 1} · ${selectedOption.name}`}</div>
                              <div className="card-subtitle">{`${formatTargetLabel(selectedOption)} · up to ${selectedOption.max_sets} sets`}</div>
                            </div>
                            <div className="recommendation-pill-row">
                              <span className={`recommendation-pill ${keepingDefault ? 'is-accent' : 'is-muted'}`}>
                                {keepingDefault ? 'Recommended' : 'Changed'}
                              </span>
                              <span className="recommendation-pill is-muted">{humanizeToken(selectedOption.type)}</span>
                            </div>
                          </div>
                          {recommendedOption && recommendedOption.exercise_id !== selectedOption.exercise_id ? (
                            <div className="recommendation-slot-note">{`Default: ${recommendedOption.name}`}</div>
                          ) : null}
                          <div className="recommendation-slot-actions">
                            <button
                              type="button"
                              className={slot.options.length > 1 ? 'secondary-button' : 'secondary-button recommendation-button-disabled'}
                              disabled={slot.options.length <= 1 || busy}
                              onClick={() => onOpenSlotPicker(slot.slot_id)}
                            >
                              {slot.options.length > 1 ? 'Replace' : 'No alternatives'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </section>
                );
              })}
            </div>
          </section>

          <section id="recommendation-review-panel" className={`recommendation-panel${view.step !== 'review' ? ' hidden' : ''}`}>
            <div className="recommendation-panel-header">
              <div>
                <div className="card-title">Review before activation</div>
                <div className="card-subtitle">Check the final structure and any changed exercises.</div>
              </div>
            </div>
            <div id="recommendation-review-summary" className="recommendation-review-list">
              <section className="card recommendation-review-card">
                <div className="card-title">Selected structure</div>
                <p className="card-subtitle">
                  {selectedStructure ? `${selectedStructure.label} · ${selectedStructure.description}` : 'No structure selected'}
                </p>
                <SchedulePreview schedule={selectedStructure?.schedule ?? {}} />
              </section>
              <section className="card recommendation-review-card">
                <div className="card-title">Exercise changes</div>
                {changedSlots.length === 0 ? (
                  <p className="card-subtitle">You are keeping all recommended exercise defaults.</p>
                ) : (
                  <div className="recommendation-change-list">
                    {changedSlots.map(slot => {
                      const selectedOption = getSelectedOption(slot);
                      const recommendedOption = getRecommendedOption(slot);
                      return (
                        <div className="recommendation-change-item" key={slot.slot_id}>
                          <strong>{`${slot.workout_name} · Slot ${slot.slot_index + 1}`}</strong>
                          <div className="text-secondary">
                            {`${recommendedOption?.name ?? 'Default'} -> ${selectedOption?.name ?? 'Selected'}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </section>

          <section className="card recommendation-actions-card">
            <div className="recommendation-action-row">
              <button
                id="recommendation-back-button"
                className={`secondary-button${view.step === 'structure' ? ' hidden' : ''}`}
                type="button"
                disabled={busy}
                onClick={() => onGoToStep(FLOW_STEPS[Math.max(FLOW_STEPS.indexOf(view.step) - 1, 0)])}
              >
                Back
              </button>
              <button
                id="recommendation-next-button"
                type="button"
                className={view.step === 'review' ? 'hidden' : ''}
                disabled={busy}
                onClick={() => onGoToStep(FLOW_STEPS[Math.min(FLOW_STEPS.indexOf(view.step) + 1, FLOW_STEPS.length - 1)])}
              >
                {view.step === 'structure' ? 'Continue to exercises' : 'Review plan'}
              </button>
              <button
                id="recommendation-confirm-button"
                type="button"
                className={view.step !== 'review' ? 'hidden' : ''}
                disabled={busy}
                onClick={onActivate}
              >
                {status === 'activating' ? 'Activating...' : 'Activate plan'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <OptionDialog
        slot={activeSlot}
        open={view.pickerOpen && showContent}
        busy={busy}
        onPick={onPickExercise}
        onClose={onClosePicker}
      />
    </>
  );
}
