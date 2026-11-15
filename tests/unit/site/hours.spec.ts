import { describe, expect, it } from 'vitest';
import {
  formatRange,
  formatTime12,
  groupHours,
  isOpenNow,
  openStatus,
  parseTime,
  summarizeHours,
  zonedParts,
} from '@/entities/site/hours';
import type { DayHours, OpeningHours } from '@/entities/site/model';

const week = (hours: DayHours | null): OpeningHours['weekly'] => ({
  mon: hours,
  tue: hours,
  wed: hours,
  thu: hours,
  fri: hours,
  sat: hours,
  sun: hours,
});

const at = (iso: string): Date => new Date(iso);

// 2026-11-09 is a Monday, 2026-11-13 a Friday, 2026-11-14 a Saturday.

describe('parseTime', () => {
  it.each([
    ['00:00', 0],
    ['09:30', 570],
    ['12:00', 720],
    ['23:59', 1439],
  ])('parses %s as %i minutes', (value, minutes) => {
    expect(parseTime(value)).toBe(minutes);
  });

  it.each(['24:00', '9:30', '09:60', '9', 'abc', '', '12:5'])('rejects "%s"', (value) => {
    expect(() => parseTime(value)).toThrow(/Invalid time/);
  });
});

describe('zonedParts', () => {
  it('reads the weekday and minutes in the requested time zone', () => {
    expect(zonedParts(at('2026-11-13T09:30:00Z'), 'UTC')).toEqual({ day: 'fri', minutes: 570 });
    // Tokyo is UTC+9: 23:30 UTC on Friday is 08:30 on Saturday there.
    expect(zonedParts(at('2026-11-13T23:30:00Z'), 'Asia/Tokyo')).toEqual({ day: 'sat', minutes: 510 });
    // New York is UTC-5 in November: 04:00 UTC on Friday is 23:00 on Thursday there.
    expect(zonedParts(at('2026-11-13T04:00:00Z'), 'America/New_York')).toEqual({ day: 'thu', minutes: 1380 });
  });

  it('reports midnight as 0 minutes, not 24 hours', () => {
    expect(zonedParts(at('2026-11-14T00:05:00Z'), 'UTC')).toEqual({ day: 'sat', minutes: 5 });
  });
});

describe('isOpenNow', () => {
  const daily: OpeningHours = { timezone: 'UTC', weekly: week({ open: '09:00', close: '23:00' }) };

  it.each([
    ['2026-11-13T08:59:00Z', false],
    ['2026-11-13T09:00:00Z', true], // opening minute is inclusive
    ['2026-11-13T22:59:00Z', true],
    ['2026-11-13T23:00:00Z', false], // closing minute is exclusive
  ])('regular day, %s -> %s', (iso, expected) => {
    expect(isOpenNow(daily, at(iso))).toBe(expected);
  });

  it('is closed on a day marked null and open on the others', () => {
    const closedMondays: OpeningHours = { ...daily, weekly: { ...daily.weekly, mon: null } };
    expect(isOpenNow(closedMondays, at('2026-11-09T12:00:00Z'))).toBe(false);
    expect(isOpenNow(closedMondays, at('2026-11-10T12:00:00Z'))).toBe(true);
  });

  describe('after midnight', () => {
    // Open only on Friday, 18:00 until 02:00 on Saturday.
    const lateFriday: OpeningHours = { timezone: 'UTC', weekly: { ...week(null), fri: { open: '18:00', close: '02:00' } } };

    it.each([
      ['2026-11-13T17:59:00Z', false],
      ['2026-11-13T18:00:00Z', true],
      ['2026-11-13T23:59:00Z', true],
      ['2026-11-14T00:00:00Z', true], // spills into Saturday
      ['2026-11-14T01:59:00Z', true],
      ['2026-11-14T02:00:00Z', false],
      ['2026-11-14T18:00:00Z', false], // Saturday itself is closed
      ['2026-11-13T01:00:00Z', false], // early Friday belongs to Thursday, which is closed
    ])('%s -> %s', (iso, expected) => {
      expect(isOpenNow(lateFriday, at(iso))).toBe(expected);
    });

    it('treats open == close as open around the clock', () => {
      const allDay: OpeningHours = { timezone: 'UTC', weekly: week({ open: '00:00', close: '00:00' }) };
      for (const iso of ['2026-11-13T00:00:00Z', '2026-11-13T12:34:00Z', '2026-11-13T23:59:00Z']) {
        expect(isOpenNow(allDay, at(iso))).toBe(true);
      }
    });
  });

  describe('time zones', () => {
    it('evaluates hours in the restaurant time zone, not the visitor one', () => {
      // 00:30 UTC is 09:30 in Tokyo (open) but would be closed if read as UTC.
      const tokyo: OpeningHours = { ...daily, timezone: 'Asia/Tokyo' };
      expect(isOpenNow(tokyo, at('2026-11-13T00:30:00Z'))).toBe(true);
      expect(isOpenNow(daily, at('2026-11-13T00:30:00Z'))).toBe(false);
    });

    it('applies the standard-time offset in November (New York is UTC-5)', () => {
      const newYork: OpeningHours = { ...daily, timezone: 'America/New_York' };
      expect(isOpenNow(newYork, at('2026-11-13T23:30:00Z'))).toBe(true); // 18:30 local
      expect(isOpenNow(newYork, at('2026-11-13T04:00:00Z'))).toBe(false); // 23:00 local the day before
    });
  });
});

