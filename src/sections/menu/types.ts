import type { MenuBrowserCategory } from '@/features/menu-browser';

export type MenuCategoryModel = MenuBrowserCategory;

export interface MenuSectionProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly intro: string;
  readonly categories: readonly MenuCategoryModel[];
  readonly phone: { readonly display: string; readonly href: string };
}
