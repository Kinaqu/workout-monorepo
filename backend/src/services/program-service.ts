import { DEFAULT_PROGRAM } from "../domain/default-program";
import { createProgramDraft, programTemplateToApi, ProgramDefinitionInput, validateProgramDefinition } from "../domain/program";
import { seedProgressionStates } from "../domain/progression";
import { nowIso } from "../lib/time";
import type { ProgramMutationResponse, ProgramResponse } from "../openapi/schemas";
import {
  GeneratedProgramMetadataRecord,
  GeneratedProgramMetadataRepository,
} from "../repositories/generated-program-metadata-repository";
import { ProgramRepository } from "../repositories/program-repository";
import { ProgramRuntimeStateRepository } from "../repositories/program-runtime-state-repository";
import { ProgressionRepository } from "../repositories/progression-repository";
import { ProgressionService } from "./progression-service";
import { UserLifecycleService } from "./user-lifecycle-service";

export class ProgramService {
  constructor(
    private readonly lifecycle: UserLifecycleService,
    private readonly programs: ProgramRepository,
    private readonly metadata: GeneratedProgramMetadataRepository,
    private readonly runtime: ProgramRuntimeStateRepository,
    private readonly progression: ProgressionRepository,
    private readonly progressionService: ProgressionService
  ) {}

  async getCurrentProgram(userId: string, username: string): Promise<ProgramResponse> {
    const program = await this.lifecycle.requireActiveProgram(userId, username);
    await this.progressionService.ensureFreshForProgram(userId, username, program.versionId);
    const summary = await this.programs.getActiveProgramSummary(userId);
    const [states, generatedMetadata, runtimeState, progressionEvents, previousProgram] = await Promise.all([
      this.progression.getByProgram(userId, program.versionId),
      this.metadata.getByProgram(userId, program.versionId),
      this.runtime.getByProgram(userId, program.versionId),
      this.progression.listEventsByProgram(userId, program.versionId),
      summary?.previous_program_id ? this.programs.getProgramById(summary.previous_program_id) : Promise.resolve(null),
    ]);

    const versionChanges = summarizeProgramChanges(program, previousProgram);

    return {
      ...programTemplateToApi(program),
      version_id: program.versionId,
      source: program.source,
      userSets: Object.fromEntries(Array.from(states.values()).map(state => [state.exerciseKey, state.currentSets])),
      progressionState: Object.fromEntries(
        Array.from(states.values()).map(state => [
          state.exerciseKey,
          {
            sets: state.currentSets,
            min: state.currentTargetMin,
            max: state.currentTargetMax,
            last_progression: state.lastProgressionAt,
          },
        ])
      ),
      generator_metadata: generatedMetadata
        ? {
            version: generatedMetadata.generatorVersion,
            catalog_seed_version: generatedMetadata.catalogSeedVersion,
          }
        : null,
      generated_program_metadata: generatedMetadata ? mapGeneratedMetadata(generatedMetadata) : null,
      progression_events: progressionEvents.map(event => ({
        id: event.id,
        exercise_id: event.exerciseId,
        catalog_exercise_id: event.catalogExerciseId,
        exercise_key: event.exerciseKey,
        exercise_name: event.exerciseName,
        direction: event.direction,
        reason: event.reason,
        before: event.before,
        after: event.after,
        created_at: event.createdAt,
      })),
      program_runtime_state: runtimeState
        ? {
            last_session_logged_at: runtimeState.lastSessionLoggedAt,
            last_progression_run_at: runtimeState.lastProgressionRunAt,
            created_at: runtimeState.createdAt,
            updated_at: runtimeState.updatedAt,
          }
        : null,
      active_version: summary
        ? {
            status: "active",
            program_family_id: summary.program_family_id,
            version_number: summary.version_number,
            previous_version_id: summary.previous_program_id,
            created_at: summary.created_at,
            updated_at: summary.updated_at,
            source: summary.source,
          }
        : {
            status: "active",
            program_family_id: program.versionId,
            version_number: 1,
            previous_version_id: null,
            created_at: program.createdAt,
            updated_at: program.updatedAt,
            source: program.source,
          },
      current_version_changes: versionChanges,
    };
  }

  async saveProgram(userId: string, username: string, input: unknown): Promise<ProgramMutationResponse> {
    await this.lifecycle.ensureUserExists(userId, username);
    const definition = validateProgramDefinition(input);
    return this.createProgramVersion(userId, definition, false, "api");
  }

  async resetProgram(userId: string, username: string): Promise<ProgramMutationResponse> {
    await this.lifecycle.ensureUserExists(userId, username);
    return this.createProgramVersion(userId, DEFAULT_PROGRAM, true, "reset");
  }

  private async createProgramVersion(
    userId: string,
    definition: ProgramDefinitionInput,
    resetProgression: boolean,
    source: string
  ): Promise<ProgramMutationResponse> {
    const current = await this.programs.getActiveProgram(userId);
    const previousStates = current
      ? await this.progression.getByProgram(userId, current.versionId)
      : new Map();

    const created = await this.programs.createProgramVersion(userId, createProgramDraft(definition), source);
    const seeded = seedProgressionStates(created, previousStates, nowIso(), null, resetProgression);
    await this.progression.replaceProgramStates(userId, created.versionId, seeded);

    return {
      ok: true,
      message: resetProgression ? "Program reset to default" : "Program saved",
      program: {
        ...programTemplateToApi(created),
        version_id: created.versionId,
      },
    };
  }
}

function mapGeneratedMetadata(metadata: GeneratedProgramMetadataRecord) {
  return {
    generation_reason: metadata.generationReason,
    profile_version: metadata.profileVersion,
    created_at: metadata.createdAt,
    input_summary: metadata.inputSummary,
  };
}

