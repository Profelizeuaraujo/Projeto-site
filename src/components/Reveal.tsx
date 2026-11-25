import React, { useEffect, useRef, useState } from 'react';

type Callback = () => void;

let sharedObserver: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, Callback>();

function getSharedObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return null;
  }
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cb = callbacks.get(entry.target);
            if (cb) {
              cb();
              callbacks.delete(entry.target);
            }
            sharedObserver?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' },
    );
  }
  return sharedObserver;
}

export const Reveal = React.memo(function Reveal({
  children,
  className = '',
  delay = 0,
  enabled = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  enabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const [visible, setVisible] = useState(!enabled || prefersReduced);

  useEffect(() => {
    if (!enabled || prefersReduced) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = getSharedObserver();
    if (!observer) {
      setVisible(true);
      return;
    }
    callbacks.set(el, () => setVisible(true));
    observer.observe(el);
    return () => {
      callbacks.delete(el);
      observer.unobserve(el);
    };
  }, [enabled, prefersReduced]);

  return (
    <div
      ref={ref}
      style={delay > 0 && enabled && !prefersReduced ? { transitionDelay: `${delay}ms` } : undefined}
      className={`transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform] ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      {children}
    </div>
  );
});
