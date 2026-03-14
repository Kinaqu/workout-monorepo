import { api, getToken } from './api.js';

// Check auth
if (!getToken()) {
  window.location.href = 'login.html';
}

// State
let todayWorkoutData = null;
let todayWorkoutType = null;

// DOM Elements
const tabs = document.querySelectorAll('.tab-content');
const navItems = document.querySelectorAll('.nav-item');

// Tab Switching
navItems.forEach(item => {
  item.addEventListener('click', () => {
    const tabId = item.getAttribute('data-tab');
    
    // Update nav
    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');
    
    // Update tabs
    tabs.forEach(tab => tab.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');

    // Load data if needed
    if (tabId === 'history' && !document.getElementById('history-date').value) {
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('history-date').value = today;
      loadHistory(today);
    } else if (tabId === 'program' && document.getElementById('program-content').classList.contains('hidden')) {
      loadProgram();
    }
  });
});

// Utility to create DOM elements
function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
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
    
    todayWorkoutData = data;
    todayWorkoutType = data.type;

    document.getElementById('today-workout-name').textContent = data.name || 'Workout';
    document.getElementById('today-workout-type').textContent = `Type: ${data.type}`;

    const exercisesContainer = document.getElementById('today-exercises');
    const restMessage = document.getElementById('today-rest-message');
    const formContainer = document.getElementById('today-form-container');

    if (data.type === 'rest') {
      restMessage.classList.remove('hidden');
      exercisesContainer.classList.add('hidden');
      formContainer.classList.add('hidden');
      return;
    }

    exercisesContainer.innerHTML = '';
    formContainer.classList.remove('hidden');

    if (!data.exercises || data.exercises.length === 0) {
      exercisesContainer.innerHTML = '<div class="text-center text-secondary">No exercises</div>';
      return;
    }

    data.exercises.forEach(ex => {
      const card = el('div', 'card exercise-card');
      card.dataset.id = ex.id;
      
      const title = el('div', 'card-title', ex.name || ex.id);
      
      let targetText = '';
      if (ex.type === 'reps' && ex.reps) targetText = `Goal: ${ex.reps.min}-${ex.reps.max} reps`;
      else if (ex.type === 'time' && ex.duration) targetText = `Goal: ${ex.duration.min}-${ex.duration.max} sec`;
      else if (ex.type === 'cycles' && ex.cycles) targetText = `Goal: ${ex.cycles.min}-${ex.cycles.max} cycles`;
      
      const subtitle = el('div', 'card-subtitle', targetText);
      
      const setsContainer = el('div', 'sets-container');
      
      // Render initial sets
      const initialSets = ex.sets || 1;
      for (let i = 0; i < initialSets; i++) {
        setsContainer.appendChild(createSetRow(i + 1, ex.type));
      }

      const addBtn = el('button', 'add-set-btn', '+ Add Set');
      addBtn.type = 'button';
      addBtn.onclick = () => {
        const currentSets = setsContainer.querySelectorAll('.set-row').length;
        if (currentSets < (ex.max_sets || 10)) {
          setsContainer.appendChild(createSetRow(currentSets + 1, ex.type));
        } else {
          alert(`Maximum sets: ${ex.max_sets}`);
        }
      };

      card.appendChild(title);
      card.appendChild(subtitle);
      card.appendChild(setsContainer);
      card.appendChild(addBtn);
      exercisesContainer.appendChild(card);
    });

  } catch (err) {
    loader.classList.add('hidden');
    errorEl.textContent = 'Error loading workout: ' + err.message;
  }
}

function createSetRow(index, type) {
  const row = el('div', 'set-row');
  
  const label = el('div', 'set-label', `Set ${index}`);
  
  const input = el('input', 'set-input');
  input.type = 'number';
  input.min = '0';
  input.placeholder = type === 'time' ? 'Sec' : 'Reps';
  
  const removeBtn = el('button', 'remove-set-btn', '✕');
  removeBtn.type = 'button';
  removeBtn.onclick = () => row.remove();
  
  row.appendChild(label);
  row.appendChild(input);
  row.appendChild(removeBtn);
  
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

    const note = document.getElementById('today-note').value;
    
    const payload = {
      workout_type: todayWorkoutType,
      exercises,
      note
    };

    await api.logWorkout(payload);
    alert('Workout saved!');
    
    // Refresh history if today is selected
    const historyDate = document.getElementById('history-date').value;
    const today = new Date().toISOString().split('T')[0];
    if (historyDate === today) {
      loadHistory(today);
    }
  } catch (err) {
    alert('Error saving: ' + err.message);
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
    document.getElementById('history-workout-type').textContent = `Workout Type: ${data.workout_type}`;
    
    const exercisesContainer = document.getElementById('history-exercises');
    exercisesContainer.innerHTML = '';
    
    if (data.exercises && data.exercises.length > 0) {
      data.exercises.forEach(ex => {
        const card = el('div', 'card');
        card.appendChild(el('div', 'card-title', ex.id)); // Ideally we'd map ID to name
        const setsText = ex.sets.map((s, i) => `Set ${i+1}: ${s}`).join(', ');
        card.appendChild(el('div', '', setsText));
        exercisesContainer.appendChild(card);
      });
    } else {
      exercisesContainer.innerHTML = '<div class="card">No exercises</div>';
    }

    document.getElementById('history-note').textContent = data.note || 'No notes';

  } catch (err) {
    loader.classList.add('hidden');
    if (err.message.includes('404') || err.message.includes('not found')) {
      empty.classList.remove('hidden');
    } else {
      errorEl.textContent = 'Error loading history: ' + err.message;
    }
  }
}

