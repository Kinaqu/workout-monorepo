"use client";

import { useEffect } from "react";

/**
 * Writes each deck card's pin point: top = 100svh − own height, so a card
 * pins only once it has been fully read. Percentage insets on sticky
 * elements resolve against the scrollport (verified in Chromium), so this
 * offset cannot be expressed in pure CSS. Measurement only — no scroll
 * work; without JS cards simply never pin and the page scrolls normally.
 */
export function DeckPins() {
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(
      ".deck-item:not(:last-child) > .deck-card",
    );
    if (cards.length === 0) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const card = entry.target as HTMLElement;
        card.style.setProperty(
          "--deck-top",
          `calc(100svh - ${card.offsetHeight}px)`,
        );
      }
    });
    for (const card of cards) observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return null;
}
