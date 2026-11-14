import type { HomeCopy, SiteInfo } from './model';

/** Port: where site info and copy come from. */
export interface SiteRepository {
  site(): Promise<SiteInfo>;
  copy(): Promise<HomeCopy>;
}
