import type { HoursRow, OpeningHours } from '@/entities/site';
import type { ImageSource } from '@/shared/ui';

export interface VisitProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly text: string;
  readonly directionsLabel: string;
  readonly hoursTitle: string;
  readonly callLabel: string;
  readonly address: readonly string[];
  readonly mapUrl: string;
  readonly phone: { readonly display: string; readonly href: string };
  readonly hours: OpeningHours;
  readonly hoursRows: readonly HoursRow[];
  /** Server-rendered default text of the "open now" chip. */
  readonly openLabel: string;
  readonly map: ImageSource;
}
