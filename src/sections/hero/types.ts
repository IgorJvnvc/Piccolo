import type { ImageSource } from '@/shared/ui';
import type { NavLink, OpeningHours } from '@/entities/site';

export interface HeroArt {
  readonly slab: ImageSource;
  readonly pizza: ImageSource;
  /** The small whole pizza in the headline. */
  readonly badge: ImageSource;
  readonly hotdog: ImageSource;
  readonly sandwich: ImageSource;
  readonly drink: ImageSource;
  /** A plume of steam rising from the hot food. */
  readonly steam: ImageSource;
}

export interface HeroProps {
  readonly title: readonly [string, string];
  readonly text: string;
  readonly cta: NavLink;
  /** The quieter second action beside the primary one. Desktop only: a phone has the dock. */
  readonly call: NavLink;
  /** The row of hard facts along the bottom of the first screen. Desktop only: a phone has the dock. */
  readonly info: {
    readonly hours: OpeningHours;
    /** Server-rendered text of the "open now" chip until the behavior replaces it. */
    readonly openLabel: string;
    readonly address: string;
    readonly mapUrl: string;
    readonly directionsLabel: string;
  };
  readonly scrollLabel: string;
  /** Where the scroll indicator goes (the section after the hero). */
  readonly scrollHref: string;
  readonly art: HeroArt;
}
