import { z } from "@hono/zod-openapi";

const DateStringSchema = z
  .string()
  .openapi({
    example: "2026-03-11",
    description: "Date string in YYYY-MM-DD format.",
  });

const IsoDateTimeSchema = z
  .string()
  .openapi({
    example: "2026-03-29T12:00:00.000Z",
    description: "UTC timestamp in ISO 8601 format.",
  });

const TargetRangeSchema = z
  .object({
    min: z.number().int().openapi({ example: 8 }),
    max: z.number().int().openapi({ example: 12 }),
  })
  .openapi("TargetRange");

const RepsExerciseSchema = z
  .object({
    id: z.string().openapi({ example: "pushups" }),
    name: z.string().openapi({ example: "Push-ups" }),
    type: z.literal("reps"),
    max_sets: z.number().int().positive().openapi({ example: 3 }),
    reps: TargetRangeSchema,
  })
  .openapi("ProgramExerciseReps");

const TimeExerciseSchema = z
  .object({
    id: z.string().openapi({ example: "side_plank" }),
    name: z.string().openapi({ example: "Side Plank" }),
    type: z.literal("time"),
    max_sets: z.number().int().positive().openapi({ example: 3 }),
    duration: TargetRangeSchema,
  })
  .openapi("ProgramExerciseTime");

const CyclesExerciseSchema = z
  .object({
    id: z.string().openapi({ example: "breathing" }),
    name: z.string().openapi({ example: "Breathing" }),
    type: z.literal("cycles"),
    max_sets: z.number().int().positive().openapi({ example: 1 }),
    cycles: TargetRangeSchema,
  })
  .openapi("ProgramExerciseCycles");

export const ProgramExerciseSchema = z.union([
  RepsExerciseSchema,
  TimeExerciseSchema,
  CyclesExerciseSchema,
]);

export const ProgramWorkoutSchema = z
  .object({
    name: z.string().openapi({ example: "Workout A" }),
    exercises: z.array(ProgramExerciseSchema).min(1),
  })
  .openapi("ProgramWorkout");

export const ProgramScheduleSchema = z
  .object({
    monday: z.string().openapi({ example: "A" }),
    tuesday: z.string().openapi({ example: "B" }),
    wednesday: z.string().openapi({ example: "stretch" }),
    thursday: z.string().openapi({ example: "A" }),
    friday: z.string().openapi({ example: "B" }),
    saturday: z.string().openapi({ example: "stretch" }),
    sunday: z.string().openapi({ example: "rest" }),
  })
  .openapi("ProgramSchedule");

export const ProgramDefinitionSchema = z
  .object({
    id: z.string().openapi({ example: "default" }),
    name: z.string().openapi({ example: "Base Program" }),
    schedule: ProgramScheduleSchema,
    workouts: z.record(z.string(), ProgramWorkoutSchema),
  })
  .openapi("ProgramDefinition");

const ProgressionStateValueSchema = z
  .object({
    sets: z.number().int().openapi({ example: 2 }),
    min: z.number().int().openapi({ example: 8 }),
    max: z.number().int().openapi({ example: 12 }),
    last_progression: z.string().nullable().openapi({ example: "2026-03-27" }),
  })
  .openapi("ProgressionStateValue");

export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({ example: "Invalid request" }),
    detail: z.string().optional().openapi({ example: "Invalid date. Use format: 2026-03-11" }),
  })
  .openapi("ErrorResponse");

export const DisabledAuthResponseSchema = z
  .object({
    error: z
      .string()
      .openapi({
        example:
          "Local auth is disabled. Use Clerk authentication on the frontend and send the Clerk Bearer token.",
      }),
  })
  .openapi("DisabledAuthResponse");

export const ProgramResponseSchema = ProgramDefinitionSchema.extend({
  version_id: z.string().openapi({ example: "program_123" }),
  source: z.string().openapi({ example: "api" }),
  userSets: z.record(z.string(), z.number().int()).openapi({
    example: {
      pushups: 2,
      squats: 3,
    },
  }),
  progressionState: z.record(z.string(), ProgressionStateValueSchema),
}).openapi("ProgramResponse");

export const ProgramMutationResponseSchema = z
  .object({
    ok: z.literal(true),
    message: z.string().openapi({ example: "Program saved" }),
    program: ProgramDefinitionSchema.extend({
      version_id: z.string().openapi({ example: "program_123" }),
    }),
  })
  .openapi("ProgramMutationResponse");

