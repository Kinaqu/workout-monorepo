// Source of truth: backend OpenAPI schemas in `backend/src/openapi/schemas.ts`.

export interface ApiErrorPayload {
  error?: string;
  detail?: string;
  message?: string;
  [key: string]: unknown;
}

export interface RuntimeAppConfig {
  apiBaseUrl?: string;
}

export interface TargetRange {
  min: number;
  max: number;
}

export interface ProgramExerciseBase {
  id: string;
  name: string;
  max_sets: number;
}

export interface ProgramExerciseReps extends ProgramExerciseBase {
  type: 'reps';
  reps: TargetRange;
}

export interface ProgramExerciseTime extends ProgramExerciseBase {
  type: 'time';
  duration: TargetRange;
}

export interface ProgramExerciseCycles extends ProgramExerciseBase {
  type: 'cycles';
  cycles: TargetRange;
}

export type ProgramExercise = ProgramExerciseReps | ProgramExerciseTime | ProgramExerciseCycles;

export interface ProgramWorkout {
  name: string;
  exercises: ProgramExercise[];
}

export interface ProgramSchedule {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface ProgramDefinition {
  id: string;
  name: string;
  schedule: ProgramSchedule;
  workouts: Record<string, ProgramWorkout>;
}

export interface ProgressionStateValue {
  sets: number;
  min: number;
  max: number;
  last_progression: string | null;
}

export type OnboardingGoal = 'strength' | 'muscle' | 'general_fitness' | 'mobility';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type EquipmentAccess = 'bodyweight' | 'dumbbells' | 'bands' | 'bench' | 'pullup_bar';
export type FocusArea = 'upper_body' | 'lower_body' | 'core' | 'mobility';
export type LimitationTag = 'wrist_sensitive' | 'knee_sensitive' | 'lower_back_sensitive' | 'shoulder_sensitive';
export type PreferredStyle = 'balanced' | 'strength_bias' | 'mobility_bias' | 'low_impact';

export interface OnboardingDraft {
  questionnaireVersion?: string;
  goals?: OnboardingGoal[];
  experienceLevel?: ExperienceLevel;
  trainingDaysPerWeek?: number;
  sessionDurationMinutes?: number;
  equipmentAccess?: EquipmentAccess[];
  focusAreas?: FocusArea[];
  limitations?: LimitationTag[];
  preferredStyles?: PreferredStyle[];
}

export interface OnboardingAnswers {
  questionnaireVersion: string;
  goals: OnboardingGoal[];
  experienceLevel: ExperienceLevel;
  trainingDaysPerWeek: number;
  sessionDurationMinutes: number;
  equipmentAccess: EquipmentAccess[];
  focusAreas: FocusArea[];
  limitations: LimitationTag[];
  preferredStyles: PreferredStyle[];
}

export interface OnboardingProfileSummary {
  version: string;
  primary_goal: string;
  training_days_per_week: number;
  session_duration_minutes: number;
  updated_at: string;
}

export interface OnboardingStateResponse {
  status: 'not_started' | 'draft' | 'completed';
  completed: boolean;
  questionnaireVersion: string | null;
  answersUpdatedAt: string | null;
  completedAt: string | null;
  answers: OnboardingDraft | null;
  profile: OnboardingProfileSummary | null;
}

export interface OnboardingDraftSaveResponse {
  ok: true;
  message: string;
  questionnaire_version: string;
  updated_at: string;
  completed_at: string | null;
}

export interface GeneratedProgramMetadata {
  version: string;
  catalog_seed_version: string;
}

export interface StoredGeneratedProgramMetadata {
  generation_reason: string;
  profile_version: string | null;
  created_at: string;
  input_summary: {
    primaryGoal?: string | null;
    trainingDaysPerWeek?: number | null;
    sessionDurationMinutes?: number | null;
    [key: string]: unknown;
  };
}

export interface GeneratedProgram extends ProgramDefinition {
  version_id: string;
  source: string;
}

export interface GeneratedProgramResponse {
  ok: true;
  message: string;
  program: GeneratedProgram;
  generator: GeneratedProgramMetadata;
}

export type RecommendationDraftStatus = 'draft' | 'activated';
export type RecommendationDraftExerciseType = 'reps' | 'time' | 'cycles';

export interface RecommendationDraftProfileSnapshot {
  primaryGoal: string;
  experienceLevel: string;
  trainingDaysPerWeek: number;
  sessionDurationMinutes: number;
  splitPreference: string;
  volumeLevel: string;
  equipmentAccess: string[];
  focusAreas: string[];
  limitationTags: string[];
  preferredStyles: string[];
  preferredWorkoutTags: string[];
  excludedWorkoutTags: string[];
}

export interface RecommendationDraftStructureWorkout {
  key: string;
  name: string;
  tags: string[];
}

export interface RecommendationDraftStructure {
  id: string;
  label: string;
  description: string;
  schedule: ProgramSchedule;
  workouts: RecommendationDraftStructureWorkout[];
  recommended: boolean;
}

export interface RecommendationDraftExerciseOption {
  catalog_exercise_id: string;
  exercise_id: string;
  name: string;
  type: RecommendationDraftExerciseType;
  target_min: number;
  target_max: number;
  max_sets: number;
  recommended: boolean;
}

export interface RecommendationDraftExerciseSlot {
  slot_id: string;
  workout_key: string;
  workout_name: string;
  slot_index: number;
  blueprint_tags: string[];
  recommended_exercise_id: string;
  selected_exercise_id: string;
  options: RecommendationDraftExerciseOption[];
}

export interface RecommendationDraftActivationContext {
  activated_program_id?: string | null;
  activated_at?: string | null;
}

export interface RecommendationDraftJson {
  status: RecommendationDraftStatus;
  profile_snapshot: RecommendationDraftProfileSnapshot;
  structures: RecommendationDraftStructure[];
  selected_structure_id: string;
  exercise_slots: RecommendationDraftExerciseSlot[];
  generator_version: string;
  catalog_seed_version: string;
  activation_context?: RecommendationDraftActivationContext;
}

export interface RecommendationDraftResponse {
  id: string;
  status: RecommendationDraftStatus;
  source_onboarding_answer_id: string | null;
  source_profile_id: string | null;
  generator_version: string;
  catalog_seed_version: string;
  selected_structure_id: string;
  activated_program_id: string | null;
  created_at: string;
  updated_at: string;
  activated_at: string | null;
  draft: RecommendationDraftJson;
}

export interface RecommendationDraftStructureSelectRequest {
  draft_id: string;
  structure_id: string;
}

export interface RecommendationDraftExerciseReplaceRequest {
  draft_id: string;
  slot_id: string;
  catalog_exercise_id: string;
}

export interface RecommendationDraftActivateRequest {
  draft_id: string;
}

export interface RecommendationDraftActivateResponse {
  ok: true;
  message: string;
  program: ProgramDefinition & {
    version_id: string;
    source: string;
  };
  generator: GeneratedProgramMetadata;
  recommendation_draft: {
    id: string;
    status: 'activated';
    selected_structure_id: string;
    activated_program_id: string;
    activated_at: string;
    updated_at: string;
  };
}

export interface OnboardingCompleteResponse {
  ok: true;
  message: string;
  onboarding: {
    completed: true;
    completed_at: string;
    questionnaire_version: string;
  };
  profile: Omit<OnboardingProfileSummary, 'updated_at'>;
  recommendation_draft: RecommendationDraftResponse;
}

export interface MeResponse {
  user: {
    id: string;
    username: string | null;
    created_at: string;
  };
  lifecycle: {
    user_exists: true;
    onboarding_completed: boolean;
    has_active_program: boolean;
  };
  onboarding: {
    status: 'not_started' | 'draft' | 'completed';
    completed: boolean;
    questionnaireVersion: string | null;
    answersUpdatedAt: string | null;
    completedAt: string | null;
    answers: OnboardingDraft | null;
  };
  profile: {
    version: string;
    primary_goal: string;
    experience_level: string;
    training_days_per_week: number;
    session_duration_minutes: number;
    updated_at: string;
  } | null;
  active_program: {
    version_id: string;
    key: string;
    name: string;
    source: string;
    updated_at: string;
  } | null;
}

export interface ProgramResponse extends ProgramDefinition {
  version_id: string;
  source: string;
  userSets: Record<string, number>;
  progressionState: Record<string, ProgressionStateValue>;
  generator_metadata: GeneratedProgramMetadata | null;
  generated_program_metadata: StoredGeneratedProgramMetadata | null;
  progression_events: Array<{
    id: string;
    exercise_id: string;
    catalog_exercise_id: string | null;
    exercise_key: string;
    exercise_name: string;
    direction: 'up' | 'down';
    reason: string;
    before: { sets: number; min: number; max: number };
    after: { sets: number; min: number; max: number };
    created_at: string;
  }>;
  program_runtime_state: {
    last_session_logged_at: string | null;
    last_progression_run_at: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  active_version: {
    status: 'active';
    program_family_id: string;
    version_number: number;
    previous_version_id: string | null;
    created_at: string;
    updated_at: string;
    source: string;
  };
  current_version_changes: {
    summary: string;
    highlights: string[];
    stats: {
      schedule_changes: number;
      workouts_added: number;
      workouts_removed: number;
      exercises_added: number;
      exercises_removed: number;
      target_changes: number;
      set_cap_changes: number;
      renamed: boolean;
    };
  };
}

export interface ProgramMutationResponse {
  ok: true;
  message: string;
  program: ProgramDefinition & {
    version_id: string;
  };
}

export interface WorkoutExerciseBase {
  id: string;
  name: string;
  sets: number;
  max_sets: number;
}

export interface WorkoutExerciseReps extends WorkoutExerciseBase {
  type: 'reps';
  reps: TargetRange;
}

export interface WorkoutExerciseTime extends WorkoutExerciseBase {
  type: 'time';
  duration: TargetRange;
}

export interface WorkoutExerciseCycles extends WorkoutExerciseBase {
  type: 'cycles';
  cycles: TargetRange;
}

export type WorkoutExercise = WorkoutExerciseReps | WorkoutExerciseTime | WorkoutExerciseCycles;

export interface WorkoutPlanResponse {
  date: string;
  type: string;
  name: string;
  exercises: WorkoutExercise[];
  program_id: string;
  program_version_id: string;
}

export interface RestDayResponse {
  type: 'rest';
  date: string;
  message: string;
}

export type WorkoutTodayResponse = RestDayResponse | WorkoutPlanResponse;

export interface ProgressionBounds {
  sets: number;
  min: number;
  max: number;
}

export interface ProgressionChange {
  id: string;
  name: string;
  direction: 'up' | 'down';
  reason: string;
  before: ProgressionBounds;
  after: ProgressionBounds;
}

export interface ProgressionSkipped {
  id: string;
  reason: string;
}

export interface ProgressionRunResponse {
  ok: true;
  progression_date: string;
  result: {
    changed: ProgressionChange[];
    skipped: ProgressionSkipped[];
  };
}

export interface JsonLogExercise {
  id: string;
  name?: string;
  sets: number[];
}

export interface JsonLogRequest {
  session_date?: string;
  note?: string;
  workout_type?: string | null;
  exercises?: JsonLogExercise[];
}

export interface SessionLogExercise {
  id: string;
  name: string;
  sets: number[];
}

export interface WorkoutSessionExercise {
  id: string;
  programExerciseId: string | null;
  catalogExerciseId: string | null;
  exerciseKey: string | null;
  exerciseName: string;
  exerciseType: 'reps' | 'time' | 'cycles' | null;
  matched: boolean;
  sortOrder: number;
  sets: number[];
}

export interface WorkoutSessionRecord {
  id: string;
  sessionDate: string;
  workoutType: string | null;
  workoutName: string | null;
  note: string;
  source: 'json' | 'text' | 'legacy-kv';
  rawText: string | null;
  unmatched: string[];
  createdAt: string;
  updatedAt: string;
  exercises: WorkoutSessionExercise[];
}

export interface SessionsListResponse {
  sessions: WorkoutSessionRecord[];
  count: number;
}

export interface LegacyLogEntry {
  date: string;
  workout_type: string | null;
  exercises: SessionLogExercise[];
  note: string;
  unmatched: string[];
  source: 'json' | 'text' | 'legacy-kv';
  session_id: string;
  created_at: string;
}

export interface LogCreateResponse {
  ok: true;
  date: string;
  entry: LegacyLogEntry;
  session: WorkoutSessionRecord;
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
