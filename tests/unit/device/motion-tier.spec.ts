// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { applyToDocument, motionTierOf } from '@/shared/device';
import type { Capabilities } from '@/shared/device';

const root = document.documentElement;

afterEach(() => root.removeAttribute('data-motion'));

describe('motionTierOf', () => {
  it.each(['full', 'lite'] as const)('reads the %s tier the document is in, and follows applyToDocument when it changes', (tier) => {
    const caps = { device: 'phone', motion: tier, pointer: 'coarse' } as Capabilities;
    applyToDocument(document, caps);
    expect(motionTierOf(document)).toBe(tier);

    applyToDocument(document, { ...caps, motion: 'static' });

    expect(motionTierOf(document)).toBe('static');
  });

  it('treats a document the bootstrap never touched, or one with an unknown value, as static: nothing may animate without it', () => {
    expect(motionTierOf(document)).toBe('static');

    root.setAttribute('data-motion', 'turbo');

    expect(motionTierOf(document)).toBe('static');
  });
});
