import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import type { AppEnv } from "../app";
import { authMiddleware } from "../middleware/auth";
import { bearerSecurity } from "../openapi/config";
import {
  ErrorResponseSchema,
  RecommendationDraftActivateRequestSchema,
  RecommendationDraftActivateResponseSchema,
  RecommendationDraftExerciseReplaceRequestSchema,
  RecommendationDraftResponseSchema,
  RecommendationDraftStructureSelectRequestSchema,
} from "../openapi/schemas";
import { createAppContext } from "../services/app-context";

const createRecommendationDraftRoute = createRoute({
  method: "post",
  path: "/recommendation-draft",
  middleware: authMiddleware,
  security: bearerSecurity,
  tags: ["Recommendation Draft"],
  summary: "Create or refresh recommendation draft from stored profile",
  description:
    "Builds an editable recommendation draft from the stored normalized profile without activating a program.",
  responses: {
    200: {
      description: "Recommendation draft created.",
      content: {
        "application/json": {
          schema: RecommendationDraftResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid Clerk Bearer token.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    409: {
      description: "Stored onboarding/profile or catalog state cannot satisfy draft creation.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    503: {
      description: "Clerk JWKS unavailable.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

const getRecommendationDraftRoute = createRoute({
  method: "get",
  path: "/recommendation-draft",
  middleware: authMiddleware,
  security: bearerSecurity,
  tags: ["Recommendation Draft"],
  summary: "Get current recommendation draft",
  responses: {
    200: {
      description: "Current recommendation draft.",
      content: { "application/json": { schema: RecommendationDraftResponseSchema } },
    },
    401: {
      description: "Missing or invalid Clerk Bearer token.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Recommendation draft not found.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    503: {
      description: "Clerk JWKS unavailable.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

const chooseRecommendationDraftStructureRoute = createRoute({
  method: "patch",
  path: "/recommendation-draft/structure",
  middleware: authMiddleware,
  security: bearerSecurity,
  tags: ["Recommendation Draft"],
  summary: "Choose recommendation draft structure",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: RecommendationDraftStructureSelectRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Recommendation draft structure updated.",
      content: { "application/json": { schema: RecommendationDraftResponseSchema } },
    },
    400: {
      description: "Invalid structure selection request.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "Missing or invalid Clerk Bearer token.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Recommendation draft not found.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    409: {
      description: "Draft is stale, activated, or structure is invalid for the current draft.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    503: {
      description: "Clerk JWKS unavailable.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

const replaceRecommendationDraftExerciseRoute = createRoute({
  method: "patch",
  path: "/recommendation-draft/exercise",
  middleware: authMiddleware,
  security: bearerSecurity,
  tags: ["Recommendation Draft"],
  summary: "Replace recommendation draft exercise in a slot",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: RecommendationDraftExerciseReplaceRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Recommendation draft exercise updated.",
      content: { "application/json": { schema: RecommendationDraftResponseSchema } },
    },
    400: {
      description: "Invalid exercise replacement request.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "Missing or invalid Clerk Bearer token.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Recommendation draft not found.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    409: {
      description: "Draft is stale, activated, slot is missing, or exercise is not valid for the slot.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    503: {
      description: "Clerk JWKS unavailable.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

const activateRecommendationDraftRoute = createRoute({
  method: "post",
  path: "/recommendation-draft/activate",
  middleware: authMiddleware,
  security: bearerSecurity,
  tags: ["Recommendation Draft"],
  summary: "Activate current recommendation draft",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: RecommendationDraftActivateRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Recommendation draft activated into a normal active program version.",
      content: { "application/json": { schema: RecommendationDraftActivateResponseSchema } },
    },
    400: {
      description: "Invalid activation request.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "Missing or invalid Clerk Bearer token.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Recommendation draft not found.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    409: {
      description: "Draft is stale or activation state is invalid.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Activation failed after partial orchestration.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    503: {
      description: "Clerk JWKS unavailable.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

function methodNotAllowed(c: Context<AppEnv>) {
  return c.json({ error: "Method not allowed" }, 405);
}

export function registerRecommendationDraftRoutes(app: OpenAPIHono<AppEnv>) {
  app.openapi(createRecommendationDraftRoute, async c => {
    const auth = c.get("auth");
    const { recommendationDraftService } = createAppContext(c.env);
    return c.json(await recommendationDraftService.createFromStoredProfile(auth.userId, auth.username), 200);
  });

  app.openapi(getRecommendationDraftRoute, async c => {
    const auth = c.get("auth");
    const { recommendationDraftService } = createAppContext(c.env);
    return c.json(await recommendationDraftService.getCurrentDraft(auth.userId, auth.username), 200);
  });

  app.openapi(chooseRecommendationDraftStructureRoute, async c => {
    const auth = c.get("auth");
    const body = c.req.valid("json");
    const { recommendationDraftService } = createAppContext(c.env);
    return c.json(
      await recommendationDraftService.chooseStructure(auth.userId, auth.username, body.draft_id, body.structure_id),
      200
    );
  });

  app.openapi(replaceRecommendationDraftExerciseRoute, async c => {
    const auth = c.get("auth");
    const body = c.req.valid("json");
    const { recommendationDraftService } = createAppContext(c.env);
    return c.json(
      await recommendationDraftService.replaceExercise(
        auth.userId,
        auth.username,
        body.draft_id,
        body.slot_id,
        body.catalog_exercise_id
      ),
      200
    );
  });

  app.openapi(activateRecommendationDraftRoute, async c => {
    const auth = c.get("auth");
    const body = c.req.valid("json");
    const { recommendationDraftService } = createAppContext(c.env);
    return c.json(await recommendationDraftService.activateDraft(auth.userId, auth.username, body.draft_id), 200);
  });

  app.all("/recommendation-draft", authMiddleware, methodNotAllowed);
  app.all("/recommendation-draft/structure", authMiddleware, methodNotAllowed);
  app.all("/recommendation-draft/exercise", authMiddleware, methodNotAllowed);
  app.all("/recommendation-draft/activate", authMiddleware, methodNotAllowed);
}
