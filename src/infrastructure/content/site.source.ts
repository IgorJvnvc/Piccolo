import { getEntry } from 'astro:content';
import type { HomeCopy, SiteInfo, SiteRepository } from '@/entities/site';

/** Adapter: content collections (src/content/*.json) -> SiteRepository. */
export function createContentSiteRepository(): SiteRepository {
  return {
    async site(): Promise<SiteInfo> {
      const entry = await getEntry('site', 'main');
      if (!entry) throw new Error('Missing content: src/content/site.json needs a "main" entry');
      return entry.data;
    },

    async copy(): Promise<HomeCopy> {
      const entry = await getEntry('home', 'main');
      if (!entry) throw new Error('Missing content: src/content/home.json needs a "main" entry');
      return entry.data;
    },
  };
}
