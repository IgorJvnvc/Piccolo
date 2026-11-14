import type { Capabilities } from '@/shared/device';
import { type Bus, createBus } from './bus';

/** Every cross-feature message in the app. Features talk through these, never by importing each other. */
export interface AppEvents {
  /** Device capabilities changed (resize, reduced-motion toggled, ...). */
  'caps:changed': { readonly caps: Capabilities };
  /** Mobile navigation opened/closed. */
  'nav:menu': { readonly open: boolean };
  /** Menu browser switched category. */
  'menu:category': { readonly categoryId: string };
  /** Somebody asked to see an item's details (opens the quick view in the menu browser). */
  'menu:details': { readonly itemId: string; readonly opener?: HTMLElement | null };
  /** Smooth-scroll request ("#menu" or an absolute y). */
  'scroll:to': { readonly target: string | number };
  /** A modal surface (mobile menu, quick view) wants the page not to scroll behind it. */
  'scroll:lock': { readonly locked: boolean };
}

export type AppBus = Bus<AppEvents>;

/** `menu:details` is sticky: a click may precede hydration of the menu island, and must not be lost. */
export const createAppBus = (): AppBus => createBus<AppEvents>({ sticky: ['menu:details'] });

/**
 * The browser-side singleton. Behaviors, scenes AND hydrated islands share this one instance (they are
 * separate bundles that import the same module), which is how they talk without importing each other.
 */
export const appBus: AppBus = createAppBus();
