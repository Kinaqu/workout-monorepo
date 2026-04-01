import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppEnv } from "../app";
import { authMiddleware } from "../middleware/auth";
import { bearerSecurity } from "../openapi/config";
import { DateQuerySchema, ErrorResponseSchema, WorkoutTodayResponseSchema } from "../openapi/schemas";
import { createAppContext } from "../services/app-context";
import { isValidDate, todayDate } from "../lib/time";

const workoutTodayRoute = createRoute({
  method: "get",
  path: "/workout/today",
  middleware: authMiddleware,
  security: bearerSecurity,
  tags: ["Workout"],
  summary: "Get today's workout",
  description:
    "Returns the generated workout plan for the provided date or for today when no date query parameter is supplied.",
  request: {
    query: DateQuerySchema,
  },
  responses: {
    200: {
      description: "Workout plan or rest-day response.",
      content: {
        "application/json": {
          schema: WorkoutTodayResponseSchema,
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

export function registerWorkoutRoutes(app: OpenAPIHono<AppEnv>) {
  app.openapi(workoutTodayRoute, async c => {
    const auth = c.get("auth");
    const date = c.req.query("date") ?? todayDate();
    if (!isValidDate(date)) {
      return c.json(
        {
          error: "Invalid date. Use format: 2026-03-11",
        },
        400
      );
    }

    const { workoutService } = createAppContext(c.env);
    return c.json(
      (await workoutService.getWorkoutForDate(auth.userId, auth.username, date)) as z.infer<
        typeof WorkoutTodayResponseSchema
      >,
      200
    );
  });
}
