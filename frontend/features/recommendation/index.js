import {
  api,
  ApiError,
  isRecommendationDraftNotFoundError,
} from '/lib/api/index.js';
import {
  resetRecommendation,
  selectRecommendation,
  selectRecommendationDraft,
  updateRecommendation,
} from '/store/app-store.js';
import { el } from '/shared/ui/dom.js';
import { humanizeToken } from '/shared/utils/format.js';
import { ensureApiObject } from '/shared/utils/guards.js';

const recommendationShell = document.getElementById('recommendation-shell');
const recommendationStatusBadge = document.getElementById('recommendation-status-badge');
const recommendationError = document.getElementById('recommendation-error');
const recommendationLoader = document.getElementById('recommendation-loader');
const recommendationContent = document.getElementById('recommendation-content');
const recommendationProfileSummary = document.getElementById('recommendation-profile-summary');
const recommendationStepItems = Array.from(document.querySelectorAll('[data-recommendation-step]'));
const recommendationStructurePanel = document.getElementById('recommendation-structure-panel');
const recommendationStructures = document.getElementById('recommendation-structures');
const recommendationExercisePanel = document.getElementById('recommendation-exercise-panel');
const recommendationExerciseSummary = document.getElementById('recommendation-exercise-summary');
const recommendationExercises = document.getElementById('recommendation-exercises');
const recommendationReviewPanel = document.getElementById('recommendation-review-panel');
const recommendationReviewSummary = document.getElementById('recommendation-review-summary');
const recommendationActionCopy = document.getElementById('recommendation-action-copy');
const recommendationBackButton = document.getElementById('recommendation-back-button');
const recommendationNextButton = document.getElementById('recommendation-next-button');
const recommendationConfirmButton = document.getElementById('recommendation-confirm-button');
const recommendationOptionDialog = document.getElementById('recommendation-option-dialog');
const recommendationOptionTitle = document.getElementById('recommendation-option-title');
const recommendationOptionCopy = document.getElementById('recommendation-option-copy');
const recommendationOptionList = document.getElementById('recommendation-option-list');
const recommendationOptionClose = document.getElementById('recommendation-option-close');

const DAY_LABELS = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const FLOW_STEPS = ['structure', 'exercise', 'review'];

function isBusyStatus(status) {
  return status === 'loading' || status === 'updating' || status === 'activating';
}

function formatStructureScheduleValue(value) {
  if (!value || value === 'rest') {
    return 'Rest';
  }

  if (/^[A-Za-z]$/.test(value)) {
    return value.toUpperCase();
  }

  return humanizeToken(value);
}

function formatTargetLabel(option) {
  const range = `${option.target_min}-${option.target_max}`;
  if (option.type === 'time') {
    return `${range} sec`;
  }
  if (option.type === 'cycles') {
    return `${range} cycles`;
  }
  return `${range} reps`;
}

function formatStepTitle(step) {
  if (step === 'structure') return 'Choose your training structure';
  if (step === 'exercise') return 'Tune each exercise slot';
  return 'Review before activation';
}

function formatStepCopy(step) {
  if (step === 'structure') {
    return 'Start from the recommended split or switch to another supported structure.';
  }
  if (step === 'exercise') {
    return 'Keep the defaults or swap individual exercises with compatible alternatives.';
  }
  return 'Activation creates the normal active program version used by Today, History, and Plan.';
}

function buildSchedulePreview(schedule) {
  return Object.entries(DAY_LABELS)
    .filter(([day]) => schedule[day] && schedule[day] !== 'rest')
    .map(([day, workoutKey]) => `${DAY_LABELS[day]} ${formatStructureScheduleValue(workoutKey)}`);
}

function getDraftResponse() {
  return selectRecommendationDraft();
}

function getDraftJson() {
  return getDraftResponse()?.draft ?? null;
}

function getSelectedStructure(draft = getDraftJson()) {
  return draft?.structures.find(structure => structure.id === draft.selected_structure_id) ?? null;
}

function getSlotOption(slot, exerciseId) {
  return slot.options.find(option => option.exercise_id === exerciseId) ?? null;
}

