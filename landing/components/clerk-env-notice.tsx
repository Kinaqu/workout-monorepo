type ClerkEnvNoticeProps = {
  mode: "sign in" | "sign up";
  hasPublishableKey: boolean;
  hasSecretKey: boolean;
};

export function ClerkEnvNotice({
  mode,
  hasPublishableKey,
  hasSecretKey,
}: ClerkEnvNoticeProps) {
  return (
    <div className="space-y-4 rounded-[1.4rem] border border-white/6 bg-black/15 p-6">
      <h2 className="text-2xl font-semibold text-text-primary">
        Clerk keys are missing
      </h2>
      <p className="text-sm leading-7 text-text-secondary">
        This route is wired for Clerk {mode}, but the landing app does not have
        the required environment variables yet. Add them in Vercel Project
        Settings and redeploy.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/6 bg-surface p-4 text-sm text-text-secondary">
          <p className="font-semibold text-text-primary">
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
          </p>
          <p className="mt-2">{String(hasPublishableKey)}</p>
        </div>
        <div className="rounded-2xl border border-white/6 bg-surface p-4 text-sm text-text-secondary">
          <p className="font-semibold text-text-primary">CLERK_SECRET_KEY</p>
          <p className="mt-2">{String(hasSecretKey)}</p>
        </div>
      </div>
      <a
        href="https://clerk.com/docs/quickstarts/nextjs"
        className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-black transition-colors hover:bg-[#c89dff]"
      >
        Clerk Next.js quickstart
      </a>
    </div>
  );
}
