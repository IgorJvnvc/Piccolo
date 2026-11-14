import type { MenuRepository } from '@/entities/menu';
import type { SiteRepository } from '@/entities/site';
import { createContentMenuRepository, createContentSiteRepository } from '@/infrastructure/content';
import { createImageResolver } from '@/infrastructure/images';
import type { ImageResolver } from '@/shared/ui';

/** Everything the page needs from the outside world, behind ports. */
export interface Container {
  readonly site: SiteRepository;
  readonly menu: MenuRepository;
  readonly images: ImageResolver;
}

/**
 * Build-time composition root: the only place that knows which adapter implements which port.
 * Swap the content-collection adapters for a CMS here without touching a single section.
 */
function createContainer(): Container {
  const site = createContentSiteRepository();
  const menu = createContentMenuRepository({ currency: async () => (await site.site()).currency });
  const images = createImageResolver();
  return { site, menu, images };
}

export const container: Container = createContainer();
