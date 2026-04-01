import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../app";
import { authMiddleware } from "../middleware/auth";
import { bearerSecurity } from "../openapi/config";
import {
  ErrorResponseSchema,
  SessionIdParamSchema,
  SessionListQuerySchema,
  SessionsListResponseSchema,
  WorkoutSessionRecordSchema,
} from "../openapi/schemas";
import { getNumberParam } from "../http/request";
import { createAppContext } from "../services/app-context";

const listSessionsRoute = createRoute({
  method: "get",
  path: "/sessions",
  middleware: authMiddleware,
  security: bearerSecurity,
  tags: ["Sessions"],
  summary: "List workout sessions",
  description: "Returns stored workout sessions, optionally filtered by date and limited to the requested count.",
  request: {
    query: SessionListQuerySchema,
  },
  responses: {
    200: {
      description: "Session list.",
      content: {
        "application/json": {
          schema: SessionsListResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid date filter.",
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

const getSessionRoute = createRoute({
  method: "get",
  path: "/sessions/{id}",
  middleware: authMiddleware,
  security: bearerSecurity,
  tags: ["Sessions"],
  summary: "Get workout session",
  description: "Returns a full workout session record including matched exercises and set values.",
  request: {
    params: SessionIdParamSchema,
  },
  responses: {
    200: {
      description: "Session record.",
      content: {
        "application/json": {
          schema: WorkoutSessionRecordSchema,
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
      description: "Session not found.",
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

export function registerSessionsRoutes(app: OpenAPIHono<AppEnv>) {
  app.openapi(listSessionsRoute, async c => {
    const auth = c.get("auth");
    const url = new URL(c.req.url);
    const date = c.req.query("date") ?? undefined;
    const limit = Math.min(getNumberParam(url, "limit", 20), 100);
    const { sessionService } = createAppContext(c.env);

    return c.json(await sessionService.listSessions(auth.userId, auth.username, limit, date), 200);
  });

  app.openapi(getSessionRoute, async c => {
    const auth = c.get("auth");
    const id = c.req.param("id");
    const { sessionService } = createAppContext(c.env);
    const session = await sessionService.getSession(auth.userId, auth.username, id);
    if (!session) {
      return c.json(
        {
          error: "Session not found",
        },
        404
      );
    }

    return c.json(session, 200);
  });

  app.all("/sessions", authMiddleware, c =>
    c.json(
      {
        error: "Method not allowed",
      },
      405
    )
  );

  app.all("/sessions/:id", authMiddleware, c =>
    c.json(
      {
        error: "Method not allowed",
      },
      405
    )
  );
}
