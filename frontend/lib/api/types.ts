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

export interface OnboardingCompleteResponse extends GeneratedProgramResponse {
  onboarding: {
    completed: true;
    completed_at: string;
    questionnaire_version: string;
  };
  profile: Omit<OnboardingProfileSummary, 'updated_at'>;
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
    legacy_kv_migrated_at: string | null;
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

export interface LegacyLogByDateResponse extends LegacyLogEntry {
  session_count: number;
  sessions: WorkoutSessionRecord[];
}

export interface ApiClient {
  getMe(): Promise<MeResponse>;
  getOnboarding(): Promise<OnboardingStateResponse>;
  saveOnboardingDraft(payload: OnboardingDraft): Promise<OnboardingDraftSaveResponse>;
  completeOnboarding(payload: OnboardingAnswers): Promise<OnboardingCompleteResponse>;
  getTodayWorkout(): Promise<WorkoutTodayResponse>;
  logWorkout(payload: JsonLogRequest, date?: string): Promise<LogCreateResponse>;
  getLog(date: string): Promise<LegacyLogByDateResponse>;
  getProgram(): Promise<ProgramResponse>;
  regenerateProgram(): Promise<GeneratedProgramResponse>;
  runProgression(): Promise<ProgressionRunResponse>;
}
