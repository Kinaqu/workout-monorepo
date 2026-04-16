const state = {
  me: null,
  onboarding: null,
  shellMode: 'loading',
};

export function getAppState() {
  return state;
}

export function selectMe() {
  return state.me;
}

export function setMe(me) {
  state.me = me;
  return state.me;
}

export function selectOnboarding() {
  return state.onboarding;
}

export function setOnboarding(onboarding) {
  state.onboarding = onboarding;
  return state.onboarding;
}

export function selectShellMode() {
  return state.shellMode;
}

export function setShellMode(mode) {
  state.shellMode = mode;
  return state.shellMode;
}

export function selectLifecycle() {
  return state.me?.lifecycle ?? {};
}

export function hasCompletedOnboarding() {
  return Boolean(selectLifecycle().onboarding_completed);
}

export function hasActiveProgram() {
  return Boolean(selectLifecycle().has_active_program);
}

export function updateMeLifecycle(patch) {
  state.me = {
    ...state.me,
    lifecycle: {
      ...state.me?.lifecycle,
      ...patch,
    },
  };

  return state.me;
}
