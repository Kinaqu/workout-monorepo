export const apiInfo = {
  title: "Workout Manager Backend API",
  version: "1.0.0",
  description:
    "Cloudflare Workers backend for workout programs, progression, workout logging, and Clerk-authenticated access.",
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