function getSelectedOption(slot) {
  return getSlotOption(slot, slot.selected_exercise_id) ?? slot.options[0] ?? null;
}

function getRecommendedOption(slot) {
  return getSlotOption(slot, slot.recommended_exercise_id) ?? slot.options[0] ?? null;
}

function getChangedSlots(draft = getDraftJson()) {
  return (draft?.exercise_slots ?? []).filter(
    slot => slot.selected_exercise_id !== slot.recommended_exercise_id
  );
}

function setFeatureError(message = '') {
  if (recommendationError) {
    recommendationError.textContent = message;
  }
}

function setPickerState({ slotId = null, open = false } = {}) {
  updateRecommendation({
    activeSlotId: slotId,
    pickerOpen: open,
  });
}

function closeOptionDialog() {
  if (recommendationOptionDialog?.open) {
    recommendationOptionDialog.close();
  }

  setPickerState({ slotId: null, open: false });
}

function setDraftResponse(draftResponse, { step } = {}) {
  const safeDraft = ensureApiObject(draftResponse, 'recommendation draft');
  updateRecommendation({
    supported: true,
    status: 'ready',
    step: step ?? selectRecommendation().step ?? 'structure',
    draft: safeDraft,
    errorMessage: '',
    activationErrorMessage: '',
  });

  return safeDraft;
}

function renderProfileSummary(draft) {
  if (!recommendationProfileSummary) return;

  const snapshot = draft.profile_snapshot;
  const items = [
    humanizeToken(snapshot.primaryGoal),
    `${snapshot.trainingDaysPerWeek} days/week`,
    `${snapshot.sessionDurationMinutes} min`,
    humanizeToken(snapshot.experienceLevel),
  ];

  recommendationProfileSummary.innerHTML = '';
  items.forEach(item => {
    recommendationProfileSummary.appendChild(el('span', 'recommendation-pill', item));
  });
}

function renderStructureCards(draft, status) {
  if (!recommendationStructures) return;

  recommendationStructures.innerHTML = '';

  draft.structures.forEach(structure => {
    const card = el(
      'article',
      [
        'card',
        'recommendation-structure-card',
        structure.id === draft.selected_structure_id ? 'is-selected' : '',
      ]
        .filter(Boolean)
        .join(' ')
    );

    const header = el('div', 'recommendation-structure-header');
    const titleWrap = el('div', 'recommendation-structure-copy');
    titleWrap.appendChild(el('div', 'card-title', structure.label));
    titleWrap.appendChild(el('p', 'card-subtitle', structure.description));
    header.appendChild(titleWrap);

    const badgeRow = el('div', 'recommendation-pill-row');
    if (structure.recommended) {
      badgeRow.appendChild(el('span', 'recommendation-pill is-accent', 'Recommended'));
    }
    if (structure.id === draft.selected_structure_id) {
      badgeRow.appendChild(el('span', 'recommendation-pill is-selected', 'Selected'));
    }
    header.appendChild(badgeRow);
    card.appendChild(header);

    const schedulePreview = el('div', 'recommendation-preview-list');
    buildSchedulePreview(structure.schedule).forEach(item => {
      schedulePreview.appendChild(el('span', 'recommendation-preview-chip', item));
    });
    card.appendChild(schedulePreview);

    const workoutMeta = el('div', 'recommendation-workout-meta');
    structure.workouts.forEach(workout => {
      const workoutItem = el('div', 'recommendation-workout-meta-item');
      workoutItem.appendChild(el('strong', '', workout.name));
      workoutItem.appendChild(
        el('span', 'text-secondary', workout.tags.map(tag => humanizeToken(tag)).join(' · '))
      );
      workoutMeta.appendChild(workoutItem);
    });
    card.appendChild(workoutMeta);

    const action = el(
      'button',
      structure.id === draft.selected_structure_id ? 'secondary-button' : '',
      structure.id === draft.selected_structure_id ? 'Selected' : 'Choose structure'
    );
    action.type = 'button';
    action.disabled = structure.id === draft.selected_structure_id || isBusyStatus(status);
    action.dataset.recommendationAction = 'select-structure';
    action.dataset.structureId = structure.id;
    card.appendChild(action);

    recommendationStructures.appendChild(card);
  });
}

