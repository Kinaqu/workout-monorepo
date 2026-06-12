import type { DecisionKind } from "@/data/landing-content";

/* Shared chip palette for the advance / hold / regress vocabulary, used by
   the phone mockup and the cinematic hero. Mirrors the engine's decision
   semantics; pro-section keeps its own ledger-tuned variant. */
export const decisionStyles: Record<DecisionKind, string> = {
  start: "border-white/12 bg-white/[0.05] text-white/65",
  advance: "border-[#125bff]/45 bg-[#125bff]/14 text-[#9fbeff]",
  hold: "border-white/12 bg-white/[0.05] text-white/65",
  regress: "border-[#f5a97f]/40 bg-[#f5a97f]/12 text-[#f5b894]",
};

export const decisionGlyphs: Record<DecisionKind, string> = {
  start: "•",
  advance: "▲",
  hold: "▶",
  regress: "▼",
};
