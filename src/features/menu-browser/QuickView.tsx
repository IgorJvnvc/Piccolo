import { useRef } from 'preact/hooks';
import type { MenuCardModel } from '@/entities/menu';
import { useDialog } from '@/shared/focus/use-dialog';
import { usePresence } from '@/shared/motion/island';
import { Icon, Picture } from '@/shared/ui';
import styles from './quick-view.module.css';
import { quickViewMotion } from './quick-view.motion';

export interface QuickViewProps {
  readonly card: MenuCardModel | null;
  readonly phone: { readonly display: string; readonly href: string };
  readonly onClose: () => void;
  /** The control that opened the dialog; focus returns to it on close. */
  readonly opener: HTMLElement | null;
}

/** Item details: sizes, allergens, and how to order (this is a marketing site: call or visit). */
export function QuickView({ card, phone, onClose, opener }: QuickViewProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const overlay = usePresence<HTMLDivElement>(card !== null, quickViewMotion);
  useDialog(panelRef, card !== null, { onClose, returnFocus: opener });

  // The dialog plays out after `card` has already gone back to null, so it keeps showing the last card until it is gone.
  const lastCard = useRef<MenuCardModel | null>(null);
  if (card) lastCard.current = card;
  const shown = card ?? lastCard.current;

  if (!overlay.present || !shown) return null;

  return (
    <div
      ref={overlay.ref}
      class={styles.overlay}
      role="presentation"
      onClick={(event: MouseEvent) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div ref={panelRef} class={styles.panel} data-part="panel" role="dialog" aria-modal="true" aria-labelledby="quick-view-title" tabIndex={-1}>
        <button class={styles.close} type="button" aria-label="Close details" onClick={onClose}>
          <Icon name="close" />
        </button>

        <div class={styles.media}>
          <Picture image={shown.image} alt="" sizes="(min-width: 768px) 22rem, 70vw" imgClass={styles.image} loading="eager" />
        </div>

        <div class={styles.body}>
          {shown.tags.length > 0 ? (
            <ul class={styles.tags} role="list">
              {shown.tags.map((tag) => (
                <li class={styles.tag} key={tag}>
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}

          <h3 class={styles.title} id="quick-view-title">
            {shown.name}
          </h3>
          <p class={styles.description}>{shown.description}</p>

          {shown.sizes.length > 0 ? (
            <ul class={styles.sizes} role="list" aria-label="Sizes and prices">
              {shown.sizes.map((size) => (
                <li class={styles.size} key={size.label}>
                  <span>{size.label}</span>
                  <strong>{size.priceLabel}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p class={styles.single}>{shown.priceLabel}</p>
          )}

          <p class={styles.allergens}>
            {shown.allergens.length > 0 ? (
              <>
                <strong>Contains:</strong> {shown.allergens.join(', ')}
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
      </div>
    </div>
  );
}
