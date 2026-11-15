import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from '@/shared/seo/jsonld';

describe('serializeJsonLd', () => {
  // It is written into a <script> element with set:html, so this escaping is the only thing between content and script injection.
  it('can never end its script element, and still parses back to the same data', () => {
    const data = { name: '</script><script>alert(1)</script> & "quoted" \u2028 \u2029' };
    const text = serializeJsonLd(data);

    expect(text).not.toMatch(/[<>&\u2028\u2029]/);
    expect(JSON.parse(text)).toEqual(data);
  });
});
