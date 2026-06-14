import { useSyncExternalStore } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppModal } from '@/components/ui/Modal';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { Skeleton } from '@/components/ui/Skeleton';
import type { RecommendationDraftResponse } from '@/lib/api/contracts';
import { humanizeToken } from '@/shared/utils/format';

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
const STEP_LABELS: Record<RecommendationStep, string> = {
  structure: 'Structure',
  exercise: 'Exercises',
  review: 'Review',
};

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
    .filter((day) => schedule[day] && schedule[day] !== 'rest')
    .map((day) => `${DAY_LABELS[day]} ${formatStructureScheduleValue(schedule[day] as string)}`);
}

function getSelectedStructure(draft: DraftJson): DraftStructure | null {
  return draft.structures.find((structure) => structure.id === draft.selected_structure_id) ?? null;
}

function getSlotOption(slot: DraftSlot, exerciseId: string): SlotOption | null {
  return slot.options.find((option) => option.exercise_id === exerciseId) ?? null;
}

function getSelectedOption(slot: DraftSlot): SlotOption | null {
  return getSlotOption(slot, slot.selected_exercise_id) ?? slot.options[0] ?? null;
}

function getRecommendedOption(slot: DraftSlot): SlotOption | null {
  return getSlotOption(slot, slot.recommended_exercise_id) ?? slot.options[0] ?? null;
}

function SchedulePreview({ schedule, extra }: { schedule: Partial<Record<string, string>>; extra?: string }) {
  return (
    <View style={styles.pillRow}>
      {buildSchedulePreview(schedule).map((item) => (
        <Pill key={item}>{item}</Pill>
      ))}
      {extra ? <Pill>{extra}</Pill> : null}
    </View>
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
  return (
    <AppModal
      visible={open && Boolean(slot)}
      onClose={onClose}
      title={slot ? `${slot.workout_name} · Slot ${slot.slot_index + 1}` : undefined}
    >
      <AppText variant="label">Replace exercise</AppText>
      <AppText variant="secondary">Choose one of the compatible replacements for this slot.</AppText>
      <ScrollView style={styles.optionScroll} contentContainerStyle={styles.optionList}>
        {slot
          ? slot.options.map((option) => {
              const selected = option.exercise_id === slot.selected_exercise_id;
              return (
                <Pressable
                  key={option.catalog_exercise_id}
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => onPick(slot.slot_id, option.catalog_exercise_id)}
                  style={({ pressed }) => [
                    styles.optionButton,
                    selected && styles.optionButtonSelected,
                    pressed && styles.pressed,
                    busy && styles.disabled,
                  ]}
                >
                  <View style={styles.optionCopy}>
                    <AppText style={styles.optionName}>{option.name}</AppText>
                    <AppText variant="secondary">{`${formatTargetLabel(option)} · up to ${option.max_sets} sets`}</AppText>
                  </View>
                  <View style={styles.pillRow}>
                    {selected ? <Pill tone="accent">Selected</Pill> : null}
                    {option.recommended ? <Pill tone="accent">Recommended</Pill> : null}
                    <Pill>{humanizeToken(option.type)}</Pill>
                  </View>
                </Pressable>
              );
            })
          : null}
      </ScrollView>
      <Button title="Close" tone="secondary" onPress={onClose} />
    </AppModal>
  );
}

