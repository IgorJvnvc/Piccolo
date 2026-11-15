import type { NavLink, SocialLink } from '@/entities/site';

export interface FooterColumnModel {
  readonly title: string;
  readonly links: readonly (NavLink & { readonly external?: boolean })[];
}

export interface FooterProps {
  readonly brand: { readonly name: string; readonly tagline: string };
  /** Where the wordmark leads. Default: the top of this page (the 404 page sends it to the home page). */
  readonly homeHref?: string;
  readonly blurb: string;
  readonly columns: readonly FooterColumnModel[];
  readonly address: {
    readonly title: string;
    readonly lines: readonly string[];
    readonly hours: string;
  };
  readonly socials: readonly SocialLink[];
  readonly rights: string;
  readonly backToTop: string;
}
