import { useRef } from 'preact/hooks';
import type { MenuCardModel } from '@/entities/menu';
import { useDialog } from '@/shared/focus/use-dialog';
import { AnimatePresence, m, useReducedMotion } from '@/shared/motion/motion-react';
import { Icon, Picture } from '@/shared/ui';
import styles from './quick-view.module.css';

const EASE = [0.22, 1, 0.36, 1] as const;

export interface QuickViewProps {
  readonly card: MenuCardModel | null;
  readonly phone: { readonly display: string; readonly href: string };
  readonly onClose: () => void;
  /** The control that opened the dialog; focus returns to it on close. */
  readonly opener: HTMLElement | null;
}

const TAG_LABEL = { vegetarian: 'Vegetarian', vegan: 'Vegan', spicy: 'Spicy', new: 'New' } as const;

/** Item details: sizes, allergens, and how to order (this is a marketing site: call or visit). */
export function QuickView({ card, phone, onClose, opener }: QuickViewProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useDialog(panelRef, card !== null, { onClose, returnFocus: opener });

  return (
    <AnimatePresence>
      {card ? (
        <m.div
          key="overlay"
          class={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(event: MouseEvent) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <m.div
            ref={panelRef}
            class={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-view-title"
            tabIndex={-1}
            initial={reduced ? false : { opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <button class={styles.close} type="button" aria-label="Close details" onClick={onClose}>
              <Icon name="close" />
            </button>

            <div class={styles.media}>
              <Picture image={card.image} alt="" sizes="(min-width: 768px) 22rem, 70vw" imgClass={styles.image} loading="eager" />
            </div>

            <div class={styles.body}>
              {card.tags.length > 0 ? (
                <ul class={styles.tags} role="list">
                  {card.tags.map((tag) => (
                    <li class={styles.tag} key={tag}>
                      {TAG_LABEL[tag]}
                    </li>
                  ))}
                </ul>
              ) : null}

              <h3 class={styles.title} id="quick-view-title">
                {card.name}
              </h3>
              <p class={styles.description}>{card.description}</p>

              {card.sizes.length > 0 ? (
                <ul class={styles.sizes} role="list" aria-label="Sizes and prices">
                  {card.sizes.map((size) => (
                    <li class={styles.size} key={size.label}>
                      <span>{size.label}</span>
                      <strong>{size.priceLabel}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p class={styles.single}>{card.priceLabel}</p>
              )}

              <p class={styles.allergens}>
                {card.allergens.length > 0 ? (
                  <>
                    <strong>Contains:</strong> {card.allergens.join(', ')}
                  </>
                ) : (
                  'No listed allergens. Ask us if you have any concerns.'
                )}
              </p>

              <a class={styles.call} href={phone.href}>
                <Icon name="phone" />
                <span>Order by phone: {phone.display}</span>
              </a>
            </div>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
