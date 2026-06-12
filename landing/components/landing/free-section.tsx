import Link from "next/link";
import { maintenanceRoutine } from "@/data/landing-content";
import { siteConfig } from "@/data/site-config";
import { ArrowIcon } from "./icons";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

/* Deliberately the stillest section on the page: maintenance is static,
   so the free offer gets receipt typography and no kinetic treatment. */
export function FreeSection() {
  return (
    <section id="daily-minimum" className="bg-[#05070b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center lg:gap-20">
          <Reveal>
            <SectionHeading
              inverse
              eyebrow="Free · Every day"
              title="The daily minimum."
              description="One fixed routine. Ten push-ups, ten squats, ten dips, a plank. Five minutes to keep your baseline on the days nothing else happens."
            />
            <p className="mt-7 text-base leading-7 text-white/52">
              It never gets harder. That&apos;s the point — and the limit.
              Maintenance keeps you here; moving forward is a different
              machine.
            </p>
            <Link
              href={siteConfig.ctaHref}
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-white/25 underline-offset-8 transition hover:decoration-white"
            >
              Start free
              <ArrowIcon />
            </Link>
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-7">
              <p className="text-xs tracking-[0.24em] text-white/42 uppercase">
                The routine · fixed
              </p>
              <ul className="mt-4 divide-y divide-white/8">
                {maintenanceRoutine.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-baseline gap-3 py-3.5"
                  >
                    <span className="text-sm font-medium text-white/85">
                      {item.name}
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex-1 border-b border-dotted border-white/14"
                    />
                    <span className="font-display text-sm font-semibold text-white/70 tabular-nums">
                      {item.dose}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-white/12 pt-4 text-sm">
                <span className="text-white/45">Every day. Same numbers.</span>
                <span className="font-semibold text-white/80">≈ 5 minutes</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
