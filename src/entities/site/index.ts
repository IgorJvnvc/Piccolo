/** Browser-safe public API of the site entity (pure TS). */
export { type HoursRow, TIME_PATTERN, groupHours, isOpenNow, summarizeHours } from './hours';
export {
  DAY_KEYS,
  SOCIAL_NETWORKS,
  type DayHours,
  type DayKey,
  type FooterColumn,
  type HomeCopy,
  type NavLink,
  type OpeningHours,
  type SiteInfo,
  type SocialLink,
  type SocialNetwork,
} from './model';
export type { SiteRepository } from './ports';
