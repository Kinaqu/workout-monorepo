import { PlaceholderShell } from "@/components/placeholder-shell";

export default function SignInPage() {
  return (
    <PlaceholderShell
      eyebrow="Sign In"
      title="Authentication entry point placeholder"
      description="This route is reserved for the future auth handoff. It is intentionally present now so marketing CTA flows and Vercel routing can be built before authentication is implemented."
      nextHref="/onboarding"
      nextLabel="Onboarding"
      notes={[
        "Clerk is not wired yet in this foundation step.",
        "No backend auth callbacks or session handling have been added here.",
      ]}
    >
      <div className="rounded-[1.5rem] border border-dashed border-border bg-page/70 p-6">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
          Clerk Integration Point
        </p>
        <p className="mt-3 text-sm leading-7 text-muted">
          Mount Clerk sign-in and sign-up components in this section during a later task. Keep provider setup, redirect behavior, and protected-route logic out of this step.
        </p>
      </div>
    </PlaceholderShell>
  );
}
