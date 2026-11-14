import { defineScene } from '@/shared/enhance';
import { requirePart } from '@/shared/lib';
import { enter, stagger } from '@/shared/motion';
import { MENU } from './menu.hooks';

/** Menu scene: the heading block, then the browser, fade up as the section arrives. */
export default defineScene({
  id: 'menu',
  selector: MENU.root,
  start: enter.menu,

  build({ fadeUp }, root) {
    fadeUp([requirePart(root, MENU.parts.head), requirePart(root, MENU.parts.browser)], { stagger: stagger.copy });
  },
});
