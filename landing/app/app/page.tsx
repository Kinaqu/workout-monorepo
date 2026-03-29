import { PlaceholderShell } from "@/components/placeholder-shell";

export default function AppPage() {
  return (
    <PlaceholderShell
      eyebrow="App"
      title="Post-auth app shell"
      description="This is the current handoff target for signed-in users in the landing project. It stays separate from the existing frontend implementation, but the route is now auth-aware and ready for the next stage."
      nextHref="/"
      nextLabel="Landing"
      notes={[
        "Backend integration is still intentionally not implemented here.",
        "This screen is ready to become a redirect or embedded app shell later.",
      ]}
    >
      <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-black/15 p-6">
        <p className="pill pill-accent inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
          Handoff Placeholder
        </p>
        <p className="mt-3 text-sm leading-7 text-text-secondary">
          Use this route later for the authenticated post-onboarding shell or redirect into the main workout experience once the exact product boundary is defined.
        </p>
      </div>
    </PlaceholderShell>
  );
}
