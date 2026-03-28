import { ProgramDefinitionInput } from "../domain/program";
import { Env } from "../env";

interface LegacyState {
  program_id: string;
  sets: Record<string, number>;
  last_progression: string | null;
}

interface LegacyLog {
  date: string;
  workout_type?: string | null;
  exercises?: Array<{ id: string; name?: string; sets: number[] }>;
  note?: string;
  unmatched?: string[];
  source?: string;
}

export interface LegacySnapshot {
  program: ProgramDefinitionInput | null;
  state: LegacyState | null;
  logs: LegacyLog[];
}

export class LegacyKvRepository {
  constructor(private readonly env: Env) {}

  async readUserSnapshot(userId: string): Promise<LegacySnapshot> {
    const [programRaw, stateRaw, logs] = await Promise.all([
      this.env.KV.get(`program:${userId}`),
      this.env.KV.get(`state:${userId}`),
      this.readLogs(userId),
    ]);

    return {
      program: programRaw ? JSON.parse(programRaw) as ProgramDefinitionInput : null,
      state: stateRaw ? JSON.parse(stateRaw) as LegacyState : null,
      logs,
    };
  }

  private async readLogs(userId: string): Promise<LegacyLog[]> {
    const prefix = `log:${userId}:`;
    const entries: LegacyLog[] = [];
    let cursor: string | undefined;

    do {
      const page = await this.env.KV.list({ prefix, cursor });
      const keys = page.keys.map(item => item.name);
      if (keys.length > 0) {
        const values = await Promise.all(keys.map(key => this.env.KV.get(key)));
        for (const value of values) {
          if (!value) continue;
          entries.push(JSON.parse(value) as LegacyLog);
        }
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);

    return entries.sort((left, right) => left.date.localeCompare(right.date));
  }
}
