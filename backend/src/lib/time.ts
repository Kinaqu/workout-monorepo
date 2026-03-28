export type DayName =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

const DAY_NAMES: DayName[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const ALL_DAY_NAMES = DAY_NAMES.slice(1).concat(DAY_NAMES[0]) as DayName[];

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayDate(): string {
  return nowIso().slice(0, 10);
}

export function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
}

export function getDayName(date: string | Date): DayName {
  const target = typeof date === "string" ? new Date(`${date}T00:00:00.000Z`) : date;
  return DAY_NAMES[target.getUTCDay()];
}

export function daysAgo(days: number): string {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}
