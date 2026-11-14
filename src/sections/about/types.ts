import type { NavLink } from '@/entities/site';
import type { ImageSource } from '@/shared/ui';

export interface AboutProps {
  readonly eyebrow: string;
  readonly title: readonly [string, string];
  readonly text: string;
  readonly cta: NavLink;
  readonly art: { readonly cluster: ImageSource; readonly contour: ImageSource };
}
