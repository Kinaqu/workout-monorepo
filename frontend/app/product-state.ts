// Imperative snapshot of the product lifecycle, shared by the app shell
// and the feature controllers. This intentionally stays a plain module
// (not React state): consumers only need point-in-time reads right after
// the shell refreshes /me.
import type { MeResponse, OnboardingStateResponse } from '../lib/api/contracts.ts';

export type ShellMode = 'loading' | 'onboarding' | 'recommendation' | 'app';

export type OnboardingSnapshot = Partial<
  Pick<OnboardingStateResponse, 'status' | 'completed' | 'questionnaireVersion'>
> & { answers?: unknown };

let me: MeResponse | null = null;
let onboarding: OnboardingSnapshot | null = null;
let shellMode: ShellMode = 'loading';

export function selectMe(): MeResponse | null {
  return me;
}

export function setMe(next: MeResponse | null): void {
  me = next;
}

export function updateMeLifecycle(patch: Partial<MeResponse['lifecycle']>): void {
  if (!me) return;
  me = { ...me, lifecycle: { ...me.lifecycle, ...patch } };
}

export function selectOnboarding(): OnboardingSnapshot | null {
  return onboarding;
}

export function setOnboarding(next: OnboardingSnapshot | null): void {
  onboarding = next;
}

export function selectShellMode(): ShellMode {
  return shellMode;
}

export function setShellMode(mode: ShellMode): void {
  shellMode = mode;
}

export function hasCompletedOnboarding(): boolean {
  return Boolean(me?.lifecycle?.onboarding_completed);
}

export function hasActiveProgram(): boolean {
  return Boolean(me?.lifecycle?.has_active_program);
}
