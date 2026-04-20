import {
  api,
  AuthRedirectError,
  isMissingProgramError,
  isOnboardingIncompleteError,
} from '/lib/api/index.js';
import { hasActiveProgram } from '/store/app-store.js';
import { renderBoneyardLoader } from '/shared/ui/boneyard.js';
import { el } from '/shared/ui/dom.js';
import { formatDateLabel, formatWorkoutTypeLabel, humanizeToken } from '/shared/utils/format.js';

const historyEmpty = document.getElementById('history-empty');
const historyNoteCard = document.getElementById('history-note-card');
const historyDateInput = document.getElementById('history-date');
const historySessionSummary = document.getElementById('history-session-summary');
const historySessionList = document.getElementById('history-session-list');
const historyDetail = document.getElementById('history-detail');

export function createHistoryFeature({ onEnterOnboarding, onMissingProgram }) {
  let loadedSessions = [];
  let selectedSessionId = null;
  let detailRequestToken = 0;

  function init() {
    historyDateInput?.addEventListener('change', event => {
      void load(event.target.value);
    });
  }

  function renderRecoveryState() {
    document.getElementById('history-loader').classList.add('hidden');
    document.getElementById('history-data').classList.add('hidden');
    resetHistoryState();
    historyEmpty.textContent = 'No plan yet. Build one first to start logging workouts.';
    historyEmpty.classList.remove('hidden');
    document.getElementById('history-error').textContent = '';
  }

  function getSelectedDate() {
    return historyDateInput?.value || '';
  }

  async function loadSelected() {
    if (!historyDateInput) return;

    if (!historyDateInput.value) {
      historyDateInput.value = new Date().toISOString().split('T')[0];
    }

    await load(historyDateInput.value);
  }

  async function load(date) {
    if (!date) return;

    const loader = document.getElementById('history-loader');
    const errorEl = document.getElementById('history-error');
    const content = document.getElementById('history-data');
    const empty = document.getElementById('history-empty');

    loader.classList.remove('hidden');
    renderBoneyardLoader(loader);
    content.classList.add('hidden');
    empty.classList.add('hidden');
    errorEl.textContent = '';

    if (!hasActiveProgram()) {
      renderRecoveryState();
      return;
    }

    try {
      const data = await api.listSessions({ date, limit: 50 });
      loader.classList.add('hidden');
      loadedSessions = Array.isArray(data?.sessions) ? data.sessions : [];

      if (loadedSessions.length === 0) {
        resetHistoryState();
        empty.textContent = 'No sessions stored for this day.';
        empty.classList.remove('hidden');
        return;
      }

      content.classList.remove('hidden');
      renderSessionSummary(date, loadedSessions);
      renderSessionListItems();

      const nextSessionId = loadedSessions.some(session => session.id === selectedSessionId)
        ? selectedSessionId
        : loadedSessions[0]?.id ?? null;

      if (nextSessionId) {
        await loadSessionDetail(nextSessionId);
      } else {
        renderEmptyDetail();
      }
    } catch (error) {
      loader.classList.add('hidden');
      if (error instanceof AuthRedirectError) return;

      if (isOnboardingIncompleteError(error)) {
        await onEnterOnboarding();
        return;
      }

      if (isMissingProgramError(error)) {
        onMissingProgram();
        renderRecoveryState();
        return;
      }

      errorEl.textContent = 'Could not load history: ' + error.message;
    }
  }

  function resetHistoryState() {
    loadedSessions = [];
    selectedSessionId = null;
    detailRequestToken += 1;

    if (historySessionSummary) {
      historySessionSummary.textContent = '';
    }

    if (historySessionList) {
      historySessionList.innerHTML = '';
    }

    if (historyDetail) {
      historyDetail.innerHTML = '';
      historyDetail.classList.add('hidden');
    }

    historyNoteCard?.classList.add('hidden');
    const historyNote = document.getElementById('history-note');
    if (historyNote) {
      historyNote.textContent = '';
    }
  }

  function renderSessionSummary(date, sessions) {
    if (!historySessionSummary) return;

    const countLabel = sessions.length === 1 ? '1 session' : `${sessions.length} sessions`;
    historySessionSummary.textContent = `${formatDateLabel(date)} · ${countLabel}`;
  }

  function renderSessionListItems() {
    if (!historySessionList) return;

    historySessionList.innerHTML = '';

    loadedSessions.forEach((session, index) => {
      const button = el('button', 'history-session-item');
      button.type = 'button';
      button.dataset.sessionId = session.id;
      button.classList.toggle('active', session.id === selectedSessionId);
      button.addEventListener('click', () => {
        void loadSessionDetail(session.id);
      });

      const header = el('div', 'history-session-item-header');
      header.appendChild(el('div', 'history-session-item-index', `#${index + 1}`));
      header.appendChild(el('div', 'history-session-item-title', getSessionTitle(session)));
      button.appendChild(header);

      button.appendChild(el('div', 'history-session-item-meta', getSessionMeta(session)));
      button.appendChild(
        el(
          'div',
          'history-session-item-stats',
          `${countMatchedExercises(session)} matched · ${countUnmatchedExercises(session)} unmatched`
        )
      );

      historySessionList.appendChild(button);
    });
  }

  async function loadSessionDetail(sessionId) {
    if (!sessionId) return;

    selectedSessionId = sessionId;
    renderSessionListItems();
    renderDetailLoading();

    const requestToken = ++detailRequestToken;

    try {
      const session = await api.getSession(sessionId);
      if (requestToken !== detailRequestToken) return;
      renderSessionDetail(session);
    } catch (error) {
      if (requestToken !== detailRequestToken) return;
      if (error instanceof AuthRedirectError) return;

      if (!historyDetail) return;

      historyDetail.classList.remove('hidden');
      historyDetail.innerHTML = '';
      historyDetail.appendChild(
        createEmptyCard(
          'Could not load this session right now.',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
    }
  }

  function renderDetailLoading() {
    if (!historyDetail) return;

    historyDetail.classList.remove('hidden');
    historyDetail.innerHTML = '';
    historyDetail.appendChild(
      createEmptyCard('Loading session details…', 'Fetching the full record from /sessions/{id}.')
    );
  }

  function renderEmptyDetail() {
    if (!historyDetail) return;

    historyDetail.classList.remove('hidden');
    historyDetail.innerHTML = '';
    historyDetail.appendChild(
      createEmptyCard('No session selected.', 'Choose a session from the list to inspect the saved payload.')
    );
  }

  function renderSessionDetail(session) {
    if (!historyDetail) return;

    const matchedExercises = session.exercises.filter(exercise => exercise.matched);
    const unmatchedExercises = session.exercises.filter(exercise => !exercise.matched);

    historyDetail.innerHTML = '';
    historyDetail.classList.remove('hidden');
    historyDetail.appendChild(createOverviewCard(session, matchedExercises, unmatchedExercises));
    if (session.note) {
      historyDetail.appendChild(createNoteCard(session.note));
    }
    historyDetail.appendChild(
      createExerciseSection('Saved exercises', matchedExercises, 'Exercises linked to this workout.')
    );
    if (unmatchedExercises.length > 0) {
      historyDetail.appendChild(
        createExerciseSection(
          'Extra saved lines',
          unmatchedExercises,
          'Saved separately because they are not linked to your plan yet.'
        )
      );
    }
    historyDetail.appendChild(createTechnicalDetailsSection(session, matchedExercises, unmatchedExercises));

    historyNoteCard?.classList.add('hidden');
    const historyNote = document.getElementById('history-note');
    if (historyNote) {
      historyNote.textContent = '';
    }
  }

  function createOverviewCard(session, matchedExercises, unmatchedExercises) {
    const card = el('article', 'card history-detail-card history-detail-overview-card');
    const header = el('div', 'history-detail-header');
    const titleWrap = el('div', 'history-detail-title-wrap');

    titleWrap.appendChild(el('div', 'history-detail-kicker', formatDateLabel(session.sessionDate)));
    titleWrap.appendChild(el('div', 'card-title', getSessionTitle(session)));
    header.appendChild(titleWrap);
    header.appendChild(createPill(`Source: ${formatSourceLabel(session.source)}`, 'history-meta-pill'));
    card.appendChild(header);

    const meta = el('div', 'history-meta-grid');
    meta.appendChild(createMetaStat('Plan day', session.workoutType ? formatWorkoutTypeLabel(session.workoutType) : 'Not assigned'));
    meta.appendChild(createMetaStat('Saved', formatDateTime(session.createdAt)));
    meta.appendChild(createMetaStat('Updated', formatDateTime(session.updatedAt)));
    meta.appendChild(createMetaStat('Extra lines', session.unmatched.length ? `${session.unmatched.length}` : 'None'));
    card.appendChild(meta);

    const stats = el('div', 'history-pill-row');
    stats.appendChild(createPill(`${matchedExercises.length} tracked`, 'history-stat-pill'));
    stats.appendChild(createPill(`${unmatchedExercises.length} extra`, 'history-stat-pill history-stat-pill-warning'));
    stats.appendChild(createPill(`${session.exercises.length} saved`, 'history-stat-pill history-stat-pill-neutral'));
    card.appendChild(stats);

    return card;
  }

  function createParsedResultCard(session, matchedExercises, unmatchedExercises) {
    const card = el('article', 'card history-detail-card');
    card.appendChild(el('div', 'card-title', 'Import details'));
    card.appendChild(
      el(
        'p',
        'history-detail-copy',
        'Extra details about how this workout entry was saved.'
      )
    );

    const summary = el('div', 'history-parsed-grid');
    summary.appendChild(createMetaStat('Tracked exercises', String(matchedExercises.length)));
    summary.appendChild(createMetaStat('Extra exercises', String(unmatchedExercises.length)));
    summary.appendChild(createMetaStat('Extra text lines', String(session.unmatched.length)));
    summary.appendChild(createMetaStat('Saved note', session.note ? 'Yes' : 'No'));
    card.appendChild(summary);

    if (session.unmatched.length > 0) {
      const issueBlock = el('div', 'history-block');
      issueBlock.appendChild(el('div', 'history-block-title', 'Extra text lines'));
      const list = el('div', 'history-text-list');
      session.unmatched.forEach(line => {
        list.appendChild(el('div', 'history-text-chip', line));
      });
      issueBlock.appendChild(list);
      card.appendChild(issueBlock);
    }

    return card;
  }

  function createExerciseSection(title, exercises, description) {
    const section = el('section', 'history-detail-section');
    section.appendChild(el('div', 'history-section-title', title));
    section.appendChild(el('p', 'history-detail-copy', description));

    if (!exercises.length) {
      section.appendChild(createEmptyCard('Nothing to show.', 'Nothing was saved in this section for the selected workout.'));
      return section;
    }

    const list = el('div', 'history-exercise-list');
    exercises.forEach((exercise, index) => {
      list.appendChild(createExerciseCard(exercise, index));
    });
    section.appendChild(list);

    return section;
  }

  function createExerciseCard(exercise, index) {
    const card = el('article', 'card history-exercise-card');
    const header = el('div', 'history-exercise-header');
    header.appendChild(el('div', 'history-exercise-index', `#${index + 1}`));

    const titleWrap = el('div', 'history-exercise-title-wrap');
    titleWrap.appendChild(el('div', 'card-title', exercise.exerciseName || humanizeToken(exercise.exerciseKey || 'exercise')));
    titleWrap.appendChild(
      el(
        'div',
        'card-subtitle',
        exercise.matched ? 'Tracked in your plan' : 'Saved as an extra line'
      )
    );
    header.appendChild(titleWrap);

    const badges = el('div', 'history-pill-row');
    badges.appendChild(
      createPill(
        exercise.matched ? 'Tracked' : 'Extra line',
        exercise.matched ? 'history-status-pill' : 'history-status-pill history-status-pill-warning'
      )
    );
    badges.appendChild(
      createPill(
        exercise.exerciseType ? humanizeToken(exercise.exerciseType) : 'Unknown type',
        'history-status-pill history-status-pill-neutral'
      )
    );
    badges.appendChild(createPill(`${exercise.sets.length} ${exercise.sets.length === 1 ? 'set' : 'sets'}`, 'history-status-pill history-status-pill-neutral'));
    header.appendChild(badges);
    card.appendChild(header);

    if (exercise.sets.length > 0) {
      const setList = el('div', 'history-set-list');
      exercise.sets.forEach((setValue, setIndex) => {
        const row = el('div', 'history-set-row');
        row.appendChild(el('div', 'history-set-label', `Set ${setIndex + 1}`));
        row.appendChild(el('div', 'history-set-value', String(setValue)));
        setList.appendChild(row);
      });
      card.appendChild(setList);
    } else {
      card.appendChild(el('div', 'history-detail-copy', 'No set values were saved for this exercise.'));
    }

    return card;
  }

  function createRawImportCard(session) {
    const card = el('article', 'card history-detail-card');
    card.appendChild(el('div', 'card-title', 'Original text entry'));
    card.appendChild(
      el(
        'p',
        'history-detail-copy',
        session.rawText
          ? 'Original text kept with this workout entry.'
          : 'No original text was saved for this workout entry.'
      )
    );

    const pre = el('pre', 'history-raw-import');
    pre.textContent = session.rawText || 'No raw text available.';
    card.appendChild(pre);

    return card;
  }

  function createTechnicalDetailsSection(session, matchedExercises, unmatchedExercises) {
    const shell = document.createElement('details');
    shell.className = 'history-details-shell';

    const summary = document.createElement('summary');
    summary.className = 'history-details-summary';
    summary.textContent = 'Import and save details';
    shell.appendChild(summary);

    const body = el('div', 'history-details-body');
    body.appendChild(createParsedResultCard(session, matchedExercises, unmatchedExercises));
    body.appendChild(createRawImportCard(session));
    shell.appendChild(body);

    return shell;
  }

  function createNoteCard(note) {
    const card = el('article', 'card history-detail-card');
    card.appendChild(el('div', 'card-title', 'Note'));
    card.appendChild(el('p', 'history-detail-copy', note));
    return card;
  }

  function createMetaStat(label, value) {
    const wrapper = el('div', 'history-meta-stat');
    wrapper.appendChild(el('div', 'history-meta-label', label));
    wrapper.appendChild(el('div', 'history-meta-value', value));
    return wrapper;
  }

  function createPill(text, className) {
    return el('div', className, text);
  }

  function createEmptyCard(title, message) {
    const card = el('article', 'card history-empty-card');
    card.appendChild(el('div', 'card-title', title));
    card.appendChild(el('p', 'history-detail-copy', message));
    return card;
  }

  function getSessionTitle(session) {
    return session.workoutName || formatWorkoutTypeLabel(session.workoutType) || 'Logged session';
  }

  function getSessionMeta(session) {
    return `${formatSourceLabel(session.source)} · ${formatTime(session.createdAt)}`;
  }

  function countMatchedExercises(session) {
    return session.exercises.filter(exercise => exercise.matched).length;
  }

  function countUnmatchedExercises(session) {
    return session.exercises.filter(exercise => !exercise.matched).length;
  }

  function formatSourceLabel(source) {
    if (source === 'json') return 'Saved workout';
    if (source === 'text') return 'Quick text entry';
    if (source === 'legacy-kv') return 'Imported workout';
    return humanizeToken(source || 'unknown');
  }

  function formatTime(value) {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  }

  function formatDateTime(value) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  }

  return {
    getSelectedDate,
    init,
    load,
    loadSelected,
    renderRecoveryState,
  };
}