function renderExerciseCards(draft, status) {
  if (!recommendationExercises || !recommendationExerciseSummary) return;

  const selectedStructure = getSelectedStructure(draft);
  const workouts = selectedStructure?.workouts ?? [];
  recommendationExerciseSummary.textContent = `${draft.exercise_slots.length} slots across ${workouts.length} sessions.`;
  recommendationExercises.innerHTML = '';

  workouts.forEach(workout => {
    const workoutCard = el('section', 'card recommendation-workout-card');
    const header = el('div', 'recommendation-workout-header');
    const titleWrap = el('div', 'recommendation-workout-copy');
    titleWrap.appendChild(el('div', 'card-title', workout.name));
    titleWrap.appendChild(
      el('div', 'card-subtitle', workout.tags.map(tag => humanizeToken(tag)).join(' · '))
    );
    header.appendChild(titleWrap);
    workoutCard.appendChild(header);

    const slots = draft.exercise_slots
      .filter(slot => slot.workout_key === workout.key)
      .sort((left, right) => left.slot_index - right.slot_index);

    slots.forEach(slot => {
      const selectedOption = getSelectedOption(slot);
      const recommendedOption = getRecommendedOption(slot);
      if (!selectedOption) {
        return;
      }

      const slotCard = el('div', 'recommendation-slot-card');
      const slotHeader = el('div', 'recommendation-slot-header');
      const slotCopy = el('div', 'recommendation-slot-copy');
      slotCopy.appendChild(
        el('div', 'recommendation-slot-title', `Slot ${slot.slot_index + 1} · ${selectedOption.name}`)
      );
      slotCopy.appendChild(
        el(
          'div',
          'card-subtitle',
          `${formatTargetLabel(selectedOption)} · up to ${selectedOption.max_sets} sets`
        )
      );
      slotHeader.appendChild(slotCopy);

      const slotBadges = el('div', 'recommendation-pill-row');
      slotBadges.appendChild(
        el(
          'span',
          `recommendation-pill ${slot.selected_exercise_id === slot.recommended_exercise_id ? 'is-accent' : 'is-muted'}`,
          slot.selected_exercise_id === slot.recommended_exercise_id ? 'Recommended' : 'Changed'
        )
      );
      slotBadges.appendChild(
        el('span', 'recommendation-pill is-muted', humanizeToken(selectedOption.type))
      );
      slotHeader.appendChild(slotBadges);
      slotCard.appendChild(slotHeader);

      if (
        recommendedOption &&
        recommendedOption.exercise_id !== selectedOption.exercise_id
      ) {
        slotCard.appendChild(
          el('div', 'recommendation-slot-note', `Default: ${recommendedOption.name}`)
        );
      }

      slotCard.appendChild(
        el(
          'div',
          'recommendation-slot-tags',
          slot.blueprint_tags.map(tag => humanizeToken(tag)).join(' · ')
        )
      );

      const actionRow = el('div', 'recommendation-slot-actions');
      const replaceButton = el(
        'button',
        slot.options.length > 1 ? 'secondary-button' : 'secondary-button recommendation-button-disabled',
        slot.options.length > 1 ? 'Replace' : 'No alternatives'
      );
      replaceButton.type = 'button';
      replaceButton.disabled = slot.options.length <= 1 || isBusyStatus(status);
      replaceButton.dataset.recommendationAction = 'open-slot-picker';
      replaceButton.dataset.slotId = slot.slot_id;
      actionRow.appendChild(replaceButton);
      slotCard.appendChild(actionRow);

      workoutCard.appendChild(slotCard);
    });

    recommendationExercises.appendChild(workoutCard);
  });
}

