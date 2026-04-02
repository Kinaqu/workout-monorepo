import { describe, expect, it } from "vitest";
import { app } from "../../src/app";
import { fetchJson } from "../helpers/runtime";

describe("public and auth-protected routes", () => {
  it("serves OpenAPI and legacy auth compatibility endpoints", async () => {
    const openApi = await fetchJson(app.request.bind(app), "/openapi.json");
    expect(openApi.response.status).toBe(200);
    expect((openApi.body as { info: { title: string } }).info.title).toBe("Workout Manager Backend API");

    const register = await fetchJson(app.request.bind(app), "/auth/register", { method: "POST" });
    expect(register.response.status).toBe(410);
    expect((register.body as { error: string }).error).toContain("Local auth is disabled");
  });

  it("rejects protected routes without a Clerk bearer token", async () => {
    const me = await fetchJson(app.request.bind(app), "/me");
    expect(me.response.status).toBe(401);
    expect(me.body).toEqual({ error: "Unauthorized" });
  });
});
