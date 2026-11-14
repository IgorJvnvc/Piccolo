/**
 * Serializes data for a `<script type="application/ld+json">`.
 * Escapes `<`, `>`, `&` and U+2028/2029 so the payload can never terminate the script element.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
