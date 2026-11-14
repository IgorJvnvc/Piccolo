import { cn } from '@/shared/lib';
import { Icon, Picture } from '@/shared/ui';
import type { MenuCardModel } from '../card-model';
import styles from './menu-card.module.css';

export interface MenuCardProps {
  readonly model: MenuCardModel;
  /**
   * Where this card is rendered ("popular", "menu"). The same item can appear in several places on the page,
   * and element ids must stay unique, so the heading id (aria-labelledby) includes the placement.
   */
  readonly idScope: string;
  readonly class?: string | undefined;
  /** First cards above the fold may be eager. */
  readonly eager?: boolean;
}

const TAG_LABEL = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  spicy: 'Spicy',
  new: 'New',
} as const;

/**
 * Presentational menu card. Pure Preact (no hooks), so it renders statically in Astro AND inside the
 * MenuBrowser island with identical markup. The Details button carries `data-details`; a delegated
 * behavior turns clicks into a `menu:details` bus event (cards never know who listens).
 */
export function MenuCard({ model, idScope, class: className, eager = false }: MenuCardProps) {
  const titleId = `card-${idScope}-${model.id}`;
  const badge = model.tags[0];

  return (
    <article class={cn(styles.card, className)} aria-labelledby={titleId} data-card={model.id}>
      {badge ? <span class={styles.badge}>{TAG_LABEL[badge]}</span> : null}
      <div class={styles.media}>
        <Picture
          image={model.image}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          sizes="(min-width: 1024px) 20rem, 60vw"
          imgClass={styles.image}
        />
      </div>
      <h3 class={styles.title} id={titleId}>
        {model.name}
      </h3>
      <p class={styles.description}>{model.description}</p>
      <div class={styles.foot}>
        <span class={styles.price}>{model.priceLabel}</span>
        <button
          class={styles.details}
          type="button"
          data-details={model.id}
          aria-label={`Details: ${model.name}`}
        >
          <Icon name="arrow-up-right" />
        </button>
      </div>
    </article>
  );
}
