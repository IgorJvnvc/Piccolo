import { Icon } from '@/shared/ui';
import styles from './menu-browser.module.css';

export interface PagerProps {
  /** Zero-based current page. */
  readonly page: number;
  readonly count: number;
  readonly label: string;
  readonly onChange: (page: number) => void;
}

/**
 * Previous / "Page 2 of 4" / Next under a category with more cards than one page holds. An end of the range is
 * `aria-disabled`, not `disabled`, so keyboard focus stays on the button that was pressed.
 */
export function Pager({ page, count, label, onChange }: PagerProps) {
  const first = page === 0;
  const last = page === count - 1;
  return (
    <nav class={styles.pager} aria-label={label}>
      <button
        class={styles.pagerButton}
        type="button"
        aria-disabled={first}
        onClick={() => {
          if (!first) onChange(page - 1);
        }}
      >
        <Icon name="arrow-right" class={styles.pagerPrev} />
        <span>Previous</span>
      </button>
      <span class={styles.pagerStatus} aria-live="polite">
        Page {page + 1} of {count}
      </span>
      <button
        class={styles.pagerButton}
        type="button"
        aria-disabled={last}
        onClick={() => {
          if (!last) onChange(page + 1);
        }}
      >
        <span>Next</span>
        <Icon name="arrow-right" />
      </button>
    </nav>
  );
}