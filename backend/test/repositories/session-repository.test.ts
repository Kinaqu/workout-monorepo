import { beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { DEFAULT_PROGRAM } from "../../src/domain/default-program";
import { createProgramDraft } from "../../src/domain/program";
import { enrichSessionInput } from "../../src/domain/session";
import type { SessionWriteInput } from "../../src/domain/session";
import { ProgramRepository } from "../../src/repositories/program-repository";
import { SessionRepository } from "../../src/repositories/session-repository";
import { UserRepository } from "../../src/repositories/user-repository";
import { TEST_USER } from "../helpers/fixtures";
import { resetPersistence } from "../helpers/runtime";

const { userId, username } = TEST_USER;

function buildSessionInput(sessionDate: string, overrides: Partial<SessionWriteInput> = {}): SessionWriteInput {
  return {
    sessionDate,
    note: `note for ${sessionDate}`,
    workoutType: "A",
    source: "json",
    rawText: null,
    exercises: [
      { id: "pushups", sets: [10, 9, 8] },
      { id: "squats", sets: [15, 15] },
    ],
    unmatched: [],
    ...overrides,
  };
}

describe("SessionRepository.listSessions", () => {
  beforeEach(async () => {
    await resetPersistence();
  });

  it("returns the same aggregates as loading each session individually", async () => {
    const users = new UserRepository(env);
    const programs = new ProgramRepository(env);
    const sessions = new SessionRepository(env);

    await users.upsert(userId, username);
    const program = await programs.createProgramVersion(userId, createProgramDraft(DEFAULT_PROGRAM), "api");

    const inputs: SessionWriteInput[] = [
      buildSessionInput("2026-04-01"),
      buildSessionInput("2026-04-02", {
        workoutType: "B",
        exercises: [{ id: "dead_bug", sets: [12] }],
      }),
      buildSessionInput("2026-04-03", {
        workoutType: null,
        source: "text",
        rawText: "отжимания 10 10\nburpees 8 8",
        exercises: [{ id: "pushups", sets: [10, 10] }],
        unmatched: ["burpees 8 8"],
      }),
    ];

    for (const input of inputs) {
      await sessions.createSession(userId, program, enrichSessionInput(program, input));
    }

    const listed = await sessions.listSessions(userId, 50);
    expect(listed).toHaveLength(3);
    // Newest session date first.
    expect(listed.map(session => session.sessionDate)).toEqual(["2026-04-03", "2026-04-02", "2026-04-01"]);

    for (const record of listed) {
      const individual = await sessions.getSession(userId, record.id);
      expect(record).toEqual(individual);
    }

    const textSession = listed[0];
    expect(textSession.rawText).toBe("отжимания 10 10\nburpees 8 8");
    expect(textSession.unmatched).toEqual(["burpees 8 8"]);

    const jsonSession = listed[2];
    expect(jsonSession.rawText).toBeNull();
    expect(jsonSession.exercises.map(exercise => exercise.exerciseKey)).toEqual(["pushups", "squats"]);
    expect(jsonSession.exercises.map(exercise => exercise.sets)).toEqual([
      [10, 9, 8],
      [15, 15],
    ]);
    expect(jsonSession.exercises.map(exercise => exercise.sortOrder)).toEqual([0, 1]);
  });

  it("filters by date and respects the limit", async () => {
    const users = new UserRepository(env);
    const programs = new ProgramRepository(env);
    const sessions = new SessionRepository(env);

    await users.upsert(userId, username);
    const program = await programs.createProgramVersion(userId, createProgramDraft(DEFAULT_PROGRAM), "api");

    for (const date of ["2026-04-01", "2026-04-02", "2026-04-03"]) {
      await sessions.createSession(userId, program, enrichSessionInput(program, buildSessionInput(date)));
    }

    const filtered = await sessions.listSessions(userId, 50, "2026-04-02");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].sessionDate).toBe("2026-04-02");

    const limited = await sessions.listSessions(userId, 2);
    expect(limited.map(session => session.sessionDate)).toEqual(["2026-04-03", "2026-04-02"]);

    expect(await sessions.listSessions(userId, 50, "2026-01-01")).toEqual([]);
  });
});
