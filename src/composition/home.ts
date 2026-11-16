import { type MenuCardModel, groupByCategory, popularItems, toCardModel } from '@/entities/menu';
import { groupHours, summarizeHours } from '@/entities/site';
import type { AboutProps } from '@/sections/about';
import type { DockProps } from '@/sections/dock';
import type { FollowLink, FollowProps } from '@/sections/follow';
import type { FooterProps } from '@/sections/footer';
import type { HeroProps } from '@/sections/hero';
import type { IntroProps } from '@/sections/intro';
import type { MenuSectionProps } from '@/sections/menu';
import type { NavbarProps } from '@/sections/navbar';
import type { PopularProps } from '@/sections/popular';
import type { VisitProps } from '@/sections/visit';
import { formatMoney, nbsp, telHref } from '@/shared/lib';
import type { ImageSource } from '@/shared/ui';
import type { Container } from './container';
import { buildRestaurantJsonLd } from './restaurant-jsonld';

export interface HomePageModel {
  readonly seo: {
    readonly title: string;
    readonly description: string;
    readonly canonical: string;
    readonly siteName: string;
    readonly jsonLd: readonly unknown[];
  };
  readonly intro: IntroProps;
  readonly navbar: NavbarProps;
  readonly hero: HeroProps;
  readonly about: AboutProps;
  readonly popular: PopularProps;
  readonly menu: MenuSectionProps;
  readonly follow: FollowProps;
  readonly visit: VisitProps;
  readonly footer: FooterProps;
  readonly dock: DockProps;
}

/**
 * Assembles every section's props from the domain (site, menu), the marketing copy and the image catalog.
 * Sections stay ignorant of where anything comes from; swap an adapter in container.ts and nothing here changes.
 */
export async function buildHomePage(container: Container, siteUrl: string): Promise<HomePageModel> {
  const [site, copy, categories, items] = await Promise.all([
    container.site.site(),
    container.site.copy(),
    container.menu.categories(),
    container.menu.items(),
  ]);

  const image = (key: string): Promise<ImageSource> => container.images.resolve(key);

  // Resolve every distinct menu image once.
  const imageKeys = Array.from(new Set(items.map((item) => item.imageKey)));
  const resolved = new Map(await Promise.all(imageKeys.map(async (key) => [key, await image(key)] as const)));
  const format = (money: { minor: number; currency: string }): string => formatMoney(money.minor, money.currency, site.locale);

  const cardOf = (item: (typeof items)[number]): MenuCardModel => {
    const source = resolved.get(item.imageKey);
    if (!source) throw new Error(`Image "${item.imageKey}" was not resolved`);
    return toCardModel(item, source, format);
  };

  const [slab, pizza, pizzaWhole, hotdog, sandwich, drink, cluster, contour, followArt, map] = await Promise.all([
    image('hero/slab'),
    image('food/pizza'),
    image('food/pizza-whole'),
    image('food/hotdog'),
    image('food/sandwich'),
    image('food/drink'),
    image('about/cluster'),
    image('about/contour'),
    image('follow/art'),
    image('visit/map'),
  ]);

  const phone = { display: nbsp(site.contact.phone), href: telHref(site.contact.phone) };
  const hoursRows = groupHours(site.hours);
  const openLabel = hoursRows.length === 1 && hoursRows[0]?.time !== 'Closed' ? 'Open daily' : 'See opening hours';
  const brand = { name: site.name, tagline: site.tagline };

  const followLinks: FollowLink[] = site.socials.flatMap((social): FollowLink[] => {
    if (social.network === 'whatsapp') return [{ network: 'whatsapp' as const, label: copy.follow.whatsappLabel, href: social.href }];
    if (social.network === 'instagram') return [{ network: 'instagram' as const, label: copy.follow.instagramLabel, href: social.href }];
    return [];
  });

  const whatsapp = site.socials.find((social) => social.network === 'whatsapp');
  const canonical = `${siteUrl}/`;

  return {
    seo: {
      title: copy.seo.title,
      description: copy.seo.description,
      canonical,
      siteName: site.name,
      jsonLd: [buildRestaurantJsonLd(site, canonical, categories, items)],
    },

    intro: { pizza: pizzaWhole },

    navbar: {
      brand,
      links: copy.nav.links,
      phone,
      callLabel: copy.nav.callLabel,
      hours: site.hours,
      openLabel,
      socials: site.socials,
    },

    hero: {
      title: copy.hero.title,
      text: copy.hero.text,
      cta: copy.hero.cta,
      call: { label: copy.nav.callLabel, href: phone.href },
      info: {
        hours: site.hours,
        openLabel,
        address: site.address.lines.join(', '),
        mapUrl: site.address.mapUrl,
        directionsLabel: copy.visit.directionsLabel,
      },
      scrollLabel: copy.hero.scrollLabel,
      scrollHref: '#about',
      art: { slab, pizza, badge: pizzaWhole, hotdog, sandwich, drink },
    },

    about: {
      eyebrow: copy.about.eyebrow,
      title: copy.about.title,
      text: copy.about.text,
      cta: copy.about.cta,
      art: { cluster, contour },
    },

    popular: { title: copy.popular.title, cards: popularItems(items, 3).map(cardOf) },

    menu: {
      title: copy.menu.title,
      intro: copy.menu.intro,
      categories: groupByCategory(categories, items).map((group) => ({
        id: group.category.id,
        title: group.category.title,
        blurb: group.category.blurb,
        cards: group.items.map(cardOf),
      })),
      phone,
    },

    follow: {
      eyebrow: copy.follow.eyebrow,
      title: copy.follow.title,
      phone,
      callLabel: copy.follow.callLabel,
      links: followLinks,
      art: followArt,
    },

    visit: {
      title: copy.visit.title,
      text: copy.visit.text,
      directionsLabel: copy.visit.directionsLabel,
      hoursTitle: copy.visit.hoursTitle,
      callLabel: copy.nav.callLabel,
      address: site.address.lines,
      mapUrl: site.address.mapUrl,
      phone,
      hours: site.hours,
      hoursRows,
      openLabel,
      map,
    },

    footer: {
      brand,
      blurb: copy.footer.blurb,
      columns: [
        ...copy.footer.columns,
        {
          title: 'Contact',
          links: [
            { label: phone.display, href: phone.href },
            ...(whatsapp ? [{ label: 'WhatsApp', href: whatsapp.href, external: true }] : []),
            { label: site.contact.email, href: `mailto:${site.contact.email}` },
          ],
        },
      ],
      address: { title: copy.footer.addressTitle, lines: site.address.lines, hours: summarizeHours(site.hours) },
      socials: site.socials,
      rights: `${new Date().getFullYear()} ${site.name}. ${copy.footer.rights}`,
      backToTop: 'Back to top',
    },

    dock: {
      labels: { group: copy.dock.label, call: copy.dock.call, whatsapp: copy.dock.whatsapp, directions: copy.dock.directions },
      phone,
      ...(whatsapp ? { whatsappHref: whatsapp.href } : {}),
      mapUrl: site.address.mapUrl,
      hours: site.hours,
      openLabel,
    },
  };
}
