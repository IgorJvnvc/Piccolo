import { describe, expect, it } from 'vitest';
import { formatMoney, nbsp, telHref } from '@/shared/lib/format';
import { compactScript } from '@/shared/lib/inline';

describe('formatMoney', () => {
  it('writes whole amounts as printed on a menu: the amount, then the currency code', () => {
    expect(formatMoney(22000, 'RSD')).toBe('220 RSD');
    expect(formatMoney(132000, 'RSD')).toBe('1320 RSD'); // no thousands separator
    expect(formatMoney(0, 'RSD')).toBe('0 RSD');
  });

  it('keeps two decimals when the amount is not whole', () => {
    expect(formatMoney(850, 'EUR')).toBe('8.50 EUR');
    expect(formatMoney(1999, 'EUR')).toBe('19.99 EUR');
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

  it('does not change the tel: link built from the same number', () => {
    expect(telHref(nbsp('+00 000 000 0000'))).toBe('tel:+000000000000');
  });
});

describe('compactScript', () => {
  it('drops block comments, whole-line comments and blank lines, and keeps the code and a // that follows code', () => {
    const source = '/*\n * header\n */\n(function () {\n  // a note\n  var a = 1;\n\n  var url = "http://x"; // trailing\n})();\n';
    expect(compactScript(source)).toBe('(function () {\n  var a = 1;\n  var url = "http://x"; // trailing\n})();');
  });
});