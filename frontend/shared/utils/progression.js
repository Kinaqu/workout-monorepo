export function getLatestProgressionDate(progressionState = {}) {
  return Object.values(progressionState).reduce((latest, state) => {
    if (!state?.last_progression) {
      return latest;
    }

    if (!latest || state.last_progression > latest) {
      return state.last_progression;
    }

    return latest;
  }, '');
}
