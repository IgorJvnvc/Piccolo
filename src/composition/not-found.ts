import type { FooterProps } from '@/sections/footer';
import type { NavbarProps } from '@/sections/navbar';
import type { NotFoundProps } from '@/sections/not-found';
import type { Container } from './container';
import { buildHomePage } from './home';

export interface NotFoundPageModel {
  readonly seo: {
    readonly title: string;
    readonly description: string;
    readonly siteName: string;
    /** Never indexed, and no canonical URL: this page stands in for many addresses. */
    readonly noindex: true;
    readonly jsonLd: readonly unknown[];
  };
  readonly navbar: NavbarProps;
  readonly notFound: NotFoundProps;
  readonly footer: FooterProps;
}

/** "#menu" would point at nothing here, so in-page links lead to the matching section of the home page. */
const toHome = (href: string): string => (href.startsWith('#') ? `/${href}` : href);

/**
 * The 404 page: the same header and footer as the home page (with links that work from anywhere), a short message
 * and a way back. Built on the home model so brand, phone, hours and footer stay a single source of truth.
 */
export async function buildNotFoundPage(container: Container, siteUrl: string): Promise<NotFoundPageModel> {
  const [home, copy, site] = await Promise.all([
    buildHomePage(container, siteUrl),
    container.site.copy(),
    container.site.site(),
  ]);

  return {
    seo: {
      title: `${copy.notFound.title} | ${site.name}`,
      description: copy.notFound.text,
      siteName: site.name,
      noindex: true,
      jsonLd: [],
    },
    navbar: { ...home.navbar, links: home.navbar.links.map((link) => ({ ...link, href: toHome(link.href) })) },
    notFound: {
      title: copy.notFound.title,
      text: copy.notFound.text,
      homeLabel: copy.notFound.homeLabel,
      homeHref: '/',
      callLabel: copy.nav.callLabel,
      phone: home.navbar.phone,
      art: home.hero.art.pizza,
    },
    footer: {
      ...home.footer,
      columns: home.footer.columns.map((column) => ({
        ...column,
        links: column.links.map((link) => ({ ...link, href: toHome(link.href) })),
      })),
    },
  };
}