function renderReview(draft) {
  if (!recommendationReviewSummary) return;

  const selectedStructure = getSelectedStructure(draft);
  const changedSlots = getChangedSlots(draft);
  recommendationReviewSummary.innerHTML = '';

  const structureCard = el('section', 'card recommendation-review-card');
  structureCard.appendChild(el('div', 'card-title', 'Selected structure'));
  structureCard.appendChild(
    el(
      'p',
      'card-subtitle',
      selectedStructure
        ? `${selectedStructure.label} · ${selectedStructure.description}`
        : 'No structure selected'
    )
  );

  const scheduleRow = el('div', 'recommendation-preview-list');
  buildSchedulePreview(selectedStructure?.schedule ?? {}).forEach(item => {
    scheduleRow.appendChild(el('span', 'recommendation-preview-chip', item));
  });
  structureCard.appendChild(scheduleRow);
  recommendationReviewSummary.appendChild(structureCard);

  const changesCard = el('section', 'card recommendation-review-card');
  changesCard.appendChild(el('div', 'card-title', 'Exercise changes'));

  if (changedSlots.length === 0) {
    changesCard.appendChild(
      el('p', 'card-subtitle', 'You are keeping all recommended exercise defaults.')
    );
  } else {
    const list = el('div', 'recommendation-change-list');
    changedSlots.forEach(slot => {
      const selectedOption = getSelectedOption(slot);
      const recommendedOption = getRecommendedOption(slot);
      const item = el('div', 'recommendation-change-item');
      item.appendChild(
        el(
          'strong',
          '',
          `${slot.workout_name} · Slot ${slot.slot_index + 1}`
        )
      );
      item.appendChild(
        el(
          'div',
          'text-secondary',
          `${recommendedOption?.name ?? 'Default'} -> ${selectedOption?.name ?? 'Selected'}`
        )
      );
      list.appendChild(item);
    });
    changesCard.appendChild(list);
  }

  recommendationReviewSummary.appendChild(changesCard);
}

function renderOptionDialog(draft, status) {
  if (!recommendationOptionList || !recommendationOptionTitle || !recommendationOptionCopy) {
    return;
  }

  const recommendation = selectRecommendation();
  if (!recommendation.pickerOpen || !recommendation.activeSlotId) {
    recommendationOptionList.innerHTML = '';
    closeOptionDialog();
    return;
  }

  const slot = draft.exercise_slots.find(item => item.slot_id === recommendation.activeSlotId);
  if (!slot) {
    closeOptionDialog();
    return;
  }

  recommendationOptionTitle.textContent = `${slot.workout_name} · Slot ${slot.slot_index + 1}`;
  recommendationOptionCopy.textContent = 'Choose one of the compatible replacements for this slot.';
  recommendationOptionList.innerHTML = '';

  slot.options.forEach(option => {
    const button = el(
      'button',
      [
        'recommendation-option-button',
        option.exercise_id === slot.selected_exercise_id ? 'is-selected' : '',
      ]
        .filter(Boolean)
        .join(' ')
    );
    button.type = 'button';
    button.disabled = isBusyStatus(status);
    button.dataset.recommendationAction = 'pick-exercise';
    button.dataset.slotId = slot.slot_id;
    button.dataset.catalogExerciseId = option.catalog_exercise_id;

    const copy = el('div', 'recommendation-option-copy');
    copy.appendChild(el('strong', '', option.name));
    copy.appendChild(
      el(
        'div',
        'text-secondary',
        `${formatTargetLabel(option)} · up to ${option.max_sets} sets`
      )
    );
    button.appendChild(copy);

    const badges = el('div', 'recommendation-pill-row');
    if (option.exercise_id === slot.selected_exercise_id) {
      badges.appendChild(el('span', 'recommendation-pill is-selected', 'Selected'));
    }
    if (option.recommended) {
      badges.appendChild(el('span', 'recommendation-pill is-accent', 'Recommended'));
    }
    badges.appendChild(el('span', 'recommendation-pill is-muted', humanizeToken(option.type)));
    button.appendChild(badges);

    recommendationOptionList.appendChild(button);
  });

  if (typeof recommendationOptionDialog?.showModal === 'function' && !recommendationOptionDialog.open) {
    recommendationOptionDialog.showModal();
  }
}

