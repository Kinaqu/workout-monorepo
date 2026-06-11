import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { api } from '../../lib/api/client.ts';
import type { OnboardingStateResponse } from '../../lib/api/contracts.ts';
import { AuthRedirectError } from '../../lib/api/errors.ts';
import { getApiErrorMessage } from '../../shared/hooks/use-routed-api-error.ts';
import {
  mergeOnboardingData,
  validateOnboardingPayload,
} from '../../shared/utils/onboarding.js';
import { selectShellMode } from '../../app/product-state.ts';

export interface OnboardingFormData {
  questionnaireVersion: string;
  goals: string[];
  experienceLevel: string;
  trainingDaysPerWeek: number | null;
  sessionDurationMinutes: number | null;
  equipmentAccess: string[];
  focusAreas: string[];
  limitations: string[];
  preferredStyles: string[];
}

export interface OnboardingHydration {
  nonce: number;
  onboarding: Pick<OnboardingStateResponse, 'status'> & {
    questionnaireVersion?: string | null;
    answers?: unknown;
  };
  loadFailed: boolean;
}

export interface OnboardingShellProps {
  subscribe: (listener: () => void) => () => void;
  getHydration: () => OnboardingHydration | null;
  isCompleted: () => boolean;
  onDraftSaved: (payload: OnboardingFormData) => void;
  onCompleted: () => Promise<void>;
}

interface ChoiceOption {
  value: string;
  label: string;
  small?: string;
}

const GOAL_OPTIONS: ChoiceOption[] = [
  { value: 'strength', label: 'Strength' },
  { value: 'muscle', label: 'Muscle' },
  { value: 'general_fitness', label: 'General fitness' },
  { value: 'mobility', label: 'Mobility' },
];

const LEVEL_OPTIONS: ChoiceOption[] = [
  { value: 'beginner', label: 'Beginner', small: 'New to training' },
  { value: 'intermediate', label: 'Intermediate', small: 'Some experience' },
  { value: 'advanced', label: 'Advanced', small: 'Train regularly' },
];

const DAYS_OPTIONS: ChoiceOption[] = [
  { value: '2', label: '2 days' },
  { value: '3', label: '3 days' },
  { value: '4', label: '4 days' },
  { value: '5', label: '5 days' },
];

const DURATION_OPTIONS: ChoiceOption[] = [
  { value: '20', label: '20 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '60 min' },
  { value: '75', label: '75 min' },
];

const EQUIPMENT_OPTIONS: ChoiceOption[] = [
  { value: 'bodyweight', label: 'Bodyweight only' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'bands', label: 'Bands' },
  { value: 'bench', label: 'Bench' },
  { value: 'pullup_bar', label: 'Pull-up bar' },
];

const FOCUS_OPTIONS: ChoiceOption[] = [
  { value: 'upper_body', label: 'Upper body' },
  { value: 'lower_body', label: 'Lower body' },
  { value: 'core', label: 'Core' },
  { value: 'mobility', label: 'Mobility' },
];

const LIMITATION_OPTIONS: ChoiceOption[] = [
  { value: 'wrist_sensitive', label: 'Wrist sensitive' },
  { value: 'knee_sensitive', label: 'Knee sensitive' },
  { value: 'lower_back_sensitive', label: 'Lower back sensitive' },
  { value: 'shoulder_sensitive', label: 'Shoulder sensitive' },
];

const STYLE_OPTIONS: ChoiceOption[] = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'strength_bias', label: 'Strength bias' },
  { value: 'mobility_bias', label: 'Mobility bias' },
  { value: 'low_impact', label: 'Low impact' },
];

const STEP_FIELDS: Record<number, string[]> = {
  0: ['goals', 'experienceLevel'],
  1: ['trainingDaysPerWeek', 'sessionDurationMinutes'],
  2: ['equipmentAccess', 'focusAreas', 'preferredStyles'],
};

const LAST_STEP = 2;

