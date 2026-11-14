import { createPortal } from 'preact/compat';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { MenuCard } from '@/entities/menu/ui';
import { appBus } from '@/shared/events';
import { useMotion } from '@/shared/motion/island';
import styles from './menu-browser.module.css';
import { type PillBox, measurePill, revealCards, slidePill } from './menu-browser.motion';
import { QuickView } from './QuickView';
import type { MenuBrowserProps } from './types';

/**
 * Island 2 of 2. Category tabs whose pill slides from one tab to the next, staggered card entrance on every switch (both in
 * menu-browser.motion.ts), and an item quick view.
 *
 * Progressive enhancement: the server renders EVERY category (hidden panels are plain `hidden`), so
 * search engines and no-JS visitors get the whole menu; CSS shows all panels when JS is off.
 */
export default function MenuBrowser({ categories, phone }: MenuBrowserProps) {
  const firstId = categories[0]?.id ?? '';
  const [activeId, setActiveId] = useState(firstId);
  /** Bumps on every switch so the newly shown panel replays its entrance. */
  const [pulse, setPulse] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  /** The pill as it was when the selection changed, for the new pill to slide in from. */
  const pillFrom = useRef<PillBox | null>(null);
  const getTools = useMotion();

  const activeRef = useRef(firstId);

  useEffect(() => setMounted(true), []);

  const select = useCallback((id: string, focus = false): void => {
    if (id !== activeRef.current) {
      pillFrom.current = measurePill(tabsRef.current); // before the render moves the pill into the new tab
      activeRef.current = id;
      setActiveId(id);
      setPulse((value) => value + 1);
      appBus.emit('menu:category', { categoryId: id });
    }
    if (focus) tabRefs.current[id]?.focus();
  }, []);

  // Runs after the new selection is in the DOM and before it is painted, so nothing flashes at its resting place first.
  useLayoutEffect(() => {
    const from = pillFrom.current;
    pillFrom.current = null;
    if (pulse === 0) return undefined; // what the server rendered needs no entrance
    const tools = getTools();
    const root = rootRef.current;
    const list = tabsRef.current;
    if (!tools || !root) return undefined;

    const playing = [
      list && from ? slidePill(list, from, tools) : undefined,
      revealCards(root.querySelectorAll('[role="tabpanel"]:not([hidden]) [data-part="cell"]'), tools),
    ];
    return () => {
      for (const animation of playing) animation?.kill();
    };
  }, [pulse, getTools]);

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
    <div class={styles.root} ref={rootRef}>
      <div class={styles.tabsWrap}>
        <div class={styles.tabs} role="tablist" aria-label="Menu categories" ref={tabsRef}>
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
                {selected ? <span class={styles.pill} data-part="pill" /> : null}
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
            {/* Remounts (new key) each time this panel becomes active, so every switch starts from fresh markup. */}
            <ul class={styles.grid} role="list" key={isActive ? `on-${pulse}` : 'off'}>
              {category.cards.map((card) => (
                <li key={card.id} class={styles.cell} data-part="cell">
                  <MenuCard model={card} idScope="menu" />
                </li>
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
