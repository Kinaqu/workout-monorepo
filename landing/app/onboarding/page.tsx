import { PlaceholderShell } from "@/components/placeholder-shell";

export default function OnboardingPage() {
  return (
    <PlaceholderShell
      eyebrow="Onboarding"
      title="Protected onboarding shell"
      description="This route now sits behind the Clerk flow when auth keys are configured. It is ready to become the first personalized step after registration without changing the landing app structure again."
      nextHref="/app"
      nextLabel="App"
      notes={[
        "Add onboarding state, validation, and persistence in a later step.",
        "The visual shell already matches the frontend card system.",
      ]}
    >
      <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-black/15 p-6">
        <p className="pill pill-secondary inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
          Future Inputs
        </p>
        <p className="mt-3 text-sm leading-7 text-text-secondary">
          Use this step for goals, equipment, experience level, and scheduling preferences once the onboarding logic is ready. The auth handoff into this route is already prepared.
        </p>
      </div>
    </PlaceholderShell>
  );
}
