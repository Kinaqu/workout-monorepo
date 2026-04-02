type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  inverse?: boolean;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  inverse = false,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div
      className={[
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "",
      ].join(" ")}
    >
      <p
        className={`text-xs font-semibold tracking-[0.28em] uppercase ${
          inverse ? "text-[#8ab4ff]" : "text-[#125bff]"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-4 font-display text-3xl leading-tight font-semibold tracking-[-0.05em] sm:text-4xl lg:text-5xl ${
          inverse ? "text-white" : "text-[#05070b]"
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-5 text-base leading-8 sm:text-lg ${
          inverse ? "text-white/72" : "text-[#4c5868]"
        }`}
      >
        {description}
      </p>
    </div>
  );
}
