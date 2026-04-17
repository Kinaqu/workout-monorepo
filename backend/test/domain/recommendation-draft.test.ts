import { describe, expect, it } from "vitest";
import { validateRecommendationDraftJson } from "../../src/domain/recommendation-draft";

function buildValidDraftJson() {
  return {
    status: "draft",
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
            type: "reps",
            target_min: 8,
            target_max: 12,
            max_sets: 4,
            recommended: true,
          },
          {
            catalog_exercise_id: "catalog_incline_pushups",
            exercise_id: "incline_pushups",
            name: "Incline Push-ups",
            type: "reps",
            target_min: 10,
            target_max: 15,
            max_sets: 4,
            recommended: false,
          },
        ],
      },
    ],
    generator_version: "generator-v1",
    catalog_seed_version: "catalog-v1",
  };
}

describe("recommendation draft validation", () => {
  it("accepts a valid minimal draft json payload", () => {
    const input = buildValidDraftJson();
    expect(validateRecommendationDraftJson(input)).toEqual(input);
  });

  it("rejects unknown selected structure ids", () => {
    const input = buildValidDraftJson();
    input.selected_structure_id = "missing";

    expect(() => validateRecommendationDraftJson(input)).toThrowError(
      /selected_structure_id/i
    );
  });

  it("rejects duplicate structure ids", () => {
    const input = buildValidDraftJson();
    input.structures.push({
      ...input.structures[0],
      recommended: false,
    });

    expect(() => validateRecommendationDraftJson(input)).toThrowError(/structure ids/i);
  });

  it("rejects duplicate slot ids", () => {
    const input = buildValidDraftJson();
    input.exercise_slots.push({
      ...input.exercise_slots[0],
    });

    expect(() => validateRecommendationDraftJson(input)).toThrowError(/slot ids/i);
  });

  it("rejects recommended exercise ids that are not present in options", () => {
    const input = buildValidDraftJson();
    input.exercise_slots[0].recommended_exercise_id = "missing";

    expect(() => validateRecommendationDraftJson(input)).toThrowError(
      /recommended_exercise_id/i
    );
  });

  it("rejects selected exercise ids that are not present in options", () => {
    const input = buildValidDraftJson();
    input.exercise_slots[0].selected_exercise_id = "missing";

    expect(() => validateRecommendationDraftJson(input)).toThrowError(
      /selected_exercise_id/i
    );
  });

  it("rejects mixed exercise option types inside one slot", () => {
    const input = buildValidDraftJson();
    input.exercise_slots[0].options[1].type = "time";

    expect(() => validateRecommendationDraftJson(input)).toThrowError(
      /share the same exercise type/i
    );
  });

  it("rejects schedules that reference unknown workout keys", () => {
    const input = buildValidDraftJson();
    input.structures[0].schedule.monday = "Z";

    expect(() => validateRecommendationDraftJson(input)).toThrowError(
      /references unknown workout key/i
    );
  });

  it("rejects invalid target ranges", () => {
    const input = buildValidDraftJson();
    input.exercise_slots[0].options[0].target_max = 7;

    expect(() => validateRecommendationDraftJson(input)).toThrowError(/target_max/i);
  });

  it("rejects non-positive max set counts", () => {
    const input = buildValidDraftJson();
    input.exercise_slots[0].options[0].max_sets = 0;

    expect(() => validateRecommendationDraftJson(input)).toThrowError(/max_sets/i);
  });
});
