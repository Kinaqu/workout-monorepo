import { formatDateLabel, formatLongDateLabel } from './date';

export { formatDateLabel };
export { formatLongDateLabel };

export function humanizeToken(value = ''): string {
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, match => match.toUpperCase());
}

export function formatWorkoutTypeLabel(type: string | null | undefined): string {
  if (!type) return '';
  if (type === 'rest') return 'Rest day';
  if (/^[A-Za-z]$/.test(type)) return `Day ${type.toUpperCase()}`;
  return humanizeToken(type);
}

export function formatPlanSlotLabel(type: string | null | undefined): string {
  if (!type || type === 'rest') return 'Rest';
  if (/^[A-Za-z]$/.test(type)) return `Day ${type.toUpperCase()}`;
  return humanizeToken(type);
}
