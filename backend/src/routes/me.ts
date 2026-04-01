import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppEnv } from "../app";
import { authMiddleware } from "../middleware/auth";
import { bearerSecurity } from "../openapi/config";
import { ErrorResponseSchema, MeResponseSchema } from "../openapi/schemas";
import { createAppContext } from "../services/app-context";

const meRoute = createRoute({
  method: "get",
  path: "/me",
  middleware: authMiddleware,
  security: bearerSecurity,
  tags: ["User"],
  summary: "Get current user product state",
  description:
    "Returns the authenticated user identity together with onboarding, profile, legacy migration, and active-program state.",
  responses: {
    200: {
      description: "Current user state.",
      content: {
        "application/json": {
          schema: MeResponseSchema,
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

export function registerMeRoutes(app: OpenAPIHono<AppEnv>) {
  app.openapi(meRoute, async c => {
    const auth = c.get("auth");
    const { meService } = createAppContext(c.env);
    return c.json((await meService.getState(auth.userId, auth.username)) as z.infer<typeof MeResponseSchema>, 200);
  });

  app.all("/me", authMiddleware, c =>
    c.json(
      {
        error: "Method not allowed",
      },
      405
    )
  );
}

