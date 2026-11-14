import type { MenuCategory, MenuItem } from './model';

/** Port: where the menu comes from. Implemented in infrastructure (content collections today, a CMS tomorrow). */
export interface MenuRepository {
  categories(): Promise<readonly MenuCategory[]>;
  items(): Promise<readonly MenuItem[]>;
}