function render() {
  if (!recommendationShell) return;

  const recommendation = selectRecommendation();
  const draftResponse = recommendation.draft;
  const draft = draftResponse?.draft ?? null;
  const status = recommendation.status;
  const showLoader = status === 'loading' && !draft;
  const showContent = Boolean(draft);

  if (recommendationStatusBadge) {
    recommendationStatusBadge.textContent =
      status === 'activating'
        ? 'Activating...'
        : status === 'updating'
          ? 'Saving changes...'
          : draftResponse?.status === 'activated'
            ? 'Activated'
            : 'Draft';
  }

  setFeatureError(recommendation.activationErrorMessage || recommendation.errorMessage || '');

  recommendationLoader?.classList.toggle('hidden', !showLoader);
  recommendationContent?.classList.toggle('hidden', !showContent);

  if (!draft) {
    closeOptionDialog();
    return;
  }

  renderProfileSummary(draft);
  renderStructureCards(draft, status);
  renderExerciseCards(draft, status);
  renderReview(draft);

  recommendationStepItems.forEach(item => {
    const step = item.dataset.recommendationStep;
    item.classList.toggle('is-active', step === recommendation.step);
    item.classList.toggle('is-complete', FLOW_STEPS.indexOf(step) < FLOW_STEPS.indexOf(recommendation.step));
  });

  recommendationStructurePanel?.classList.toggle('hidden', recommendation.step !== 'structure');
  recommendationExercisePanel?.classList.toggle('hidden', recommendation.step !== 'exercise');
  recommendationReviewPanel?.classList.toggle('hidden', recommendation.step !== 'review');

  if (recommendationActionCopy) {
    recommendationActionCopy.textContent = formatStepCopy(recommendation.step);
  }

  if (recommendationBackButton) {
    recommendationBackButton.classList.toggle('hidden', recommendation.step === 'structure');
    recommendationBackButton.disabled = isBusyStatus(status);
  }

  if (recommendationNextButton) {
    recommendationNextButton.classList.toggle('hidden', recommendation.step === 'review');
    recommendationNextButton.disabled = isBusyStatus(status);
    recommendationNextButton.textContent =
      recommendation.step === 'structure' ? 'Continue to exercises' : 'Review plan';
  }

  if (recommendationConfirmButton) {
    recommendationConfirmButton.classList.toggle('hidden', recommendation.step !== 'review');
    recommendationConfirmButton.disabled = isBusyStatus(status);
    recommendationConfirmButton.textContent = status === 'activating' ? 'Activating...' : 'Activate plan';
  }

  const panelTitle = recommendationShell.querySelector('#recommendation-panel-title');
  if (panelTitle) {
    panelTitle.textContent = formatStepTitle(recommendation.step);
  }

  renderOptionDialog(draft, status);
}

function goToStep(step) {
  if (!FLOW_STEPS.includes(step)) return;
  updateRecommendation({
    step,
    errorMessage: '',
    activationErrorMessage: '',
  });
  render();
}