function optionLabel(options: ChoiceOption[], value: string): string {
  return options.find(option => option.value === value)?.label ?? value;
}

function validatePayload(payload: OnboardingFormData): Record<string, string> {
  return { ...validateOnboardingPayload(payload) };
}

function filterErrorsForStep(errors: Record<string, string>, stepIndex: number): Record<string, string> {
  if (stepIndex >= LAST_STEP) return errors;
  const allowed = new Set(STEP_FIELDS[stepIndex] ?? []);
  return Object.fromEntries(Object.entries(errors).filter(([field]) => allowed.has(field)));
}

function resolveDraftStep(payload: OnboardingFormData): number {
  for (let index = 0; index < LAST_STEP; index += 1) {
    if (Object.keys(filterErrorsForStep(validatePayload(payload), index)).length > 0) {
      return index;
    }
  }
  return LAST_STEP;
}

function ChoiceGroup({
  title,
  meta,
  name,
  options,
  type,
  gridClass = 'choice-grid',
  selected,
  error,
  onToggle,
}: {
  title: string;
  meta?: string;
  name: string;
  options: ChoiceOption[];
  type: 'checkbox' | 'radio';
  gridClass?: string;
  selected: string[];
  error?: string;
  onToggle: (value: string, checked: boolean) => void;
}) {
  return (
    <div className="onboarding-step-group">
      {meta ? (
        <div className="onboarding-group-heading">
          <h3 className="onboarding-group-title">{title}</h3>
          <span className="onboarding-group-meta">{meta}</span>
        </div>
      ) : (
        <h3 className="onboarding-group-title">{title}</h3>
      )}
      <div className={gridClass}>
        {options.map(option => (
          <label className={`choice-pill${gridClass.includes('choice-grid-4') ? ' choice-pill-compact' : ''}`} key={option.value}>
            <input
              className="choice-input"
              type={type}
              name={name}
              value={option.value}
              checked={selected.includes(option.value)}
              onChange={event => onToggle(option.value, event.target.checked)}
            />
            <span>
              <strong>{option.label}</strong>
              {option.small ? <small>{option.small}</small> : null}
            </span>
          </label>
        ))}
      </div>
      <p className="field-error" data-error-for={name}>
        {error ?? ''}
      </p>
    </div>
  );
}

function ReviewSummary({ data }: { data: OnboardingFormData }) {
  const sections = [
    { title: 'Goal', values: data.goals.map(value => optionLabel(GOAL_OPTIONS, value)) },
    { title: 'Level', values: data.experienceLevel ? [optionLabel(LEVEL_OPTIONS, data.experienceLevel)] : ['Not set'] },
    {
      title: 'Days',
      values: data.trainingDaysPerWeek ? [optionLabel(DAYS_OPTIONS, String(data.trainingDaysPerWeek))] : ['Not set'],
    },
    {
      title: 'Length',
      values: data.sessionDurationMinutes
        ? [optionLabel(DURATION_OPTIONS, String(data.sessionDurationMinutes))]
        : ['Not set'],
    },
    { title: 'Equipment', values: data.equipmentAccess.map(value => optionLabel(EQUIPMENT_OPTIONS, value)) },
    { title: 'Focus', values: data.focusAreas.map(value => optionLabel(FOCUS_OPTIONS, value)) },
    { title: 'Avoid', values: data.limitations.map(value => optionLabel(LIMITATION_OPTIONS, value)) },
    { title: 'Style', values: data.preferredStyles.map(value => optionLabel(STYLE_OPTIONS, value)) },
  ]
    .map(section => ({ ...section, values: section.values.length > 0 ? section.values : ['None'] }))
    .filter(section => section.values.some(value => value !== 'None' && value !== 'Not set'));

  return (
    <>
      {sections.map(section => (
        <section className="onboarding-review-section" key={section.title}>
          <div className="onboarding-review-title">{section.title}</div>
          <div className="onboarding-review-values">
            {section.values.slice(0, 3).map(value => (
              <span className="onboarding-review-pill" key={value}>
                {value}
              </span>
            ))}
            {section.values.length > 3 ? (
              <span className="onboarding-review-pill onboarding-review-pill-muted">{`+${section.values.length - 3}`}</span>
            ) : null}
          </div>
        </section>
      ))}
    </>
  );
}

