import { UserSettings } from '../types';

export const HOUR = 3600_000;
export const MIN = 60_000;
export const DEFAULT_TIME_ZONE = 'America/New_York';

/**
 * Returns YYYY-MM-DD local date key for a given epoch ms in the specified time zone
 */
export function localDateKey(
  ms: number = Date.now(),
  zone: string = DEFAULT_TIME_ZONE
): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date(ms));
  } catch {
    // Fallback if invalid timezone
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

interface ZonedTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function getZonedParts(ms: number, zone: string): ZonedTimeParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date(ms));
  let year = 1970,
    month = 1,
    day = 1,
    hour = 0,
    minute = 0,
    second = 0;
  for (const p of parts) {
    if (p.type === 'year') year = Number(p.value);
    else if (p.type === 'month') month = Number(p.value);
    else if (p.type === 'day') day = Number(p.value);
    else if (p.type === 'hour') {
      const h = Number(p.value);
      hour = h === 24 ? 0 : h;
    } else if (p.type === 'minute') minute = Number(p.value);
    else if (p.type === 'second') second = Number(p.value);
  }
  return { year, month, day, hour, minute, second };
}

/**
 * Finds the exact epoch ms of midnight (00:00:00) for a given YYYY-MM-DD in a timezone
 */
export function getMidnightMs(key: string, zone: string = DEFAULT_TIME_ZONE): number {
  const [targetYear, targetMonth, targetDay] = key.split('-').map(Number);
  // Start estimate at noon UTC of that date
  let candidate = Date.UTC(targetYear, targetMonth - 1, targetDay, 12, 0, 0);

  for (let i = 0; i < 4; i++) {
    const zoned = getZonedParts(candidate, zone);
    const dayDiff =
      (Date.UTC(targetYear, targetMonth - 1, targetDay) -
        Date.UTC(zoned.year, zoned.month - 1, zoned.day)) /
      86400000;
    const secDiff =
      dayDiff * 86400 - (zoned.hour * 3600 + zoned.minute * 60 + zoned.second);

    if (secDiff === 0) break;
    candidate += secDiff * 1000;
  }

  // Ensure candidate is the start of the day:
  // If candidate - 1000 is still on target day (e.g. DST jump at midnight), walk back
  while (localDateKey(candidate - 60000, zone) === key) {
    candidate -= 60000;
  }
  while (localDateKey(candidate - 1000, zone) === key) {
    candidate -= 1000;
  }

  return candidate;
}

/**
 * Local-midnight bounds (epoch ms) for a "YYYY-MM-DD" key in a timezone
 */
export function dayBounds(
  key: string,
  zone: string = DEFAULT_TIME_ZONE
): { startMs: number; endMs: number } {
  const startMs = getMidnightMs(key, zone);
  const nextKey = shiftDateKey(key, 1);
  const endMs = getMidnightMs(nextKey, zone);
  return { startMs, endMs };
}

export function fmt(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h > 0) {
    return m > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h`;
  }
  return `${m}m`;
}

export function fmtClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

/**
 * Formats time according to user's timezone and 12h/24h hour format
 * e.g., "7:42 pm" or "19:42"
 */
export function formatClock(
  ms: number,
  settings: { timeZone?: string; hourFormat?: 12 | 24 } | UserSettings = {}
): string {
  const zone = settings.timeZone || DEFAULT_TIME_ZONE;
  const is24Hour = settings.hourFormat === 24;

  try {
    if (is24Hour) {
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: zone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      return formatter.format(new Date(ms));
    } else {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return formatter.format(new Date(ms)).toLowerCase();
    }
  } catch {
    const d = new Date(ms);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}

export function hhmm(ms: number, zone: string = DEFAULT_TIME_ZONE): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(new Date(ms));
  } catch {
    const d = new Date(ms);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}

export function fmtTime12(ms: number, zone: string = DEFAULT_TIME_ZONE): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return formatter.format(new Date(ms)).toLowerCase();
  } catch {
    const d = new Date(ms);
    const h = d.getHours() % 12 || 12;
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = d.getHours() >= 12 ? 'pm' : 'am';
    return `${h}:${m} ${ampm}`;
  }
}

export function fmtTime24(ms: number, zone: string = DEFAULT_TIME_ZONE): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(new Date(ms));
  } catch {
    const d = new Date(ms);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}

export function formatDateNice(
  key: string,
  zone: string = DEFAULT_TIME_ZONE
): string {
  const [y, m, d] = key.split('-').map(Number);
  const now = Date.now();
  const todayKey = localDateKey(now, zone);
  const yesterdayKey = shiftDateKey(todayKey, -1);
  const tomorrowKey = shiftDateKey(todayKey, 1);

  if (key === todayKey) return 'Today';
  if (key === yesterdayKey) return 'Yesterday';
  if (key === tomorrowKey) return 'Tomorrow';

  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return date.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export interface FormattedDateDetails {
  weekday: string;
  fullDate: string;
  shortDate: string;
  year: number;
  monthName: string;
  dayNum: number;
  isToday: boolean;
  isYesterday: boolean;
  isTomorrow: boolean;
  relativeLabel: string;
  isoDate: string;
}

export function formatDateDetails(
  key: string,
  zone: string = DEFAULT_TIME_ZONE
): FormattedDateDetails {
  const [y, m, d] = key.split('-').map(Number);
  const now = Date.now();
  const todayKey = localDateKey(now, zone);
  const yesterdayKey = shiftDateKey(todayKey, -1);
  const tomorrowKey = shiftDateKey(todayKey, 1);

  const isToday = key === todayKey;
  const isYesterday = key === yesterdayKey;
  const isTomorrow = key === tomorrowKey;

  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  let weekday = 'Today';
  let fullDate = `${d} ${m}`;
  let shortDate = `${m}/${d}`;
  let monthName = '';

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).formatToParts(date);

    weekday = parts.find((p) => p.type === 'weekday')?.value || 'Day';
    const dayVal = parts.find((p) => p.type === 'day')?.value || String(d);
    monthName = parts.find((p) => p.type === 'month')?.value || '';
    fullDate = `${dayVal} ${monthName}`;
    shortDate = `${monthName.slice(0, 3)} ${dayVal}`;
  } catch {
    weekday = date.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long' });
    monthName = date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long' });
    fullDate = `${d} ${monthName}`;
    shortDate = `${monthName.slice(0, 3)} ${d}`;
  }

  let relativeLabel = weekday;
  if (isToday) relativeLabel = 'Today';
  else if (isYesterday) relativeLabel = 'Yesterday';
  else if (isTomorrow) relativeLabel = 'Tomorrow';

  return {
    weekday,
    fullDate,
    shortDate,
    year: y,
    monthName,
    dayNum: d,
    isToday,
    isYesterday,
    isTomorrow,
    relativeLabel,
    isoDate: key,
  };
}

export function shiftDateKey(key: string, daysDelta: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + daysDelta, 12, 0, 0));
  const resY = date.getUTCFullYear();
  const resM = String(date.getUTCMonth() + 1).padStart(2, '0');
  const resD = String(date.getUTCDate()).padStart(2, '0');
  return `${resY}-${resM}-${resD}`;
}

/**
 * Returns the Monday (or Sunday) start of the week key for a given date key in a timezone
 */
export function startOfWeek(
  keyOrMs: string | number,
  zone: string = DEFAULT_TIME_ZONE
): string {
  const key = typeof keyOrMs === 'number' ? localDateKey(keyOrMs, zone) : keyOrMs;
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dayOfWeek = date.getUTCDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return shiftDateKey(key, diffToMonday);
}
