import { type OpeningHours, isOpenNow } from '@/entities/site';
import { defineEnhancement } from '@/shared/enhance';
import { selector } from '@/shared/lib';

const REFRESH_MS = 60_000;

/** Parses the `data-hours` JSON the server embeds; returns null (and stays silent) if it is malformed. */
function readHours(raw: string | undefined): OpeningHours | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null && 'weekly' in parsed && 'timezone' in parsed
      ? (parsed as OpeningHours)
      : null;
  } catch {
    return null;
  }
}

/** Keeps every "open now" chip honest: computed in the restaurant's time zone, refreshed each minute. */
export default defineEnhancement({
  id: 'open-status',
  selector: selector.part('open-status'),
  when: 'load',
  tiers: ['full', 'lite', 'static'],

  setup({ root }) {
    const hours = readHours(root.dataset['hours']);
    if (!hours) return undefined;

    const label = root.querySelector(selector.part('open-label'));

    const update = (): void => {
      const open = isOpenNow(hours, new Date());
      root.dataset['open'] = String(open);
      if (label) label.textContent = open ? 'Open now' : 'Closed now';
    };

    update();
    const timer = window.setInterval(update, REFRESH_MS);
    return () => window.clearInterval(timer);
  },
});
