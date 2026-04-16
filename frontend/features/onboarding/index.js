import { api, ApiError, AuthRedirectError } from '/lib/api/index.js';
import { selectMe, selectOnboarding, selectShellMode, setOnboarding } from '/store/app-store.js';
import { el } from '/shared/ui/dom.js';
import { ensureApiObject } from '/shared/utils/guards.js';
import {
  createDefaultOnboardingData,
  mergeOnboardingData,
  ONBOARDING_QUESTIONNAIRE_VERSION,
  validateOnboardingPayload,
} from '/shared/utils/onboarding.js';

const onboardingShell = document.getElementById('onboarding-shell');
const onboardingForm = document.getElementById('onboarding-form');
const onboardingSaveStatus = document.getElementById('onboarding-save-status');
const onboardingSubmitError = document.getElementById('onboarding-submit-error');
const onboardingStatusBadge = document.getElementById('onboarding-status-badge');
const onboardingCompleteButton = document.getElementById('onboarding-complete-button');
const onboardingBackButton = document.getElementById('onboarding-back-button');
const onboardingNextButton = document.getElementById('onboarding-next-button');
const onboardingReview = document.getElementById('onboarding-review');
const onboardingStepPanels = Array.from(document.querySelectorAll('[data-onboarding-step-panel]'));
const onboardingStepItems = Array.from(document.querySelectorAll('[data-onboarding-step-item]'));

