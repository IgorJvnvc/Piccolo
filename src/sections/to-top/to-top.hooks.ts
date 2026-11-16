import { selector } from '@/shared/lib';

/** Markup <-> behavior contract for the back-to-top button. */
export const TO_TOP = {
  name: 'to-top',
  root: selector.enhance('to-top'),
} as const;