const WorkoutExerciseBaseSchema = z.object({
  id: z.string().openapi({ example: "pushups" }),
  name: z.string().openapi({ example: "Push-ups" }),
  sets: z.number().int().positive().openapi({ example: 2 }),
  max_sets: z.number().int().positive().openapi({ example: 3 }),
});

const WorkoutExerciseRepsSchema = WorkoutExerciseBaseSchema.extend({
  type: z.literal("reps"),
  reps: TargetRangeSchema,
}).openapi("WorkoutExerciseReps");

const WorkoutExerciseTimeSchema = WorkoutExerciseBaseSchema.extend({
  type: z.literal("time"),
  duration: TargetRangeSchema,
}).openapi("WorkoutExerciseTime");

const WorkoutExerciseCyclesSchema = WorkoutExerciseBaseSchema.extend({
  type: z.literal("cycles"),
  cycles: TargetRangeSchema,
}).openapi("WorkoutExerciseCycles");

export const WorkoutExerciseSchema = z.union([
  WorkoutExerciseRepsSchema,
  WorkoutExerciseTimeSchema,
  WorkoutExerciseCyclesSchema,
]);

export const WorkoutPlanResponseSchema = z
  .object({
    date: DateStringSchema,
    type: z.string().openapi({ example: "A" }),
    name: z.string().openapi({ example: "Workout A" }),
    exercises: z.array(WorkoutExerciseSchema),
    program_id: z.string().openapi({ example: "default" }),
    program_version_id: z.string().openapi({ example: "program_123" }),
  })
  .openapi("WorkoutPlanResponse");

export const RestDayResponseSchema = z
  .object({
    type: z.literal("rest"),
    date: DateStringSchema,
    message: z.string().openapi({ example: "Today is a rest day" }),
  })
  .openapi("RestDayResponse");

export const WorkoutTodayResponseSchema = z
  .union([RestDayResponseSchema, WorkoutPlanResponseSchema])
  .openapi("WorkoutTodayResponse");

const ProgressionBoundsSchema = z
  .object({
    sets: z.number().int().openapi({ example: 2 }),
    min: z.number().int().openapi({ example: 8 }),
    max: z.number().int().openapi({ example: 12 }),
  })
  .openapi("ProgressionBounds");

const ProgressionChangeSchema = z
  .object({
    id: z.string().openapi({ example: "pushups" }),
    name: z.string().openapi({ example: "Push-ups" }),
    direction: z.enum(["up", "down"]),
    reason: z.string().openapi({ example: "performed above target in 2 sessions" }),
    before: ProgressionBoundsSchema,
    after: ProgressionBoundsSchema,
  })
  .openapi("ProgressionChange");

const ProgressionSkippedSchema = z
  .object({
    id: z.string().openapi({ example: "pushups" }),
    reason: z.string().openapi({ example: "performance stayed within target range" }),
  })
  .openapi("ProgressionSkipped");

export const ProgressionRunResponseSchema = z
  .object({
    ok: z.literal(true),
    progression_date: DateStringSchema,
    result: z.object({
      changed: z.array(ProgressionChangeSchema),
      skipped: z.array(ProgressionSkippedSchema),
    }),
  })
  .openapi("ProgressionRunResponse");

export const JsonLogExerciseSchema = z
  .object({
    id: z.string().openapi({ example: "pushups" }),
    name: z.string().optional().openapi({ example: "Push-ups" }),
    sets: z.array(z.number().int()).openapi({ example: [10, 10, 9] }),
  })
  .openapi("JsonLogExercise");

export const JsonLogRequestSchema = z
  .object({
    session_date: DateStringSchema.optional(),
    note: z.string().optional().openapi({ example: "Felt strong today" }),
    workout_type: z.string().nullable().optional().openapi({ example: "A" }),
    exercises: z.array(JsonLogExerciseSchema).optional(),
  })
  .openapi("JsonLogRequest");

export const PlainTextLogRequestSchema = z
  .string()
  .openapi({
    example: "Push-ups 10 10 9\nSquats 15 15 15",
    description: "Legacy plain-text log format.",
  });

export const SessionLogExerciseSchema = z
  .object({
    id: z.string().openapi({ example: "pushups" }),
    name: z.string().openapi({ example: "Push-ups" }),
    sets: z.array(z.number().int()).openapi({ example: [10, 10, 9] }),
  })
  .openapi("SessionLogExercise");

