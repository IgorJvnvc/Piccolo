import type { MenuCardModel } from '@/entities/menu';

export interface MenuBrowserCategory {
  readonly id: string;
  readonly title: string;
  readonly blurb: string;
  readonly cards: readonly MenuCardModel[];
}

export interface MenuBrowserProps {
  readonly categories: readonly MenuBrowserCategory[];
  readonly phone: { readonly display: string; readonly href: string };
}
