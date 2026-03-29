import { PlaceholderShell } from "@/components/placeholder-shell";

export default function AppPage() {
  return (
    <PlaceholderShell
      eyebrow="App"
      title="Post-onboarding app placeholder"
      description="This route represents the handoff target after sign-in and onboarding are complete. It is intentionally a placeholder so the landing app can define its boundaries before real product logic arrives."
      nextHref="/"
      nextLabel="Landing"
      notes={[
        "No backend API integration has been added.",
        "No connection to the existing workout experience has been implemented yet.",
      ]}
    >
      <div className="rounded-[1.5rem] border border-dashed border-border bg-page/70 p-6">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
          Handoff Placeholder
        </p>
        <p className="mt-3 text-sm leading-7 text-muted">
          Use this route later for the authenticated post-onboarding shell or for a redirect into the main product experience once that behavior is clearly defined.
        </p>
      </div>
    </PlaceholderShell>
  );
}
