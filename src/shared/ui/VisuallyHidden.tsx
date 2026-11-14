import styles from './visually-hidden.module.css';

export interface VisuallyHiddenProps {
  readonly text: string;
}

/** Text for assistive tech only (accessible name of icon-only / ornament-heavy controls). */
export function VisuallyHidden({ text }: VisuallyHiddenProps) {
  return <span class={styles.root}>{text}</span>;
}
