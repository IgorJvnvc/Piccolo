import type { RefObject } from 'preact';
import { useEffect } from 'preact/hooks';
import { appBus } from '@/shared/events';
import { FOCUSABLE } from './focusable';

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
      // Focus on the dialog itself, or strayed outside it, comes back in at the end the key is heading for.
      const active = document.activeElement;
      if (!active || active === container || !container.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      root.removeAttribute('data-scroll-lock');
      appBus.emit('scroll:lock', { locked: false });
      // A link that was followed has already moved focus to its target: take focus back only if it is still in the dialog or lost.
      const active = document.activeElement;
      if (!active || active === document.body || container.contains(active)) previous?.focus({ preventScroll: true });
    };
    // `onClose` is intentionally not a dependency: islands pass inline closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ref, returnFocus]);
}
