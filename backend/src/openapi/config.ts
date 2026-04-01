export const apiInfo = {
  title: "Workout Manager Backend API",
  version: "1.0.0",
  description:
    "Cloudflare Workers backend for Clerk-authenticated onboarding, backend-owned program generation, workouts, sessions, and progression.",
};

export const bearerSecurity = [{ bearerAuth: [] as string[] }];

export function createOpenApiDocument(origin: string) {
  return {
    openapi: "3.0.0",
    info: apiInfo,
    servers: [
      {
        url: origin,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Provide a Clerk Bearer JWT in the Authorization header. The Worker validates issuer, audience, and JWKS settings from CLERK_ISSUER, CLERK_AUDIENCE, and CLERK_JWKS_URL.",
        },
      },
    },
  };
}
