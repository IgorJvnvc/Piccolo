import { selector } from '@/shared/lib';

/** Markup <-> behavior contract for the hero. */
export const HERO = {
  name: 'hero',
  root: selector.enhance('hero'),
} as const;
