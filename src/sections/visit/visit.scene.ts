import { defineScene } from '@/shared/enhance';
import { parts } from '@/shared/lib';
import { enter, stagger } from '@/shared/motion';
import { VISIT } from './visit.hooks';

/** Visit scene: the info card and the map fade up one after the other. */
export default defineScene({
  id: 'visit',
  selector: VISIT.root,
  start: enter.visit,

  build({ fadeUp }, root) {
    fadeUp(parts(root, VISIT.parts.item), { stagger: stagger.copy });
  },
});
