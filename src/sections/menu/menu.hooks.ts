import { selector } from '@/shared/lib';

export const MENU = {
  name: 'menu',
  root: selector.enhance('menu'),
  parts: { head: 'head', browser: 'browser' },
} as const;
