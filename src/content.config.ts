import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { addonGroupSchema, categorySchema, homeSchema, itemSchema, siteSchema } from '@/infrastructure/content/schemas';

/**
 * Content collections. Edit the JSON under src/content; the schemas (infrastructure/content/schemas.ts)
 * validate it at build time. Only infrastructure/content/** reads these collections.
 */
export const collections = {
  site: defineCollection({ loader: file('src/content/site.json'), schema: siteSchema }),
  home: defineCollection({ loader: file('src/content/home.json'), schema: homeSchema }),
  categories: defineCollection({ loader: file('src/content/menu/categories.json'), schema: categorySchema }),
  items: defineCollection({ loader: file('src/content/menu/items.json'), schema: itemSchema }),
  addons: defineCollection({ loader: file('src/content/menu/addons.json'), schema: addonGroupSchema }),
};
