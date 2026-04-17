import { describe, expect, it } from "vitest";
import { getAllowedCorsOrigins, isCorsOriginAllowed, resolveCorsOrigin } from "./cors";

describe("getAllowedCorsOrigins", () => {
  it("falls back to local dev origins when no env override is set", () => {
    expect(getAllowedCorsOrigins({})).toEqual([
      "http://127.0.0.1:3000",
      "http://localhost:3000",
      "http://127.0.0.1:4173",
      "http://localhost:4173",
    ]);
  });

  it("uses only configured origins when an override is provided", () => {
    expect(
      getAllowedCorsOrigins({
        CORS_ALLOWED_ORIGINS: "https://app.example.com, https://preview.example.com ,invalid-origin",
      })
    ).toEqual(["https://app.example.com", "https://preview.example.com"]);
  });
});

describe("isCorsOriginAllowed", () => {
  it("allows exact configured origins", () => {
    expect(
      isCorsOriginAllowed("https://app.example.com", {
        CORS_ALLOWED_ORIGINS: "https://app.example.com,https://api.example.com",
      })
    ).toBe(true);
  });

  it("allows default local development origins when no override is set", () => {
    expect(isCorsOriginAllowed("http://localhost:3000", {})).toBe(true);
    expect(isCorsOriginAllowed("http://127.0.0.1:4173", {})).toBe(true);
  });

  it("allows wildcard vercel preview origins when a pattern is configured", () => {
    expect(
      isCorsOriginAllowed("https://workout-frontend-qncb9aihl-diars-projects-3dd081b1.vercel.app", {
        CORS_ALLOWED_ORIGIN_PATTERNS: "https://workout-frontend-*.vercel.app",
      })
    ).toBe(true);
  });

  it("rejects unrelated vercel origins when a narrow pattern is configured", () => {
    expect(
      isCorsOriginAllowed("https://kinova-landing-83bnjeszzb964mkwyxdph2prdngc.vercel.app", {
        CORS_ALLOWED_ORIGIN_PATTERNS: "https://workout-frontend-*.vercel.app",
      })
    ).toBe(false);
  });

  it("rejects invalid origins and invalid patterns", () => {
    expect(
      isCorsOriginAllowed("not-a-valid-origin", {
        CORS_ALLOWED_ORIGIN_PATTERNS: "https://workout-frontend-*.vercel.app,invalid-pattern",
      })
    ).toBe(false);
    expect(
      isCorsOriginAllowed("https://workout-frontend-qncb9aihl-diars-projects-3dd081b1.vercel.app", {
        CORS_ALLOWED_ORIGIN_PATTERNS: "invalid-pattern",
      })
    ).toBe(false);
  });
});

describe("resolveCorsOrigin", () => {
  it("returns the origin when it is allowed", () => {
    expect(
      resolveCorsOrigin("https://workout-frontend-esrp5xy0a-diars-projects-3dd081b1.vercel.app", {
        CORS_ALLOWED_ORIGIN_PATTERNS: "https://workout-frontend-*.vercel.app",
      })
    ).toBe("https://workout-frontend-esrp5xy0a-diars-projects-3dd081b1.vercel.app");
  });

  it("returns null when the origin is not allowed", () => {
    expect(
      resolveCorsOrigin("https://kinova-landing-83bnjeszzb964mkwyxdph2prdngc.vercel.app", {
        CORS_ALLOWED_ORIGIN_PATTERNS: "https://workout-frontend-*.vercel.app",
      })
    ).toBeNull();
  });
});
