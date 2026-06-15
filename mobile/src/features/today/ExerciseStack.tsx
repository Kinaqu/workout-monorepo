import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import * as Haptics from 'expo-haptics';

import { AppText } from '@/components/ui/AppText';
import { Field } from '@/components/ui/Field';
import type { WorkoutTodayResponse } from '@/lib/api/contracts';

type WorkoutPlan = Extract<WorkoutTodayResponse, { exercises: unknown }>;
type PlanExercise = WorkoutPlan['exercises'][number];

function resolveExerciseSets(exercise: PlanExercise): number {
  const currentSets = Number.isInteger(exercise.sets) ? exercise.sets : null;
  const maxSets = Number.isInteger(exercise.max_sets) ? exercise.max_sets : null;
  return Math.max(1, currentSets ?? maxSets ?? 1);
}

function formatSetsLabel(exercise: PlanExercise, currentSets: number): string {
  const maxSets = Number.isInteger(exercise.max_sets) ? exercise.max_sets : null;
  if (maxSets && maxSets > currentSets) {
    return `${currentSets}/${maxSets} sets`;
  }
  return `${currentSets} sets`;
}

function formatTargetRange(range: { min: number; max: number } | undefined, unit: string): string {
  if (!range) return '';
  const min = Number.isInteger(range.min) ? range.min : null;
  const max = Number.isInteger(range.max) ? range.max : null;
  if (min === null && max === null) return '';
  if (min !== null && max !== null) {
    return min === max ? `${max} ${unit}` : `${min}-${max} ${unit}`;
  }
  return `${min ?? max} ${unit}`;
}

function formatExerciseTarget(exercise: PlanExercise): string {
  if (exercise.type === 'reps') return formatTargetRange(exercise.reps, 'reps');
  if (exercise.type === 'time') return formatTargetRange(exercise.duration, 'sec');
  return formatTargetRange(exercise.cycles, 'cycles');
}

function inputPlaceholder(type: PlanExercise['type']): string {
  if (type === 'time') return 'Sec';
  if (type === 'cycles') return 'Cycles';
  return 'Reps';
}

function helperText(type: PlanExercise['type']): string {
  if (type === 'time') return 'Enter seconds for each set.';
  if (type === 'cycles') return 'Enter cycles for each set.';
  return 'Enter reps for each set.';
}

// One-card-at-a-time logging: the active exercise is front and center; the
// last card saves. Card-enter and invalid-shake animations use Reanimated
// (replacing the web CSS keyframes).
export function ExerciseStack({
  plan,
  saving,
  onSave,
}: {
  plan: WorkoutPlan;
  saving: boolean;
  onSave: (exercises: { id: string; sets: number[] }[]) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [values, setValues] = useState<string[][]>(() =>
    plan.exercises.map((exercise) => Array.from({ length: resolveExerciseSets(exercise) }, () => ''))
  );
  const [invalidIndex, setInvalidIndex] = useState<number | null>(null);

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  function setValue(exerciseIndex: number, setIndex: number, value: string) {
    setValues((previous) =>
      previous.map((sets, index) =>
        index === exerciseIndex ? sets.map((v, i) => (i === setIndex ? value : v)) : sets
      )
    );
  }

  function triggerShake() {
    // eslint-disable-next-line react-hooks/immutability -- mutating a Reanimated shared value in a handler is intended
    shakeX.value = withSequence(
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 100 }),
      withTiming(-6, { duration: 100 }),
      withTiming(0, { duration: 50 })
    );
  }

  function advance(exerciseIndex: number) {
    if (saving) return;

    const filled = values[exerciseIndex].every((value) => value.trim() !== '');
    if (!filled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setInvalidIndex(exerciseIndex);
      triggerShake();
      setTimeout(() => setInvalidIndex((current) => (current === exerciseIndex ? null : current)), 1400);
      return;
    }

    if (exerciseIndex < plan.exercises.length - 1) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveIndex(exerciseIndex + 1);
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(
      plan.exercises.map((exercise, index) => ({
        id: exercise.id,
        sets: values[index].map((value) => Number.parseInt(value, 10) || 0),
      }))
    );
  }

  const index = activeIndex;
  const exercise = plan.exercises[index];
  const isLast = index === plan.exercises.length - 1;
  const currentSets = resolveExerciseSets(exercise);
  const targetText = formatExerciseTarget(exercise);
  const isInvalid = invalidIndex === index;

  return (
    <Animated.View key={exercise.id} entering={FadeInDown.duration(300)} style={[styles.card, shakeStyle]}>
      <View style={styles.progressRow}>
        <Text style={styles.progressCurrent}>{`${index + 1}/${plan.exercises.length}`}</Text>
        <Text style={styles.progressLabel}>Exercise</Text>
      </View>

      <AppText style={styles.title}>{exercise.name || exercise.id}</AppText>

      <View style={styles.chips}>
        {targetText ? (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{targetText}</Text>
          </View>
        ) : null}
        <View style={[styles.chip, styles.chipAccent]}>
          <Text style={[styles.chipText, styles.chipTextAccent]}>{formatSetsLabel(exercise, currentSets)}</Text>
        </View>
      </View>

      <Text style={styles.helper}>{helperText(exercise.type)}</Text>

      <View style={styles.sets}>
        {values[index].map((value, setIndex) => (
          <View style={styles.setRow} key={setIndex}>
            <Text style={styles.setLabel}>{`Set ${setIndex + 1}`}</Text>
            <Field
              style={styles.setInput}
              numeric
              placeholder={inputPlaceholder(exercise.type)}
              value={value}
              onChangeText={(text) => setValue(index, setIndex, text)}
            />
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerHint}>
          {isInvalid
            ? 'Enter every set first.'
            : isLast
              ? 'Fill every set to save.'
              : 'Fill every set to continue.'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Save workout' : 'Open next exercise'}
          disabled={saving}
          onPress={() => advance(index)}
          style={({ pressed }) => [styles.completeBtn, pressed && styles.completeBtnPressed, saving && styles.completeBtnDisabled]}
        >
          <Text style={styles.completeBtnText}>{isLast ? 'Save workout' : 'Next exercise'}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    paddingTop: 24,
    paddingHorizontal: 22,
    paddingBottom: 20,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: theme.colors.surfaceElevated,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  progressCurrent: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  progressLabel: {
    color: theme.colors.copySecondary,
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },
  title: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 24,
    lineHeight: 28,
    color: theme.colors.copyPrimary,
    marginBottom: 14,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surfacePanelStrong,
  },
  chipAccent: {
    backgroundColor: 'rgba(94, 234, 212, 0.14)',
  },
  chipText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 13,
    color: theme.colors.copyPrimary,
  },
  chipTextAccent: {
    color: theme.colors.accentTeal,
  },
  helper: {
    color: theme.colors.copySecondary,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    marginBottom: 18,
  },
  sets: {
    gap: 10,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.045)',
  },
  setLabel: {
    width: 56,
    color: theme.colors.copySecondary,
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 13,
  },
  setInput: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 18,
  },
  footerHint: {
    flex: 1,
    color: theme.colors.copySecondary,
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },
  completeBtn: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: theme.colors.accentSoft,
  },
  completeBtnPressed: {
    opacity: 0.9,
  },
  completeBtnDisabled: {
    opacity: 0.5,
  },
  completeBtnText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: '#04111f',
  },
}));
