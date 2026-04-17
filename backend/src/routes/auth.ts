import { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import type { AppEnv } from "../app";

export function registerAuthRoutes(app: OpenAPIHono<AppEnv>) {
  const handler = (c: Context<AppEnv>) =>
    c.json(
      {
        error:
          "Local auth is disabled. Use Clerk authentication on the frontend and send the Clerk Bearer token.",
      },
      410
    );

  app.post("/auth/register", handler);
  app.post("/auth/login", handler);
  app.all("/auth/register", handler);
  app.all("/auth/login", handler);
}
