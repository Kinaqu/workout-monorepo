import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  showName?: boolean;
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export function BrandLogo({
  className = "",
  imageClassName = "",
  priority = false,
  showName = true,
  subtitle,
  titleClassName = "",
  subtitleClassName = "",
}: BrandLogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <Image
        src="/logo.svg"
        alt="Kinova logo"
        width={512}
        height={512}
        priority={priority}
        className={`h-10 w-auto shrink-0 object-contain ${imageClassName}`.trim()}
      />
      {showName ? (
        <div className="flex min-w-0 flex-col">
          <span
            className={`font-display text-base font-semibold tracking-[0.22em] text-current uppercase ${titleClassName}`.trim()}
          >
            Kinova
          </span>
          {subtitle ? (
            <span
              className={`text-[0.68rem] tracking-[0.18em] text-current/60 uppercase ${subtitleClassName}`.trim()}
            >
              {subtitle}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
