'use client';

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  /** Position in a staggered group (0, 1, 2…). */
  order?: number;
  className?: string;
}

/**
 * Slides content in from the left when it scrolls into view. Content is visible by default
 * (server render, no JS, reduced motion); it's only hidden once the observer is armed, and
 * never for elements already on screen at load.
 */
export function Reveal({ children, as: Tag = 'div', order = 0, className }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    el.dataset.reveal = 'armed';
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.dataset.reveal = 'in';
        observer.disconnect();
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={cn('reveal', className)} style={{ '--i': order } as CSSProperties}>
      {children}
    </Tag>
  );
}
