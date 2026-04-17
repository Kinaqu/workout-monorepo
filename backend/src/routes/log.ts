import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppEnv } from "../app";
import { authMiddleware } from "../middleware/auth";
import { bearerSecurity } from "../openapi/config";
import {
  ErrorResponseSchema,
  JsonLogRequestSchema,
  LogCreateResponseSchema,
  WorkoutDateHeaderSchema,
} from "../openapi/schemas";
import { createAppContext } from "../services/app-context";

const createLogRoute = createRoute({
  method: "post",
  path: "/log",
  middleware: authMiddleware,
  security: bearerSecurity,
  tags: ["Log"],
  summary: "Create workout log",
  description: "Creates a workout session from structured JSON. X-Workout-Date can override the session date.",
  request: {
    headers: WorkoutDateHeaderSchema,
    body: {
      required: false,
      content: {
        "application/json": {
          schema: JsonLogRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Workout session created.",
      content: {
        "application/json": {
          schema: LogCreateResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid request body or date header.",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid Clerk Bearer token.",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    409: {
      description: "Onboarding not completed, no active program exists, or a log already exists for the date.",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    503: {
      description: "Clerk JWKS unavailable.",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

export function registerLogRoutes(app: OpenAPIHono<AppEnv>) {
  app.openapi(createLogRoute, async c => {
    const auth = c.get("auth");
    const requestedDate = c.req.header("X-Workout-Date");
    const contentType = c.req.header("Content-Type") ?? "";
    const { sessionService } = createAppContext(c.env);

    if (!contentType.includes("application/json")) {
      return c.json(
        {
          error: "Unsupported content type. Use application/json for /log or text/plain for /log/import-text.",
        },
        400
      );
    }

    return c.json(
      (await sessionService.createFromJson(
        auth.userId,
        auth.username,
        c.req.valid("json"),
        requestedDate
      )) as z.infer<
        typeof LogCreateResponseSchema
      >,
      200
    );
  });

  app.post("/log/import-text", authMiddleware, async c => {
    const auth = c.get("auth");
    const requestedDate = c.req.header("X-Workout-Date");
    const contentType = c.req.header("Content-Type") ?? "";
    const { sessionService } = createAppContext(c.env);

    if (!contentType.includes("text/plain")) {
      return c.json(
        {
          error: "Unsupported content type. Use text/plain for /log/import-text.",
        },
        400
      );
    }

    return c.json(
      await sessionService.createFromText(auth.userId, auth.username, await c.req.text(), requestedDate),
      200
    );
  });

  app.all("/log", authMiddleware, c =>
    c.json(
      {
        error: "Method not allowed",
      },
      405
    )
  );

  app.all("/log/import-text", authMiddleware, c =>
    c.json(
      {
        error: "Method not allowed",
      },
      405
    )
  );
}
