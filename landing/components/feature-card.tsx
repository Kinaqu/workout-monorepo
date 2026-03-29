type FeatureCardProps = {
  title: string;
  description: string;
};

export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <article className="glass-panel rounded-[1.75rem] border border-white/70 p-6 shadow-[0_16px_48px_rgba(23,28,40,0.08)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent-strong">
        UI
      </div>
      <h3 className="mt-5 text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
    </article>
  );
}
