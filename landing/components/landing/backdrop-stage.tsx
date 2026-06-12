import { PointerGlow } from "./pointer-glow";

/**
 * The persistent scene behind the card deck: grid with scroll parallax,
 * three breathing aurora orbs that evolve with page scroll (the warm orb C
 * surfaces around the Pro region), a vignette, and the desktop pointer glow.
 */
export function BackdropStage() {
  return (
    <div aria-hidden="true" className="backdrop-stage">
      <div className="stage-grid" />
      <div className="stage-orb stage-orb--a">
        <div className="stage-orb-core stage-orb-core--a" />
      </div>
      <div className="stage-orb stage-orb--b">
        <div className="stage-orb-core stage-orb-core--b" />
      </div>
      <div className="stage-orb stage-orb--c">
        <div className="stage-orb-core stage-orb-core--c" />
      </div>
      <div className="stage-vignette" />
      <PointerGlow />
    </div>
  );
}
