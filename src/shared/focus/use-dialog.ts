import type { RefObject } from 'preact';
import { useEffect } from 'preact/hooks';
import { appBus } from '@/shared/events';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface DialogOptions {
  readonly onClose: () => void;
  /** Where focus returns on close. Defaults to whatever was focused when it opened (unreliable after a tap). */
  readonly returnFocus?: HTMLElement | null;
}

/**
 * Modal behavior for islands: while `open`, traps Tab inside `ref`, closes on Escape, locks page scroll
 * (and tells smooth-scroll to pause via the bus), and returns focus to whatever opened it.
 * Preact hooks: import this only from island code (secondary entry, keeps hooks out of other bundles).
 */
export function useDialog(ref: RefObject<HTMLElement | null>, open: boolean, { onClose, returnFocus }: DialogOptions): void {
  useEffect(() => {
    if (!open) return undefined;
    const container = ref.current;
    if (!container) return undefined;

    const previous = returnFocus ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const root = document.documentElement;
    root.setAttribute('data-scroll-lock', '');
    appBus.emit('scroll:lock', { locked: true });

    const focusables = (): HTMLElement[] =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);

    (focusables()[0] ?? container).focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      root.removeAttribute('data-scroll-lock');
      appBus.emit('scroll:lock', { locked: false });
      previous?.focus({ preventScroll: true });
    };
    // `onClose` is intentionally not a dependency: islands pass inline closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ref, returnFocus]);
}