describe('openStatus', () => {
  const daily: OpeningHours = { timezone: 'UTC', weekly: week({ open: '09:00', close: '23:00' }) };
  const lateFriday: OpeningHours = { timezone: 'UTC', weekly: { ...week(null), fri: { open: '18:00', close: '02:00' } } };

  it.each([
    ['open: says when it closes', daily, '2026-11-13T12:00:00Z', { open: true, detail: 'until 11:00 PM' }],
    ['before opening: opens today', daily, '2026-11-13T07:00:00Z', { open: false, detail: 'opens 9:00 AM' }],
    ['after closing: opens tomorrow', daily, '2026-11-13T23:30:00Z', { open: false, detail: 'opens tomorrow 9:00 AM' }],
    ['past midnight: closes after the spill', lateFriday, '2026-11-14T01:00:00Z', { open: true, detail: 'until 2:00 AM' }],
    ['days away: names the day', lateFriday, '2026-11-14T12:00:00Z', { open: false, detail: 'opens Fri 6:00 PM' }],
  ] as const)('%s', (_name, hours, iso, expected) => {
    expect(openStatus(hours, at(iso))).toEqual(expected);
  });

  it('has nothing to add when it is always open or never open', () => {
    expect(openStatus({ timezone: 'UTC', weekly: week({ open: '00:00', close: '00:00' }) }, at('2026-11-13T12:00:00Z'))).toEqual({ open: true, detail: '' });
    expect(openStatus({ timezone: 'UTC', weekly: week(null) }, at('2026-11-13T12:00:00Z'))).toEqual({ open: false, detail: '' });
  });
});
describe('formatTime12', () => {
  it.each([
    ['00:00', '12:00 AM'],
    ['00:30', '12:30 AM'],
    ['09:05', '9:05 AM'],
    ['12:00', '12:00 PM'],
    ['13:15', '1:15 PM'],
    ['23:59', '11:59 PM'],
  ])('%s -> %s', (value, expected) => {
    expect(formatTime12(value)).toBe(expected);
  });
});

describe('formatRange', () => {
  it('joins both times with an en dash', () => {
    expect(formatRange({ open: '09:00', close: '23:00' })).toBe('9:00 AM – 11:00 PM');
  });

  it('says so when open == close (the 24 h encoding)', () => {
    expect(formatRange({ open: '00:00', close: '00:00' })).toBe('Open 24 hours');
  });
});

describe('groupHours / summarizeHours', () => {
  const weekdays: DayHours = { open: '09:00', close: '23:00' };
  const mixed: OpeningHours = {
    timezone: 'UTC',
    weekly: { mon: weekdays, tue: weekdays, wed: weekdays, thu: weekdays, fri: weekdays, sat: { open: '10:00', close: '00:00' }, sun: null },
  };

  it('collapses consecutive days with identical hours', () => {
    expect(groupHours(mixed)).toEqual([
      { days: 'Mon – Fri', time: '9:00 AM – 11:00 PM' },
      { days: 'Sat', time: '10:00 AM – 12:00 AM' },
      { days: 'Sun', time: 'Closed' },
    ]);
  });

  it('does not merge identical days that are not adjacent', () => {
    const gap: OpeningHours = { timezone: 'UTC', weekly: { ...week(weekdays), tue: null } };
    const rows = groupHours(gap);
    expect(rows.map((row) => row.days)).toEqual(['Mon', 'Tue', 'Wed – Sun']);
  });

  it('summarises identical days as "Daily"', () => {
    expect(summarizeHours({ timezone: 'UTC', weekly: week(weekdays) })).toBe('Daily 9:00 AM – 11:00 PM');
  });

  it('lets "Closed" and "Open 24 hours" stand alone when every day is the same', () => {
    expect(summarizeHours({ timezone: 'UTC', weekly: week(null) })).toBe('Closed');
    expect(summarizeHours({ timezone: 'UTC', weekly: week({ open: '00:00', close: '00:00' }) })).toBe('Open 24 hours');
  });

  it('lists every group when the days differ', () => {
    expect(summarizeHours(mixed)).toBe('Mon – Fri 9:00 AM – 11:00 PM · Sat 10:00 AM – 12:00 AM · Sun Closed');
  });
});
