import { defineEnhancement } from '@/shared/enhance';
import { parts } from '@/shared/lib';
import { revealOnEnter } from '@/shared/motion';
import { VISIT } from './visit.hooks';

/** Visit scene: the info card and the map fade up one after the other. */
export default defineEnhancement({
  id: 'visit',
  selector: VISIT.root,
  when: 'visible',

  async setup({ root, caps, gsap: loadGsap }) {
    const kit = await loadGsap();
    return revealOnEnter(kit, {
      trigger: root,
      targets: parts(root, VISIT.parts.item),
      tier: caps.motion,
      start: 'top 78%',
      stagger: 0.2,
    });
  },
});
