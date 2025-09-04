import { formatReleaseDate } from './formatReleaseDate';

describe('formatReleaseDate', () => {
  it('formats null as semicolon', () => {
    expect(formatReleaseDate(null)).toBe(';');
  });

  it('formats ISO date string as YYYY-MM-DD', () => {
    expect(formatReleaseDate('2024-01-02T00:00:00Z')).toBe('2024-01-02');
  });
});

