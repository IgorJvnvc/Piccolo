import type { OpeningHours } from '@/entities/site';

export interface DockProps {
  readonly labels: { readonly group: string; readonly call: string; readonly whatsapp: string; readonly directions: string };
  readonly phone: { readonly display: string; readonly href: string };
  /** The business's WhatsApp link, when it has one. */
  readonly whatsappHref?: string;
  readonly mapUrl: string;
  readonly hours: OpeningHours;
  /** Server-rendered default text of the "open now" chip (the client refines it). */
  readonly openLabel: string;
}