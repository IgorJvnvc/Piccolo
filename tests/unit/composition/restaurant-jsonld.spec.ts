import { describe, expect, it } from 'vitest';
import { buildRestaurantJsonLd } from '@/composition/restaurant-jsonld';
import { type MenuCategory, type MenuItem } from '@/entities/menu/model';
import type { SiteInfo } from '@/entities/site/model';

const site: SiteInfo = {
  name: 'Piccolo',
  tagline: 'Pizza · Hot dogs · Drinks',
  description: 'Stone-baked pizza, hot dogs and drinks.',
  locale: 'en-IE',
  currency: 'EUR',
  contact: { phone: '+00 000 000 0000', email: 'hello@example.com' },
  address: { lines: ['1 Example Street', 'Dublin'], mapUrl: 'https://maps.example.com/piccolo' },
  hours: {
    timezone: 'Europe/Dublin',
    weekly: {
      mon: null,
      tue: { open: '12:00', close: '22:00' },
      wed: { open: '12:00', close: '22:00' },
      thu: { open: '12:00', close: '22:00' },
      fri: { open: '12:00', close: '23:30' },
      sat: { open: '12:00', close: '23:30' },
      sun: { open: '13:00', close: '21:00' },
    },
  },
  socials: [
    { network: 'instagram', label: 'Instagram', href: 'https://instagram.com/piccolo' },
    { network: 'whatsapp', label: 'WhatsApp', href: 'https://wa.me/000' },
    { network: 'facebook', label: 'Facebook', href: 'https://facebook.com/piccolo' },
  ],
};

const categories: MenuCategory[] = [
  { id: 'pizza', title: 'Pizza', blurb: 'Stone-baked.', order: 1 },
  { id: 'drinks', title: 'Drinks', blurb: 'Cold.', order: 2 },
];

const item = (id: string, category: string, minor: number): MenuItem => ({
  id,
  categoryId: category,
  name: id,
  description: `About ${id}`,
  price: { minor, currency: 'EUR' },
  sizes: [],
  addons: [],
  imageKey: 'menu/pizza-slice',
  allergens: [],
  tags: [],
  popular: false,
  order: 0,
});

const items = [item('margherita', 'pizza', 850), item('pepperoni', 'pizza', 1000), item('cola', 'drinks', 300)];

const build = () => buildRestaurantJsonLd(site, 'https://piccolo.example/', categories, items);

describe('buildRestaurantJsonLd', () => {
  it('describes the business for schema.org consumers', () => {
    expect(build()).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'FastFoodRestaurant',
      name: 'Piccolo',
      url: 'https://piccolo.example/',
      telephone: '+00 000 000 0000',
      email: 'hello@example.com',
      servesCuisine: ['Pizza', 'Drinks'],
      address: { '@type': 'PostalAddress', streetAddress: '1 Example Street, Dublin' },
    });
  });

  it('leaves the email out when the business has none', () => {
    const noEmail = { ...site, contact: { phone: site.contact.phone } };

    expect(buildRestaurantJsonLd(noEmail, 'https://piccolo.example/', categories, items)).not.toHaveProperty('email');
  });

  it('lists opening hours for open days only', () => {
    const specification = build()['openingHoursSpecification'] as Array<Record<string, unknown>>;

    expect(specification.map((entry) => entry['dayOfWeek'])).toEqual([
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]);
    expect(specification[3]).toEqual({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Friday',
      opens: '12:00',
      closes: '23:30',
    });
  });

  it('ends a 24-hour day at 23:59, because schema.org reads opens == closes as closed', () => {
    const allDay = { ...site, hours: { ...site.hours, weekly: { ...site.hours.weekly, mon: { open: '00:00', close: '00:00' } } } };
    const specification = buildRestaurantJsonLd(allDay, 'https://piccolo.example/', categories, items)['openingHoursSpecification'];

    expect(specification).toContainEqual({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Monday',
      opens: '00:00',
      closes: '23:59',
    });
  });

  it('links social profiles but not the WhatsApp chat link', () => {
    expect(build()['sameAs']).toEqual(['https://instagram.com/piccolo', 'https://facebook.com/piccolo']);
  });

  it('nests the menu by category with two-decimal prices', () => {
    const menu = build()['hasMenu'] as { hasMenuSection: Array<{ name: string; hasMenuItem: Array<Record<string, unknown>> }> };

    expect(menu.hasMenuSection.map((section) => section.name)).toEqual(['Pizza', 'Drinks']);
    expect(menu.hasMenuSection[0]?.hasMenuItem.map((entry) => entry['name'])).toEqual(['margherita', 'pepperoni']);
    expect(menu.hasMenuSection[0]?.hasMenuItem[0]).toEqual({
      '@type': 'MenuItem',
      name: 'margherita',
      description: 'About margherita',
      offers: { '@type': 'Offer', price: '8.50', priceCurrency: 'EUR' },
    });
    expect(menu.hasMenuSection[1]?.hasMenuItem[0]?.['offers']).toMatchObject({ price: '3.00' });
  });
});
