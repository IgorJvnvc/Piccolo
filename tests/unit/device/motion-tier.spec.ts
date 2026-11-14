// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { applyToDocument, motionTierOf } from '@/shared/device';
import type { Capabilities } from '@/shared/device';

const root = document.documentElement;

afterEach(() => root.removeAttribute('data-motion'));

describe('motionTierOf', () => {
  it.each(['full', 'lite', 'static'] as const)('reads the %s tier the document is in', (tier) => {
    root.setAttribute('data-motion', tier);

    expect(motionTierOf(document)).toBe(tier);
  });

  it('follows applyToDocument, so a capability change reaches animations that start afterwards', () => {
    const caps = { device: 'phone', motion: 'lite', pointer: 'coarse' } as Capabilities;
    applyToDocument(document, caps);
    expect(motionTierOf(document)).toBe('lite');

    applyToDocument(document, { ...caps, motion: 'static' });

    expect(motionTierOf(document)).toBe('static');
  });

  it('treats a document the bootstrap never touched as static: nothing may animate without it', () => {
    expect(motionTierOf(document)).toBe('static');
  });

  it('treats an unknown value as static', () => {
    root.setAttribute('data-motion', 'turbo');

    expect(motionTierOf(document)).toBe('static');
  });
});
