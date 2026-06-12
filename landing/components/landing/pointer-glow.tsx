"use client";

import { useEffect, useRef } from "react";

const GLOW_SIZE = 640;

/**
 * Desktop-only glow that follows the pointer inside its parent section.
 * The gradient layer is painted once and moved with translate3d from a
 * rAF-throttled pointermove handler, so tracking never repaints.
 */
export function PointerGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const section = element.parentElement;
    if (!section) return;

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const onMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const rect = section.getBoundingClientRect();
        const x = pointerX - rect.left - GLOW_SIZE / 2;
        const y = pointerY - rect.top - GLOW_SIZE / 2;
        element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        element.classList.add("is-active");
      });
    };

    const onLeave = () => {
      element.classList.remove("is-active");
    };

    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} aria-hidden="true" className="hero-glow" />;
}
