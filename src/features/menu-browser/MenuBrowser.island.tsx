import { createPortal } from 'preact/compat';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { MenuCard } from '@/entities/menu/ui';
import { appBus } from '@/shared/events';
import { MotionRoot, m, useReducedMotion } from '@/shared/motion/motion-react';
import styles from './menu-browser.module.css';
import { QuickView } from './QuickView';
import type { MenuBrowserProps } from './types';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Island 2 of 2. Category tabs with a shared-layout pill (Motion `layoutId`), staggered card entrance
 * on every switch, and an item quick view.
 *
 * Progressive enhancement: the server renders EVERY category (hidden panels are plain `hidden`), so
 * search engines and no-JS visitors get the whole menu; CSS shows all panels when JS is off.
 */
export default function MenuBrowser(props: MenuBrowserProps) {
  return (
    <MotionRoot>
      <MenuBrowserInner {...props} />
    </MotionRoot>
  );
}

function MenuBrowserInner({ categories, phone }: MenuBrowserProps) {
  const firstId = categories[0]?.id ?? '';
  const [activeId, setActiveId] = useState(firstId);
  /** Bumps on every switch so the newly shown panel replays its entrance. */
  const [pulse, setPulse] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const reduced = useReducedMotion();

  const activeRef = useRef(firstId);

  useEffect(() => setMounted(true), []);

  const select = useCallback((id: string, focus = false): void => {
    if (id !== activeRef.current) {
      activeRef.current = id;
      setActiveId(id);
      setPulse((value) => value + 1);
      setInteracted(true);
      appBus.emit('menu:category', { categoryId: id });
    }
    if (focus) tabRefs.current[id]?.focus();
  }, []);

  // Anyone can ask for an item's details (popular cards, other sections). `replay` delivers a click that
  // happened before this island finished hydrating.
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

  const onTabKeyDown = (event: KeyboardEvent, index: number): void => {
    const last = categories.length - 1;
    const target =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null;
    if (target === null) return;
    event.preventDefault();
    const next = categories[target];
    if (next) select(next.id, true);
  };

  const active = categories.find((category) => category.id === activeId);

  return (
    <div class={styles.root}>
      <div class={styles.tabsWrap}>
        <div class={styles.tabs} role="tablist" aria-label="Menu categories">
          {categories.map((category, index) => {
            const selected = category.id === activeId;
            return (
              <button
                key={category.id}
                ref={(el: HTMLButtonElement | null) => {
                  tabRefs.current[category.id] = el;
                }}
                class={styles.tab}
                role="tab"
                type="button"
                id={`tab-${category.id}`}
                aria-selected={selected}
                aria-controls={`panel-${category.id}`}
                tabIndex={selected ? 0 : -1}
                data-selected={selected ? '' : undefined}
                onClick={() => select(category.id)}
                onKeyDown={(event: KeyboardEvent) => onTabKeyDown(event, index)}
              >
                {selected ? (
                  <m.span
                    layoutId="menu-tab-pill"
                    class={styles.pill}
                    transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
                  />
                ) : null}
                <span class={styles.label}>{category.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p class={styles.blurb} aria-live="polite">
        {active?.blurb}
      </p>

      {categories.map((category) => {
        const isActive = category.id === activeId;
        return (
          <div
            key={category.id}
            class={styles.panel}
            role="tabpanel"
            id={`panel-${category.id}`}
            aria-labelledby={`tab-${category.id}`}
            hidden={!isActive}
          >
            <h3 class={styles.panelTitle}>{category.title}</h3>
            {/* Remounts (new key) each time this panel becomes active, replaying the stagger. */}
            <ul class={styles.grid} role="list" key={isActive ? `on-${pulse}` : 'off'}>
              {category.cards.map((card, index) => (
                <m.li
                  key={card.id}
                  class={styles.cell}
                  initial={interacted && isActive && !reduced ? { opacity: 0, y: 28 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.06, ease: EASE }}
                >
                  <MenuCard model={card} idScope="menu" />
                </m.li>
              ))}
            </ul>
          </div>
        );
      })}

      {mounted
        ? createPortal(<QuickView card={detail} phone={phone} opener={opener} onClose={() => setDetailId(null)} />, document.body)
        : null}
    </div>
  );
}
