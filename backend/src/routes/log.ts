import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppEnv } from "../app";
import { authMiddleware } from "../middleware/auth";
import { bearerSecurity } from "../openapi/config";
import {
  DateParamSchema,
  ErrorResponseSchema,
  JsonLogRequestSchema,
  LegacyLogByDateResponseSchema,
  LogCreateResponseSchema,
  PlainTextLogRequestSchema,
  WorkoutDateHeaderSchema,
} from "../openapi/schemas";
import { createAppContext } from "../services/app-context";
import { SessionAlreadyExistsError } from "../services/session-service";

const getLogRoute = createRoute({
  method: "get",
  path: "/log/{date}",
  middleware: authMiddleware,
  security: bearerSecurity,
  tags: ["Log"],
  summary: "Get legacy log by date",
  description: "Returns the latest legacy-compatible log payload for a given date together with all sessions stored for that day.",
  request: {
    params: DateParamSchema,
  },
  responses: {
    200: {
      description: "Legacy-compatible log response.",
      content: {
        "application/json": {
          schema: LegacyLogByDateResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid date.",
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
    404: {
      description: "No log found for the date.",
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

const createLogRoute = createRoute({
  method: "post",
  path: "/log",
  middleware: authMiddleware,
  security: bearerSecurity,
  tags: ["Log"],
  summary: "Create workout log",
  description:
    "Creates a workout session from structured JSON or legacy plain text. X-Workout-Date can override the session date for either format.",
  request: {
    headers: WorkoutDateHeaderSchema,
    body: {
      required: false,
      content: {
        "application/json": {
          schema: JsonLogRequestSchema,
        },
        "text/plain": {
          schema: PlainTextLogRequestSchema,
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
    409: {
      description: "A workout log already exists for the requested date.",
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
  app.openapi(getLogRoute, async c => {
    const auth = c.get("auth");
    const date = c.req.param("date");
    const { sessionService } = createAppContext(c.env);

    try {
      const log = await sessionService.getLegacyLogByDate(auth.userId, auth.username, date);
      if (!log) {
        return c.json(
          {
            error: "No log for this date",
          },
          404
        );
      }

      return c.json(log as z.infer<typeof LegacyLogByDateResponseSchema>, 200);
    } catch (error) {
      return c.json(
        {
          error: error instanceof Error ? error.message : "Invalid date",
        },
        400
      );
    }
  });

  app.openapi(createLogRoute, async c => {
    const auth = c.get("auth");
    const requestedDate = c.req.header("X-Workout-Date");
    const contentType = c.req.header("Content-Type") ?? "";
    const { sessionService } = createAppContext(c.env);

    try {
      if (contentType.includes("application/json")) {
        return c.json(
          (await sessionService.createFromJson(auth.userId, auth.username, await c.req.json(), requestedDate)) as z.infer<
            typeof LogCreateResponseSchema
          >,
          200
        );
      }

      return c.json(
        (await sessionService.createFromText(auth.userId, auth.username, await c.req.text(), requestedDate)) as z.infer<
          typeof LogCreateResponseSchema
        >,
        200
      );
    } catch (error) {
      if (error instanceof SessionAlreadyExistsError) {
        return c.json(
          {
            error: error.message,
            detail: `Existing session id: ${error.sessionId}`,
          },
          409
        );
      }

      return c.json(
        {
          error: error instanceof Error ? error.message : "Invalid request",
        },
        400
      );
    }
  });

  app.all("/log", authMiddleware, c =>
    c.json(
      {
        error: "Method not allowed",
      },
      405
    )
  );

  app.all("/log/:date", authMiddleware, c =>
    c.json(
      {
        error: "Method not allowed",
      },
      405
    )
  );
}
