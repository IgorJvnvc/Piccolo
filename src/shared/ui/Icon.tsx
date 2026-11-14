import type { JSX } from 'preact';

interface IconDef {
  /** Filled glyph (brand marks, play) vs. 1.8px stroked glyph. */
  readonly filled?: boolean;
  readonly node: JSX.Element;
}

const ICONS = {
  'arrow-right': { node: <path d="M5 12h14M13 6l6 6-6 6" /> },
  'arrow-down': { node: <path d="M12 5v14M6 13l6 6 6-6" /> },
  'arrow-up-right': { node: <path d="M7 17 17 7M8 7h9v9" /> },
  'chevron-down': { node: <path d="m6 9 6 6 6-6" /> },
  phone: {
    node: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    ),
  },
  pin: {
    node: (
      <>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
  },
  clock: {
    node: (
      <>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 6.5V12l3.5 2" />
      </>
    ),
  },
  menu: { node: <path d="M4 7h16M4 12h16M4 17h16" /> },
  close: { node: <path d="M6 6l12 12M18 6 6 18" /> },
  plus: { node: <path d="M12 5v14M5 12h14" /> },
  check: { node: <path d="m5 12.5 4.5 4.5L19 7.5" /> },
  external: {
    node: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  },
  play: { filled: true, node: <path d="M8.5 5.6v12.8a.6.6 0 0 0 .92.5l10-6.4a.6.6 0 0 0 0-1l-10-6.4a.6.6 0 0 0-.92.5Z" /> },
  instagram: {
    node: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M17.6 6.4h.01" />
      </>
    ),
  },
  facebook: { node: <path d="M17 3h-2.6A4.4 4.4 0 0 0 10 7.4V10H7v4h3v7h4v-7h3l1-4h-4V7.6c0-.4.3-.6.7-.6H17V3Z" /> },
  tiktok: { node: <path d="M14 3v11.2a3.4 3.4 0 1 1-3.4-3.4M14 3c.3 2.3 1.9 4 4.6 4.2" /> },
  whatsapp: {
    node: (
      <>
        <path d="M3.2 20.8 4.6 16A8.6 8.6 0 1 1 8 19.4l-4.8 1.4Z" />
        <path d="M9.2 8.8c.4 2.4 2.6 4.6 5 5.2l1.4-1.4-1.9-1-.9.8a3.7 3.7 0 0 1-1.8-1.8l.8-.9-1-1.9-1.6 1Z" />
      </>
    ),
  },
} as const satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  readonly name: IconName;
  /** CSS length or number (px). Defaults to 1em so icons scale with text. */
  readonly size?: number | string;
  readonly class?: string | undefined;
  /** Accessible name. Omit for decorative icons (aria-hidden). */
  readonly title?: string;
}

export function Icon({ name, size = '1em', class: className, title }: IconProps) {
  const def: IconDef = ICONS[name];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={def.filled ? 'currentColor' : 'none'}
      stroke={def.filled ? 'none' : 'currentColor'}
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={className}
      focusable="false"
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': 'true' })}
    >
      {def.node}
    </svg>
  );
}
