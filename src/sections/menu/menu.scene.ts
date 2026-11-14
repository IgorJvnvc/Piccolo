import { defineEnhancement } from '@/shared/enhance';
import { requirePart } from '@/shared/lib';
import { revealOnEnter } from '@/shared/motion';
import { MENU } from './menu.hooks';

/** Menu scene: the heading block, then the browser, fade up as the section arrives. */
export default defineEnhancement({
  id: 'menu',
  selector: MENU.root,
  when: 'visible',

  async setup({ root, caps, gsap: loadGsap }) {
    const kit = await loadGsap();
    return revealOnEnter(kit, {
      trigger: root,
      targets: [requirePart(root, MENU.parts.head), requirePart(root, MENU.parts.browser)],
      tier: caps.motion,
      start: 'top 78%',
      stagger: 0.2,
    });
  },
});
