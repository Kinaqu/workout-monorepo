import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../../src/app";
import { installClerkTestAuth } from "../helpers/auth";
import { authHeaders } from "../helpers/fixtures";
import { fetchJson, resetPersistence } from "../helpers/runtime";

const PROGRAM = {
  id: "ownership-test",
  name: "Ownership Program",
  schedule: {
    monday: "A",
    tuesday: "rest",
    wednesday: "rest",
    thursday: "rest",
    friday: "rest",
    saturday: "rest",
    sunday: "rest",
  },
  workouts: {
    A: {
      name: "Workout A",
      exercises: [{ id: "pushups", name: "Push-ups", type: "reps", max_sets: 3, reps: { min: 8, max: 12 } }],
    },
  },
};

describe("resource ownership", () => {
  beforeEach(async () => {
    await resetPersistence();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("never exposes user A's program or sessions to user B", async () => {
    const { token: tokenA, mintToken } = await installClerkTestAuth();
    const tokenB = await mintToken({ sub: "user_intruder_456", username: "intruder" });

    // User A owns a program and a logged session.
    const saved = await fetchJson(app.request.bind(app), "/program", {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }, tokenA),
      body: JSON.stringify(PROGRAM),
    });
    expect(saved.response.status).toBe(200);

    const logged = await fetchJson(app.request.bind(app), "/log", {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json", "X-Workout-Date": "2026-04-06" }, tokenA),
      body: JSON.stringify({ exercises: [{ id: "pushups", sets: [10, 10] }] }),
    });
    expect(logged.response.status).toBe(200);
    const sessionId = (logged.body as { session: { id: string } }).session.id;

    // User B sees an empty world, not A's data.
    const bSessions = await fetchJson(app.request.bind(app), "/sessions", {
      headers: authHeaders({}, tokenB),
    });
    expect(bSessions.response.status).toBe(200);
    expect(bSessions.body).toEqual({ sessions: [], count: 0 });

    const bSessionById = await fetchJson(app.request.bind(app), `/sessions/${sessionId}`, {
      headers: authHeaders({}, tokenB),
    });
    expect(bSessionById.response.status).toBe(404);

    const bProgram = await fetchJson(app.request.bind(app), "/program", {
      headers: authHeaders({}, tokenB),
    });
    expect(bProgram.response.status).toBe(409);
    expect((bProgram.body as { error: string }).error).toBe("Onboarding not completed");

    const bProgression = await fetchJson(app.request.bind(app), "/progression/run", {
      method: "POST",
      headers: authHeaders({}, tokenB),
    });
    expect(bProgression.response.status).toBe(409);

    // A's data is untouched by B's attempts.
    const aProgram = await fetchJson(app.request.bind(app), "/program", {
      headers: authHeaders({}, tokenA),
    });
    expect(aProgram.response.status).toBe(200);
    expect((aProgram.body as { progressionState: Record<string, unknown> }).progressionState.pushups).toMatchObject({
      sets: 1,
      min: 8,
      max: 12,
    });

    const aSession = await fetchJson(app.request.bind(app), `/sessions/${sessionId}`, {
      headers: authHeaders({}, tokenA),
    });
    expect(aSession.response.status).toBe(200);
  });
});
