import { selector } from '@/shared/lib';

/** Markup <-> behavior contract for the navbar. */
export const NAVBAR = {
  name: 'navbar',
  root: selector.enhance('navbar'),
} as const;
