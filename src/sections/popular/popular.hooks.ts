import { selector } from '@/shared/lib';

export const POPULAR = {
  name: 'popular',
  root: selector.enhance('popular'),
  parts: { heading: 'heading', card: 'card' },
} as const;
