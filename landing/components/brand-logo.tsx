import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  iconClassName?: string;
  priority?: boolean;
  showWordmark?: boolean;
  size?: number;
  subtitle?: string;
  titleClassName?: string;
};

export function BrandLogo({
  className = "",
  iconClassName = "",
  priority = false,
  showWordmark = true,
  size = 30,
  subtitle,
  titleClassName = "",
}: BrandLogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <Image
        src="/logo.svg"
        alt="Kinova logo"
        width={size}
        height={size}
        priority={priority}
        className={`h-auto w-auto shrink-0 ${iconClassName}`.trim()}
      />
      {showWordmark ? (
        <div className="min-w-0">
          <div
            className={`font-display text-lg font-semibold tracking-[-0.06em] text-current ${titleClassName}`.trim()}
          >
            Kinova
          </div>
          {subtitle ? (
            <div className="text-[0.68rem] uppercase tracking-[0.32em] text-current/55">
              {subtitle}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
