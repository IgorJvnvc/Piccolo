import type { ImageSource } from './image-source';

export type { ImageSource } from './image-source';

export interface PictureProps {
  readonly image: ImageSource;
  /** Required. Use "" only for purely decorative images. */
  readonly alt: string;
  readonly sizes?: string;
  readonly loading?: 'lazy' | 'eager';
  readonly fetchPriority?: 'high' | 'low' | 'auto';
  readonly class?: string | undefined;
  readonly imgClass?: string | undefined;
}

export function Picture({
  image,
  alt,
  sizes,
  loading = 'lazy',
  fetchPriority = 'auto',
  class: className,
  imgClass,
}: PictureProps) {
  return (
    <picture class={className}>
      {image.sources?.map((source) => (
        <source key={source.type} type={source.type} srcset={source.srcset} {...(sizes ? { sizes } : {})} />
      ))}
      <img
        src={image.src}
        width={image.width}
        height={image.height}
        alt={alt}
        loading={loading}
        decoding="async"
        draggable={false}
        class={imgClass}
        {...(image.srcset ? { srcset: image.srcset } : {})}
        {...(sizes ? { sizes } : {})}
        {...(fetchPriority !== 'auto' ? { fetchpriority: fetchPriority } : {})}
      />
    </picture>
  );
}
