const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Workout-Date, X-Reset-Token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export function noContent(status = 204): Response {
  return new Response(null, {
    status,
    headers: CORS_HEADERS,
  });
}

export function errorResponse(message: string, status = 400, detail?: string): Response {
  return json(detail ? { error: message, detail } : { error: message }, status);
}

export function methodNotAllowed(): Response {
  return errorResponse("Method not allowed", 405);
}
