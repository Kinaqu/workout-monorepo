type FeatureCardProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function FeatureCard({ eyebrow, title, description }: FeatureCardProps) {
  return (
    <article className="surface-card rounded-[1.7rem] p-6">
      <span className="pill inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
        {eyebrow}
      </span>
      <h3 className="mt-5 text-xl font-semibold text-text-primary">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-text-secondary">{description}</p>
    </article>
  );
}
