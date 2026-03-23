import { api, getToken } from '/api.js';

if (!getToken()) {
  window.location.href = '/login';
}

let todayWorkoutType = null;

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

    data.exercises.forEach((ex, index) => {
      const card = el('section', `card exercise-card${index === 0 ? ' active' : ''}`);
      card.dataset.id = ex.id;

      let targetText = '';
      if (ex.type === 'reps' && ex.reps) targetText = `${ex.reps.max} reps`;
      else if (ex.type === 'time' && ex.duration) targetText = `${ex.duration.max} sec`;
      else if (ex.type === 'cycles' && ex.cycles) targetText = `${ex.cycles.max} cycles`;

      const header = el('button', 'exercise-card-toggle');
      header.type = 'button';
      header.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');

      const headerMain = el('div', 'exercise-card-main');
      const labelWrap = el('div', 'exercise-label-wrap');
      labelWrap.appendChild(el('div', 'exercise-badge', `Exercise ${index + 1}`));
      labelWrap.appendChild(el('div', 'card-title exercise-title', ex.name || ex.id));
      headerMain.appendChild(labelWrap);

      const chips = el('div', 'exercise-header-chips');
      if (targetText) chips.appendChild(el('div', 'exercise-chip', targetText));
      chips.appendChild(el('div', 'exercise-chip exercise-chip-accent', `${ex.sets || 1} sets`));
      headerMain.appendChild(chips);

      header.appendChild(headerMain);
      header.appendChild(el('div', 'exercise-expand-icon', '›'));
      card.appendChild(header);

      const contentWrap = el('div', 'exercise-card-content');
      const setsContainer = el('div', 'sets-container');
      for (let i = 0; i < (ex.sets || 1); i++) {
        setsContainer.appendChild(createSetRow(i + 1, ex.type));
      }
      contentWrap.appendChild(setsContainer);
      card.appendChild(contentWrap);

      header.addEventListener('click', () => {
        document.querySelectorAll('.exercise-card').forEach(item => {
          const isActive = item === card;
          item.classList.toggle('active', isActive);
          const toggle = item.querySelector('.exercise-card-toggle');
          if (toggle) toggle.setAttribute('aria-expanded', String(isActive));
        });
      });

      exercisesContainer.appendChild(card);
    });

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
    document.getElementById('history-workout-type').textContent = `Workout: ${data.workout_type}`;

    const exercisesContainer = document.getElementById('history-exercises');
    exercisesContainer.innerHTML = '';

    if (data.exercises && data.exercises.length > 0) {
      data.exercises.forEach(ex => {
        const card = el('div', 'card');
        card.appendChild(el('div', 'card-title', ex.id));
        const setsText = ex.sets.map((s, i) => `Set ${i + 1}: ${s}`).join(', ');
        card.appendChild(el('div', '', setsText));
        exercisesContainer.appendChild(card);
      });
    } else {
      exercisesContainer.innerHTML = '<div class="card">No exercises</div>';
    }

    document.getElementById('history-note').textContent = data.note || 'No notes';

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
        const row = el('div', 'flex justify-between mb-2 border-b pb-1');
        row.appendChild(el('span', 'font-bold', label));
        row.appendChild(el('span', '', data.schedule[key] || '—'));
        scheduleContainer.appendChild(row);
      });
    }

    // Workouts
    const workoutsContainer = document.getElementById('program-workouts');
    workoutsContainer.innerHTML = '';
    if (data.workouts) {
      Object.entries(data.workouts).forEach(([type, workout]) => {
        const card = el('div', 'card');
        card.appendChild(el('div', 'card-title', workout.name || type));

        if (workout.exercises && workout.exercises.length > 0) {
          const ul = el('ul', 'mt-2 pl-4');
          workout.exercises.forEach(ex => {
            const li = el('li', 'mb-2 text-sm');

            let target = '';
            if (ex.type === 'reps' && ex.reps) target = `${ex.reps.max} reps`;
            else if (ex.type === 'time' && ex.duration) target = `${ex.duration.max} sec`;
            else if (ex.type === 'cycles' && ex.cycles) target = `${ex.cycles.max} cycles`;

            const currentSets = userSets[ex.id] ?? 1;
            const setsDisplay = `${currentSets}/${ex.max_sets} sets`;

            li.textContent = `${ex.name || ex.id} — ${setsDisplay} × ${target}`;
            ul.appendChild(li);
          });
          card.appendChild(ul);
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