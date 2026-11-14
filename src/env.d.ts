/// <reference types="astro/client" />

interface Window {
  /** Set by runtime/boot.ts once enhancement is running (read by the inline bootstrap failsafe). */
  __PICCOLO_READY__?: boolean;
}

declare module '*.inline.js?raw' {
  const source: string;
  export default source;
}
