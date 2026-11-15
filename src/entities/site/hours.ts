import { DAY_KEYS, type DayHours, type DayKey, type OpeningHours } from './model';

/** 24h "HH:MM", zero-padded: the one pattern for the parser and for the content schema. */
export const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** "09:30" -> 570. Throws on malformed input (content is validated by its schema first). */
export function parseTime(value: string): number {
  const match = TIME_PATTERN.exec(value);
  if (!match) throw new Error(`Invalid time "${value}", expected HH:MM`);
  return Number(match[1]) * 60 + Number(match[2]);
}

const WEEKDAY_TO_KEY: Readonly<Record<string, DayKey>> = {
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat',
  Sun: 'sun',
};

/** Weekday + minutes-since-midnight of `date` as seen in `timeZone`. */
export function zonedParts(date: Date, timeZone: string): { day: DayKey; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes): string => parts.find((part) => part.type === type)?.value ?? '';
  const day = WEEKDAY_TO_KEY[get('weekday')];
  if (!day) throw new Error(`Unrecognised weekday "${get('weekday')}"`);
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

const previousDay = (day: DayKey): DayKey => DAY_KEYS[(DAY_KEYS.indexOf(day) + 6) % 7] ?? day;

const isOvernight = (hours: DayHours): boolean => parseTime(hours.close) <= parseTime(hours.open);

/** Is the restaurant open at `now`? Handles closing after midnight (spills into the next day). */
export function isOpenNow(hours: OpeningHours, now: Date): boolean {
  const { day, minutes } = zonedParts(now, hours.timezone);

  const today = hours.weekly[day];
  if (today) {
    const open = parseTime(today.open);
    const close = parseTime(today.close);
    if (isOvernight(today) ? minutes >= open : minutes >= open && minutes < close) return true;
  }

  const yesterday = hours.weekly[previousDay(day)];
  if (yesterday && isOvernight(yesterday) && minutes < parseTime(yesterday.close)) return true;

  return false;
}

/** "09:00" -> "9:00 AM" */
export function formatTime12(value: string): string {
  const total = parseTime(value);
  const h24 = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

/** "9:00 AM – 11:00 PM"; open == close is the 24 h encoding. */
export const formatRange = (hours: DayHours): string =>
  hours.open === hours.close ? 'Open 24 hours' : `${formatTime12(hours.open)} – ${formatTime12(hours.close)}`;

const DAY_LABEL: Readonly<Record<DayKey, string>> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

export interface HoursRow {
  /** "Mon – Fri", "Sat", ... */
  readonly days: string;
  /** "9:00 AM – 11:00 PM" or "Closed". */
  readonly time: string;
}

/** Collapses consecutive days with identical hours: Mon–Fri 9–11, Sat 10–12, ... */
export function groupHours(hours: OpeningHours): HoursRow[] {
  const describe = (day: DayKey): string => {
    const value = hours.weekly[day];
    return value ? formatRange(value) : 'Closed';
  };

  const rows: { start: DayKey; end: DayKey; time: string }[] = [];
  for (const day of DAY_KEYS) {
    const time = describe(day);
    const last = rows[rows.length - 1];
    if (last && last.time === time) last.end = day;
    else rows.push({ start: day, end: day, time });
  }

  return rows.map((row) => ({
    days: row.start === row.end ? DAY_LABEL[row.start] : `${DAY_LABEL[row.start]} – ${DAY_LABEL[row.end]}`,
    time: row.time,
  }));
}

/** One-line summary for the footer: "Daily 9:00 AM – 11:00 PM" when every day is identical ("Closed" and "Open 24 hours" stand alone). */
export function summarizeHours(hours: OpeningHours): string {
  const rows = groupHours(hours);
  const only = rows[0];
  if (rows.length === 1 && only) return /^\d/.test(only.time) ? `Daily ${only.time}` : only.time;
  return rows.map((row) => `${row.days} ${row.time}`).join(' · ');
}
