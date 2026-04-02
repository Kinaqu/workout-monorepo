import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppEnv } from "../app";
import { authMiddleware } from "../middleware/auth";
import { bearerSecurity } from "../openapi/config";
import {
  ErrorResponseSchema,
  OnboardingAnswersSchema,
  OnboardingCompleteResponseSchema,
  OnboardingDraftSaveResponseSchema,
  OnboardingDraftSchema,
  OnboardingStateResponseSchema,
} from "../openapi/schemas";
import { createAppContext } from "../services/app-context";

const getOnboardingRoute = createRoute({
  method: "get",
  path: "/onboarding",
  middleware: authMiddleware,
  security: bearerSecurity,
  tags: ["Onboarding"],
  summary: "Get onboarding state",
  description: "Returns saved onboarding draft, completion state, and current normalized profile summary.",
  responses: {
    200: {
      description: "Current onboarding state.",
      content: {
        "application/json": {
          schema: OnboardingStateResponseSchema,
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

const saveOnboardingRoute = createRoute({
  method: "post",
  path: "/onboarding",
  middleware: authMiddleware,
  security: bearerSecurity,
  tags: ["Onboarding"],
  summary: "Save onboarding draft",
  description: "Persists draft onboarding answers without completing onboarding or generating a program.",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: OnboardingDraftSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Draft saved.",
      content: {
        "application/json": {
          schema: OnboardingDraftSaveResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid onboarding draft body.",
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

const completeOnboardingRoute = createRoute({
  method: "post",
  path: "/onboarding/complete",
  middleware: authMiddleware,
  security: bearerSecurity,
  tags: ["Onboarding"],
  summary: "Complete onboarding and generate program",
  description:
    "Validates onboarding answers, stores the normalized profile, generates a backend-owned program from the global exercise catalog, and activates it for the user.",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: OnboardingAnswersSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Onboarding completed and program generated.",
      content: {
        "application/json": {
          schema: OnboardingCompleteResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid onboarding answers.",
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
      description: "Catalog or user state cannot satisfy onboarding completion.",
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

export function registerOnboardingRoutes(app: OpenAPIHono<AppEnv>) {
  app.openapi(getOnboardingRoute, async c => {
    const auth = c.get("auth");
    const { onboardingService } = createAppContext(c.env);
    return c.json(
      (await onboardingService.getState(auth.userId, auth.username)) as z.infer<typeof OnboardingStateResponseSchema>,
      200
    );
  });

  app.openapi(saveOnboardingRoute, async c => {
    const auth = c.get("auth");
    const { onboardingService } = createAppContext(c.env);
    return c.json(
      (await onboardingService.saveDraft(auth.userId, auth.username, c.req.valid("json"))) as z.infer<typeof OnboardingDraftSaveResponseSchema>,
      200
    );
  });

  app.openapi(completeOnboardingRoute, async c => {
    const auth = c.get("auth");
    const { onboardingService } = createAppContext(c.env);
    return c.json(
      (await onboardingService.complete(auth.userId, auth.username, c.req.valid("json"))) as z.infer<typeof OnboardingCompleteResponseSchema>,
      200
    );
  });

  app.all("/onboarding", authMiddleware, c =>
    c.json(
      {
        error: "Method not allowed",
      },
      405
    )
  );

  app.all("/onboarding/complete", authMiddleware, c =>
    c.json(
      {
        error: "Method not allowed",
      },
      405
    )
  );
}
