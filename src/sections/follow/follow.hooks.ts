import { selector } from '@/shared/lib';

export const FOLLOW = {
  name: 'follow',
  root: selector.enhance('follow'),
  parts: { stage: 'stage', bg: 'bg', art: 'art', content: 'content', sparkle: 'sparkle' },
} as const;
