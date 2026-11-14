import type { ImageSource } from '@/shared/ui';

export interface NotFoundProps {
  readonly title: string;
  readonly text: string;
  readonly homeLabel: string;
  readonly homeHref: string;
  readonly callLabel: string;
  readonly phone: { readonly display: string; readonly href: string };
  readonly art: ImageSource;
}
