export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type DayKey = (typeof DAY_KEYS)[number];

/** 24h "HH:MM". If `close` <= `open` the shop closes after midnight (next day). */
export interface DayHours {
  readonly open: string;
  readonly close: string;
}

export interface OpeningHours {
  /** IANA time zone of the restaurant, e.g. "Europe/Berlin". */
  readonly timezone: string;
  /** `null` = closed that day. */
  readonly weekly: Readonly<Record<DayKey, DayHours | null>>;
}

export const SOCIAL_NETWORKS = ['instagram', 'facebook', 'tiktok', 'whatsapp'] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export interface SocialLink {
  readonly network: SocialNetwork;
  readonly label: string;
  readonly href: string;
}

export interface SiteInfo {
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
  readonly locale: string;
  /** ISO 4217, used for every price on the site. */
  readonly currency: string;
  readonly contact: {
    /** Human readable, e.g. "+00 000 000 0000". */
    readonly phone: string;
    readonly email: string;
  };
  readonly address: {
    readonly lines: readonly string[];
    /** Link opened by "Get directions". */
    readonly mapUrl: string;
  };
  readonly hours: OpeningHours;
  readonly socials: readonly SocialLink[];
}

export interface NavLink {
  readonly label: string;
  readonly href: string;
}

export interface FooterColumn {
  readonly title: string;
  readonly links: readonly NavLink[];
}

/** All marketing copy of the home page. Edit src/content/home.json, not the components. */
export interface HomeCopy {
  readonly seo: { readonly title: string; readonly description: string };
  readonly nav: { readonly links: readonly NavLink[]; readonly callLabel: string; readonly toTopLabel: string };
  readonly dock: { readonly label: string; readonly call: string; readonly whatsapp: string; readonly directions: string };
  readonly hero: {
    readonly title: readonly [string, string];
    readonly text: string;
    readonly cta: NavLink;
    readonly scrollLabel: string;
  };
  readonly about: {
    readonly eyebrow: string;
    readonly title: readonly [string, string];
    readonly text: string;
    readonly cta: NavLink;
  };
  readonly popular: { readonly title: string };
  readonly menu: { readonly title: string; readonly intro: string };
  readonly follow: {
    readonly eyebrow: string;
    readonly title: readonly [string, string];
    readonly callLabel: string;
    readonly whatsappLabel: string;
    readonly instagramLabel: string;
  };
  readonly visit: {
    readonly title: string;
    readonly text: string;
    readonly directionsLabel: string;
    readonly hoursTitle: string;
  };
  readonly notFound: {
    readonly title: string;
    readonly text: string;
    readonly homeLabel: string;
  };
  readonly footer: {
    readonly blurb: string;
    readonly columns: readonly FooterColumn[];
    readonly addressTitle: string;
    readonly rights: string;
  };
}
