import { createPortal } from 'preact/compat';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { appBus } from '@/shared/events';
import { useDialog } from '@/shared/focus/use-dialog';
import { usePresence } from '@/shared/motion/island';
import { Icon } from '@/shared/ui';
import styles from './mobile-nav.module.css';
import { type Origin, createPanelMotion } from './mobile-nav.motion';
import type { MobileNavProps } from './types';

/**
 * Island 1 of 2. Hamburger + full-screen menu that opens as a circle from the button (mobile-nav.motion.ts).
 * Hydrated only below 1024px (`client:media`); the desktop navbar needs no JS at all.
 */
export default function MobileNav({ brand, links, phone, socials }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const origin = useRef<Origin>({ x: 0, y: 0, radius: 0 });
  const toggleRef = useRef<HTMLButtonElement>(null);
  const motion = useMemo(() => createPanelMotion(() => origin.current), []);
  const panel = usePresence<HTMLDivElement>(open, motion);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpen(false), []);

  const openMenu = (): void => {
    const rect = toggleRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 32;
    const y = rect ? rect.top + rect.height / 2 : 32;
    origin.current = { x, y, radius: Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) };
    setOpen(true);
  };

  useDialog(panel.ref, open, { onClose: close, returnFocus: toggleRef.current });

  // Tell the navbar (keep it visible) and whoever else cares.
  useEffect(() => {
    appBus.emit('nav:menu', { open });
  }, [open]);

  // Leaving the phone/tablet layout closes the menu.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const onChange = (): void => {
      if (query.matches) setOpen(false);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const menu = panel.present ? (
    <div ref={panel.ref} id="mobile-menu" class={styles.panel} role="dialog" aria-modal="true" aria-label="Menu" tabIndex={-1}>
      <div class={styles.top}>
        <span class={styles.brand}>{brand.name.toUpperCase()}</span>
        <button class={styles.close} type="button" aria-label="Close menu" onClick={close}>
          <Icon name="close" />
        </button>
      </div>

      <nav class={styles.nav} aria-label="Mobile">
        <ul class={styles.list} role="list">
          {links.map((link) => (
            <li key={link.href} data-part="link">
              <a class={styles.link} href={link.href} onClick={close}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div class={styles.footer} data-part="footer">
        <a class={styles.call} href={phone.href}>
          <Icon name="phone" />
          <span>{phone.display}</span>
        </a>
        <ul class={styles.socials} role="list">
          {socials.map((social) => (
            <li key={social.network}>
              <a class={styles.social} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                <Icon name={social.network} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={toggleRef}
        class={styles.toggle}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={open ? close : openMenu}
      >
        <Icon name={open ? 'close' : 'menu'} />
      </button>
      {/* Portaled to <body>: a transformed/blurred ancestor would otherwise trap position:fixed. */}
      {mounted ? createPortal(menu, document.body) : null}
    </>
  );
}
