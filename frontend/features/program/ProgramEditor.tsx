import { DAY_OPTIONS, EXERCISE_TYPE_OPTIONS, type EditorState } from './editor-model.ts';

// Manual plan editor; only reachable when the advanced-tools flag is on.
export function ProgramEditor({
  state,
  status,
  busy,
  onChange,
  onSave,
  onCancel,
}: {
  state: EditorState;
  status: string;
  busy: boolean;
  onChange: (next: EditorState) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const workoutKeys = state.workouts.map(workout => workout.key).filter(Boolean);

  function patchWorkout(index: number, patch: Partial<EditorState['workouts'][number]>) {
    onChange({
      ...state,
      workouts: state.workouts.map((workout, i) => (i === index ? { ...workout, ...patch } : workout)),
    });
  }

  function patchExercise(workoutIndex: number, exerciseIndex: number, patch: Record<string, string>) {
    patchWorkout(workoutIndex, {
      exercises: state.workouts[workoutIndex].exercises.map((exercise, i) =>
        i === exerciseIndex ? { ...exercise, ...patch } : exercise
      ),
    });
  }

  function renameWorkoutKey(index: number, nextKey: string) {
    const previousKey = state.workouts[index]?.key;
    const schedule = { ...state.schedule };
    DAY_OPTIONS.forEach(([day]) => {
      if (schedule[day] === previousKey) {
        schedule[day] = nextKey || 'rest';
      }
    });
    onChange({
      ...state,
      schedule,
      workouts: state.workouts.map((workout, i) => (i === index ? { ...workout, key: nextKey } : workout)),
    });
  }

  function addWorkout() {
    const baseKey = `session_${state.workouts.length + 1}`;
    let nextKey = baseKey;
    let suffix = 2;
    const existingKeys = new Set(state.workouts.map(workout => workout.key));
    while (existingKeys.has(nextKey)) {
      nextKey = `${baseKey}_${suffix}`;
      suffix += 1;
    }

    onChange({
      ...state,
      workouts: [
        ...state.workouts,
        {
          key: nextKey,
          name: `Session ${state.workouts.length + 1}`,
          exercises: [
            { id: `${nextKey}_exercise_1`, name: 'New exercise', type: 'reps', max_sets: 3, target_min: 8, target_max: 12 },
          ],
        },
      ],
    });
  }

  function removeWorkout(index: number) {
    const removed = state.workouts[index];
    const schedule = { ...state.schedule };
    if (removed?.key) {
      DAY_OPTIONS.forEach(([day]) => {
        if (schedule[day] === removed.key) {
          schedule[day] = 'rest';
        }
      });
    }
    onChange({ ...state, schedule, workouts: state.workouts.filter((_, i) => i !== index) });
  }

  function addExercise(workoutIndex: number) {
    const workout = state.workouts[workoutIndex];
    patchWorkout(workoutIndex, {
      exercises: [
        ...workout.exercises,
        {
          id: `${workout.key || 'session'}_exercise_${workout.exercises.length + 1}`,
          name: 'New exercise',
          type: 'reps',
          max_sets: 3,
          target_min: 8,
          target_max: 12,
        },
      ],
    });
  }

  function removeExercise(workoutIndex: number, exerciseIndex: number) {
    patchWorkout(workoutIndex, {
      exercises: state.workouts[workoutIndex].exercises.filter((_, i) => i !== exerciseIndex),
    });
  }

  return (
    <div id="program-editor" className="card program-editor">
      <div className="program-editor-header">
        <div>
          <div className="card-title">Manual editor</div>
          <div className="card-subtitle">
            Adjust the schedule, session structure, and targets before saving a new version.
          </div>
        </div>
        <div id="program-editor-status" className={`program-editor-status${status ? '' : ' hidden'}`}>
          {status}
        </div>
      </div>
      <div className="program-editor-grid">
        <label className="program-field">
          <span className="program-field-label">Program id</span>
          <input
            id="program-editor-id"
            type="text"
            placeholder="generated_three_day_strength"
            value={state.id}
            onChange={event => onChange({ ...state, id: event.target.value })}
          />
        </label>
        <label className="program-field">
          <span className="program-field-label">Program name</span>
          <input
            id="program-editor-name"
            type="text"
            placeholder="Strength plan"
            value={state.name}
            onChange={event => onChange({ ...state, name: event.target.value })}
          />
        </label>
      </div>
      <section className="program-editor-section">
        <div className="program-section-header">
          <div className="program-section-title">Week schedule</div>
          <div className="program-section-copy">Map each weekday to an existing session or a rest day.</div>
        </div>
        <div id="program-editor-schedule" className="program-editor-schedule">
          {DAY_OPTIONS.map(([day, label]) => (
            <label className="program-schedule-cell" key={day}>
              <div className="program-schedule-day">{label}</div>
              <select
                className="program-schedule-select"
                value={state.schedule[day] ?? 'rest'}
                onChange={event => onChange({ ...state, schedule: { ...state.schedule, [day]: event.target.value } })}
              >
                <option value="rest">Rest</option>
                {workoutKeys.map(key => (
                  <option value={key} key={key}>
                    {key}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </section>
      <section className="program-editor-section">
        <div className="program-section-header">
          <div className="program-section-title">Sessions</div>
          <div className="program-section-copy">Edit names, targets, and set caps. Save will create a new version.</div>
        </div>
        <div id="program-editor-workouts" className="program-editor-workouts">
          {state.workouts.map((workout, workoutIndex) => (
            <section className="program-workout-editor" key={workoutIndex}>
              <div className="program-workout-editor-header">
                <div>
                  <div className="card-title">{workout.name || `Session ${workoutIndex + 1}`}</div>
                  <div className="card-subtitle">{workout.key || 'Set a session key'}</div>
                </div>
                <button
                  type="button"
                  className="secondary-button program-inline-danger"
                  disabled={busy}
                  onClick={() => removeWorkout(workoutIndex)}
                >
                  Remove session
                </button>
              </div>
              <div className="program-workout-editor-grid">
                <label className="program-field">
                  <span className="program-field-label">Session key</span>
                  <input
                    className="program-exercise-input"
                    type="text"
                    placeholder="A"
                    defaultValue={workout.key}
                    onBlur={event => renameWorkoutKey(workoutIndex, event.target.value.trim())}
                  />
                </label>
                <label className="program-field">
                  <span className="program-field-label">Session name</span>
                  <input
                    className="program-exercise-input"
                    type="text"
                    placeholder="Workout A"
                    value={workout.name}
                    onChange={event => patchWorkout(workoutIndex, { name: event.target.value })}
                  />
                </label>
              </div>
              <div className="program-exercise-editor-list">
                {workout.exercises.map((exercise, exerciseIndex) => (
                  <div className="program-exercise-editor" key={exerciseIndex}>
                    <div className="program-exercise-editor-grid">
                      <label className="program-field">
                        <span className="program-field-label">Exercise id</span>
                        <input
                          className="program-exercise-input"
                          type="text"
                          placeholder="pushups"
                          value={exercise.id}
                          onChange={event => patchExercise(workoutIndex, exerciseIndex, { id: event.target.value })}
                        />
                      </label>
                      <label className="program-field">
                        <span className="program-field-label">Exercise name</span>
                        <input
                          className="program-exercise-input"
                          type="text"
                          placeholder="Push-ups"
                          value={exercise.name}
                          onChange={event => patchExercise(workoutIndex, exerciseIndex, { name: event.target.value })}
                        />
                      </label>
                      <label className="program-field">
                        <span className="program-field-label">Type</span>
                        <select
                          className="program-schedule-select"
                          value={exercise.type}
                          onChange={event => patchExercise(workoutIndex, exerciseIndex, { type: event.target.value })}
                        >
                          {EXERCISE_TYPE_OPTIONS.map(([value, label]) => (
                            <option value={value} key={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="program-field">
                        <span className="program-field-label">Max sets</span>
                        <input
                          className="program-exercise-input"
                          type="number"
                          min="1"
                          value={String(exercise.max_sets ?? 1)}
                          onChange={event => patchExercise(workoutIndex, exerciseIndex, { max_sets: event.target.value })}
                        />
                      </label>
                      <label className="program-field">
                        <span className="program-field-label">Target min</span>
                        <input
                          className="program-exercise-input"
                          type="number"
                          min="1"
                          value={String(exercise.target_min ?? '')}
                          onChange={event => patchExercise(workoutIndex, exerciseIndex, { target_min: event.target.value })}
                        />
                      </label>
                      <label className="program-field">
                        <span className="program-field-label">Target max</span>
                        <input
                          className="program-exercise-input"
                          type="number"
                          min="1"
                          value={String(exercise.target_max ?? '')}
                          onChange={event => patchExercise(workoutIndex, exerciseIndex, { target_max: event.target.value })}
                        />
                      </label>
                    </div>
                    <div className="program-workout-editor-actions">
                      <button
                        type="button"
                        className="secondary-button program-inline-danger"
                        disabled={busy}
                        onClick={() => removeExercise(workoutIndex, exerciseIndex)}
                      >
                        Remove exercise
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="program-workout-editor-actions">
                <button type="button" className="secondary-button" disabled={busy} onClick={() => addExercise(workoutIndex)}>
                  Add exercise
                </button>
              </div>
            </section>
          ))}
        </div>
        <button id="program-add-workout-button" className="secondary-button" type="button" disabled={busy} onClick={addWorkout}>
          Add session
        </button>
      </section>
      <div className="program-editor-actions">
        <button id="program-cancel-edit-button" className="secondary-button" type="button" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
        <button id="program-save-button" type="button" disabled={busy} onClick={onSave}>
          Save plan
        </button>
      </div>
    </div>
  );
}
