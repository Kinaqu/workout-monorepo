import { api, getToken, hasClerkSession } from '/api.js';

if (!getToken() && !hasClerkSession()) {
  window.location.href = '/login';
}

let todayWorkoutType = null;
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
      const today = new Date().toISOString().split('T')[0];
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

// ==========================================
// TAB 1: TODAY
// ==========================================
async function loadToday() {
  const loader = document.getElementById('today-loader');
  const errorEl = document.getElementById('today-error');
  const content = document.getElementById('today-content');

  try {
    const data = await api.getTodayWorkout();
    loader.classList.add('hidden');
    content.classList.remove('hidden');

    todayWorkoutType = data.type;

    document.getElementById('today-workout-name').textContent = data.name || 'Workout';
    document.getElementById('today-workout-type').textContent = `Type: ${data.type}`;

    const exercisesContainer = document.getElementById('today-exercises');
    const restMessage = document.getElementById('today-rest-message');
    const formContainer = document.getElementById('today-form-container');

    if (data.type === 'rest') {
      restMessage.classList.remove('hidden');
      formContainer.classList.add('hidden');
      return;
    }

    exercisesContainer.innerHTML = '';
    formContainer.classList.remove('hidden');

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
      confirmBtn.addEventListener('click', () => advanceExercise(card));
      footer.appendChild(footerHint);
      footer.appendChild(confirmBtn);
      card.appendChild(footer);

      exercisesContainer.appendChild(card);
    });

    syncExerciseStack();

  } catch (err) {
    loader.classList.add('hidden');
    errorEl.textContent = 'Error loading workout: ' + err.message;
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

function advanceExercise(card) {
  if (!card.classList.contains('active')) return;

  const inputs = Array.from(card.querySelectorAll('.set-input'));
  const isComplete = inputs.every(input => input.value.trim() !== '');
  if (!isComplete) {
    card.classList.add('exercise-card-invalid');
    window.setTimeout(() => card.classList.remove('exercise-card-invalid'), 380);
    return;
  }

  const cards = Array.from(document.querySelectorAll('.exercise-card'));
  const currentIndex = cards.indexOf(card);
  card.classList.add('is-leaving');

  if (currentIndex >= 0 && currentIndex < cards.length - 1) {
    window.setTimeout(() => setActiveExercise(currentIndex + 1), 180);
  } else {
    card.classList.add('completed-pulse');
    window.setTimeout(() => card.classList.remove('completed-pulse'), 320);
  }
}

function syncExerciseStack() {
  const container = document.getElementById('today-exercises');
  if (!container) return;

  const cards = Array.from(container.querySelectorAll('.exercise-card'));
  const remaining = Math.max(cards.length - activeExerciseIndex - 1, 0);
  container.style.setProperty('--stack-depth', String(Math.min(remaining, 2)));
}


document.getElementById('save-workout-btn').addEventListener('click', async () => {
  const btn = document.getElementById('save-workout-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const exercises = [];
    document.querySelectorAll('.exercise-card').forEach(card => {
      const id = card.dataset.id;
      const inputs = card.querySelectorAll('.set-input');
      const sets = Array.from(inputs).map(inp => parseInt(inp.value) || 0);
      exercises.push({ id, sets });
    });

    await api.logWorkout({ workout_type: todayWorkoutType, exercises, note: '' });
    alert('Workout saved!');

    const historyDate = document.getElementById('history-date').value;
    const today = new Date().toISOString().split('T')[0];
    if (historyDate === today) loadHistory(today);

  } catch (err) {
    alert('Save error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Workout';
  }
});

// ==========================================
// TAB 2: HISTORY
// ==========================================
document.getElementById('history-date').addEventListener('change', (e) => {
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
    if (err.message.includes('404') || err.message.toLowerCase().includes('not found') || err.message.toLowerCase().includes('no log')) {
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
    const data = await api.getProgram();
    loader.classList.add('hidden');
    content.classList.remove('hidden');

    const userSets = data.userSets ?? {};

    // Schedule
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

    // Workouts
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
    errorEl.textContent = 'Error loading program: ' + err.message;
  }
}

loadToday();