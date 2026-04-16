import { api } from '/lib/api/index.js';
import {
  hasActiveProgram,
  hasCompletedOnboarding,
  selectLifecycle,
  setMe,
} from '/store/app-store.js';
import { ensureApiObject } from '/shared/utils/guards.js';

export function createProfileFeature() {
  async function loadProductState() {
    const me = ensureApiObject(await api.getMe(), 'product state');
    setMe(me);
    return me;
  }

  return {
    getLifecycle: selectLifecycle,
    hasActiveProgram,
    hasCompletedOnboarding,
    loadProductState,
  };
}
