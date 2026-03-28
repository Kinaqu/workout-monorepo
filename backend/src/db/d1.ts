export async function fetchAll<T>(statement: D1PreparedStatement): Promise<T[]> {
  const result = await statement.all<T>();
  if (!result.success) {
    throw new Error("D1 query failed");
  }
  return result.results;
}

export async function fetchFirst<T>(statement: D1PreparedStatement): Promise<T | null> {
  const result = await statement.first<T>();
  return result ?? null;
}
