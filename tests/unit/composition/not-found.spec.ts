import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildNotFoundPage } from '@/composition/not-found';
import type { Container } from '@/composition/container';
import type { MenuCategory, MenuItem } from '@/entities/menu/model';
import { homeSchema, siteSchema } from '@/infrastructure/content/schemas';
import type { ImageSource } from '@/shared/ui';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const mainOf = (file: string): unknown => (JSON.parse(readFileSync(`${ROOT}src/content/${file}`, 'utf8')) as { main: unknown }).main;

// The real content, so the test also notices when the copy or links are edited into something unsupported.
const site = siteSchema.parse(mainOf('site.json'));
const copy = homeSchema.parse(mainOf('home.json'));

const categories: MenuCategory[] = [{ id: 'pizza', title: 'Pizza', blurb: 'Stone-baked.', order: 1 }];
const items: MenuItem[] = [
  {
    id: 'margherita',
    categoryId: 'pizza',
    name: 'Margherita',
    description: 'Tomato, mozzarella, basil.',
    price: { minor: 850, currency: 'EUR' },
    sizes: [],
    addons: [],
    imageKey: 'menu/pizza-slice',
    allergens: [],
    tags: [],
    popular: true,
    order: 1,
  },
];

const image = (key: string): ImageSource => ({ src: `/img/${key}.png`, width: 100, height: 100 });

const container: Container = {
  site: { site: () => Promise.resolve(site), copy: () => Promise.resolve(copy) },
  menu: { categories: () => Promise.resolve(categories), items: () => Promise.resolve(items) },
  images: { resolve: (key) => Promise.resolve(image(key)) },
};

const build = () => buildNotFoundPage(container, 'https://piccolo.example');

describe('buildNotFoundPage', () => {
  it('is kept out of search results and has no canonical URL or structured data', async () => {
    const { seo } = await build();

    expect(seo.noindex).toBe(true);
    expect(seo).not.toHaveProperty('canonical');
    expect(seo.jsonLd).toEqual([]);
    expect(seo.title).toBe(`${copy.notFound.title} | ${site.name}`);
    expect(seo.siteName).toBe(site.name);
  });

  it('points every in-page navigation link at the matching section of the home page', async () => {
    const { navbar, footer } = await build();

    expect(navbar.links.length).toBeGreaterThan(0);
    expect(navbar.links.map((link) => link.href)).toEqual(copy.nav.links.map((link) => `/${link.href}`));
    for (const column of footer.columns) {
      for (const link of column.links.filter((entry) => copy.footer.columns.some((c) => c.links.some((l) => l.label === entry.label)))) {
        expect(link.href.startsWith('/#'), `${column.title} / ${link.label} -> ${link.href}`).toBe(true);
      }
    }
  });

  it('leaves links that already work from anywhere untouched (tel:, mailto:, https:)', async () => {
    // The real site has no email and no WhatsApp, so give this one both: they are the kinds of link the footer can carry.
    const full = {
      ...site,
      contact: { ...site.contact, email: 'hello@example.com' },
      socials: [...site.socials, { network: 'whatsapp' as const, label: 'WhatsApp', href: 'https://wa.me/381640000000' }],
    };
    const { footer } = await buildNotFoundPage({ ...container, site: { ...container.site, site: () => Promise.resolve(full) } }, 'https://piccolo.example');
    const contact = footer.columns.find((column) => column.title === 'Contact');
    const hrefs = contact?.links.map((link) => link.href) ?? [];

    expect(hrefs.some((href) => href.startsWith('tel:'))).toBe(true);
    expect(hrefs.some((href) => href.startsWith('mailto:'))).toBe(true);
    expect(hrefs.some((href) => href.startsWith('https:'))).toBe(true);
    expect(hrefs.every((href) => !href.startsWith('/'))).toBe(true);
  });
});
