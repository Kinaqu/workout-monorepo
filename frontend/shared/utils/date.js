export function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

export function shiftDateString(value, dayOffset) {
  if (!value) {
    return getTodayDateString();
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return getTodayDateString();
  }

  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().split('T')[0];
}

export function formatDateLabel(value) {
  if (!value) return '';

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatLongDateLabel(value) {
  if (!value) return '';

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
