// Stable import surface for API types.
//
// Wire types are aliases into lib/api/types.gen.ts, which is generated from
// backend/openapi.json (npm run generate:api). Never hand-edit the generated
// file; add aliases here as new schemas are consumed.
import type { components } from './types.gen';

type Schemas = components['schemas'];

// Wire contracts (generated from the backend OpenAPI document).
export type ErrorResponse = Schemas['ErrorResponse'];
export type GeneratedProgramResponse = Schemas['GeneratedProgramResponse'];
export type JsonLogRequest = Schemas['JsonLogRequest'];
export type LogCreateResponse = Schemas['LogCreateResponse'];
export type MeResponse = Schemas['MeResponse'];
export type OnboardingAnswers = Schemas['OnboardingAnswers'];
export type OnboardingCompleteResponse = Schemas['OnboardingCompleteResponse'];
export type OnboardingDraft = Schemas['OnboardingDraft'];
export type OnboardingDraftSaveResponse = Schemas['OnboardingDraftSaveResponse'];
export type OnboardingStateResponse = Schemas['OnboardingStateResponse'];
export type ProgramDefinition = Schemas['ProgramDefinition'];
export type ProgramMutationResponse = Schemas['ProgramMutationResponse'];
export type ProgramResponse = Schemas['ProgramResponse'];
export type ProgressionRunResponse = Schemas['ProgressionRunResponse'];
export type RecommendationDraftActivateRequest = Schemas['RecommendationDraftActivateRequest'];
export type RecommendationDraftActivateResponse = Schemas['RecommendationDraftActivateResponse'];
export type RecommendationDraftExerciseReplaceRequest = Schemas['RecommendationDraftExerciseReplaceRequest'];
export type RecommendationDraftResponse = Schemas['RecommendationDraftResponse'];
export type RecommendationDraftStructureSelectRequest = Schemas['RecommendationDraftStructureSelectRequest'];
export type SessionsListResponse = Schemas['SessionsListResponse'];
export type WorkoutSessionRecord = Schemas['WorkoutSessionRecord'];
export type WorkoutTodayResponse = Schemas['WorkoutTodayResponse'];

// Frontend-only types (not part of the wire contract).
export interface ApiErrorPayload {
  error?: string;
  detail?: string;
  message?: string;
  [key: string]: unknown;
}

export interface ApiClient {
  getMe(): Promise<MeResponse>;
  getOnboarding(): Promise<OnboardingStateResponse>;
  saveOnboardingDraft(payload: OnboardingDraft): Promise<OnboardingDraftSaveResponse>;
  completeOnboarding(payload: OnboardingAnswers): Promise<OnboardingCompleteResponse>;
  getRecommendationDraft(): Promise<RecommendationDraftResponse>;
  createRecommendationDraft(): Promise<RecommendationDraftResponse>;
  selectRecommendationStructure(
    payload: RecommendationDraftStructureSelectRequest
  ): Promise<RecommendationDraftResponse>;
  replaceRecommendationExercise(
    payload: RecommendationDraftExerciseReplaceRequest
  ): Promise<RecommendationDraftResponse>;
  activateRecommendationDraft(
    payload: RecommendationDraftActivateRequest
  ): Promise<RecommendationDraftActivateResponse>;
  getTodayWorkout(date?: string): Promise<WorkoutTodayResponse>;
  logWorkout(payload: JsonLogRequest, date?: string): Promise<LogCreateResponse>;
  listSessions(options?: { date?: string; limit?: number }): Promise<SessionsListResponse>;
  getSession(id: string): Promise<WorkoutSessionRecord>;
  getProgram(): Promise<ProgramResponse>;
  saveProgram(payload: ProgramDefinition): Promise<ProgramMutationResponse>;
  resetProgram(resetToken: string): Promise<ProgramMutationResponse>;
  regenerateProgram(): Promise<GeneratedProgramResponse>;
  runProgression(): Promise<ProgressionRunResponse>;
}
