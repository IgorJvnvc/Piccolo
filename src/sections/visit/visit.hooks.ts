import { selector } from '@/shared/lib';

export const VISIT = {
  name: 'visit',
  root: selector.enhance('visit'),
  parts: { item: 'item' },
} as const;
