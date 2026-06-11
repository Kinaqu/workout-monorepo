// Compile-time pins between the OpenAPI schemas (the documented wire
// contract) and the domain types that intentionally duplicate them.
//
// Wire response types are enforced at the source: every public service
// method declares its return type as z.infer of the response schema (see
// the type aliases at the bottom of ./schemas). The pins below cover the
// remaining seams, where the domain keeps its own definitions so it does
// not depend on the OpenAPI layer. If either side drifts, this file stops
// compiling. Nothing here is executed.
import type { z } from "@hono/zod-openapi";

import type { OnboardingAnswers, OnboardingDraft } from "../domain/onboarding";
import type { ProgramDefinitionApi, ProgramDefinitionInput } from "../domain/program";
import type { ProgressionChange, WorkoutPlan } from "../domain/progression";
import type { RecommendationDraftJson } from "../domain/recommendation-draft";
import type { LegacyLogEntry, WorkoutSessionExercise, WorkoutSessionRecord } from "../domain/session";
import type {
  LegacyLogEntrySchema,
  OnboardingAnswersSchema,
  OnboardingDraftSchema,
  ProgramDefinitionSchema,
  ProgressionChangeSchema,
  RecommendationDraftJsonSchema,
  WorkoutExerciseSchema,
  WorkoutSessionExerciseSchema,
  WorkoutSessionRecordSchema,
} from "./schemas";

type Expect<T extends true> = T;
// A extends B: every A is a valid B. Catches missing or mistyped fields
// (what breaks API clients); undocumented extra fields are not flagged.
type Extends<A, B> = A extends B ? true : false;
// Mutual assignability. Deliberately not the invariance-based Equal trick,
// which reports false negatives for structurally identical types that are
// represented differently (e.g. Record<DayName, string> vs a literal
// object type with the same keys).
type Equal<X, Y> = [Extends<X, Y>, Extends<Y, X>] extends [true, true] ? true : false;

// --- Domain types duplicated by schemas stay in lockstep ---

export type AssertSessionExercise = Expect<
  Equal<WorkoutSessionExercise, z.infer<typeof WorkoutSessionExerciseSchema>>
>;
export type AssertSessionRecord = Expect<
  Equal<WorkoutSessionRecord, z.infer<typeof WorkoutSessionRecordSchema>>
>;
export type AssertLegacyLogEntry = Expect<
  Equal<LegacyLogEntry, z.infer<typeof LegacyLogEntrySchema>>
>;
export type AssertProgressionChange = Expect<
  Equal<ProgressionChange, z.infer<typeof ProgressionChangeSchema>>
>;
export type AssertProgramDefinitionApi = Expect<
  Equal<ProgramDefinitionApi, z.infer<typeof ProgramDefinitionSchema>>
>;
export type AssertWorkoutPlanExercises = Expect<
  Equal<WorkoutPlan["exercises"][number], z.infer<typeof WorkoutExerciseSchema>>
>;

// The domain and openapi recommendation-draft schema trees are maintained
// separately (domain adds refinements the doc does not need); their inferred
// shapes must stay identical.
export type AssertDraftJson = Expect<
  Equal<RecommendationDraftJson, z.infer<typeof RecommendationDraftJsonSchema>>
>;

// --- Wire inputs remain compatible with the domain types that consume them ---

// A program definition accepted at the route boundary is a valid input for
// domain validation (the domain type additionally allows an internal
// catalogExerciseId the wire contract does not expose).
export type AssertProgramDefinitionInput = Expect<
  Extends<z.infer<typeof ProgramDefinitionSchema>, ProgramDefinitionInput>
>;

// Validated domain onboarding values satisfy the wire shapes they are
// embedded into (domain requires fields the wire marks optional).
export type AssertOnboardingDraftOut = Expect<
  Extends<OnboardingDraft, z.infer<typeof OnboardingDraftSchema>>
>;
export type AssertOnboardingAnswersOut = Expect<
  Extends<OnboardingAnswers, z.infer<typeof OnboardingAnswersSchema>>
>;
