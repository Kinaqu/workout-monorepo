export function ensureApiObject(data, resourceName) {
  if (data && typeof data === 'object') {
    return data;
  }

  throw new Error(`Invalid ${resourceName} response`);
}
