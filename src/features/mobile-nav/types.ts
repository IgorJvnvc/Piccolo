import type { NavLink, SocialLink } from '@/entities/site';

export interface MobileNavProps {
  readonly brand: { readonly name: string; readonly tagline: string };
  readonly links: readonly NavLink[];
  readonly phone: { readonly display: string; readonly href: string };
  readonly socials: readonly SocialLink[];
}
