import { renderBones } from 'boneyard-js';
import todayBones from '/bones/today-shell.bones.json';
import historyBones from '/bones/history-shell.bones.json';
import programBones from '/bones/program-shell.bones.json';
import recommendationBones from '/bones/recommendation-shell.bones.json';

const loaderBones = {
  'today-shell': todayBones,
  'history-shell': historyBones,
  'program-shell': programBones,
  'recommendation-shell': recommendationBones,
};

function resolveResponsive(bones, width) {
  if (!bones?.breakpoints) return bones || null;

  const breakpoints = Object.keys(bones.breakpoints)
    .map(Number)
    .sort((left, right) => left - right);

  if (breakpoints.length === 0) {
    return null;
  }

  const match = [...breakpoints].reverse().find(point => width >= point) ?? breakpoints[0];
  return bones.breakpoints[match] ?? null;
}

function getLoaderWidth(element) {
  const rect = element.getBoundingClientRect();
  return Math.max(
    Math.round(rect.width),
    element.clientWidth || 0,
    typeof window !== 'undefined' ? window.innerWidth : 0,
    375
  );
}

export function renderBoneyardLoader(element, explicitName = '') {
  if (!element) return;

  const skeletonName = explicitName || element.dataset.boneyardLoader || '';
  const bones = loaderBones[skeletonName];
  if (!bones) return;

  const activeBones = resolveResponsive(bones, getLoaderWidth(element));
  if (!activeBones) return;

  element.classList.add('app-boneyard-loader');
  element.setAttribute('aria-hidden', 'true');
  element.innerHTML = renderBones(activeBones, 'rgba(52, 92, 160, 0.32)', false);
}

export function primeVisibleBoneyardLoaders(root = document) {
  root.querySelectorAll('[data-boneyard-loader]').forEach(element => {
    if (!(element instanceof HTMLElement)) return;
    if (element.classList.contains('hidden')) return;
    renderBoneyardLoader(element);
  });
}
