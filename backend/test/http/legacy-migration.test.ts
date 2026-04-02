import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "cloudflare:workers";
import { DEFAULT_PROGRAM } from "../../src/domain/default-program";
import { installClerkTestAuth } from "../helpers/auth";
import { authHeaders, TEST_USER } from "../helpers/fixtures";
import { fetchJson } from "../helpers/runtime";
import { app } from "../../src/app";

describe("legacy KV import", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("imports legacy program data only when D1 state has not been migrated yet", async () => {
    const { token } = await installClerkTestAuth();
    const headers = (extra: HeadersInit = {}) => authHeaders(extra, token);

    await env.KV.put(`program:${TEST_USER.userId}`, JSON.stringify(DEFAULT_PROGRAM));
    await env.KV.put(
      `state:${TEST_USER.userId}`,
      JSON.stringify({
        program_id: DEFAULT_PROGRAM.id,
        sets: { pushups: 3 },
        last_progression: "2026-03-31",
      })
    );
    await env.KV.put(
      `log:${TEST_USER.userId}:2026-04-01`,
      JSON.stringify({
        date: "2026-04-01",
        workout_type: "A",
        exercises: [{ id: "pushups", name: "Отжимания", sets: [12, 12, 10] }],
        note: "legacy session",
      })
    );

    const first = await fetchJson(app.request.bind(app), "/me", { headers: headers() });
    expect(first.response.status).toBe(200);

    const firstBody = first.body as {
      lifecycle: { has_active_program: boolean; legacy_kv_migrated_at: string | null };
      active_program: { source: string } | null;
    };

    expect(firstBody.lifecycle.has_active_program).toBe(true);
    expect(firstBody.lifecycle.legacy_kv_migrated_at).not.toBeNull();
    expect(firstBody.active_program?.source).toBe("legacy-kv");

    const sessions = await fetchJson(app.request.bind(app), "/sessions", { headers: headers() });
    expect((sessions.body as { count: number }).count).toBe(1);

    const second = await fetchJson(app.request.bind(app), "/me", { headers: headers() });
    expect(second.response.status).toBe(200);
    expect((second.body as { lifecycle: { legacy_kv_migrated_at: string | null } }).lifecycle.legacy_kv_migrated_at).not.toBeNull();
  });
});