// ==========================================
// TAB 3: PROGRESS
// ==========================================
document.getElementById('run-progression-btn').addEventListener('click', async () => {
  const btn = document.getElementById('run-progression-btn');
  const loader = document.getElementById('progress-loader');
  const errorEl = document.getElementById('progress-error');
  const content = document.getElementById('progress-content');
  
  btn.disabled = true;
  loader.classList.remove('hidden');
  content.classList.add('hidden');
  errorEl.textContent = '';

  try {
    const data = await api.runProgression();
    loader.classList.add('hidden');
    content.classList.remove('hidden');
    
    const changedContainer = document.getElementById('progress-changed');
    changedContainer.innerHTML = '';
    if (data.result && data.result.changed && data.result.changed.length > 0) {
      data.result.changed.forEach(item => {
        const div = el('div', 'progression-item');
        const header = el('div', 'flex justify-between items-center mb-2');
        header.appendChild(el('strong', '', item.name || item.id));
        
        const dir = el('span', item.direction === 'up' ? 'direction-up' : 'direction-down', item.direction === 'up' ? '↑ Increase' : '↓ Decrease');
        header.appendChild(dir);
        div.appendChild(header);
        
        div.appendChild(el('div', 'text-secondary mb-2', item.reason));
        
        const details = el('div', 'flex justify-between text-sm');
        details.appendChild(el('div', '', `Before: ${JSON.stringify(item.before)}`));
        details.appendChild(el('div', '', `After: ${JSON.stringify(item.after)}`));
        div.appendChild(details);
        
        changedContainer.appendChild(div);
      });
    } else {
      changedContainer.innerHTML = '<div class="text-secondary">No changes</div>';
    }

    const skippedContainer = document.getElementById('progress-skipped');
    skippedContainer.innerHTML = '';
    if (data.result && data.result.skipped && data.result.skipped.length > 0) {
      data.result.skipped.forEach(item => {
        const div = el('div', 'progression-item');
        div.appendChild(el('strong', '', item.id));
        div.appendChild(el('div', 'text-secondary', item.reason));
        skippedContainer.appendChild(div);
      });
    } else {
      skippedContainer.innerHTML = '<div class="text-secondary">No skipped</div>';
    }

  } catch (err) {
    loader.classList.add('hidden');
    errorEl.textContent = 'Error calculating progression: ' + err.message;
  } finally {
    btn.disabled = false;
  }
});

// ==========================================
// TAB 4: PROGRAM
// ==========================================
async function loadProgram() {
  const loader = document.getElementById('program-loader');
  const errorEl = document.getElementById('program-error');
  const content = document.getElementById('program-content');
  
  try {
    const data = await api.getProgram();
    loader.classList.add('hidden');
    content.classList.remove('hidden');
    
    const scheduleContainer = document.getElementById('program-schedule');
    scheduleContainer.innerHTML = '';
    if (data.schedule) {
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      
      days.forEach((day, i) => {
        const row = el('div', 'flex justify-between mb-2 border-b pb-1');
        row.appendChild(el('span', 'font-bold', dayNames[i]));
        row.appendChild(el('span', '', data.schedule[day] || '-'));
        scheduleContainer.appendChild(row);
      });
    }

    const workoutsContainer = document.getElementById('program-workouts');
    workoutsContainer.innerHTML = '';
    if (data.workouts) {
      Object.entries(data.workouts).forEach(([type, workout]) => {
        const card = el('div', 'card');
        card.appendChild(el('div', 'card-title', `${workout.name || type} (Type: ${type})`));
        
        if (workout.exercises && workout.exercises.length > 0) {
          const ul = el('ul', 'mt-2 pl-4');
          workout.exercises.forEach(ex => {
            const li = el('li', 'mb-2 text-sm');
            let target = '';
            if (ex.reps) target = `${ex.reps.min}-${ex.reps.max} reps`;
            else if (ex.duration) target = `${ex.duration.min}-${ex.duration.max} sec`;
            else if (ex.cycles) target = `${ex.cycles.min}-${ex.cycles.max} cycles`;
            
            li.textContent = `${ex.name || ex.id} — ${ex.sets} sets of ${target}`;
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

// Initialize
loadToday();