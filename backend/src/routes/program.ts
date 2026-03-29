import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { Context } from "hono";
import type { AppEnv } from "../app";
import { authMiddleware } from "../middleware/auth";
import { bearerSecurity } from "../openapi/config";
import {
  ErrorResponseSchema,
  ProgramDefinitionSchema,
  ProgramMutationResponseSchema,
  ProgramResponseSchema,
  ResetTokenHeaderSchema,
} from "../openapi/schemas";
import { createAppContext } from "../services/app-context";

const getProgramRoute = createRoute({
  method: "get",
  path: "/program",
  middleware: authMiddleware,
  security: bearerSecurity,
  tags: ["Program"],
  summary: "Get active program",
  description:
    "Returns the active program definition together with current progression metadata and user set counts.",
  responses: {
    200: {
      description: "Active program.",
      content: {
        "application/json": {
          schema: ProgramResponseSchema,
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

const saveProgramRoute = createRoute({
  method: "post",
  path: "/program",
  middleware: authMiddleware,
  security: bearerSecurity,
  tags: ["Program"],
  summary: "Save active program",
  description: "Creates a new active program version and reseeds progression state from the previous version.",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: ProgramDefinitionSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Program saved.",
      content: {
        "application/json": {
          schema: ProgramMutationResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid program body.",
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

const resetProgramRoute = createRoute({
  method: "post",
  path: "/program/reset",
  middleware: authMiddleware,
  security: bearerSecurity,
  tags: ["Program"],
  summary: "Reset active program",
  description: "Resets the active program to the built-in default program. Requires the X-Reset-Token header.",
  request: {
    headers: ResetTokenHeaderSchema,
  },
  responses: {
    200: {
      description: "Program reset.",
      content: {
        "application/json": {
          schema: ProgramMutationResponseSchema,
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
    403: {
      description: "Invalid reset token.",
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

function methodNotAllowed(c: Context<AppEnv>) {
  return c.json(
    {
      error: "Method not allowed",
    },
    405
  );
}

export function registerProgramRoutes(app: OpenAPIHono<AppEnv>) {
  app.openapi(getProgramRoute, async c => {
    const auth = c.get("auth");
    const { programService } = createAppContext(c.env);
    return c.json(
      (await programService.getCurrentProgram(auth.userId, auth.username)) as z.infer<typeof ProgramResponseSchema>,
      200
    );
  });

  app.openapi(saveProgramRoute, async c => {
    const auth = c.get("auth");
    const body = await c.req.json();
    const { programService } = createAppContext(c.env);

    try {
      return c.json(
        (await programService.saveProgram(auth.userId, auth.username, body)) as z.infer<
          typeof ProgramMutationResponseSchema
        >,
        200
      );
    } catch (error) {
      return c.json(
        {
          error: error instanceof Error ? error.message : "Invalid program body",
        },
        400
      );
    }
  });

  app.openapi(resetProgramRoute, async c => {
    const auth = c.get("auth");
    if (c.req.header("X-Reset-Token") !== c.env.RESET_TOKEN) {
      return c.json(
        {
          error: "Invalid reset token",
        },
        403
      );
    }

    const { programService } = createAppContext(c.env);
    return c.json(
      (await programService.resetProgram(auth.userId, auth.username)) as z.infer<
        typeof ProgramMutationResponseSchema
      >,
      200
    );
  });

  app.all("/program", authMiddleware, methodNotAllowed);
  app.all("/program/reset", authMiddleware, methodNotAllowed);
}