function getReadableErrorMessage(error, fallback) {
  if (error instanceof ApiError && error.message) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function createRecommendationFeature({ showShellMode, onActivated }) {
  async function loadOrCreateDraft() {
    try {
      return ensureApiObject(await api.getRecommendationDraft(), 'recommendation draft');
    } catch (error) {
      if (isRecommendationDraftNotFoundError(error)) {
        return ensureApiObject(await api.createRecommendationDraft(), 'recommendation draft');
      }
      throw error;
    }
  }

  async function enter(prefetchedDraft = null) {
    updateRecommendation({
      status: prefetchedDraft ? 'ready' : 'loading',
      step: selectRecommendation().step ?? 'structure',
      errorMessage: '',
      activationErrorMessage: '',
    });

    showShellMode('recommendation');
    render();

    const draftResponse = prefetchedDraft ?? (await loadOrCreateDraft());
    setDraftResponse(draftResponse, { step: selectRecommendation().step || 'structure' });
    render();
    return true;
  }

  function reset({ preserveSupport = false } = {}) {
    const supported = preserveSupport ? selectRecommendation().supported : true;
    resetRecommendation();
    updateRecommendation({ supported });
    closeOptionDialog();
    setFeatureError('');
    render();
  }

  function markUnsupported() {
    updateRecommendation({ supported: false, status: 'idle' });
    closeOptionDialog();
  }

  async function handleSelectStructure(structureId) {
    const draftResponse = getDraftResponse();
    if (!draftResponse || !structureId) return;

    updateRecommendation({
      status: 'updating',
      errorMessage: '',
      activationErrorMessage: '',
    });
    render();

    try {
      const nextDraft = await api.selectRecommendationStructure({
        draft_id: draftResponse.id,
        structure_id: structureId,
      });
      setDraftResponse(nextDraft, { step: 'structure' });
    } catch (error) {
      updateRecommendation({
        status: 'ready',
        errorMessage: getReadableErrorMessage(error, 'Unable to change structure right now.'),
      });
    }

    render();
  }

  async function handleReplaceExercise(slotId, catalogExerciseId) {
    const draftResponse = getDraftResponse();
    if (!draftResponse || !slotId || !catalogExerciseId) return;

    updateRecommendation({
      status: 'updating',
      errorMessage: '',
      activationErrorMessage: '',
    });
    render();

    try {
      const nextDraft = await api.replaceRecommendationExercise({
        draft_id: draftResponse.id,
        slot_id: slotId,
        catalog_exercise_id: catalogExerciseId,
      });
      setDraftResponse(nextDraft, { step: 'exercise' });
      closeOptionDialog();
    } catch (error) {
      updateRecommendation({
        status: 'ready',
        errorMessage: getReadableErrorMessage(error, 'Unable to replace this exercise right now.'),
      });
    }

    render();
  }

  async function handleActivateDraft() {
    const draftResponse = getDraftResponse();
    if (!draftResponse) return;

    updateRecommendation({
      status: 'activating',
      activationErrorMessage: '',
      errorMessage: '',
    });
    render();

    try {
      const activation = await api.activateRecommendationDraft({
        draft_id: draftResponse.id,
      });
      closeOptionDialog();
      updateRecommendation({
        status: 'ready',
        activationErrorMessage: '',
      });
      if (typeof onActivated === 'function') {
        await onActivated(activation);
      }
    } catch (error) {
      updateRecommendation({
        status: 'ready',
        activationErrorMessage: getReadableErrorMessage(error, 'Unable to activate this draft right now.'),
      });
      render();
    }
  }

  recommendationShell?.addEventListener('click', event => {
    const actionTarget = event.target.closest('[data-recommendation-action]');
    if (!actionTarget) return;

    const action = actionTarget.dataset.recommendationAction;
    if (action === 'select-structure') {
      void handleSelectStructure(actionTarget.dataset.structureId || '');
      return;
    }

    if (action === 'open-slot-picker') {
      setPickerState({
        slotId: actionTarget.dataset.slotId || null,
        open: true,
      });
      render();
    }
  });

  recommendationOptionList?.addEventListener('click', event => {
    const actionTarget = event.target.closest('[data-recommendation-action="pick-exercise"]');
    if (!actionTarget) return;

    void handleReplaceExercise(
      actionTarget.dataset.slotId || '',
      actionTarget.dataset.catalogExerciseId || ''
    );
  });

  recommendationOptionClose?.addEventListener('click', () => {
    closeOptionDialog();
    render();
  });

  recommendationOptionDialog?.addEventListener('close', () => {
    setPickerState({ slotId: null, open: false });
  });

  recommendationBackButton?.addEventListener('click', () => {
    const currentIndex = FLOW_STEPS.indexOf(selectRecommendation().step);
    goToStep(FLOW_STEPS[Math.max(currentIndex - 1, 0)]);
  });

  recommendationNextButton?.addEventListener('click', () => {
    const currentIndex = FLOW_STEPS.indexOf(selectRecommendation().step);
    goToStep(FLOW_STEPS[Math.min(currentIndex + 1, FLOW_STEPS.length - 1)]);
  });

  recommendationConfirmButton?.addEventListener('click', () => {
    void handleActivateDraft();
  });

  recommendationStepItems.forEach(item => {
    item.addEventListener('click', () => {
      const step = item.dataset.recommendationStep;
      if (!step) return;

      const currentIndex = FLOW_STEPS.indexOf(selectRecommendation().step);
      const nextIndex = FLOW_STEPS.indexOf(step);
      if (nextIndex <= currentIndex) {
        goToStep(step);
      }
    });
  });

  return {
    enter,
    loadOrCreateDraft,
    markUnsupported,
    reset,
  };
}
