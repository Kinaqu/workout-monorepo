export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  RESET_TOKEN: string;
  CORS_ALLOWED_ORIGINS?: string;
  CORS_ALLOWED_ORIGIN_PATTERNS?: string;
  CLERK_ISSUER: string;
  CLERK_AUDIENCE?: string;
  CLERK_JWKS_URL?: string;
}
