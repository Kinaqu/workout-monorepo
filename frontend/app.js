import { api, getToken, AuthRedirectError, ApiError } from '/api.js';
import { ensureClerkReady } from '/clerk-bootstrap.js';

let todayWorkoutType = null;
let todayWorkoutDate = null;
let todayWorkoutSaved = false;
let todaySaveInFlight = false;
let activeExerciseIndex = 0;

const tabs = document.querySelectorAll('.tab-content');
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const tabId = item.getAttribute('data-tab');

    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');

    tabs.forEach(tab => tab.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');

    if (tabId === 'history' && !document.getElementById('history-date').value) {
      const today = getTodayDateString();
      document.getElementById('history-date').value = today;
      loadHistory(today);
    } else if (tabId === 'program' && document.getElementById('program-content').classList.contains('hidden')) {
      loadProgram();
    }
  });
});

function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function ensureApiObject(data, resourceName) {
  if (data && typeof data === 'object') {
    return data;
  }

  throw new Error(`Invalid ${resourceName} response`);
}

function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

function setTodayError(message = '') {
  const errorEl = document.getElementById('today-error');
  errorEl.textContent = message;
}

function setTodayLockedMessage(message = '') {
  const lockedMessage = document.getElementById('today-locked-message');
  lockedMessage.textContent = message;
}