function Stepper({
  step,
  onGoToStep,
}: {
  step: RecommendationStep;
  onGoToStep: (step: RecommendationStep) => void;
}) {
  const currentIndex = FLOW_STEPS.indexOf(step);
  return (
    <View style={styles.stepper}>
      {FLOW_STEPS.map((flowStep, index) => {
        const active = flowStep === step;
        const reachable = index <= currentIndex;
        return (
          <Pressable
            key={flowStep}
            accessibilityRole="button"
            disabled={!reachable}
            onPress={() => onGoToStep(flowStep)}
            style={({ pressed }) => [styles.step, active && styles.stepActive, pressed && reachable && styles.pressed]}
          >
            <View style={[styles.stepIndex, active && styles.stepIndexActive]}>
              <Text style={[styles.stepIndexText, active && styles.stepIndexTextActive]}>{index + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{STEP_LABELS[flowStep]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function StructurePanel({
  draft,
  busy,
  onSelectStructure,
}: {
  draft: DraftJson;
  busy: boolean;
  onSelectStructure: (structureId: string) => void;
}) {
  return (
    <View style={styles.panel}>
      <View>
        <AppText variant="title">Choose your training structure</AppText>
        <AppText variant="secondary">Pick the split you want to start with.</AppText>
      </View>
      {draft.structures.map((structure) => {
        const isSelected = structure.id === draft.selected_structure_id;
        return (
          <Card key={structure.id} style={[styles.cardGap, isSelected && styles.cardSelected]}>
            <View style={styles.rowBetween}>
              <View style={styles.flexShrink}>
                <AppText variant="title">{structure.label}</AppText>
                <AppText variant="secondary">{structure.description}</AppText>
              </View>
              <View style={styles.pillRow}>
                {structure.recommended ? <Pill tone="accent">Recommended</Pill> : null}
                {isSelected ? <Pill tone="accent">Selected</Pill> : null}
              </View>
            </View>
            <SchedulePreview
              schedule={structure.schedule}
              extra={`${structure.workouts.length} ${structure.workouts.length === 1 ? 'session' : 'sessions'}`}
            />
            <Button
              title={isSelected ? 'Selected' : 'Choose structure'}
              tone={isSelected ? 'secondary' : 'primary'}
              disabled={isSelected || busy}
              onPress={() => onSelectStructure(structure.id)}
            />
          </Card>
        );
      })}
    </View>
  );
}

function ExercisePanel({
  draft,
  workouts,
  busy,
  onOpenSlotPicker,
}: {
  draft: DraftJson;
  workouts: DraftStructure['workouts'];
  busy: boolean;
  onOpenSlotPicker: (slotId: string) => void;
}) {
  return (
    <View style={styles.panel}>
      <View>
        <AppText variant="title">Tune each exercise slot</AppText>
        <AppText variant="secondary">{`${draft.exercise_slots.length} slots across ${workouts.length} sessions.`}</AppText>
      </View>
      {workouts.map((workout) => {
        const slots = draft.exercise_slots
          .filter((slot) => slot.workout_key === workout.key)
          .sort((left, right) => left.slot_index - right.slot_index);

        return (
          <Card key={workout.key} style={styles.cardGap}>
            <View>
              <AppText variant="title">{workout.name}</AppText>
              <AppText variant="secondary">{`${slots.length} ${slots.length === 1 ? 'slot' : 'slots'}`}</AppText>
            </View>
            {slots.map((slot) => {
              const selectedOption = getSelectedOption(slot);
              const recommendedOption = getRecommendedOption(slot);
              if (!selectedOption) return null;
              const keepingDefault = slot.selected_exercise_id === slot.recommended_exercise_id;

              return (
                <View key={slot.slot_id} style={styles.slotCard}>
                  <View style={styles.rowBetween}>
                    <View style={styles.flexShrink}>
                      <AppText style={styles.slotTitle}>{`Slot ${slot.slot_index + 1} · ${selectedOption.name}`}</AppText>
                      <AppText variant="secondary">{`${formatTargetLabel(selectedOption)} · up to ${selectedOption.max_sets} sets`}</AppText>
                    </View>
                    <View style={styles.pillRow}>
                      <Pill tone={keepingDefault ? 'accent' : 'neutral'}>{keepingDefault ? 'Recommended' : 'Changed'}</Pill>
                      <Pill>{humanizeToken(selectedOption.type)}</Pill>
                    </View>
                  </View>
                  {recommendedOption && recommendedOption.exercise_id !== selectedOption.exercise_id ? (
                    <AppText variant="muted">{`Default: ${recommendedOption.name}`}</AppText>
                  ) : null}
                  <Button
                    title={slot.options.length > 1 ? 'Replace' : 'No alternatives'}
                    tone="secondary"
                    disabled={slot.options.length <= 1 || busy}
                    onPress={() => onOpenSlotPicker(slot.slot_id)}
                  />
                </View>
              );
            })}
          </Card>
        );
      })}
    </View>
  );
}

function ReviewPanel({
  selectedStructure,
  changedSlots,
}: {
  selectedStructure: DraftStructure | null;
  changedSlots: DraftSlot[];
}) {
  return (
    <View style={styles.panel}>
      <View>
        <AppText variant="title">Review before activation</AppText>
        <AppText variant="secondary">Check the final structure and any changed exercises.</AppText>
      </View>
      <Card style={styles.cardGap}>
        <AppText variant="title">Selected structure</AppText>
        <AppText variant="secondary">
          {selectedStructure ? `${selectedStructure.label} · ${selectedStructure.description}` : 'No structure selected'}
        </AppText>
        <SchedulePreview schedule={selectedStructure?.schedule ?? {}} />
      </Card>
      <Card style={styles.cardGap}>
        <AppText variant="title">Exercise changes</AppText>
        {changedSlots.length === 0 ? (
          <AppText variant="secondary">You are keeping all recommended exercise defaults.</AppText>
        ) : (
          <View style={styles.changeList}>
            {changedSlots.map((slot) => {
              const selectedOption = getSelectedOption(slot);
              const recommendedOption = getRecommendedOption(slot);
              return (
                <View key={slot.slot_id} style={styles.changeItem}>
                  <AppText style={styles.changeTitle}>{`${slot.workout_name} · Slot ${slot.slot_index + 1}`}</AppText>
                  <AppText variant="secondary">
                    {`${recommendedOption?.name ?? 'Default'} -> ${selectedOption?.name ?? 'Selected'}`}
                  </AppText>
                </View>
              );
            })}
          </View>
        )}
      </Card>
    </View>
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
      ? 'Activating…'
      : status === 'updating'
        ? 'Saving changes…'
        : draftResponse?.status === 'activated'
          ? 'Activated'
          : 'Draft';

  const selectedStructure = draft ? getSelectedStructure(draft) : null;
  const workouts = selectedStructure?.workouts ?? [];
  const changedSlots = (draft?.exercise_slots ?? []).filter(
    (slot) => slot.selected_exercise_id !== slot.recommended_exercise_id
  );
  const activeSlot = draft?.exercise_slots.find((slot) => slot.slot_id === view.activeSlotId) ?? null;

  const currentIndex = FLOW_STEPS.indexOf(view.step);

  return (
    <View style={styles.container}>
      <Card style={styles.cardGap}>
        <AppText style={styles.heading}>Review your plan</AppText>
        <AppText variant="secondary">
          Start from the recommended draft, then confirm the version you want to activate.
        </AppText>
        <View style={styles.pillRow}>
          <Pill tone="accent">{badgeText}</Pill>
        </View>
      </Card>

      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

      {showRecovery ? (
        <Card style={styles.cardGap}>
          <AppText variant="title">Could not load your draft</AppText>
          <AppText variant="secondary">Try again to reload your recommendations.</AppText>
          <Button title="Try again" tone="secondary" disabled={busy} onPress={onRetry} />
        </Card>
      ) : null}

      {showLoader ? (
        <View style={styles.loader}>
          <Skeleton width="60%" height={22} />
          <Skeleton width="100%" height={140} radius={24} />
          <Skeleton width="100%" height={180} radius={24} />
        </View>
      ) : null}

      {showContent && draft ? (
        <View style={styles.content}>
          <Card style={styles.cardGap}>
            <AppText variant="title">Built from your profile</AppText>
            <View style={styles.pillRow}>
              {[
                humanizeToken(draft.profile_snapshot.primaryGoal),
                `${draft.profile_snapshot.trainingDaysPerWeek} days/week`,
                `${draft.profile_snapshot.sessionDurationMinutes} min`,
                humanizeToken(draft.profile_snapshot.experienceLevel),
              ].map((item) => (
                <Pill key={item}>{item}</Pill>
              ))}
            </View>
          </Card>

          <Card style={styles.cardGap}>
            <Stepper step={view.step} onGoToStep={onGoToStep} />
          </Card>

          {view.step === 'structure' ? (
            <StructurePanel draft={draft} busy={busy} onSelectStructure={onSelectStructure} />
          ) : null}
          {view.step === 'exercise' ? (
            <ExercisePanel draft={draft} workouts={workouts} busy={busy} onOpenSlotPicker={onOpenSlotPicker} />
          ) : null}
          {view.step === 'review' ? (
            <ReviewPanel selectedStructure={selectedStructure} changedSlots={changedSlots} />
          ) : null}

          <Card style={styles.cardGap}>
            <View style={styles.actionRow}>
              {view.step !== 'structure' ? (
                <Button
                  title="Back"
                  tone="secondary"
                  disabled={busy}
                  onPress={() => onGoToStep(FLOW_STEPS[Math.max(currentIndex - 1, 0)])}
                />
              ) : null}
              {view.step !== 'review' ? (
                <Button
                  title={view.step === 'structure' ? 'Continue to exercises' : 'Review plan'}
                  disabled={busy}
                  onPress={() => onGoToStep(FLOW_STEPS[Math.min(currentIndex + 1, FLOW_STEPS.length - 1)])}
                />
              ) : null}
              {view.step === 'review' ? (
                <Button
                  title={status === 'activating' ? 'Activating…' : 'Activate plan'}
                  disabled={busy}
                  onPress={onActivate}
                />
              ) : null}
            </View>
          </Card>
        </View>
      ) : null}

      <OptionDialog
        slot={activeSlot}
        open={view.pickerOpen && showContent}
        busy={busy}
        onPick={onPickExercise}
        onClose={onClosePicker}
      />
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
  error: {
    color: theme.colors.error,
    textAlign: 'center',
    fontFamily: theme.fonts.body,
    marginVertical: theme.space.sm,
  },
  loader: {
    gap: theme.space.md,
    marginVertical: theme.space.md,
  },
  content: {
    gap: theme.space.md,
  },
  cardGap: {
    gap: theme.space.md,
  },
  cardSelected: {
    borderColor: theme.colors.accentSoft,
    backgroundColor: 'rgba(111, 182, 255, 0.06)',
  },
  panel: {
    gap: theme.space.md,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space.sm,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: theme.space.xs,
    paddingVertical: theme.space.sm,
    borderRadius: theme.radii.md,
  },
  stepActive: {
    backgroundColor: 'rgba(111, 182, 255, 0.10)',
  },
  stepIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  stepIndexActive: {
    backgroundColor: theme.colors.accent,
  },
  stepIndexText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.copySecondary,
  },
  stepIndexTextActive: {
    color: theme.colors.onAccent,
  },
  stepLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 12,
    color: theme.colors.copyMuted,
  },
  stepLabelActive: {
    color: theme.colors.copyPrimary,
  },
  slotCard: {
    gap: theme.space.sm,
    padding: theme.space.md,
    borderRadius: theme.radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  slotTitle: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 15,
    color: theme.colors.copyPrimary,
  },
  changeList: {
    gap: theme.space.sm,
  },
  changeItem: {
    gap: 2,
    padding: theme.space.sm,
    borderRadius: theme.radii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  changeTitle: {
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.copyPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  optionScroll: {
    maxHeight: 360,
  },
  optionList: {
    gap: theme.space.sm,
  },
  optionButton: {
    gap: theme.space.sm,
    padding: theme.space.md,
    borderRadius: theme.radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionButtonSelected: {
    borderColor: theme.colors.accentSoft,
    backgroundColor: 'rgba(111, 182, 255, 0.08)',
  },
  optionCopy: {
    gap: theme.space.xs,
  },
  optionName: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 15,
    color: theme.colors.copyPrimary,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
}));
