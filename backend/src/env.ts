export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  RESET_TOKEN: string;
  CLERK_ISSUER: string;
  CLERK_AUDIENCE?: string;
  CLERK_JWKS_URL?: string;
}
