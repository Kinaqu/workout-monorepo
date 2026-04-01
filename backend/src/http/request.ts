import { badRequest } from "../lib/app-error";
import { errorResponse } from "./response";

export async function readJson<T>(request: Request): Promise<T | Response> {
  try {
    return await request.json<T>();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }
}

export async function readJsonOrThrow<T>(request: Request): Promise<T> {
  try {
    return await request.json<T>();
  } catch {
    badRequest("Invalid JSON");
  }
}

export function getNumberParam(url: URL, name: string, fallback: number): number {
  const raw = url.searchParams.get(name);
  if (!raw) return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}
