import { selector } from '@/shared/lib';

export const ABOUT = {
  name: 'about',
  root: selector.enhance('about'),
  parts: { cluster: 'cluster', item: 'item' },
} as const;
