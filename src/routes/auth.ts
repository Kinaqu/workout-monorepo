import { json } from "../index";

export async function handleAuth(): Promise<Response> {
  return json(
    {
      error: "Local auth is disabled. Use Clerk authentication on the frontend and send the Clerk Bearer token.",
    },
    410
  );
}
