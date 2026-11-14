import type { MouseEventHandler } from 'preact';
import { cn } from '@/shared/lib';
import styles from './button.module.css';
import { Icon, type IconName } from './Icon';

export interface ButtonProps {
  readonly label: string;
  readonly href?: string;
  readonly variant?: 'primary' | 'soft' | 'ghost';
  readonly size?: 'md' | 'lg';
  readonly icon?: IconName;
  readonly type?: 'button' | 'submit';
  readonly external?: boolean;
  readonly class?: string | undefined;
  readonly data?: Readonly<Record<`data-${string}`, string>>;
  /** Only meaningful inside a hydrated island (functions are not serializable from Astro). */
  readonly onClick?: MouseEventHandler<HTMLElement>;
}

export function Button({
  label,
  href,
  variant = 'primary',
  size = 'md',
  icon,
  type = 'button',
  external = false,
  class: className,
  data,
  onClick,
}: ButtonProps) {
  const classes = cn(styles.root, styles[variant], size === 'lg' && styles.lg, className);
  const content = (
    <>
      <span>{label}</span>
      {icon ? <Icon name={icon} class={styles.icon} /> : null}
    </>
  );

  if (href !== undefined) {
    return (
      <a
        class={classes}
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...data}
        {...(onClick ? { onClick } : {})}
      >
        {content}
      </a>
    );
  }

  return (
    <button class={classes} type={type} {...data} {...(onClick ? { onClick } : {})}>
      {content}
    </button>
  );
}
