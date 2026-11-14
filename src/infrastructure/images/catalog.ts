import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import type { ImageResolver, ImageSource, ResolveImageOptions } from '@/shared/ui';

/** Raster beats vector so dropping a real photo next to a generated SVG placeholder just works. */
const FORMAT_PRIORITY = ['avif', 'webp', 'png', 'jpg', 'jpeg', 'svg'] as const;
const DEFAULT_WIDTHS = [320, 560, 800] as const;

const modules = import.meta.glob<{ default: ImageMetadata }>('/src/assets/**/*.{svg,png,jpg,jpeg,webp,avif}', {
  eager: true,
});

const keyOf = (path: string): string => path.replace(/^\/src\/assets\//, '').replace(/\.[^.]+$/, '');
const extOf = (path: string): string => path.slice(path.lastIndexOf('.') + 1).toLowerCase();

function buildCatalog(): ReadonlyMap<string, ImageMetadata> {
  const best = new Map<string, { rank: number; meta: ImageMetadata }>();
  for (const [path, mod] of Object.entries(modules)) {
    const key = keyOf(path);
    const rank = FORMAT_PRIORITY.indexOf(extOf(path) as (typeof FORMAT_PRIORITY)[number]);
    const current = best.get(key);
    if (!current || rank < current.rank) best.set(key, { rank, meta: mod.default });
  }
  return new Map(Array.from(best, ([key, value]) => [key, value.meta]));
}

const catalog = buildCatalog();

/**
 * Adapter: src/assets/** -> optimized, responsive ImageSource.
 * - SVG placeholders pass through untouched.
 * - Rasters get AVIF + WebP sources at several widths, plus a same-format fallback.
 */
export function createImageResolver(): ImageResolver {
  return {
    async resolve(key: string, options: ResolveImageOptions = {}): Promise<ImageSource> {
      const meta = catalog.get(key);
      if (!meta) {
        const known = Array.from(catalog.keys()).sort().join(', ');
        throw new Error(`Unknown image "${key}". Add src/assets/${key}.(svg|png|jpg|webp|avif). Known: ${known}`);
      }

      const base: ImageSource = { src: meta.src, width: meta.width, height: meta.height };
      if (meta.format === 'svg') return base;

      const requested = options.widths ?? DEFAULT_WIDTHS;
      const widths = Array.from(new Set(requested.filter((width) => width < meta.width).concat(meta.width))).sort(
        (a, b) => a - b,
      );
      const aspect = meta.height / meta.width;

      const variants = async (format: 'avif' | 'webp' | 'png' | 'jpeg') => {
        const built = await Promise.all(
          widths.map(async (width) => {
            const image = await getImage({ src: meta, width, height: Math.round(width * aspect), format });
            return { url: image.src, width };
          }),
        );
        return built.map((entry) => `${entry.url} ${entry.width}w`).join(', ');
      };

      const fallbackFormat = meta.format === 'png' ? 'png' : 'jpeg';
      const [avif, webp, fallback] = await Promise.all([variants('avif'), variants('webp'), variants(fallbackFormat)]);
      const largest = await getImage({ src: meta, width: widths[widths.length - 1] ?? meta.width, format: fallbackFormat });

      return {
        src: largest.src,
        width: meta.width,
        height: meta.height,
        srcset: fallback,
        sources: [
          { type: 'image/avif', srcset: avif },
          { type: 'image/webp', srcset: webp },
        ],
      };
    },
  };
}
