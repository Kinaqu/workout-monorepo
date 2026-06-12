"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

type RevealProps = {
  className?: string;
  /** Extra transition delay in ms (plain mode only). */
  delay?: number;
  /** Stagger mode: descendants with class "rv" reveal using their inline --d delay. */
  stagger?: boolean;
  children: ReactNode;
};

let sharedObserver: IntersectionObserver | null = null;
const onReveal = new WeakMap<Element, () => void>();

function observe(element: Element, callback: () => void) {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          sharedObserver?.unobserve(entry.target);
          const fire = onReveal.get(entry.target);
          onReveal.delete(entry.target);
          fire?.();
        }
      },
      { threshold: 0.15 },
    );
  }
  onReveal.set(element, callback);
  sharedObserver.observe(element);
}

/**
 * In-view reveal wrapper. Server HTML stays fully visible; the hidden state
 * is applied client-side and only for elements that start below the fold,
 * so no-JS visitors, crawlers, and reduced-motion users always see content.
 */
export function Reveal({
  className = "",
  delay = 0,
  stagger = false,
  children,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Hiding elements already on (or near) the first screen would flash
    // content that was just visible before hydration.
    if (element.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    element.classList.add("reveal-init");
    observe(element, () => element.classList.add("reveal-in"));
    return () => {
      sharedObserver?.unobserve(element);
      onReveal.delete(element);
    };
  }, []);

  const style = delay
    ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties)
    : undefined;

  return (
    <div
      ref={ref}
      className={`${stagger ? "reveal-group" : "reveal"} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}
