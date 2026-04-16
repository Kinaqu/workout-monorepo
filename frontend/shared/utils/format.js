import { formatDateLabel, formatLongDateLabel } from '/shared/utils/date.js';

export { formatDateLabel };
export { formatLongDateLabel };

export function humanizeToken(value = '') {
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, match => match.toUpperCase());
}

export function formatWorkoutTypeLabel(type) {
  if (!type) return '';
  if (type === 'rest') return 'Rest day';
  if (/^[A-Za-z]$/.test(type)) return `Day ${type.toUpperCase()}`;
  return humanizeToken(type);
}

export function formatPlanSlotLabel(type) {
  if (!type || type === 'rest') return 'Rest';
  if (/^[A-Za-z]$/.test(type)) return `Day ${type.toUpperCase()}`;
  return humanizeToken(type);
}
