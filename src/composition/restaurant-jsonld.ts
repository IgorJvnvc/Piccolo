import type { MenuCategory, MenuItem } from '@/entities/menu';
import { DAY_KEYS, type DayKey, type SiteInfo } from '@/entities/site';

const SCHEMA_DAY: Readonly<Record<DayKey, string>> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

const amount = (minor: number): string => (minor / 100).toFixed(2);

/**
 * schema.org FastFoodRestaurant (+ Menu) for rich results.
 * Lives in composition because it orchestrates two entities (site + menu), which must not know each other.
 */
export function buildRestaurantJsonLd(
  site: SiteInfo,
  url: string,
  categories: readonly MenuCategory[],
  items: readonly MenuItem[],
): Record<string, unknown> {
  const openingHoursSpecification = DAY_KEYS.flatMap((day) => {
    const hours = site.hours.weekly[day];
    if (!hours) return [];
    // schema.org reads opens == closes as "closed all day", so the 24 h encoding (open == close) ends at 23:59.
    const closes = hours.open === hours.close ? '23:59' : hours.close;
    return [{ '@type': 'OpeningHoursSpecification', dayOfWeek: SCHEMA_DAY[day], opens: hours.open, closes }];
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'FastFoodRestaurant',
    name: site.name,
    description: site.description,
    url,
    telephone: site.contact.phone,
    ...(site.contact.email ? { email: site.contact.email } : {}),
    servesCuisine: categories.map((category) => category.title),
    address: { '@type': 'PostalAddress', streetAddress: site.address.lines.join(', ') },
    openingHoursSpecification,
    sameAs: site.socials.filter((social) => social.network !== 'whatsapp').map((social) => social.href),
    hasMenu: {
      '@type': 'Menu',
      hasMenuSection: categories.map((category) => ({
        '@type': 'MenuSection',
        name: category.title,
        hasMenuItem: items
          .filter((item) => item.categoryId === category.id)
          .map((item) => ({
            '@type': 'MenuItem',
            name: item.name,
            ...(item.description ? { description: item.description } : {}),
            offers: { '@type': 'Offer', price: amount(item.price.minor), priceCurrency: item.price.currency },
          })),
      })),
    },
  };
}
