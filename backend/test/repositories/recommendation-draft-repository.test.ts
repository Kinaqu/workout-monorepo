import { beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { RecommendationDraftRepository } from "../../src/repositories/recommendation-draft-repository";
import { UserRepository } from "../../src/repositories/user-repository";
import { resetPersistence } from "../helpers/runtime";

function buildDraftJson() {
  return {
    status: "draft" as const,
    profile_snapshot: {
      primaryGoal: "strength",
      experienceLevel: "beginner",
      trainingDaysPerWeek: 3,
      sessionDurationMinutes: 45,
      splitPreference: "three_day",
      volumeLevel: "standard",
      equipmentAccess: ["bodyweight", "bands"],
      focusAreas: ["upper_body", "core"],
      limitationTags: [],
      preferredStyles: ["balanced"],
      preferredWorkoutTags: ["strength", "upper", "core"],
      excludedWorkoutTags: [],
    },
    structures: [
      {
        id: "recommended_three_day",
        label: "3-day balanced",
        description: "Mon / Wed / Fri",
        schedule: {
          monday: "A",
          tuesday: "rest",
          wednesday: "B",
          thursday: "rest",
          friday: "C",
          saturday: "rest",
          sunday: "rest",
        },
        workouts: [
          { key: "A", name: "Workout A", tags: ["strength", "upper"] },
          { key: "B", name: "Workout B", tags: ["strength", "lower"] },
          { key: "C", name: "Workout C", tags: ["balanced", "core"] },
        ],
        recommended: true,
      },
    ],
    selected_structure_id: "recommended_three_day",
    exercise_slots: [
      {
        slot_id: "A:0",
        workout_key: "A",
        workout_name: "Workout A",
        slot_index: 0,
        blueprint_tags: ["strength", "upper"],
        recommended_exercise_id: "pushups",
        selected_exercise_id: "pushups",
        options: [
          {
            catalog_exercise_id: "catalog_pushups",
            exercise_id: "pushups",
            name: "Push-ups",
            type: "reps" as const,
            target_min: 8,
            target_max: 12,
            max_sets: 4,
            recommended: true,
          },
        ],
      },
    ],
    generator_version: "generator-v1",
    catalog_seed_version: "catalog-v1",
  };
}

describe("recommendation draft repository", () => {
  const users = new UserRepository(env);
  const repository = new RecommendationDraftRepository(env);

  beforeEach(async () => {
    await resetPersistence();
    await users.upsert("user_draft_test", "draft-test");
  });

  async function insertProgram(programId = "program_activated_1") {
    await env.DB.prepare(
      `INSERT INTO programs (
        id,
        user_id,
        program_key,
        program_family_id,
        version_number,
        previous_program_id,
        name,
        is_active,
        source,
        created_at,
        updated_at,
        superseded_at
      ) VALUES (?, ?, ?, ?, 1, NULL, ?, 1, 'generated', ?, ?, NULL)`
    )
      .bind(
        programId,
        "user_draft_test",
        "generated_three_day_strength",
        "program_family_strength_v1",
        "Strength Plan",
        "2026-04-20T12:00:00.000Z",
        "2026-04-20T12:00:00.000Z"
      )
      .run();

    return programId;
  }

  it("creates and loads a recommendation draft row", async () => {
    const created = await repository.upsert({
      userId: "user_draft_test",
      generatorVersion: "generator-v1",
      catalogSeedVersion: "catalog-v1",
      selectedStructureId: "recommended_three_day",
      draftJson: buildDraftJson(),
    });

    expect(created.userId).toBe("user_draft_test");
    expect(created.status).toBe("draft");
    expect(created.selectedStructureId).toBe("recommended_three_day");
    expect(created.draftJson.generator_version).toBe("generator-v1");

    const loaded = await repository.getByUserId("user_draft_test");
    expect(loaded).not.toBeNull();
    expect(loaded?.id).toBe(created.id);
  });

  it("updates an existing row on upsert", async () => {
    const initial = await repository.upsert({
      userId: "user_draft_test",
      generatorVersion: "generator-v1",
      catalogSeedVersion: "catalog-v1",
      selectedStructureId: "recommended_three_day",
      draftJson: buildDraftJson(),
    });

    const nextDraft = buildDraftJson();
    nextDraft.selected_structure_id = "recommended_three_day";
    nextDraft.exercise_slots[0].selected_exercise_id = "pushups";

    const updated = await repository.upsert({
      userId: "user_draft_test",
      generatorVersion: "generator-v1",
      catalogSeedVersion: "catalog-v1",
      selectedStructureId: "recommended_three_day",
      draftJson: nextDraft,
    });

    expect(updated.id).toBe(initial.id);
    expect(updated.draftJson.selected_structure_id).toBe("recommended_three_day");
  });

  it("rejects invalid draft json on write", async () => {
    const invalid = buildDraftJson();
    invalid.selected_structure_id = "missing";

    await expect(
      repository.upsert({
        userId: "user_draft_test",
        generatorVersion: "generator-v1",
        catalogSeedVersion: "catalog-v1",
        selectedStructureId: "missing",
        draftJson: invalid,
      })
    ).rejects.toThrow(/selected_structure_id/i);
  });

  it("supports marking a draft as activated", async () => {
    const programId = await insertProgram();

    await repository.upsert({
      userId: "user_draft_test",
      generatorVersion: "generator-v1",
      catalogSeedVersion: "catalog-v1",
      selectedStructureId: "recommended_three_day",
      draftJson: buildDraftJson(),
    });

    const activated = await repository.markActivated({
      userId: "user_draft_test",
      activatedProgramId: programId,
      activatedAt: "2026-04-20T12:00:00.000Z",
    });

    expect(activated.status).toBe("activated");
    expect(activated.activatedProgramId).toBe(programId);
    expect(activated.activatedAt).toBe("2026-04-20T12:00:00.000Z");
    expect(activated.draftJson.status).toBe("activated");
    expect(activated.draftJson.activation_context?.activated_program_id).toBe(programId);
  });

  it("rejects activation for missing drafts", async () => {
    await expect(
      repository.markActivated({
        userId: "missing_user",
        activatedProgramId: "program_1",
      })
    ).rejects.toThrow(/not found/i);
  });

  it("deletes a draft row by user id", async () => {
    await repository.upsert({
      userId: "user_draft_test",
      generatorVersion: "generator-v1",
      catalogSeedVersion: "catalog-v1",
      selectedStructureId: "recommended_three_day",
      draftJson: buildDraftJson(),
    });

    await repository.deleteByUserId("user_draft_test");
    const loaded = await repository.getByUserId("user_draft_test");
    expect(loaded).toBeNull();
  });

  it("rejects inconsistent storage metadata during update", async () => {
    await repository.upsert({
      userId: "user_draft_test",
      generatorVersion: "generator-v1",
      catalogSeedVersion: "catalog-v1",
      selectedStructureId: "recommended_three_day",
      draftJson: buildDraftJson(),
    });

    await env.DB.prepare(
      "UPDATE recommendation_drafts SET generator_version = ? WHERE user_id = ?"
    )
      .bind("generator-v2", "user_draft_test")
      .run();

    await expect(
      repository.updateDraft("user_draft_test", {
        selectedStructureId: "recommended_three_day",
      })
    ).rejects.toThrow(/generator_version/i);
  });
});
