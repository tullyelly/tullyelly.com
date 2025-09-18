import { fmtDate, fmtDateTime, fmtRelative } from '@/lib/datetime';

describe('datetime formatters', () => {
  it('returns "Not available" for null-ish inputs', () => {
    expect(fmtDate(null)).toBe('Not available');
    expect(fmtDate(undefined)).toBe('Not available');
    expect(fmtDate('')).toBe('Not available');
  });

  it('formats timestamps in America/Chicago by default', () => {
    expect(fmtDateTime('2025-09-17T12:00:00Z')).toBe('Sep 17, 2025, 07:00 AM');
  });

  it('returns relative time for recent timestamps', () => {
    const now = Date.now();
    const spy = jest.spyOn(Date, 'now').mockReturnValue(now);
    try {
      expect(fmtRelative(now - 60_000)).toBe('1 min ago');
    } finally {
      spy.mockRestore();
    }
  });
});
