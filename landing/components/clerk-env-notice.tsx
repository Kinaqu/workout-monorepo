import Link from "next/link";

type ClerkEnvNoticeProps = {
  mode: "sign in" | "sign up";
};

export function ClerkEnvNotice({ mode }: ClerkEnvNoticeProps) {
  return (
    <div className="space-y-4 rounded-[1.4rem] border border-white/6 bg-black/15 p-6">
      <h2 className="text-2xl font-semibold text-text-primary">
        Member access is almost ready
      </h2>
      <p className="text-sm leading-7 text-text-secondary">
        This preview is focused on the training experience first. Account access for{" "}
        {mode} will be available here soon, and you can still explore how the app builds
        and adjusts a plan around your level.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/6 bg-surface p-4 text-sm text-text-secondary">
          <p className="font-semibold text-text-primary">Start where you are</p>
          <p className="mt-2">
            Build around your current strength, schedule, and preferred training style.
          </p>
        </div>
        <div className="rounded-2xl border border-white/6 bg-surface p-4 text-sm text-text-secondary">
          <p className="font-semibold text-text-primary">Keep progressing</p>
          <p className="mt-2">
            Explore how the plan adapts when you improve or need an easier step.
          </p>
        </div>
      </div>
      <Link
        href="/"
        className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-[#0a130f] transition-colors hover:bg-[#e4ff92]"
      >
        Back to home
      </Link>
    </div>
  );
}
