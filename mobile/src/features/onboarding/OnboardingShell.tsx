import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChoiceChip } from '@/components/ui/ChoiceChip';
import { ChoiceGroup } from '@/components/ui/ChoiceGroup';
import { Pill } from '@/components/ui/Pill';
import { api } from '@/lib/api/client';
import type { OnboardingStateResponse } from '@/lib/api/contracts';
import { AuthRedirectError } from '@/lib/api/errors';
import { getApiErrorMessage } from '@/shared/hooks/use-routed-api-error';
import { mergeOnboardingData, validateOnboardingPayload } from '@/shared/utils/onboarding';
import { selectShellMode } from '@/lib/product-state';
import { darkTheme } from '@/theme/tokens';

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
  return options.find((option) => option.value === value)?.label ?? value;
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

function toneColor(tone: string): string {
  if (tone === 'error') return darkTheme.colors.error;
  if (tone === 'success') return darkTheme.colors.success;
  if (tone === 'pending') return darkTheme.colors.accentSoft;
  return darkTheme.colors.copyMuted;
}

function ChoiceField({
  title,
  meta,
  options,
  selected,
  error,
  onToggle,
}: {
  title: string;
  meta?: string;
  options: ChoiceOption[];
  selected: string[];
  error?: string;
  onToggle: (value: string, checked: boolean) => void;
}) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHeading}>
        <AppText variant="title" style={styles.groupTitle}>
          {title}
        </AppText>
        {meta ? <AppText variant="muted">{meta}</AppText> : null}
      </View>
      <ChoiceGroup>
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <ChoiceChip
              key={option.value}
              label={option.label}
              description={option.small}
              selected={isSelected}
              onPress={() => onToggle(option.value, !isSelected)}
            />
          );
        })}
      </ChoiceGroup>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function ReviewSummary({ data }: { data: OnboardingFormData }) {
  const sections = [
    { title: 'Goal', values: data.goals.map((value) => optionLabel(GOAL_OPTIONS, value)) },
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
    { title: 'Equipment', values: data.equipmentAccess.map((value) => optionLabel(EQUIPMENT_OPTIONS, value)) },
    { title: 'Focus', values: data.focusAreas.map((value) => optionLabel(FOCUS_OPTIONS, value)) },
    { title: 'Avoid', values: data.limitations.map((value) => optionLabel(LIMITATION_OPTIONS, value)) },
    { title: 'Style', values: data.preferredStyles.map((value) => optionLabel(STYLE_OPTIONS, value)) },
  ]
    .map((section) => ({ ...section, values: section.values.length > 0 ? section.values : ['None'] }))
    .filter((section) => section.values.some((value) => value !== 'None' && value !== 'Not set'));

  return (
    <View style={styles.reviewList}>
      {sections.map((section) => (
        <View style={styles.reviewSection} key={section.title}>
          <AppText variant="label">{section.title}</AppText>
          <View style={styles.pillRow}>
            {section.values.slice(0, 3).map((value) => (
              <Pill key={value}>{value}</Pill>
            ))}
            {section.values.length > 3 ? <Pill>{`+${section.values.length - 3}`}</Pill> : null}
          </View>
        </View>
      ))}
    </View>
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

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSignatureRef = useRef('');
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Hydrate the form whenever the bridge loads a fresh onboarding state.
  useEffect(() => {
    if (!hydration) return;

    const data = mergeOnboardingData((hydration.onboarding as { answers?: unknown }).answers ?? null) as OnboardingFormData;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing the form to a freshly loaded server draft
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
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  function scheduleDraftSave() {
    if (selectShellMode() !== 'onboarding' || isCompleted()) return;

    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
    }
    setSaveStatus({ message: 'Saving…', tone: 'pending' });

    saveTimerRef.current = setTimeout(async () => {
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
    setFormData((previous) => ({ ...previous, ...patch }));
    setSubmitError('');
    setVisibleErrors({});
    scheduleDraftSave();
  }

  function toggleArray(
    field: 'goals' | 'equipmentAccess' | 'focusAreas' | 'limitations' | 'preferredStyles',
    value: string,
    checked: boolean
  ) {
    const current = formData[field];
    applyChange({ [field]: checked ? [...current, value] : current.filter((item) => item !== value) });
  }

  function goToStep(nextStep: number) {
    const bounded = Math.max(0, Math.min(nextStep, LAST_STEP));
    setCurrentStep(bounded);
    setSubmitError('');
    setVisibleErrors(filterErrorsForStep(validatePayload(formData), bounded));
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

  async function handleComplete() {
    if (submitting) return;

    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (isCompleted()) {
      await onCompleted();
      return;
    }

    const errors = validatePayload(formData);
    setVisibleErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSubmitError('Fill the highlighted fields before preparing your draft.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSaveStatus({ message: 'Preparing your recommended draft…', tone: 'pending' });

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
    <View style={styles.container}>
      <Card style={styles.cardGap}>
        <AppText style={styles.heading}>Set up your plan</AppText>
        <AppText variant="secondary">Pick your goal, routine, and preferences.</AppText>
        {badge ? (
          <View style={styles.pillRow}>
            <Pill tone="accent">{badge}</Pill>
          </View>
        ) : null}
      </Card>

      <Card style={styles.progressCard}>
        {steps.map((step) => {
          const active = step.index === currentStep;
          const complete = step.index < currentStep;
          return (
            <View style={styles.progressStep} key={step.index}>
              <View style={[styles.progressIndex, (active || complete) && styles.progressIndexActive]}>
                <Text style={[styles.progressIndexText, (active || complete) && styles.progressIndexTextActive]}>
                  {step.index + 1}
                </Text>
              </View>
              <Text style={[styles.progressLabel, active && styles.progressLabelActive]}>{step.label}</Text>
            </View>
          );
        })}
      </Card>

      {currentStep === 0 ? (
        <Card style={styles.cardGap}>
          <View>
            <AppText variant="title">Start with your goal</AppText>
            <AppText variant="secondary">Choose what matters most right now.</AppText>
          </View>
          <ChoiceField
            title="Goals"
            options={GOAL_OPTIONS}
            selected={formData.goals}
            error={visibleErrors.goals}
            onToggle={(value, checked) => toggleArray('goals', value, checked)}
          />
          <ChoiceField
            title="Level"
            options={LEVEL_OPTIONS}
            selected={formData.experienceLevel ? [formData.experienceLevel] : []}
            error={visibleErrors.experienceLevel}
            onToggle={(value) => applyChange({ experienceLevel: value })}
          />
        </Card>
      ) : null}

      {currentStep === 1 ? (
        <Card style={styles.cardGap}>
          <View>
            <AppText variant="title">Pick a routine</AppText>
            <AppText variant="secondary">Choose what you can realistically stick to.</AppText>
          </View>
          <ChoiceField
            title="Days per week"
            options={DAYS_OPTIONS}
            selected={formData.trainingDaysPerWeek ? [String(formData.trainingDaysPerWeek)] : []}
            error={visibleErrors.trainingDaysPerWeek}
            onToggle={(value) => applyChange({ trainingDaysPerWeek: Number.parseInt(value, 10) })}
          />
          <ChoiceField
            title="Session length"
            options={DURATION_OPTIONS}
            selected={formData.sessionDurationMinutes ? [String(formData.sessionDurationMinutes)] : []}
            error={visibleErrors.sessionDurationMinutes}
            onToggle={(value) => applyChange({ sessionDurationMinutes: Number.parseInt(value, 10) })}
          />
        </Card>
      ) : null}

      {currentStep === 2 ? (
        <Card style={styles.cardGap}>
          <View>
            <AppText variant="title">Fine-tune the plan</AppText>
            <AppText variant="secondary">Add equipment, focus areas, and anything to avoid.</AppText>
          </View>
          <ChoiceField
            title="Equipment"
            options={EQUIPMENT_OPTIONS}
            selected={formData.equipmentAccess}
            error={visibleErrors.equipmentAccess}
            onToggle={(value, checked) => toggleArray('equipmentAccess', value, checked)}
          />
          <ChoiceField
            title="Focus"
            options={FOCUS_OPTIONS}
            selected={formData.focusAreas}
            error={visibleErrors.focusAreas}
            onToggle={(value, checked) => toggleArray('focusAreas', value, checked)}
          />
          <ChoiceField
            title="Avoid"
            meta="Optional"
            options={LIMITATION_OPTIONS}
            selected={formData.limitations}
            error={visibleErrors.limitations}
            onToggle={(value, checked) => toggleArray('limitations', value, checked)}
          />
          <ChoiceField
            title="Style"
            options={STYLE_OPTIONS}
            selected={formData.preferredStyles}
            error={visibleErrors.preferredStyles}
            onToggle={(value, checked) => toggleArray('preferredStyles', value, checked)}
          />
        </Card>
      ) : null}

      <Card style={styles.cardGap}>
        {currentStep === LAST_STEP ? <ReviewSummary data={formData} /> : null}
        <Text style={[styles.helper, { color: toneColor(saveStatus.tone) }]}>{saveStatus.message}</Text>
        {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
        <View style={styles.actionRow}>
          {currentStep !== 0 ? (
            <Button title="Back" tone="secondary" onPress={() => goToStep(currentStep - 1)} />
          ) : null}
          {currentStep !== LAST_STEP ? <Button title="Continue" onPress={handleNextStep} /> : null}
          {currentStep === LAST_STEP ? (
            <Button title="Review recommendations" disabled={submitting} onPress={() => void handleComplete()} />
          ) : null}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.space.md,
  },
  heading: {
    fontFamily: theme.fonts.displaySemiBold,
    fontSize: 24,
    color: theme.colors.foreground,
  },
  cardGap: {
    gap: theme.space.md,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space.sm,
  },
  progressStep: {
    flex: 1,
    alignItems: 'center',
    gap: theme.space.xs,
  },
  progressIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  progressIndexActive: {
    backgroundColor: theme.colors.accent,
  },
  progressIndexText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.copySecondary,
  },
  progressIndexTextActive: {
    color: theme.colors.onAccent,
  },
  progressLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 12,
    color: theme.colors.copyMuted,
  },
  progressLabelActive: {
    color: theme.colors.copyPrimary,
  },
  group: {
    gap: theme.space.sm,
  },
  groupHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  groupTitle: {
    fontSize: 16,
  },
  fieldError: {
    color: theme.colors.error,
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },
  reviewList: {
    gap: theme.space.sm,
  },
  reviewSection: {
    gap: theme.space.xs,
  },
  helper: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
  },
  error: {
    color: theme.colors.error,
    fontFamily: theme.fonts.body,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
}));