function summarizeProgramChanges(
  currentProgram: Awaited<ReturnType<ProgramRepository["getProgramById"]>>,
  previousProgram: Awaited<ReturnType<ProgramRepository["getProgramById"]>>
) {
  const currentWorkouts = Object.entries(currentProgram?.workouts ?? {});
  const previousWorkouts = Object.entries(previousProgram?.workouts ?? {});
  const previousWorkoutMap = new Map(previousWorkouts);
  const currentWorkoutMap = new Map(currentWorkouts);

  const changedDays = Object.entries(currentProgram?.schedule ?? {}).filter(
    ([day, workoutKey]) =>
      (previousProgram?.schedule?.[day as keyof NonNullable<typeof previousProgram>["schedule"]] ?? null) !== workoutKey
  );
  const workoutsAdded = currentWorkouts.filter(([key]) => !previousWorkoutMap.has(key));
  const workoutsRemoved = previousWorkouts.filter(([key]) => !currentWorkoutMap.has(key));

  let exercisesAdded = 0;
  let exercisesRemoved = 0;
  let targetChanges = 0;
  let setCapChanges = 0;

  for (const [workoutKey, workout] of currentWorkouts) {
    const previousWorkout = previousWorkoutMap.get(workoutKey);
    const previousExercises = new Map(
      (previousWorkout?.exercises ?? []).map(exercise => [exercise.exercise.key, exercise])
    );

    for (const exercise of workout.exercises) {
      const previousExercise = previousExercises.get(exercise.exercise.key);
      if (!previousExercise) {
        exercisesAdded += 1;
        continue;
      }

      if (
        previousExercise.targetMin !== exercise.targetMin ||
        previousExercise.targetMax !== exercise.targetMax
      ) {
        targetChanges += 1;
      }

      if (previousExercise.maxSets !== exercise.maxSets) {
        setCapChanges += 1;
      }

      previousExercises.delete(exercise.exercise.key);
    }

    exercisesRemoved += previousExercises.size;
  }

  for (const [workoutKey, workout] of previousWorkouts) {
    if (currentWorkoutMap.has(workoutKey)) {
      continue;
    }

    exercisesRemoved += workout.exercises.length;
  }

  const renamed = Boolean(previousProgram && previousProgram.name !== currentProgram?.name);
  const highlights = buildChangeHighlights({
    renamed,
    changedDays,
    workoutsAdded,
    workoutsRemoved,
    exercisesAdded,
    exercisesRemoved,
    targetChanges,
    setCapChanges,
  });

  return {
    summary: previousProgram
      ? highlights[0] ?? "No structural changes were detected in this version."
      : `Initial version created with ${currentWorkouts.length} sessions and ${countExercises(currentProgram)} exercises.`,
    highlights: previousProgram ? highlights : ["This is the first version in the current plan family."],
    stats: {
      schedule_changes: changedDays.length,
      workouts_added: workoutsAdded.length,
      workouts_removed: workoutsRemoved.length,
      exercises_added: exercisesAdded,
      exercises_removed: exercisesRemoved,
      target_changes: targetChanges,
      set_cap_changes: setCapChanges,
      renamed,
    },
  };
}

function buildChangeHighlights(input: {
  renamed: boolean;
  changedDays: Array<[string, string | null]>;
  workoutsAdded: Array<[string, { name: string }]>;
  workoutsRemoved: Array<[string, { name: string }]>;
  exercisesAdded: number;
  exercisesRemoved: number;
  targetChanges: number;
  setCapChanges: number;
}) {
  const highlights: string[] = [];

  if (input.renamed) {
    highlights.push("Plan name changed in this version.");
  }

  if (input.changedDays.length > 0) {
    const dayLabels = input.changedDays
      .slice(0, 3)
      .map(([day]) => capitalize(day))
      .join(", ");
    highlights.push(
      `${input.changedDays.length} schedule ${input.changedDays.length === 1 ? "day was" : "days were"} remapped${dayLabels ? ` (${dayLabels})` : ""}.`
    );
  }

  if (input.workoutsAdded.length > 0) {
    const names = input.workoutsAdded
      .slice(0, 2)
      .map(([, workout]) => workout.name)
      .join(", ");
    highlights.push(
      `${input.workoutsAdded.length} ${input.workoutsAdded.length === 1 ? "session was" : "sessions were"} added${names ? ` (${names})` : ""}.`
    );
  }

  if (input.workoutsRemoved.length > 0) {
    const names = input.workoutsRemoved
      .slice(0, 2)
      .map(([, workout]) => workout.name)
      .join(", ");
    highlights.push(
      `${input.workoutsRemoved.length} ${input.workoutsRemoved.length === 1 ? "session was" : "sessions were"} removed${names ? ` (${names})` : ""}.`
    );
  }

  if (input.exercisesAdded > 0 || input.exercisesRemoved > 0) {
    highlights.push(
      `Exercise lineup changed: ${input.exercisesAdded} added, ${input.exercisesRemoved} removed.`
    );
  }

  if (input.targetChanges > 0) {
    highlights.push(
      `${input.targetChanges} ${input.targetChanges === 1 ? "exercise target was" : "exercise targets were"} adjusted.`
    );
  }

  if (input.setCapChanges > 0) {
    highlights.push(
      `${input.setCapChanges} ${input.setCapChanges === 1 ? "set cap was" : "set caps were"} updated.`
    );
  }

  if (highlights.length === 0) {
    highlights.push("No structural changes were detected in this version.");
  }

  return highlights.slice(0, 5);
}

function countExercises(program: Awaited<ReturnType<ProgramRepository["getProgramById"]>>) {
  return Object.values(program?.workouts ?? {}).reduce((count, workout) => count + workout.exercises.length, 0);
}

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}
