import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import type { AuthContext } from "./auth/clerk";
import type { Env } from "./env";
import { isAppError } from "./lib/app-error";
import { createOpenApiDocument } from "./openapi/config";
import { registerAuthRoutes } from "./routes/auth";
import { registerLogRoutes } from "./routes/log";
import { registerMeRoutes } from "./routes/me";
import { registerOnboardingRoutes } from "./routes/onboarding";
import { registerProgramRoutes } from "./routes/program";
import { registerProgressionRoutes } from "./routes/progression";
import { registerSessionsRoutes } from "./routes/sessions";
import { registerWorkoutRoutes } from "./routes/workout";

export type AppEnv = {
  Bindings: Env;
  Variables: {
    auth: AuthContext;
  };
};

const app = new OpenAPIHono<AppEnv>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: "Invalid request",
          detail: result.error.message,
        },
        400
      );
    }
  },
});

app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Workout-Date", "X-Reset-Token"],
    allowMethods: ["GET", "POST", "OPTIONS"],
  })
);

app.options("*", c => c.body(null, 204));

registerAuthRoutes(app);
registerMeRoutes(app);
registerOnboardingRoutes(app);
registerWorkoutRoutes(app);
registerProgramRoutes(app);
registerProgressionRoutes(app);
registerLogRoutes(app);
registerSessionsRoutes(app);

app.doc("/openapi.json", c => createOpenApiDocument(new URL(c.req.url).origin));
app.get(
  "/docs",
  Scalar({
    url: "/openapi.json",
    pageTitle: "Workout API Reference",
  })
);

app.notFound(c => {
  return c.json(
    {
      error: "Not found",
    },
    404
  );
});

app.onError((error, c) => {
  if (isAppError(error)) {
    return c.json(
      {
        error: error.message,
        ...(error.detail ? { detail: error.detail } : {}),
      },
      error.status as 400 | 401 | 403 | 404 | 409 | 500 | 503
    );
  }

  return c.json(
    {
      error: "Internal server error",
      detail: error instanceof Error ? error.message : "Unknown error",
    },
    500
  );
});

export { app };
export default app;
