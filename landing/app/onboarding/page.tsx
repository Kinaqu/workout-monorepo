import { PlaceholderShell } from "@/components/placeholder-shell";

export default function OnboardingPage() {
  return (
    <PlaceholderShell
      eyebrow="Build your plan"
      title="Set your starting point in minutes."
      description="This is where the app learns about your goal, current level, training preferences, available setup, and weekly routine so your program starts in the right place."
      nextHref="/app"
      nextLabel="Plan preview"
      notes={[
        "Choose your goal, current level, and the kind of progress you want to make.",
        "Set your training conditions so the plan matches your real week instead of an ideal one.",
      ]}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.4rem] border border-white/8 bg-black/15 p-6">
          <p className="pill pill-secondary inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
            Your inputs
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-text-primary">
            {["Goal", "Level", "Schedule", "Equipment", "Training style"].map((item) => (
              <span key={item} className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-2">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-white/8 bg-black/15 p-6">
          <p className="pill inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
            What happens next
          </p>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            The app turns those choices into a plan that feels achievable now and is ready
            to grow as your sessions start adding up.
          </p>
        </div>
      </div>
    </PlaceholderShell>
  );
}
