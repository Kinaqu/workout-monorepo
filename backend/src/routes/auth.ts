import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import type { AppEnv } from "../app";
import { DisabledAuthResponseSchema } from "../openapi/schemas";

const registerRoute = createRoute({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Legacy register endpoint",
  description:
    "Preserved compatibility endpoint. Local auth is disabled; clients must authenticate with Clerk on the frontend and send the Clerk Bearer token.",
  responses: {
    410: {
      description: "Legacy auth is disabled.",
      content: {
        "application/json": {
          schema: DisabledAuthResponseSchema,
        },
      },
    },
  },
});

const loginRoute = createRoute({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Legacy login endpoint",
  description:
    "Preserved compatibility endpoint. Local auth is disabled; clients must authenticate with Clerk on the frontend and send the Clerk Bearer token.",
  responses: {
    410: {
      description: "Legacy auth is disabled.",
      content: {
        "application/json": {
          schema: DisabledAuthResponseSchema,
        },
      },
    },
  },
});

export function registerAuthRoutes(app: OpenAPIHono<AppEnv>) {
  const handler = (c: Context<AppEnv>) =>
    c.json(
      {
        error:
          "Local auth is disabled. Use Clerk authentication on the frontend and send the Clerk Bearer token.",
      },
      410
    );

  app.openapi(registerRoute, handler);
  app.openapi(loginRoute, handler);

  app.all("/auth/register", handler);
  app.all("/auth/login", handler);
}
