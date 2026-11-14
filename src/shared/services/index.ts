import { type AppBus, createAppBus } from '@/shared/events';

/** Time source. Injected so "open now" logic is testable. */
export interface Clock {
  now(): Date;
}

const systemClock: Clock = { now: () => new Date() };

export type AnalyticsProps = Readonly<Record<string, string | number | boolean>>;

/** Product analytics port. Default is a no-op (privacy-first: nothing is sent unless wired). */
export interface Analytics {
  track(event: string, props?: AnalyticsProps): void;
}

const noopAnalytics: Analytics = { track: () => undefined };

/** Everything a behavior may depend on (resolved once in runtime/boot.ts). */
export interface Services {
  readonly clock: Clock;
  readonly analytics: Analytics;
  readonly bus: AppBus;
}

export function createServices(overrides: Partial<Services> = {}): Services {
  return {
    clock: systemClock,
    analytics: noopAnalytics,
    bus: createAppBus(),
    ...overrides,
  };
}
