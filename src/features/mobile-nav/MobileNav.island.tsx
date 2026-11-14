import { createPortal } from 'preact/compat';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { useDialog } from '@/shared/focus/use-dialog';
import { appBus } from '@/shared/events';
import { AnimatePresence, MotionRoot, m, useReducedMotion } from '@/shared/motion/motion-react';
import { Icon } from '@/shared/ui';
import styles from './mobile-nav.module.css';
import type { MobileNavProps } from './types';

interface Origin {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Island 1 of 2. Hamburger + full-screen menu that opens as a circle from the button.
 * Hydrated only below 1024px (`client:media`); the desktop navbar needs no JS at all.
 */
export default function MobileNav(props: MobileNavProps) {
  return (
    <MotionRoot>
      <MobileNavInner {...props} />
    </MotionRoot>
  );
}

function MobileNavInner({ brand, links, phone, socials }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [origin, setOrigin] = useState<Origin>({ x: 0, y: 0, radius: 0 });
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpen(false), []);

  const openMenu = (): void => {
    const rect = toggleRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 32;
    const y = rect ? rect.top + rect.height / 2 : 32;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    setOrigin({ x, y, radius });
    setOpen(true);
  };

  useDialog(panelRef, open, { onClose: close });

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

  const circle = (radius: number): string => `circle(${radius}px at ${origin.x}px ${origin.y}px)`;

  const panel = (
    <AnimatePresence>
      {open ? (
        <m.div
          key="panel"
          ref={panelRef}
          id="mobile-menu"
          class={styles.panel}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          tabIndex={-1}
          initial={reduced ? { opacity: 0 } : { clipPath: circle(0) }}
          animate={reduced ? { opacity: 1 } : { clipPath: circle(origin.radius) }}
          exit={reduced ? { opacity: 0 } : { clipPath: circle(0) }}
          transition={{ duration: reduced ? 0.15 : 0.65, ease: EASE }}
        >
          <div class={styles.top}>
            <span class={styles.brand}>{brand.name.toUpperCase()}</span>
            <button class={styles.close} type="button" aria-label="Close menu" onClick={close}>
              <Icon name="close" />
            </button>
          </div>

          <nav class={styles.nav} aria-label="Mobile">
            <ul class={styles.list} role="list">
              {links.map((link, index) => (
                <m.li
                  key={link.href}
                  initial={reduced ? false : { opacity: 0, y: 36 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: reduced ? 0 : 0.28 + index * 0.07, ease: EASE }}
                >
                  <a class={styles.link} href={link.href} onClick={close}>
                    <span class={styles.index}>{String(index + 1).padStart(2, '0')}</span>
                    <span>{link.label}</span>
                  </a>
                </m.li>
              ))}
            </ul>
          </nav>

          <m.div
            class={styles.footer}
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reduced ? 0 : 0.6, ease: EASE }}
          >
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
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );

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
      {mounted ? createPortal(panel, document.body) : null}
    </>
  );
}
