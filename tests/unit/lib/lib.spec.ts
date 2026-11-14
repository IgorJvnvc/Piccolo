import { describe, expect, it } from 'vitest';
import { cn } from '@/shared/lib/cn';
import { formatMoney, nbsp, telHref } from '@/shared/lib/format';

describe('formatMoney', () => {
  it('formats integer cents with two decimals', () => {
    expect(formatMoney(850, 'EUR')).toBe('€8.50');
    expect(formatMoney(0, 'EUR')).toBe('€0.00');
    expect(formatMoney(1999, 'EUR')).toBe('€19.99');
  });

  it('groups thousands', () => {
    expect(formatMoney(123_456, 'EUR')).toBe('€1,234.56');
  });

  it('honours the currency and locale', () => {
    expect(formatMoney(1250, 'USD', 'en-US')).toBe('$12.50');
  });
});

describe('telHref', () => {
  it('keeps digits and a leading plus only', () => {
    expect(telHref('+00 000 000 0000')).toBe('tel:+000000000000');
    expect(telHref('+1 (555) 123-4567')).toBe('tel:+15551234567');
    expect(telHref('01 234 567')).toBe('tel:01234567');
  });
});

describe('nbsp', () => {
  it('replaces ordinary spaces with non-breaking spaces so the text cannot wrap', () => {
    expect(nbsp('+00 000 000 0000')).toBe('+00\u00a0000\u00a0000\u00a00000');
    expect(nbsp('two words')).not.toContain(' ');
  });

  it('leaves text without spaces alone', () => {
    expect(nbsp('abc')).toBe('abc');
  });

  it('does not change the tel: link built from the same number', () => {
    expect(telHref(nbsp('+00 000 000 0000'))).toBe('tel:+000000000000');
  });
});

describe('cn', () => {
  it('joins truthy class names and skips the rest', () => {
    expect(cn('a', false, null, undefined, 'b', '')).toBe('a b');
    expect(cn()).toBe('');
    expect(cn(false)).toBe('');
  });
});
