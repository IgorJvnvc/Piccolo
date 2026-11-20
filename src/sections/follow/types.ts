import type { ImageSource } from '@/shared/ui';

export interface FollowLink {
  readonly network: 'whatsapp' | 'instagram' | 'facebook';
  readonly label: string;
  readonly href: string;
}

export interface FollowProps {
  readonly eyebrow: string;
  readonly title: readonly [string, string];
  readonly phone: { readonly display: string; readonly href: string };
  readonly callLabel: string;
  readonly links: readonly FollowLink[];
  readonly art: ImageSource;
}
