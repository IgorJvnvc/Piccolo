// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { markRevealed, openRoot } from '@/shared/motion/revealed';

const html = (strings: TemplateStringsArray): string => strings.join('');

beforeEach(() => {
  document.body.innerHTML = html`
    <section id="scene">
      <h2 data-reveal="up">Title</h2>
      <p data-reveal="up">Copy</p>
      <div data-part="stage" data-state="idle"></div>
      <div data-part="other" data-state="done"></div>
    </section>
    <section id="elsewhere"><p data-reveal="up">Not in the scene</p></section>
  `;
});

describe('markRevealed', () => {
  it('sets data-revealed on every element it is given and leaves the rest alone', () => {
    const [title] = document.querySelectorAll('#scene [data-reveal]');
    markRevealed(title ? [title] : []);

    expect(title?.hasAttribute('data-revealed')).toBe(true);
    expect(document.querySelectorAll('[data-revealed]')).toHaveLength(1);
  });

  it('accepts any iterable, such as a NodeList', () => {
    markRevealed(document.querySelectorAll('#scene [data-reveal]'));
    expect(document.querySelectorAll('#scene [data-revealed]')).toHaveLength(2);
  });
});

describe('openRoot', () => {
  it('reveals everything the reveal protocol hid under the root, and nothing outside it', () => {
    const scene = document.getElementById('scene');
    if (!scene) throw new Error('fixture missing');
    openRoot(scene);

    expect(document.querySelectorAll('#scene [data-reveal]:not([data-revealed])')).toHaveLength(0);
    expect(document.querySelector('#elsewhere [data-reveal]')?.hasAttribute('data-revealed')).toBe(false);
  });

  it('opens idle stages, but leaves other states alone', () => {
    const scene = document.getElementById('scene');
    if (!scene) throw new Error('fixture missing');
    openRoot(scene);

    expect(document.querySelector<HTMLElement>('[data-part="stage"]')?.dataset['state']).toBe('open');
    expect(document.querySelector<HTMLElement>('[data-part="other"]')?.dataset['state']).toBe('done');
  });

  it('is safe to repeat (it is both the final state and the fail-safe)', () => {
    const scene = document.getElementById('scene');
    if (!scene) throw new Error('fixture missing');
    openRoot(scene);
    openRoot(scene);

    expect(document.querySelectorAll('#scene [data-revealed]')).toHaveLength(2);
    expect(document.querySelector<HTMLElement>('[data-part="stage"]')?.dataset['state']).toBe('open');
  });
});
