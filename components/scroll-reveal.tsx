'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Optional progressive enhancement: content remains visible if JavaScript is
 * disabled, IntersectionObserver isn't supported, or reduced motion is set.
 * Runs again after a client-side route transition.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!elements.length || reduceMotion || !('IntersectionObserver' in window)) {
      root.classList.remove('motion-ready');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -55px 0px', threshold: 0.08 },
    );

    // Keep initially visible sections visible from the very first frame.
    elements.forEach((element) => {
      if (element.getBoundingClientRect().top < window.innerHeight * 0.88) {
        element.classList.add('reveal-visible');
      } else {
        observer.observe(element);
      }
    });
    root.classList.add('motion-ready');

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
