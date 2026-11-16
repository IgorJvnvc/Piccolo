/**
 * Formats an integer amount in minor units for display, the way the printed menu does: the amount, then the code ("220 RSD").
 * Whole amounts have no decimals and no thousands separator; anything else has two decimals ("8.50 EUR").
 */
export function formatMoney(minor: number, currency: string, locale = 'en-IE'): string {
  const whole = minor % 100 === 0;
  const amount = new Intl.NumberFormat(locale, {
    useGrouping: false,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(minor / 100);
  return `${amount} ${currency}`;
}

/** Builds a `tel:` href from a human phone string, e.g. "+00 000 000 0000" -> "tel:+000000000000". */
export function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return `tel:${digits}`;
}

/** Swaps ordinary spaces for non-breaking ones, so a phone number never wraps in the middle. */
export const nbsp = (text: string): string => text.replaceAll(' ', '\u00a0');