export function createOnboardingFeature({ showShellMode, onCompleted }) {
  let onboardingDraftTimer = null;
  let onboardingLastSavedSignature = '';
  let onboardingHydrating = false;
  let onboardingSubmitting = false;
  let onboardingCurrentStep = 0;

  function isCompletedOnboardingState(onboarding = selectOnboarding()) {
    return Boolean(
      onboarding?.completed ||
      onboarding?.status === 'completed' ||
      selectMe()?.lifecycle?.onboarding_completed ||
      selectMe()?.onboarding?.completed
    );
  }

  function cancelOnboardingDraftSave() {
    window.clearTimeout(onboardingDraftTimer);
    onboardingDraftTimer = null;
  }

  if (onboardingForm) {
    onboardingForm.addEventListener('change', handleOnboardingChange);
    onboardingForm.addEventListener('submit', handleOnboardingSubmit);
  }

  if (onboardingBackButton) {
    onboardingBackButton.addEventListener('click', () => {
      goToOnboardingStep(onboardingCurrentStep - 1);
    });
  }

  if (onboardingNextButton) {
    onboardingNextButton.addEventListener('click', handleOnboardingNextStep);
  }

  function setOnboardingSaveStatus(message, tone = 'neutral') {
    if (!onboardingSaveStatus) return;
    onboardingSaveStatus.textContent = message;
    onboardingSaveStatus.dataset.tone = tone;
  }

  function setOnboardingSubmitError(message = '') {
    if (!onboardingSubmitError) return;
    onboardingSubmitError.textContent = message;
  }

  function setCheckedValues(name, values) {
    const allowed = new Set(values);
    document
      .querySelectorAll(`input[name="${name}"]`)
      .forEach(input => {
        input.checked = allowed.has(input.value);
      });
  }

  function setRadioValue(name, value) {
    document
      .querySelectorAll(`input[name="${name}"]`)
      .forEach(input => {
        input.checked = input.value === String(value);
      });
  }

  function getCheckedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(input => input.value);
  }

  function getRadioValue(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value || '';
  }

  function getNumberValue(name) {
    const value = Number.parseInt(getRadioValue(name), 10);
    return Number.isInteger(value) ? value : null;
  }

  function getOnboardingLastStepIndex() {
    return Math.max(onboardingStepPanels.length - 1, 0);
  }

  function getOnboardingStepFieldNames(stepIndex) {
    const stepFields = {
      0: ['goals', 'experienceLevel'],
      1: ['trainingDaysPerWeek', 'sessionDurationMinutes'],
      2: ['equipmentAccess', 'focusAreas', 'preferredStyles'],
    };

    return stepFields[stepIndex] || [];
  }

  function filterErrorsForCurrentStep(errors, stepIndex = onboardingCurrentStep) {
    if (stepIndex >= getOnboardingLastStepIndex()) {
      return errors;
    }

    const allowedFields = new Set(getOnboardingStepFieldNames(stepIndex));
    return Object.fromEntries(Object.entries(errors).filter(([field]) => allowedFields.has(field)));
  }

  function isOnboardingStepValid(stepIndex, payload) {
    const errors = filterErrorsForCurrentStep(validateOnboardingPayload(payload), stepIndex);
    renderOnboardingErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function isOnboardingStepComplete(stepIndex, payload) {
    return Object.keys(filterErrorsForCurrentStep(validateOnboardingPayload(payload), stepIndex)).length === 0;
  }

  function resolveDraftOnboardingStep(payload) {
    for (let index = 0; index < getOnboardingLastStepIndex(); index += 1) {
      if (!isOnboardingStepComplete(index, payload)) {
        return index;
      }
    }

    return getOnboardingLastStepIndex();
  }

  function getChoiceLabel(name, value) {
    const input = document.querySelector(`input[name="${name}"][value="${value}"]`);
    const label = input?.closest('label');
    const strong = label?.querySelector('strong');
    return strong?.textContent?.trim() || value;
  }

  function formatOnboardingReviewValues(name, values) {
    if (Array.isArray(values)) {
      if (values.length === 0) return ['None'];
      return values.map(value => getChoiceLabel(name, value));
    }

    if (!values) return ['Not set'];
    return [getChoiceLabel(name, String(values))];
  }

  function buildOnboardingPayload() {
    return {
      questionnaireVersion:
        selectOnboarding()?.questionnaireVersion ||
        selectMe()?.onboarding?.questionnaireVersion ||
        ONBOARDING_QUESTIONNAIRE_VERSION,
      goals: getCheckedValues('goals'),
      experienceLevel: getRadioValue('experienceLevel'),
      trainingDaysPerWeek: getNumberValue('trainingDaysPerWeek'),
      sessionDurationMinutes: getNumberValue('sessionDurationMinutes'),
      equipmentAccess: getCheckedValues('equipmentAccess'),
      focusAreas: getCheckedValues('focusAreas'),
      limitations: getCheckedValues('limitations'),
      preferredStyles: getCheckedValues('preferredStyles'),
    };
  }

  function renderOnboardingReview(payload = buildOnboardingPayload()) {
    if (!onboardingReview) return;

    const sections = [
      { title: 'Goal', values: formatOnboardingReviewValues('goals', payload.goals) },
      { title: 'Level', values: formatOnboardingReviewValues('experienceLevel', payload.experienceLevel) },
      { title: 'Days', values: formatOnboardingReviewValues('trainingDaysPerWeek', String(payload.trainingDaysPerWeek)) },
      { title: 'Length', values: formatOnboardingReviewValues('sessionDurationMinutes', String(payload.sessionDurationMinutes)) },
      { title: 'Equipment', values: formatOnboardingReviewValues('equipmentAccess', payload.equipmentAccess) },
      { title: 'Focus', values: formatOnboardingReviewValues('focusAreas', payload.focusAreas) },
      { title: 'Avoid', values: formatOnboardingReviewValues('limitations', payload.limitations) },
      { title: 'Style', values: formatOnboardingReviewValues('preferredStyles', payload.preferredStyles) },
    ];

    onboardingReview.innerHTML = '';
    sections.forEach(section => {
      const container = el('section', 'onboarding-review-section');
      container.appendChild(el('div', 'onboarding-review-title', section.title));

      const values = el('div', 'onboarding-review-values');
      section.values.forEach(value => {
        values.appendChild(el('span', 'onboarding-review-pill', value));
      });

      container.appendChild(values);
      onboardingReview.appendChild(container);
    });
  }

  function syncOnboardingStepUI() {
    const lastStep = getOnboardingLastStepIndex();

    onboardingStepPanels.forEach((panel, index) => {
      panel.classList.toggle('hidden', index !== onboardingCurrentStep);
    });

    onboardingStepItems.forEach((item, index) => {
      item.classList.toggle('active', index === onboardingCurrentStep);
      item.classList.toggle('complete', index < onboardingCurrentStep);
    });

    if (onboardingBackButton) {
      onboardingBackButton.classList.toggle('hidden', onboardingCurrentStep === 0);
    }

    if (onboardingNextButton) {
      onboardingNextButton.classList.toggle('hidden', onboardingCurrentStep === lastStep);
      onboardingNextButton.textContent = 'Continue';
    }

    if (onboardingCompleteButton) {
      onboardingCompleteButton.classList.toggle('hidden', onboardingCurrentStep !== lastStep);
    }

    if (onboardingReview) {
      onboardingReview.classList.toggle('hidden', onboardingCurrentStep !== lastStep);
    }

    renderOnboardingReview();
  }

  function goToOnboardingStep(nextStep) {
    onboardingCurrentStep = Math.max(0, Math.min(nextStep, getOnboardingLastStepIndex()));
    setOnboardingSubmitError('');
    renderOnboardingErrors(filterErrorsForCurrentStep(validateOnboardingPayload(buildOnboardingPayload())));
    syncOnboardingStepUI();
    onboardingShell?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function clearOnboardingErrors() {
    document.querySelectorAll('[data-error-for]').forEach(node => {
      node.textContent = '';
    });
  }

  function renderOnboardingErrors(errors) {
    clearOnboardingErrors();
    Object.entries(errors).forEach(([field, message]) => {
      const target = document.querySelector(`[data-error-for="${field}"]`);
      if (target) target.textContent = message;
    });
  }

  function updateOnboardingBadge(onboarding) {
    if (!onboardingStatusBadge) return;

    const status = onboarding?.status || 'not_started';

    if (status === 'draft') {
      onboardingStatusBadge.textContent = 'Draft saved';
      onboardingStatusBadge.classList.remove('hidden');
      return;
    }

    if (status === 'completed') {
      onboardingStatusBadge.textContent = 'Completed';
      onboardingStatusBadge.classList.remove('hidden');
      return;
    }

    onboardingStatusBadge.classList.add('hidden');
  }

  function hydrateOnboardingForm(onboarding) {
    const data = mergeOnboardingData(onboarding?.answers);

    onboardingHydrating = true;
    setCheckedValues('goals', data.goals);
    setRadioValue('experienceLevel', data.experienceLevel);
    setRadioValue('trainingDaysPerWeek', data.trainingDaysPerWeek);
    setRadioValue('sessionDurationMinutes', data.sessionDurationMinutes);
    setCheckedValues('equipmentAccess', data.equipmentAccess);
    setCheckedValues('focusAreas', data.focusAreas);
    setCheckedValues('limitations', data.limitations);
    setCheckedValues('preferredStyles', data.preferredStyles);
    onboardingHydrating = false;

    setOnboarding({
      ...onboarding,
      questionnaireVersion: onboarding?.questionnaireVersion || data.questionnaireVersion,
    });
    onboardingLastSavedSignature = JSON.stringify(buildOnboardingPayload());
    updateOnboardingBadge(selectOnboarding());
    clearOnboardingErrors();
    setOnboardingSubmitError('');
    onboardingCurrentStep = onboarding?.status === 'draft' ? resolveDraftOnboardingStep(data) : 0;
    syncOnboardingStepUI();
    setOnboardingSaveStatus(
      onboarding?.status === 'draft' ? 'Draft restored.' : 'Progress saves automatically.',
      'neutral'
    );
  }

  async function loadOnboardingState() {
    try {
      const onboarding = ensureApiObject(await api.getOnboarding(), 'onboarding');
      if (isCompletedOnboardingState(onboarding)) {
        setOnboarding(onboarding);
        updateOnboardingBadge(onboarding);
        cancelOnboardingDraftSave();
        return { completed: true };
      }

      hydrateOnboardingForm(onboarding);
      return { completed: false };
    } catch (error) {
      if (error instanceof AuthRedirectError) throw error;

      if (isCompletedOnboardingState()) {
        cancelOnboardingDraftSave();
        return { completed: true };
      }

      hydrateOnboardingForm({
        status: 'not_started',
        completed: false,
        questionnaireVersion: ONBOARDING_QUESTIONNAIRE_VERSION,
        answersUpdatedAt: null,
        completedAt: null,
        answers: createDefaultOnboardingData(),
      });
      setOnboardingSaveStatus('Could not load saved progress.', 'error');
      return { completed: false };
    }
  }

  function handleOnboardingChange() {
    if (onboardingHydrating) return;

    if (onboardingSubmitError?.textContent) {
      renderOnboardingErrors(filterErrorsForCurrentStep(validateOnboardingPayload(buildOnboardingPayload())));
    }

    setOnboardingSubmitError('');
    renderOnboardingReview();
    scheduleOnboardingDraftSave();
  }

  function handleOnboardingNextStep() {
    const payload = buildOnboardingPayload();
    if (!isOnboardingStepValid(onboardingCurrentStep, payload)) {
      setOnboardingSubmitError('Finish this step to continue.');
      return;
    }

    setOnboardingSubmitError('');
    goToOnboardingStep(onboardingCurrentStep + 1);
  }

  function scheduleOnboardingDraftSave() {
    if (selectShellMode() !== 'onboarding' || isCompletedOnboardingState()) return;
    cancelOnboardingDraftSave();
    setOnboardingSaveStatus('Saving...', 'pending');

    onboardingDraftTimer = window.setTimeout(async () => {
      if (isCompletedOnboardingState()) {
        setOnboardingSaveStatus('Onboarding is already complete.', 'neutral');
        return;
      }

      const payload = buildOnboardingPayload();
      const signature = JSON.stringify(payload);

      if (signature === onboardingLastSavedSignature) {
        setOnboardingSaveStatus('All changes saved.', 'neutral');
        return;
      }

      try {
        await api.saveOnboardingDraft(payload);
        onboardingLastSavedSignature = signature;
        setOnboarding({
          ...(selectOnboarding() || {}),
          status: 'draft',
          completed: false,
          questionnaireVersion: payload.questionnaireVersion,
          answers: payload,
        });
        updateOnboardingBadge(selectOnboarding());
        setOnboardingSaveStatus('Saved.', 'success');
      } catch (error) {
        if (error instanceof AuthRedirectError) return;
        setOnboardingSaveStatus('Could not save right now.', 'error');
      }
    }, 450);
  }

  async function handleOnboardingSubmit(event) {
    event.preventDefault();
    if (onboardingSubmitting) return;

    if (isCompletedOnboardingState()) {
      cancelOnboardingDraftSave();
      await onCompleted();
      return;
    }

    if (onboardingCurrentStep < getOnboardingLastStepIndex()) {
      handleOnboardingNextStep();
      return;
    }

    cancelOnboardingDraftSave();
    const payload = buildOnboardingPayload();
    const errors = validateOnboardingPayload(payload);

    renderOnboardingErrors(errors);
    if (Object.keys(errors).length > 0) {
      setOnboardingSubmitError('Fill the highlighted fields before building your plan.');
      return;
    }

    onboardingSubmitting = true;
    if (onboardingCompleteButton) onboardingCompleteButton.disabled = true;
    setOnboardingSubmitError('');
    setOnboardingSaveStatus('Building your plan...', 'pending');

    try {
      await api.completeOnboarding(payload);
      onboardingLastSavedSignature = JSON.stringify(payload);
      await onCompleted();
    } catch (error) {
      if (error instanceof AuthRedirectError) return;
      setOnboardingSubmitError(error.message || 'Could not complete onboarding.');
      setOnboardingSaveStatus('We could not build the plan yet.', 'error');
    } finally {
      onboardingSubmitting = false;
      if (onboardingCompleteButton) onboardingCompleteButton.disabled = false;
    }
  }

  async function enter() {
    const shouldProbeCompletedState = isCompletedOnboardingState();
    if (!shouldProbeCompletedState) {
      showShellMode('onboarding');
    }

    const onboardingState = await loadOnboardingState();
    if (onboardingState?.completed) {
      await onCompleted();
      return;
    }

    showShellMode('onboarding');
  }

  return {
    enter,
  };
}
