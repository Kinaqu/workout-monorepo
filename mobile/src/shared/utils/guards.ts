export function ensureApiObject<T>(data: T, resourceName: string): T & object {
  if (data && typeof data === 'object') {
    return data as T & object;
  }

  throw new Error(`Invalid ${resourceName} response`);
}
