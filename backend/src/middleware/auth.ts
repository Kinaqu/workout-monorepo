import { MiddlewareHandler } from "hono";
import { authenticate } from "../auth/clerk";
import type { AppEnv } from "../app";

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const auth = await authenticate(c.req.raw, c.env);
  if (auth instanceof Response) {
    return auth;
  }

  c.set("auth", auth);
  await next();
};
