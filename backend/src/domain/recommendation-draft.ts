import { z } from "zod";

export const RECOMMENDATION_DRAFT_STATUSES = ["draft", "activated"] as const;
export type RecommendationDraftStatus = (typeof RECOMMENDATION_DRAFT_STATUSES)[number];

export const DAY_NAMES = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export type RecommendationDraftDayName = (typeof DAY_NAMES)[number];

export const EXERCISE_TYPES = ["reps", "time", "cycles"] as const;
export type RecommendationDraftExerciseType = (typeof EXERCISE_TYPES)[number];

const nonEmptyString = z.string().trim().min(1);
const positiveInteger = z.number().int().positive();

export const RecommendationDraftProfileSnapshotSchema = z
  .object({
    primaryGoal: nonEmptyString,
    experienceLevel: nonEmptyString,
    trainingDaysPerWeek: z.number().int().min(2).max(5),
    sessionDurationMinutes: z.number().int().min(20).max(75),
    splitPreference: nonEmptyString,
    volumeLevel: nonEmptyString,
    equipmentAccess: z.array(nonEmptyString),
    focusAreas: z.array(nonEmptyString),
    limitationTags: z.array(nonEmptyString),
    preferredStyles: z.array(nonEmptyString),
    preferredWorkoutTags: z.array(nonEmptyString),
    excludedWorkoutTags: z.array(nonEmptyString),
  })
  .strict();

export const RecommendationDraftStructureWorkoutSchema = z
  .object({
    key: nonEmptyString,
    name: nonEmptyString,
    tags: z.array(nonEmptyString).min(1),
  })
  .strict();

export const RecommendationDraftStructureSchema = z
  .object({
    id: nonEmptyString,
    label: nonEmptyString,
    description: nonEmptyString,
    schedule: z.record(z.enum(DAY_NAMES), nonEmptyString),
    workouts: z.array(RecommendationDraftStructureWorkoutSchema).min(1),
    recommended: z.boolean(),
  })
  .strict();

export const RecommendationDraftExerciseOptionSchema = z
  .object({
    catalog_exercise_id: nonEmptyString,
    exercise_id: nonEmptyString,
    name: nonEmptyString,
    type: z.enum(EXERCISE_TYPES),
    target_min: positiveInteger,
    target_max: positiveInteger,
    max_sets: positiveInteger,
    recommended: z.boolean(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.target_max < value.target_min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "target_max must be greater than or equal to target_min",
        path: ["target_max"],
      });
    }
  });

export const RecommendationDraftExerciseSlotSchema = z
  .object({
    slot_id: nonEmptyString,
    workout_key: nonEmptyString,
    workout_name: nonEmptyString,
    slot_index: z.number().int().min(0),
    blueprint_tags: z.array(nonEmptyString).min(1),
    recommended_exercise_id: nonEmptyString,
    selected_exercise_id: nonEmptyString,
    options: z.array(RecommendationDraftExerciseOptionSchema).min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    const optionIds = new Set(value.options.map(option => option.exercise_id));
    if (!optionIds.has(value.recommended_exercise_id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "recommended_exercise_id must exist in options",
        path: ["recommended_exercise_id"],
      });
    }
    if (!optionIds.has(value.selected_exercise_id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "selected_exercise_id must exist in options",
        path: ["selected_exercise_id"],
      });
    }

    const types = new Set(value.options.map(option => option.type));
    if (types.size > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "all slot options must share the same exercise type",
        path: ["options"],
      });
    }
  });

export const RecommendationDraftActivationContextSchema = z
  .object({
    activated_program_id: nonEmptyString.nullable().optional(),
    activated_at: nonEmptyString.nullable().optional(),
  })
  .strict();

export const RecommendationDraftJsonSchema = z
  .object({
    status: z.enum(RECOMMENDATION_DRAFT_STATUSES),
    profile_snapshot: RecommendationDraftProfileSnapshotSchema,
    structures: z.array(RecommendationDraftStructureSchema).min(1),
    selected_structure_id: nonEmptyString,
    exercise_slots: z.array(RecommendationDraftExerciseSlotSchema).min(1),
    generator_version: nonEmptyString,
    catalog_seed_version: nonEmptyString,
    activation_context: RecommendationDraftActivationContextSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const structureIds = new Set<string>();
    let recommendedCount = 0;

    for (const [index, structure] of value.structures.entries()) {
      if (structureIds.has(structure.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "structure ids must be unique",
          path: ["structures", index, "id"],
        });
      }
      structureIds.add(structure.id);

      if (structure.recommended) {
        recommendedCount += 1;
      }

      const workoutKeys = new Set(structure.workouts.map(workout => workout.key));
      for (const day of DAY_NAMES) {
        const scheduled = structure.schedule[day];
        if (scheduled !== "rest" && !workoutKeys.has(scheduled)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `schedule.${day} references unknown workout key`,
            path: ["structures", index, "schedule", day],
          });
        }
      }
    }

    if (!structureIds.has(value.selected_structure_id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "selected_structure_id must exist in structures",
        path: ["selected_structure_id"],
      });
    }

    if (recommendedCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "exactly one structure must be marked recommended",
        path: ["structures"],
      });
    }

    const selectedStructure = value.structures.find(
      structure => structure.id === value.selected_structure_id
    );
    const selectedWorkoutKeys = new Set(
      (selectedStructure?.workouts ?? []).map(workout => workout.key)
    );

    const slotIds = new Set<string>();
    for (const [index, slot] of value.exercise_slots.entries()) {
      if (slotIds.has(slot.slot_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "slot ids must be unique",
          path: ["exercise_slots", index, "slot_id"],
        });
      }
      slotIds.add(slot.slot_id);

      if (!selectedWorkoutKeys.has(slot.workout_key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "slot workout_key must exist in selected structure",
          path: ["exercise_slots", index, "workout_key"],
        });
      }
    }
  });

export type RecommendationDraftProfileSnapshot = z.infer<
  typeof RecommendationDraftProfileSnapshotSchema
>;
export type RecommendationDraftStructureWorkout = z.infer<
  typeof RecommendationDraftStructureWorkoutSchema
>;
export type RecommendationDraftStructure = z.infer<
  typeof RecommendationDraftStructureSchema
>;
export type RecommendationDraftExerciseOption = z.infer<
  typeof RecommendationDraftExerciseOptionSchema
>;
export type RecommendationDraftExerciseSlot = z.infer<
  typeof RecommendationDraftExerciseSlotSchema
>;
export type RecommendationDraftActivationContext = z.infer<
  typeof RecommendationDraftActivationContextSchema
>;
export type RecommendationDraftJson = z.infer<typeof RecommendationDraftJsonSchema>;

export function validateRecommendationDraftJson(input: unknown): RecommendationDraftJson {
  const result = RecommendationDraftJsonSchema.safeParse(input);
  if (result.success) {
    return result.data;
  }

  throw new Error(
    `Invalid recommendation draft json: ${result.error.issues
      .map(issue => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ")}`
  );
}
