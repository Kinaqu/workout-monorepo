import { PlaceholderShell } from "@/components/placeholder-shell";

export default function OnboardingPage() {
  return (
    <PlaceholderShell
      eyebrow="Onboarding"
      title="Personalization flow placeholder"
      description="This route will eventually collect first-run personalization inputs such as goals, training history, constraints, and preferences. For now it exists only as a structural boundary."
      nextHref="/app"
      nextLabel="App"
      notes={[
        "No form state, persistence, or validation has been implemented yet.",
        "No workout generation logic belongs here in this stage.",
      ]}
    >
      <div className="rounded-[1.5rem] border border-dashed border-border bg-page/70 p-6">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
          Future Inputs
        </p>
        <p className="mt-3 text-sm leading-7 text-muted">
          Later tasks can add onboarding sections, local state, and backend persistence here without changing the app shell or route structure introduced in this foundation step.
        </p>
      </div>
    </PlaceholderShell>
  );
}
