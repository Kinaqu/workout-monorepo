import { StoreBadges } from "./store-badges";

/* The page's closing push: Kinova is a phone app, so the final beat is the
   download badges, front and centre. */
export function DownloadSection() {
  return (
    <section id="get-the-app" className="relative text-white">
      <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:px-8 lg:py-28">
        <p className="text-xs font-semibold tracking-[0.28em] text-[#8ab4ff] uppercase">
          Get Kinova
        </p>
        <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-[3rem]">
          The whole thing lives on your phone.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
          Free to start — your daily routine, the progression engine, and the AI
          coach, all in one app.
        </p>

        <div className="mt-10 flex justify-center">
          <StoreBadges />
        </div>
      </div>
    </section>
  );
}
