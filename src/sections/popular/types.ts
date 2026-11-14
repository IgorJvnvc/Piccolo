import type { MenuCardModel } from '@/entities/menu';

export interface PopularProps {
  readonly title: string;
  readonly cards: readonly MenuCardModel[];
}
