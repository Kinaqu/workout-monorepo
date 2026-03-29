type SectionHeadingProps = {
  align?: "left" | "center";
  description: string;
  eyebrow: string;
  title: string;
};

export function SectionHeading({
  align = "left",
  description,
  eyebrow,
  title,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <div className="text-xs font-semibold uppercase tracking-[0.34em] text-[color:var(--kinova-blue)]">
        {eyebrow}
      </div>
      <h2 className="font-display mt-4 text-3xl font-semibold tracking-[-0.06em] text-current sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mt-5 max-w-2xl text-base leading-8 text-current/70 sm:text-lg">
        {description}
      </p>
    </div>
  );
}
