export type ExerciseType = "reps" | "time" | "cycles";

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  max_sets: number;
  reps?:     { min: number; max: number };
  duration?: { min: number; max: number };
  cycles?:   { min: number; max: number };
}

export interface Workout {
  name: string;
  exercises: Exercise[];
}

export interface Program {
  id: string;
  name: string;
  schedule: Record<string, string>;
  workouts: Record<string, Workout>;
}

export interface UserState {
  program_id: string;
  sets: Record<string, number>;
  last_progression: string | null;
}