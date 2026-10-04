import { useMemo } from 'react';
import clsx from 'clsx';
import { resolveImage } from '../lib/scene';

export function EvidenceImage({ src, alt, className, w = 640, h = 480 }: { src: string; alt: string; className?: string; w?: number; h?: number }) {
  const url = useMemo(() => resolveImage(src, w, h), [src, w, h]);
  return <img src={url} alt={alt} className={clsx('object-cover', className)} loading="lazy" draggable={false} />;
}
