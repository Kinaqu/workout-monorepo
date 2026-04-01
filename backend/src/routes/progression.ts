import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppEnv } from "../app";
import { authMiddleware } from "../middleware/auth";
import { bearerSecurity } from "../openapi/config";
import { ErrorResponseSchema, ProgressionRunResponseSchema } from "../openapi/schemas";
import { createAppContext } from "../services/app-context";

const progressionRunRoute = createRoute({
  method: "post",
  path: "/progression/run",
  middleware: authMiddleware,
  security: bearerSecurity,
  tags: ["Progression"],
  summary: "Run progression evaluation",
  description: "Evaluates recent session performance and updates progression state for the active program.",
  responses: {
    200: {
      description: "Progression run completed.",
      content: {
        "application/json": {
          schema: ProgressionRunResponseSchema,
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
      description: "Onboarding not completed or no active program exists.",
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

export function registerProgressionRoutes(app: OpenAPIHono<AppEnv>) {
  app.openapi(progressionRunRoute, async c => {
    const auth = c.get("auth");
    const { progressionService } = createAppContext(c.env);
    return c.json(
      (await progressionService.run(auth.userId, auth.username)) as z.infer<typeof ProgressionRunResponseSchema>,
      200
    );
  });

  app.all("/progression/run", authMiddleware, c =>
    c.json(
      {
        error: "Method not allowed",
      },
      405
    )
  );
}
