import { describe, expect, it } from "vitest";
import { getAllowedCorsOrigins } from "./cors";

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