export function OnboardingShell({ subscribe, getHydration, isCompleted, onDraftSaved, onCompleted }: OnboardingShellProps) {
  const hydration = useSyncExternalStore(subscribe, getHydration);

  const [formData, setFormData] = useState<OnboardingFormData>(() => mergeOnboardingData(null));
  const [currentStep, setCurrentStep] = useState(0);
  const [visibleErrors, setVisibleErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [saveStatus, setSaveStatus] = useState<{ message: string; tone: string }>({
    message: 'Saved automatically.',
    tone: 'neutral',
  });
  const [badge, setBadge] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const saveTimerRef = useRef<number | null>(null);
  const lastSavedSignatureRef = useRef('');
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Hydrate the form whenever the bridge loads a fresh onboarding state.
  useEffect(() => {
    if (!hydration) return;

    const data = mergeOnboardingData(
      (hydration.onboarding as { answers?: unknown }).answers ?? null
    ) as OnboardingFormData;
    setFormData(data);
    lastSavedSignatureRef.current = JSON.stringify(data);
    setVisibleErrors({});
    setSubmitError('');
    setCurrentStep(hydration.onboarding.status === 'draft' ? resolveDraftStep(data) : 0);
    setBadge(
      hydration.onboarding.status === 'draft' ? 'Draft saved' : hydration.onboarding.status === 'completed' ? 'Completed' : ''
    );
    setSaveStatus(
      hydration.loadFailed
        ? { message: 'Could not load saved progress.', tone: 'error' }
        : hydration.onboarding.status === 'draft'
          ? { message: 'Draft restored.', tone: 'neutral' }
          : { message: 'Progress saves automatically.', tone: 'neutral' }
    );
  }, [hydration]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  function scheduleDraftSave() {
    if (selectShellMode() !== 'onboarding' || isCompleted()) return;

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    setSaveStatus({ message: 'Saving...', tone: 'pending' });

    saveTimerRef.current = window.setTimeout(async () => {
      saveTimerRef.current = null;

      if (isCompleted()) {
        setSaveStatus({ message: 'Onboarding is already complete.', tone: 'neutral' });
        return;
      }

      const payload = formDataRef.current;
      const signature = JSON.stringify(payload);
      if (signature === lastSavedSignatureRef.current) {
        setSaveStatus({ message: 'All changes saved.', tone: 'neutral' });
        return;
      }

      try {
        await api.saveOnboardingDraft(payload as Parameters<typeof api.saveOnboardingDraft>[0]);
        lastSavedSignatureRef.current = signature;
        setBadge('Draft saved');
        setSaveStatus({ message: 'Saved.', tone: 'success' });
        onDraftSaved(payload);
      } catch (error) {
        if (error instanceof AuthRedirectError) return;
        setSaveStatus({ message: 'Could not save right now.', tone: 'error' });
      }
    }, 450);
  }

  function applyChange(patch: Partial<OnboardingFormData>) {
    setFormData(previous => ({ ...previous, ...patch }));
    setSubmitError('');
    setVisibleErrors({});
    scheduleDraftSave();
  }

  function toggleArrayValue(field: 'goals' | 'equipmentAccess' | 'focusAreas' | 'limitations' | 'preferredStyles') {
    return (value: string, checked: boolean) => {
      const current = formData[field];
      applyChange({ [field]: checked ? [...current, value] : current.filter(item => item !== value) });
    };
  }

  function goToStep(nextStep: number) {
    const bounded = Math.max(0, Math.min(nextStep, LAST_STEP));
    setCurrentStep(bounded);
    setSubmitError('');
    setVisibleErrors(filterErrorsForStep(validatePayload(formData), bounded));
    document.getElementById('onboarding-shell')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function handleNextStep() {
    const errors = filterErrorsForStep(validatePayload(formData), currentStep);
    setVisibleErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSubmitError('Finish this step to continue.');
      return;
    }
    setSubmitError('');
    goToStep(currentStep + 1);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (isCompleted()) {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      await onCompleted();
      return;
    }

    if (currentStep < LAST_STEP) {
      handleNextStep();
      return;
    }

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const errors = validatePayload(formData);
    setVisibleErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSubmitError('Fill the highlighted fields before preparing your draft.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSaveStatus({ message: 'Preparing your recommended draft...', tone: 'pending' });

    try {
      await api.completeOnboarding(formData as Parameters<typeof api.completeOnboarding>[0]);
      lastSavedSignatureRef.current = JSON.stringify(formData);
      await onCompleted();
    } catch (error) {
      if (error instanceof AuthRedirectError) return;
      setSubmitError(getApiErrorMessage(error) || 'Could not complete onboarding.');
      setSaveStatus({ message: 'We could not prepare your draft yet.', tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  const steps = [
    { label: 'Profile', index: 0 },
    { label: 'Schedule', index: 1 },
    { label: 'Preferences', index: 2 },
  ];

  return (
    <>
      <div className="card onboarding-hero-card">
        <h1 id="onboarding-title" className="section-title mb-4">
          <span className="section-title-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9"></path>
              <path d="M12 4h9"></path>
              <path d="M4 9h16"></path>
              <path d="M4 15h16"></path>
              <path d="M8 4v16"></path>
            </svg>
          </span>
          <span>Set up your plan</span>
        </h1>
        <p className="onboarding-copy">Pick your goal, routine, and preferences.</p>
        <div className="onboarding-meta-row">
          <div id="onboarding-status-badge" className={`onboarding-meta-pill${badge ? '' : ' hidden'}`}>
            {badge}
          </div>
        </div>
      </div>

      <form id="onboarding-form" className="onboarding-form" noValidate onSubmit={handleSubmit}>
        <div id="onboarding-progress" className="card onboarding-progress-card" aria-label="Onboarding progress">
          <div className="onboarding-progress-steps">
            {steps.map(step => (
              <div
                className={`onboarding-progress-step${step.index === currentStep ? ' active' : ''}${step.index < currentStep ? ' complete' : ''}`}
                data-onboarding-step-item={step.index}
                key={step.index}
              >
                <span className="onboarding-progress-index">{step.index + 1}</span>
                <span className="onboarding-progress-copy">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        <section
          className={`card onboarding-card onboarding-step-panel${currentStep !== 0 ? ' hidden' : ''}`}
          data-onboarding-step-panel="0"
        >
          <div className="onboarding-step-header">
            <h2 className="card-title">Start with your goal</h2>
            <p className="card-subtitle">Choose what matters most right now.</p>
          </div>
          <ChoiceGroup
            title="Goals"
            name="goals"
            type="checkbox"
            options={GOAL_OPTIONS}
            selected={formData.goals}
            error={visibleErrors.goals}
            onToggle={toggleArrayValue('goals')}
          />
          <ChoiceGroup
            title="Level"
            name="experienceLevel"
            type="radio"
            gridClass="choice-grid choice-grid-3"
            options={LEVEL_OPTIONS}
            selected={formData.experienceLevel ? [formData.experienceLevel] : []}
            error={visibleErrors.experienceLevel}
            onToggle={value => applyChange({ experienceLevel: value })}
          />
        </section>

        <section
          className={`card onboarding-card onboarding-step-panel${currentStep !== 1 ? ' hidden' : ''}`}
          data-onboarding-step-panel="1"
        >
          <div className="onboarding-step-header">
            <h2 className="card-title">Pick a routine</h2>
            <p className="card-subtitle">Choose what you can realistically stick to.</p>
          </div>
          <ChoiceGroup
            title="Days per week"
            name="trainingDaysPerWeek"
            type="radio"
            gridClass="choice-grid choice-grid-4"
            options={DAYS_OPTIONS}
            selected={formData.trainingDaysPerWeek ? [String(formData.trainingDaysPerWeek)] : []}
            error={visibleErrors.trainingDaysPerWeek}
            onToggle={value => applyChange({ trainingDaysPerWeek: Number.parseInt(value, 10) })}
          />
          <ChoiceGroup
            title="Session length"
            name="sessionDurationMinutes"
            type="radio"
            gridClass="choice-grid choice-grid-4"
            options={DURATION_OPTIONS}
            selected={formData.sessionDurationMinutes ? [String(formData.sessionDurationMinutes)] : []}
            error={visibleErrors.sessionDurationMinutes}
            onToggle={value => applyChange({ sessionDurationMinutes: Number.parseInt(value, 10) })}
          />
        </section>

        <section
          className={`card onboarding-card onboarding-step-panel${currentStep !== 2 ? ' hidden' : ''}`}
          data-onboarding-step-panel="2"
        >
          <div className="onboarding-step-header">
            <h2 className="card-title">Fine-tune the plan</h2>
            <p className="card-subtitle">Add equipment, focus areas, and anything to avoid.</p>
          </div>
          <ChoiceGroup
            title="Equipment"
            name="equipmentAccess"
            type="checkbox"
            options={EQUIPMENT_OPTIONS}
            selected={formData.equipmentAccess}
            error={visibleErrors.equipmentAccess}
            onToggle={toggleArrayValue('equipmentAccess')}
          />
          <ChoiceGroup
            title="Focus"
            name="focusAreas"
            type="checkbox"
            options={FOCUS_OPTIONS}
            selected={formData.focusAreas}
            error={visibleErrors.focusAreas}
            onToggle={toggleArrayValue('focusAreas')}
          />
          <ChoiceGroup
            title="Avoid"
            meta="Optional"
            name="limitations"
            type="checkbox"
            options={LIMITATION_OPTIONS}
            selected={formData.limitations}
            error={visibleErrors.limitations}
            onToggle={toggleArrayValue('limitations')}
          />
          <ChoiceGroup
            title="Style"
            name="preferredStyles"
            type="checkbox"
            options={STYLE_OPTIONS}
            selected={formData.preferredStyles}
            error={visibleErrors.preferredStyles}
            onToggle={toggleArrayValue('preferredStyles')}
          />
        </section>

        <section className="card onboarding-card onboarding-actions-card">
          <div
            id="onboarding-review"
            className={`onboarding-review onboarding-review-compact${currentStep !== LAST_STEP ? ' hidden' : ''}`}
          >
            {currentStep === LAST_STEP ? <ReviewSummary data={formData} /> : null}
          </div>
          <p id="onboarding-save-status" className="onboarding-helper-text" data-tone={saveStatus.tone}>
            {saveStatus.message}
          </p>
          <div id="onboarding-submit-error" className="error-message onboarding-submit-error">
            {submitError}
          </div>
          <div className="onboarding-action-row">
            <button
              id="onboarding-back-button"
              className={`secondary-button${currentStep === 0 ? ' hidden' : ''}`}
              type="button"
              onClick={() => goToStep(currentStep - 1)}
            >
              Back
            </button>
            <button
              id="onboarding-next-button"
              type="button"
              className={currentStep === LAST_STEP ? 'hidden' : ''}
              onClick={handleNextStep}
            >
              Continue
            </button>
            <button
              id="onboarding-complete-button"
              className={currentStep !== LAST_STEP ? 'hidden' : ''}
              type="submit"
              disabled={submitting}
            >
              Review recommendations
            </button>
          </div>
        </section>
      </form>
    </>
  );
}
