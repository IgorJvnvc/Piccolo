/** Types for build-time image resolution. Serializable, so they can cross into islands as props. */
export interface ImageSource {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  /** `srcset` for the fallback <img> (same format as `src`). */
  readonly srcset?: string;
  /** Modern formats offered first (AVIF, WebP). */
  readonly sources?: ReadonlyArray<{ readonly type: string; readonly srcset: string }>;
}

export interface ResolveImageOptions {
  /** Target widths for responsive variants (only ones <= the source width are generated). */
  readonly widths?: readonly number[];
}

/** Port implemented by infrastructure/images, consumed by the composition root. */
export interface ImageResolver {
  resolve(key: string, options?: ResolveImageOptions): Promise<ImageSource>;
}
