import { ImageResponse } from "next/og";

export const alt = "Kinova adaptive training preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// Brand tokens, duplicated from the product apps by design (the monorepo
// intentionally has no shared package; see the root README notes).
const brand = {
  accent: "#125bff",
  accentGlow: "rgba(18,91,255,0.42)",
  accentBorder: "rgba(18,91,255,0.5)",
  accentSoftBg: "rgba(18,91,255,0.12)",
  accentLogoTint: "rgba(18,91,255,0.18)",
  bgDeep: "#05070b",
  bgPanel: "#08111f",
  font: "Manrope, sans-serif",
};

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: `radial-gradient(circle at 15% 20%, ${brand.accentGlow}, transparent 28%), linear-gradient(180deg, ${brand.bgDeep} 0%, ${brand.bgPanel} 48%, ${brand.bgDeep} 100%)`,
          color: "white",
          fontFamily: brand.font,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "92px 92px",
            opacity: 0.35,
          }}
        />
        <div
          style={{
            display: "flex",
            width: "100%",
            padding: "58px 64px",
            justifyContent: "space-between",
            gap: 48,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: 690,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                fontSize: 28,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: `linear-gradient(180deg, ${brand.accentLogoTint}, rgba(255,255,255,0.05))`,
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "-0.06em",
                  color: "white",
                }}
              >
                K
              </div>
              Kinova
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
              <div
                style={{
                  fontSize: 64,
                  lineHeight: 1.04,
                  letterSpacing: "-0.06em",
                  fontWeight: 700,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span>The daily minimum is free.</span>
                <span style={{ color: "#8ab4ff" }}>
                  Progression is the product.
                </span>
              </div>
              <div
                style={{
                  fontSize: 28,
                  lineHeight: 1.45,
                  color: "rgba(255,255,255,0.72)",
                  maxWidth: 620,
                }}
              >
                A free daily routine holds your baseline. Kinova Pro writes
                next week&apos;s targets — advance, hold, or regress.
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 18,
                flexWrap: "wrap",
              }}
            >
              {[
                "Free daily minimum",
                "Adaptive weekly targets",
                "Advance · Hold · Regress",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "14px 18px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    fontSize: 20,
                    color: "rgba(255,255,255,0.82)",
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: brand.accent,
                    }}
                  />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              width: 330,
              borderRadius: 34,
              border: "1px solid rgba(255,255,255,0.12)",
              background:
                "linear-gradient(180deg, rgba(10,13,19,0.98), rgba(6,9,13,0.92))",
              padding: 24,
              boxShadow: "0 32px 120px rgba(5,7,11,0.6)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 18,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              Kinova Pro · Week 1 → 8
            </div>
            <div
              style={{
                fontSize: 34,
                lineHeight: 1.1,
                fontWeight: 700,
              }}
            >
              The progression engine
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 6,
              }}
            >
              {[
                "Push-ups: 8 → 12 reps",
                "Side plank: 30s → 45s",
                "Week 5: regress — direction kept",
              ].map((item, index) => (
                <div
                  key={item}
                  style={{
                    borderRadius: 24,
                    border:
                      index === 2
                        ? `1px solid ${brand.accentBorder}`
                        : "1px solid rgba(255,255,255,0.08)",
                    background: index === 2 ? brand.accentSoftBg : "rgba(255,255,255,0.04)",
                    padding: "18px 18px",
                    fontSize: 20,
                    lineHeight: 1.35,
                    color: "rgba(255,255,255,0.88)",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
