import { PlaceholderShell } from "@/components/placeholder-shell";

export default function AppPage() {
  return (
    <PlaceholderShell
      eyebrow="Your plan"
      title="See how your training keeps adapting."
      description="This preview shows the kind of guidance the app gives after your plan is created: a clear workout path, steady progression, and sensible adjustments when needed."
      nextHref="/"
      nextLabel="Home"
      notes={[
        "As you complete workouts, the plan can increase the challenge little by little.",
        "If a movement is too hard, the next step can shift so progress stays realistic.",
      ]}
    >
      <div className="grid gap-4">
        {[
          ["Today", "Pull foundation", "30 min"],
          ["Up next", "Push and core", "25 min"],
          ["Adjustment", "Easier row variation added until your pulling strength catches up", "Smart step back"],
        ].map(([label, title, detail]) => (
          <div key={label} className="rounded-[1.4rem] border border-white/8 bg-black/15 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
              {label}
            </p>
            <p className="mt-3 text-lg font-semibold text-text-primary">{title}</p>
            <p className="mt-2 text-sm leading-7 text-text-secondary">{detail}</p>
          </div>
        ))}
      </div>
    </PlaceholderShell>
  );
}
