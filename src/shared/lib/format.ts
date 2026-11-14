/** Formats an integer amount in minor units (cents) for display. */
export function formatMoney(minor: number, currency: string, locale = 'en-IE'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

/** Builds a `tel:` href from a human phone string, e.g. "+00 000 000 0000" -> "tel:+000000000000". */
export function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return `tel:${digits}`;
}

/** Swaps ordinary spaces for non-breaking ones, so a phone number never wraps in the middle. */
export const nbsp = (text: string): string => text.replaceAll(' ', '\u00a0');