async function getExistingLog(date) {
  try {
    return await api.getLog(date);
  } catch (err) {
    if (err instanceof AuthRedirectError) throw err;
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

function collectWorkoutExercises() {
  const cards = Array.from(document.querySelectorAll('.exercise-card'));
  const hasMissingValues = cards.some(card =>
    Array.from(card.querySelectorAll('.set-input')).some(input => input.value.trim() === '')
  );

  if (hasMissingValues) {
    throw new Error('Complete every set before saving.');
  }

  return cards.map(card => ({
    id: card.dataset.id,
    sets: Array.from(card.querySelectorAll('.set-input')).map(input => Number.parseInt(input.value, 10) || 0),
  }));
}

async function saveTodayWorkout(triggerBtn, footerHint) {
  if (todaySaveInFlight || todayWorkoutSaved || !todayWorkoutType || !todayWorkoutDate) {
    return;
  }

  setTodayError('');
  todaySaveInFlight = true;

  if (triggerBtn) triggerBtn.disabled = true;
  if (footerHint) footerHint.textContent = 'Saving workout...';

  try {
    const existingLog = await getExistingLog(todayWorkoutDate);
    if (existingLog) {
      todayWorkoutSaved = true;
      await loadToday();
      return;
    }

    const exercises = collectWorkoutExercises();
    await api.logWorkout({ workout_type: todayWorkoutType, exercises, note: '' }, todayWorkoutDate);
    todayWorkoutSaved = true;

    const historyDate = document.getElementById('history-date').value;
    if (historyDate === todayWorkoutDate) {
      await loadHistory(todayWorkoutDate);
    }

    await loadToday();
  } catch (err) {
    if (err instanceof AuthRedirectError) return;

    if (err instanceof ApiError && err.status === 409) {
      todayWorkoutSaved = true;
      await loadToday();
      return;
    }

    setTodayError('Save error: ' + err.message);
  } finally {
    todaySaveInFlight = false;
    if (triggerBtn && triggerBtn.isConnected) triggerBtn.disabled = false;
    if (footerHint && footerHint.isConnected) footerHint.textContent = '';
  }
}

// ==========================================
// TAB 1: TODAY
// ==========================================
async function loadToday() {
  const loader = document.getElementById('today-loader');
  const content = document.getElementById('today-content');
  const exercisesContainer = document.getElementById('today-exercises');
  const restMessage = document.getElementById('today-rest-message');
  const lockedMessage = document.getElementById('today-locked-message');

  setTodayError('');
  setTodayLockedMessage('');
  loader.classList.remove('hidden');
  content.classList.add('hidden');

  try {
    const data = ensureApiObject(await api.getTodayWorkout(), 'workout');
    const existingLog = await getExistingLog(data.date);

    loader.classList.add('hidden');
    content.classList.remove('hidden');

    todayWorkoutDate = data.date;
    todayWorkoutType = data.type === 'rest' ? null : data.type;
    todayWorkoutSaved = Boolean(existingLog);

    document.getElementById('today-workout-name').textContent = data.name || 'Workout';
    document.getElementById('today-workout-type').textContent = `Type: ${data.type}`;

    exercisesContainer.classList.remove('hidden');
    exercisesContainer.innerHTML = '';
    restMessage.classList.add('hidden');
    lockedMessage.classList.add('hidden');

    if (todayWorkoutSaved) {
      exercisesContainer.classList.add('hidden');
      setTodayLockedMessage(
        data.date === getTodayDateString()
          ? "Today's workout is already saved. Open History to review it."
          : `Workout for ${data.date} is already saved.`
      );
      lockedMessage.classList.remove('hidden');
      return;
    }

    if (data.type === 'rest') {
      exercisesContainer.classList.add('hidden');
      restMessage.classList.remove('hidden');
      return;
    }

    if (!data.exercises || data.exercises.length === 0) {
      exercisesContainer.innerHTML = '<div class="text-center text-secondary">No exercises</div>';
      return;
    }

    activeExerciseIndex = 0;

    data.exercises.forEach((ex, index) => {
      const card = el('section', `card exercise-card${index === 0 ? ' active' : ''}`);
      card.dataset.id = ex.id;
      card.dataset.index = String(index);
      card.dataset.total = String(data.exercises.length);

      let targetText = '';
      if (ex.type === 'reps' && ex.reps) targetText = `${ex.reps.max} reps`;
      else if (ex.type === 'time' && ex.duration) targetText = `${ex.duration.max} sec`;
      else if (ex.type === 'cycles' && ex.cycles) targetText = `${ex.cycles.max} cycles`;

      const progress = el('div', 'exercise-progress');
      progress.appendChild(el('span', 'exercise-progress-current', `${index + 1}/${data.exercises.length}`));
      progress.appendChild(el('span', 'exercise-progress-label', 'Current exercise'));
      card.appendChild(progress);

      card.appendChild(el('div', 'card-title exercise-title', ex.name || ex.id));

      const chips = el('div', 'exercise-header-chips');
      if (targetText) chips.appendChild(el('div', 'exercise-chip', targetText));
      chips.appendChild(el('div', 'exercise-chip exercise-chip-accent', `${ex.sets || 1} sets`));
      card.appendChild(chips);

      const helper = el('div', 'exercise-helper');
      helper.textContent = '';
      card.appendChild(helper);

      const setsContainer = el('div', 'sets-container');
      for (let i = 0; i < (ex.sets || 1); i++) {
        const row = createSetRow(i + 1, ex.type);
        setsContainer.appendChild(row);
      }
      card.appendChild(setsContainer);

      const footer = el('div', 'exercise-card-footer');
      const footerHint = el('div', 'exercise-footer-hint', '');
      const confirmBtn = el('button', 'exercise-complete-btn', '✓');
      confirmBtn.type = 'button';
      confirmBtn.setAttribute('aria-label', index === data.exercises.length - 1 ? 'Confirm last exercise' : 'Confirm and open next exercise');
      confirmBtn.addEventListener('click', async () => {
        await advanceExercise(card);
      });
      footer.appendChild(footerHint);
      footer.appendChild(confirmBtn);
      card.appendChild(footer);

      exercisesContainer.appendChild(card);
    });

    syncExerciseStack();
  } catch (err) {
    loader.classList.add('hidden');
    if (err instanceof AuthRedirectError) return;
    setTodayError('Error loading workout: ' + err.message);
  }
}

function createSetRow(index, type) {
  const row = el('div', 'set-row');
  row.appendChild(el('div', 'set-label', `Set ${index}`));

  const input = el('input', 'set-input');
  input.type = 'number';
  input.min = '0';
  input.placeholder = type === 'time' ? 'Sec' : 'Reps';
  row.appendChild(input);

  return row;
}

function setActiveExercise(nextIndex) {
  const cards = Array.from(document.querySelectorAll('.exercise-card'));
  activeExerciseIndex = Math.max(0, Math.min(nextIndex, cards.length - 1));

  cards.forEach((card, index) => {
    const isActive = index === activeExerciseIndex;
    const isCompleted = index < activeExerciseIndex;
    card.classList.toggle('active', isActive);
    card.classList.toggle('completed', isCompleted);
    card.classList.toggle('upcoming', index > activeExerciseIndex);
    card.classList.remove('is-entering');
    card.classList.remove('is-leaving');
    card.setAttribute('aria-hidden', String(!isActive));
  });

  const activeCard = cards[activeExerciseIndex];
  if (activeCard) {
    activeCard.classList.add('is-entering');
    window.setTimeout(() => activeCard.classList.remove('is-entering'), 320);
  }

  syncExerciseStack();
}

async function advanceExercise(card) {
  if (!card.classList.contains('active') || todaySaveInFlight) return;

  const inputs = Array.from(card.querySelectorAll('.set-input'));
  const isComplete = inputs.every(input => input.value.trim() !== '');
  if (!isComplete) {
    card.classList.add('exercise-card-invalid');
    window.setTimeout(() => card.classList.remove('exercise-card-invalid'), 380);
    return;
  }

  const cards = Array.from(document.querySelectorAll('.exercise-card'));
  const currentIndex = cards.indexOf(card);

  if (currentIndex >= 0 && currentIndex < cards.length - 1) {
    card.classList.add('is-leaving');
    window.setTimeout(() => setActiveExercise(currentIndex + 1), 180);
    return;
  }

  card.classList.add('completed-pulse');
  window.setTimeout(() => card.classList.remove('completed-pulse'), 320);
  const confirmBtn = card.querySelector('.exercise-complete-btn');
  const footerHint = card.querySelector('.exercise-footer-hint');
  await saveTodayWorkout(confirmBtn, footerHint);
}

function syncExerciseStack() {
  const container = document.getElementById('today-exercises');
  if (!container) return;

  const cards = Array.from(container.querySelectorAll('.exercise-card'));
  const remaining = Math.max(cards.length - activeExerciseIndex - 1, 0);
  container.style.setProperty('--stack-depth', String(Math.min(remaining, 2)));
}

// ==========================================
// TAB 2: HISTORY
// ==========================================
document.getElementById('history-date').addEventListener('change', e => {
  loadHistory(e.target.value);
});

async function loadHistory(date) {
  const loader = document.getElementById('history-loader');
  const errorEl = document.getElementById('history-error');
  const content = document.getElementById('history-data');
  const empty = document.getElementById('history-empty');

  loader.classList.remove('hidden');
  content.classList.add('hidden');
  empty.classList.add('hidden');
  errorEl.textContent = '';

  try {
    const data = await api.getLog(date);
    loader.classList.add('hidden');

    if (!data || !data.workout_type) {
      empty.classList.remove('hidden');
      return;
    }

    content.classList.remove('hidden');
    document.getElementById('history-workout-type').textContent = data.workout_type;

    const exercisesContainer = document.getElementById('history-exercises');
    exercisesContainer.innerHTML = '';

    if (data.exercises && data.exercises.length > 0) {
      data.exercises.forEach((ex, index) => {
        const card = el('article', 'card history-exercise-card');

        const header = el('div', 'history-exercise-header');
        header.appendChild(el('div', 'history-exercise-index', `#${index + 1}`));
        header.appendChild(el('div', 'card-title', ex.id));
        card.appendChild(header);

        const chips = el('div', 'history-set-chips');
        ex.sets.forEach((setValue, setIndex) => {
          chips.appendChild(el('div', 'history-set-chip', `Set ${setIndex + 1}: ${setValue}`));
        });
        card.appendChild(chips);
        exercisesContainer.appendChild(card);
      });
    } else {
      exercisesContainer.innerHTML = '<div class="card history-empty-card">No exercises</div>';
    }

    document.getElementById('history-note').textContent = data.note || 'No notes added for this workout.';
  } catch (err) {
    loader.classList.add('hidden');
    if (err instanceof AuthRedirectError) return;
    if (err instanceof ApiError && err.status === 404) {
      empty.classList.remove('hidden');
    } else {
      errorEl.textContent = 'Error loading history: ' + err.message;
    }
  }
}

// ==========================================
// TAB 3: PROGRAM
// ==========================================
async function loadProgram() {
  const loader = document.getElementById('program-loader');
  const errorEl = document.getElementById('program-error');
  const content = document.getElementById('program-content');

  try {
    const data = ensureApiObject(await api.getProgram(), 'program');
    loader.classList.add('hidden');
    content.classList.remove('hidden');

    const userSets = data.userSets ?? {};

    const scheduleContainer = document.getElementById('program-schedule');
    scheduleContainer.innerHTML = '';
    if (data.schedule) {
      const days = [
        ['monday', 'Mon'], ['tuesday', 'Tue'], ['wednesday', 'Wed'],
        ['thursday', 'Thu'], ['friday', 'Fri'], ['saturday', 'Sat'], ['sunday', 'Sun']
      ];
      days.forEach(([key, label]) => {
        const row = el('div', 'program-schedule-row');
        row.appendChild(el('span', 'program-day', label));
        row.appendChild(el('span', 'program-day-value', data.schedule[key] || 'Rest'));
        scheduleContainer.appendChild(row);
      });
    }

    const workoutsContainer = document.getElementById('program-workouts');
    workoutsContainer.innerHTML = '';
    if (data.workouts) {
      Object.entries(data.workouts).forEach(([type, workout]) => {
        const card = el('section', 'card program-workout-card');

        const header = el('div', 'program-workout-header');
        header.appendChild(el('div', 'card-title', workout.name || type));
        header.appendChild(el('div', 'program-workout-type', type.toUpperCase()));
        card.appendChild(header);

        if (workout.exercises && workout.exercises.length > 0) {
          const list = el('div', 'program-exercise-list');
          workout.exercises.forEach(ex => {
            const row = el('div', 'program-exercise-row');
            const main = el('div', 'program-exercise-main');
            main.appendChild(el('div', 'program-exercise-name', ex.name || ex.id));

            let target = '';
            if (ex.type === 'reps' && ex.reps) target = `${ex.reps.max} reps`;
            else if (ex.type === 'time' && ex.duration) target = `${ex.duration.max} sec`;
            else if (ex.type === 'cycles' && ex.cycles) target = `${ex.cycles.max} cycles`;

            const detail = el('div', 'program-exercise-detail', target || 'Custom target');
            main.appendChild(detail);
            row.appendChild(main);

            const currentSets = userSets[ex.id] ?? 1;
            row.appendChild(el('div', 'program-sets-pill', `${currentSets}/${ex.max_sets} sets`));
            list.appendChild(row);
          });
          card.appendChild(list);
        } else {
          card.appendChild(el('div', 'text-secondary', 'No exercises'));
        }
        workoutsContainer.appendChild(card);
      });
    }
  } catch (err) {
    loader.classList.add('hidden');
    if (err instanceof AuthRedirectError) return;
    errorEl.textContent = 'Error loading program: ' + err.message;
  }
}

async function bootstrapApp() {
  try {
    const { isSignedIn } = await ensureClerkReady();

    if (!getToken() && !isSignedIn) {
      window.location.replace('/login');
      return;
    }
  } catch (error) {
    console.error('Failed to initialize Clerk on the main app page:', error);

    if (!getToken()) {
      window.location.replace('/login');
      return;
    }
  }

  await loadToday();
}

bootstrapApp();
