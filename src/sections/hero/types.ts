import type { ImageSource } from '@/shared/ui';
import type { NavLink } from '@/entities/site';

export interface HeroArt {
  readonly slab: ImageSource;
  readonly pizza: ImageSource;
  /** The small whole pizza in the headline. */
  readonly badge: ImageSource;
  readonly hotdog: ImageSource;
  readonly sandwich: ImageSource;
  readonly drink: ImageSource;
}

export interface HeroProps {
  readonly title: readonly [string, string];
  readonly text: string;
  readonly cta: NavLink;
  readonly scrollLabel: string;
  /** Where the scroll indicator goes (the section after the hero). */
  readonly scrollHref: string;
  readonly art: HeroArt;
}
