import { cn } from '@/shared/lib';
import styles from './logo.module.css';

export interface LogoProps {
  readonly name: string;
  readonly tagline?: string;
  /** `nav`: centered header wordmark. `footer`: left-aligned, smaller. */
  readonly size?: 'nav' | 'footer';
  readonly href?: string;
  readonly class?: string | undefined;
}

/** Placeholder wordmark (text). Swap for the real logo SVG when it arrives. */
export function Logo({ name, tagline, size = 'nav', href = '#top', class: className }: LogoProps) {
  return (
    <a class={cn(styles.root, size === 'footer' && styles.footer, className)} href={href}>
      <span class={styles.name}>{name.toUpperCase()}</span>
      {tagline ? <span class={styles.tagline}>{tagline}</span> : null}
    </a>
  );
}
