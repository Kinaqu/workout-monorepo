import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "cloudflare:workers";
import { app } from "../../src/app";
import { installClerkTestAuth } from "../helpers/auth";
import { authHeaders, ONBOARDING_ANSWERS } from "../helpers/fixtures";
import { fetchJson, resetPersistence } from "../helpers/runtime";

async function completeOnboarding(token: string) {
  return fetchJson(app.request.bind(app), "/onboarding/complete", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }, token),
    body: JSON.stringify(ONBOARDING_ANSWERS),
  });
}

describe("recommendation draft routes", () => {
  let token = "";

  beforeAll(async () => {
    token = (await installClerkTestAuth()).token;
  });

  beforeEach(async () => {
    vi.useRealTimers();
    await resetPersistence();
  });

  it("creates a recommendation draft during onboarding completion and supports the draft lifecycle", async () => {
    const headers = (extra: HeadersInit = {}) => authHeaders(extra, token);

    const completed = await completeOnboarding(token);
    expect(completed.response.status, JSON.stringify(completed.body)).toBe(200);

    const currentDraft = await fetchJson(app.request.bind(app), "/recommendation-draft", {
      headers: headers(),
    });
    expect(currentDraft.response.status, JSON.stringify(currentDraft.body)).toBe(200);

    const created = await fetchJson(app.request.bind(app), "/recommendation-draft", {
      method: "POST",
      headers: headers(),
    });
    expect(created.response.status, JSON.stringify(created.body)).toBe(200);

    const createdBody = created.body as {
      id: string;
      selected_structure_id: string;
      draft: {
        structures: Array<{ id: string }>;
        exercise_slots: Array<{
          slot_id: string;
          selected_exercise_id: string;
          options: Array<{ catalog_exercise_id: string; exercise_id: string }>;
        }>;
      };
    };

    const alternativeStructure =
      createdBody.draft.structures.find(structure => structure.id !== createdBody.selected_structure_id)?.id ?? null;
    expect(alternativeStructure).toBeTruthy();

    const changedStructure = await fetchJson(app.request.bind(app), "/recommendation-draft/structure", {
      method: "PATCH",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        draft_id: createdBody.id,
        structure_id: alternativeStructure,
      }),
    });
    expect(changedStructure.response.status, JSON.stringify(changedStructure.body)).toBe(200);

    const changedStructureBody = changedStructure.body as {
      selected_structure_id: string;
      draft: {
        exercise_slots: Array<{
          slot_id: string;
          workout_key: string;
          selected_exercise_id: string;
          options: Array<{ catalog_exercise_id: string; exercise_id: string }>;
        }>;
      };
    };
    expect(changedStructureBody.selected_structure_id).toBe(alternativeStructure);

    const invalidStructure = await fetchJson(app.request.bind(app), "/recommendation-draft/structure", {
      method: "PATCH",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        draft_id: createdBody.id,
        structure_id: "missing_structure",
      }),
    });
    expect(invalidStructure.response.status).toBe(409);

    const slot = changedStructureBody.draft.exercise_slots[0];
    expect(slot).toBeDefined();
    const replacement =
      slot.options.find(option =>
        !changedStructureBody.draft.exercise_slots.some(
          otherSlot =>
            otherSlot.slot_id !== slot.slot_id &&
            otherSlot.workout_key === slot.workout_key &&
            otherSlot.selected_exercise_id === option.exercise_id
        )
      ) ?? slot.options[0];
    expect(replacement).toBeDefined();

    const replaced = await fetchJson(app.request.bind(app), "/recommendation-draft/exercise", {
      method: "PATCH",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        draft_id: createdBody.id,
        slot_id: slot.slot_id,
        catalog_exercise_id: replacement.catalog_exercise_id,
      }),
    });
    expect(replaced.response.status, JSON.stringify(replaced.body)).toBe(200);
    const replacedBody = replaced.body as {
      draft: {
        exercise_slots: Array<{
          slot_id: string;
          selected_exercise_id: string;
        }>;
      };
    };
    expect(
      replacedBody.draft.exercise_slots.find(currentSlot => currentSlot.slot_id === slot.slot_id)?.selected_exercise_id
    ).toBe(replacement.exercise_id);

    const activated = await fetchJson(app.request.bind(app), "/recommendation-draft/activate", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        draft_id: createdBody.id,
      }),
    });
    expect(activated.response.status, JSON.stringify(activated.body)).toBe(200);

    const activatedAgain = await fetchJson(app.request.bind(app), "/recommendation-draft/activate", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        draft_id: createdBody.id,
      }),
    });
    expect(activatedAgain.response.status, JSON.stringify(activatedAgain.body)).toBe(200);

    const editAfterActivation = await fetchJson(app.request.bind(app), "/recommendation-draft/structure", {
      method: "PATCH",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        draft_id: createdBody.id,
        structure_id: createdBody.selected_structure_id,
      }),
    });
    expect(editAfterActivation.response.status).toBe(409);

    const program = await fetchJson(app.request.bind(app), "/program", {
      headers: headers(),
    });
    expect(program.response.status).toBe(200);
  });

  it("rejects draft creation when no stored profile exists", async () => {
    const headers = (extra: HeadersInit = {}) => authHeaders(extra, token);

    const me = await fetchJson(app.request.bind(app), "/me", { headers: headers() });
    expect(me.response.status).toBe(200);

    const created = await fetchJson(app.request.bind(app), "/recommendation-draft", {
      method: "POST",
      headers: headers(),
    });

    expect(created.response.status).toBe(409);
    expect(created.body).toEqual({ error: "Onboarding not completed" });
  });

  it("accepts PATCH preflight through CORS middleware", async () => {
    const response = await app.request("/recommendation-draft/structure", {
      method: "OPTIONS",
      headers: {
        Origin: env.CORS_ORIGIN,
        "Access-Control-Request-Method": "PATCH",
      },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("PATCH");
  });
});