export const WorkoutSessionExerciseSchema = z
  .object({
    id: z.string().openapi({ example: "se_123" }),
    exerciseKey: z.string().nullable().openapi({ example: "pushups" }),
    exerciseName: z.string().openapi({ example: "Push-ups" }),
    exerciseType: z.enum(["reps", "time", "cycles"]).nullable().openapi({ example: "reps" }),
    matched: z.boolean().openapi({ example: true }),
    sortOrder: z.number().int().openapi({ example: 0 }),
    sets: z.array(z.number().int()).openapi({ example: [10, 10, 9] }),
  })
  .openapi("WorkoutSessionExercise");

export const WorkoutSessionRecordSchema = z
  .object({
    id: z.string().openapi({ example: "session_123" }),
    sessionDate: DateStringSchema,
    workoutType: z.string().nullable().openapi({ example: "A" }),
    workoutName: z.string().nullable().openapi({ example: "Workout A" }),
    note: z.string().openapi({ example: "Felt strong today" }),
    source: z.enum(["json", "text", "legacy-kv"]),
    rawText: z.string().nullable().openapi({ example: null }),
    unmatched: z.array(z.string()).openapi({ example: [] }),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
    exercises: z.array(WorkoutSessionExerciseSchema),
  })
  .openapi("WorkoutSessionRecord");

export const LegacyLogEntrySchema = z
  .object({
    date: DateStringSchema,
    workout_type: z.string().nullable().openapi({ example: "A" }),
    exercises: z.array(SessionLogExerciseSchema),
    note: z.string().openapi({ example: "Felt strong today" }),
    unmatched: z.array(z.string()).openapi({ example: [] }),
    source: z.enum(["json", "text", "legacy-kv"]),
    session_id: z.string().openapi({ example: "session_123" }),
    created_at: IsoDateTimeSchema,
  })
  .openapi("LegacyLogEntry");

export const LogCreateResponseSchema = z
  .object({
    ok: z.literal(true),
    date: DateStringSchema,
    entry: LegacyLogEntrySchema,
    session: WorkoutSessionRecordSchema,
  })
  .openapi("LogCreateResponse");

export const LegacyLogByDateResponseSchema = LegacyLogEntrySchema.extend({
  session_count: z.number().int().openapi({ example: 1 }),
  sessions: z.array(WorkoutSessionRecordSchema),
}).openapi("LegacyLogByDateResponse");

export const SessionsListResponseSchema = z
  .object({
    sessions: z.array(WorkoutSessionRecordSchema),
    count: z.number().int().openapi({ example: 10 }),
  })
  .openapi("SessionsListResponse");

export const DateQuerySchema = z.object({
  date: z
    .string()
    .optional()
    .openapi({
      param: {
        name: "date",
        in: "query",
      },
      example: "2026-03-11",
      description: "Optional workout date in YYYY-MM-DD format.",
    }),
});

export const SessionListQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .openapi({
      param: {
        name: "limit",
        in: "query",
      },
      example: "20",
      description: "Optional max sessions to return. Invalid values fall back to 20.",
    }),
  date: z
    .string()
    .optional()
    .openapi({
      param: {
        name: "date",
        in: "query",
      },
      example: "2026-03-11",
      description: "Optional session date filter in YYYY-MM-DD format.",
    }),
});

export const DateParamSchema = z.object({
  date: z.string().openapi({
    param: {
      name: "date",
      in: "path",
    },
    example: "2026-03-11",
    description: "Workout log date in YYYY-MM-DD format.",
  }),
});

export const SessionIdParamSchema = z.object({
  id: z.string().openapi({
    param: {
      name: "id",
      in: "path",
    },
    example: "session_123",
    description: "Workout session identifier.",
  }),
});

export const ResetTokenHeaderSchema = z.object({
  "X-Reset-Token": z.string().openapi({
    param: {
      name: "X-Reset-Token",
      in: "header",
    },
    example: "local-reset-token",
    description: "Shared reset token required to reset the active program.",
  }),
});

export const WorkoutDateHeaderSchema = z.object({
  "X-Workout-Date": z
    .string()
    .optional()
    .openapi({
      param: {
        name: "X-Workout-Date",
        in: "header",
      },
      example: "2026-03-11",
      description: "Optional workout date override in YYYY-MM-DD format.",
    }),
});
