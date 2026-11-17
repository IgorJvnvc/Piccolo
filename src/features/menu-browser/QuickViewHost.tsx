import { createPortal } from 'preact/compat';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { appBus } from '@/shared/events';
import { QuickView } from './QuickView';
import type { MenuBrowserProps } from './types';

/**
 * Owns what the quick view needs to know (which item, and the control that opened it), so that opening and closing re-renders the
 * dialog and nothing else. The state used to sit in MenuBrowser, which then re-rendered every card of every category (71) inside
 * the click that opened the dialog: 47 ms of the main thread on a phone, right where the dialog's first frame is waiting (ADR 0017).
 *
 * Anyone can ask for an item's details (popular cards, other sections). `replay` delivers a click that happened before this
 * island finished hydrating.
 */
export function QuickViewHost({ categories, phone }: Pick<MenuBrowserProps, 'categories' | 'phone'>) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  /** The portal needs `document`, which the server render does not have. */
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const controller = new AbortController();
    appBus.on(
      'menu:details',
      ({ itemId, opener: from }) => {
        setOpener(from ?? null);
        setDetailId(itemId);
      },
      { signal: controller.signal, replay: true },
    );
    return () => controller.abort();
  }, []);

  const detail = useMemo(
    () => (detailId ? categories.flatMap((category) => category.cards).find((card) => card.id === detailId) ?? null : null),
    [categories, detailId],
  );

  return mounted ? createPortal(<QuickView card={detail} phone={phone} opener={opener} onClose={() => setDetailId(null)} />, document.body) : null;
}
