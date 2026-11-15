import type { NavLink, OpeningHours, SocialLink } from '@/entities/site';

export interface NavbarProps {
  readonly brand: { readonly name: string; readonly tagline: string };
  /** Where the wordmark leads. Default: the top of this page (the 404 page sends it to the home page). */
  readonly homeHref?: string;
  readonly links: readonly NavLink[];
  readonly phone: { readonly display: string; readonly href: string };
  readonly callLabel: string;
  readonly hours: OpeningHours;
  /** Server-rendered default text of the "open now" chip (the client refines it). */
  readonly openLabel: string;
  readonly socials: readonly SocialLink[];
}
