import type { ReactNode } from "react";

/**
 * One card of the scrolling deck. The wrapping .deck-item provides the
 * read-then-pin geometry (spacer + negative margin, see globals.css); the
 * veil dims the card while the next one slides over it.
 */
export function DeckCard({
  solid = false,
  children,
}: {
  solid?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="deck-item">
      <div className={`deck-card${solid ? " deck-card--solid" : ""}`}>
        {children}
        <div aria-hidden="true" className="deck-veil" />
      </div>
    </div>
  );
}
