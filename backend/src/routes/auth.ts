import { json } from "../http/response";

export function handleAuth(): Response {
  return json(
    {
      error: "Local auth is disabled. Use Clerk authentication on the frontend and send the Clerk Bearer token.",
    },
    410
  );
}
