import { selector } from '@/shared/lib';

export const HERO = {
  name: 'hero',
  root: selector.enhance('hero'),
} as const;
