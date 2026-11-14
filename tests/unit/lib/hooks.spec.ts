// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { ENHANCE_ATTR, PART_ATTR, enhanceAttr, partAttr, parts, requirePart, selector } from '@/shared/lib/hooks';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('markup <-> behavior contract', () => {
  it('builds attribute bags for markup', () => {
    expect(enhanceAttr('hero')).toEqual({ [ENHANCE_ATTR]: 'hero' });
    expect(partAttr('card')).toEqual({ [PART_ATTR]: 'card' });
    expect(ENHANCE_ATTR).toBe('data-enhance');
    expect(PART_ATTR).toBe('data-part');
  });

  it('builds selectors that match what the attribute bags produce', () => {
    expect(selector.enhance('hero')).toBe('[data-enhance="hero"]');
    expect(selector.part('card')).toBe('[data-part="card"]');

    document.body.innerHTML = '<section data-enhance="hero"><p data-part="card"></p></section>';
    expect(document.querySelectorAll(selector.enhance('hero'))).toHaveLength(1);
    expect(document.querySelectorAll(selector.part('card'))).toHaveLength(1);
  });

  it('requirePart returns the part, scoped to its root', () => {
    document.body.innerHTML = `
      <section id="a" data-enhance="x"><b data-part="title">A</b></section>
      <section id="b" data-enhance="x"><b data-part="title">B</b></section>`;
    const second = document.getElementById('b');
    if (!second) throw new Error('fixture missing');

    expect(requirePart(second, 'title').textContent).toBe('B');
  });

  it('requirePart fails loudly with the part name when markup is missing it', () => {
    document.body.innerHTML = '<section data-enhance="x"></section>';
    const root = document.querySelector('section');
    if (!root) throw new Error('fixture missing');

    expect(() => requirePart(root, 'title')).toThrow('Missing required part "title"');
  });

  it('parts returns every match in document order, or an empty array', () => {
    document.body.innerHTML = '<ul><li data-part="card">1</li><li data-part="card">2</li></ul>';
    const list = document.querySelector('ul');
    if (!list) throw new Error('fixture missing');

    expect(parts(list, 'card').map((el) => el.textContent)).toEqual(['1', '2']);
    expect(parts(list, 'nothing')).toEqual([]);
  });
});
