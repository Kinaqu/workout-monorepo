export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export function noContent(status = 204): Response {
  return new Response(null, { status });
}

export function errorResponse(message: string, status = 400, detail?: string): Response {
  return json(detail ? { error: message, detail } : { error: message }, status);
}

export function methodNotAllowed(): Response {
  return errorResponse("Method not allowed", 405);
}
