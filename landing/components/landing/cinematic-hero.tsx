"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LandingHeader } from "./header";
import { PhoneMockup } from "./phone-mockup";
import { StoreBadges } from "./store-badges";

// useLayoutEffect on the client, useEffect on the server — avoids the SSR
// warning while still letting GSAP set the cinematic initial state before
// the browser paints (no flash of the settled static layout).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function CinematicHero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    gsap.registerPlugin(ScrollTrigger);
    root.classList.add("cine-js");

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // ---- Desktop + motion: full pinned, scrubbed cinematic ----
      mm.add(
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        () => {
          const q = gsap.utils.selector(root);
          const card = q(".cine-card")[0] as HTMLElement;
          const headline = q(".cine-headline")[0];
          const phone = q(".cine-phone")[0];
          const ring = q(".cine-ring-progress")[0] as unknown as SVGCircleElement;
          const counter = q(".cine-counter")[0] as HTMLElement;
          const tiltWrap = q(".cine-phone-tilt")[0];
          const sideL = q(".cine-side--l")[0];
          const sideR = q(".cine-side--r")[0];
          const cta = q(".cine-cta")[0];

          const circ = parseFloat(ring.getAttribute("stroke-dasharray") ?? "0");
          const ringTarget = parseFloat(
            ring.getAttribute("stroke-dashoffset") ?? "0",
          );

          // Initial cinematic state (headline stays visible = the LCP open).
          // Gentle offsets — large scale/rotation read as the card/phone
          // "lurching" on scroll, which the user flagged.
          gsap.set(card, {
            autoAlpha: 0,
            scale: 0.88,
            yPercent: 6,
            transformOrigin: "50% 60%",
          });
          gsap.set(tiltWrap, {
            transformPerspective: 1000,
            transformStyle: "preserve-3d",
          });
          gsap.set(phone, {
            autoAlpha: 0,
            rotationY: 20,
            rotationX: 6,
            transformPerspective: 1000,
            transformOrigin: "50% 50%",
          });
          gsap.set(q(".cine-widget"), { autoAlpha: 0, y: 20 });
          gsap.set(q(".cine-float"), { autoAlpha: 0, scale: 0.7, y: 18 });
          gsap.set(sideL, { autoAlpha: 0, x: -40 });
          gsap.set(sideR, { autoAlpha: 0, x: 40 });
          gsap.set(cta, { autoAlpha: 0, scale: 0.85, y: 20 });
          gsap.set(ring, { strokeDashoffset: circ });
          const proxy = { v: 0 };
          counter.textContent = "0";

          const tl = gsap.timeline({
            scrollTrigger: {
              // Trigger on the stage (not root): root includes the sticky
              // header above the stage, so pinning off root engaged the pin
              // ~120px early and jumped. Pinning when the stage top reaches the
              // top is the clean handoff.
              trigger: stageRef.current,
              start: "top top",
              end: "+=2600",
              pin: stageRef.current,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          tl.to({}, { duration: 0.3 })
            .to(
              card,
              { autoAlpha: 1, scale: 1, yPercent: 0, duration: 2, ease: "power2.out" },
              0.4,
            )
            .to(
              phone,
              {
                autoAlpha: 1,
                rotationY: 0,
                rotationX: 0,
                duration: 2.2,
                ease: "power3.out",
              },
              "<0.2",
            )
            .to(
              headline,
              {
                // No filter: blur here — animating a gaussian blur re-renders
                // every scrubbed frame and was the main source of hero jank.
                autoAlpha: 0,
                scale: 1.04,
                duration: 1.6,
                ease: "power2.in",
              },
              "<",
            )
            .to(
              q(".cine-widget"),
              { autoAlpha: 1, y: 0, stagger: 0.12, duration: 1.1 },
              "-=1.2",
            )
            .to(
              ring,
              { strokeDashoffset: ringTarget, duration: 1.6, ease: "power2.inOut" },
              "<",
            )
            .to(
              proxy,
              {
                v: 4,
                snap: { v: 1 },
                duration: 1.6,
                ease: "power2.out",
                onUpdate: () => {
                  counter.textContent = String(Math.round(proxy.v));
                },
              },
              "<",
            )
            .to(
              q(".cine-float"),
              {
                autoAlpha: 1,
                scale: 1,
                y: 0,
                stagger: 0.15,
                ease: "back.out(1.6)",
                duration: 1.2,
              },
              "-=0.8",
            )
            .to(sideL, { autoAlpha: 1, x: 0, duration: 1.2, ease: "power3.out" }, "-=1")
            .to(sideR, { autoAlpha: 1, x: 0, duration: 1.2, ease: "expo.out" }, "<")
            .to({}, { duration: 0.6 })
            .to(cta, { autoAlpha: 1, scale: 1, y: 0, duration: 1.4, ease: "power2.out" });

          // Pointer: tilt the phone + move the card sheen (rAF-throttled).
          const rotY = gsap.quickTo(tiltWrap, "rotationY", {
            duration: 0.6,
            ease: "power3",
          });
          const rotX = gsap.quickTo(tiltWrap, "rotationX", {
            duration: 0.6,
            ease: "power3",
          });
          // Cache the card rect; only re-measure when layout could have changed
          // (resize / scroll), not on every pointer frame — a getBoundingClientRect
          // per move forces a synchronous layout and added to the scrub jank.
          let cardRect = card.getBoundingClientRect();
          let rectDirty = false;
          const markDirty = () => {
            rectDirty = true;
          };
          window.addEventListener("resize", markDirty);
          window.addEventListener("scroll", markDirty, { passive: true });

          let frame = 0;
          let px = 0;
          let py = 0;
          const onMove = (e: PointerEvent) => {
            px = e.clientX;
            py = e.clientY;
            if (frame) return;
            frame = requestAnimationFrame(() => {
              frame = 0;
              if (rectDirty) {
                cardRect = card.getBoundingClientRect();
                rectDirty = false;
              }
              rotY((px / window.innerWidth - 0.5) * 20);
              rotX(-(py / window.innerHeight - 0.5) * 20);
              card.style.setProperty(
                "--mouse-x",
                `${((px - cardRect.left) / cardRect.width) * 100}%`,
              );
              card.style.setProperty(
                "--mouse-y",
                `${((py - cardRect.top) / cardRect.height) * 100}%`,
              );
            });
          };
          window.addEventListener("pointermove", onMove);

          return () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("resize", markDirty);
            window.removeEventListener("scroll", markDirty);
            if (frame) cancelAnimationFrame(frame);
          };
        },
      );

      // ---- Mobile + motion: one cheap entrance, no pin/scrub ----
      mm.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.from(rootRef.current!.querySelectorAll(".cine-headline, .cine-card, .cine-cta"), {
          autoAlpha: 0,
          y: 16,
          duration: 0.6,
          stagger: 0.12,
          ease: "power2.out",
          clearProps: "all",
        });
      });

      // Reduced motion matches neither query → fully static, visible hero.
    }, rootRef);

    const refresh = () => ScrollTrigger.refresh();
    if (document.readyState === "complete") refresh();
    else window.addEventListener("load", refresh, { once: true });
    document.fonts?.ready.then(refresh);

    return () => {
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, []);

  return (
    // No `perspective` on this ancestor: it would establish a containing block
    // for the pinned stage's position:fixed and break the pin. 3D depth comes
    // from per-element transformPerspective (phone reveal + pointer tilt).
    <div ref={rootRef} className="relative">
      <LandingHeader />

      <section
        ref={stageRef}
        className="relative flex min-h-[100svh] flex-col items-center justify-center gap-[2svh] px-6 pb-10 pt-6 sm:px-8 lg:px-12"
      >
        {/* Headline — the LCP, visible from SSR. On the cinematic desktop it
            overlays the stage and cross-fades out as the card takes over, so the
            card + CTA centre with only a small gap on top; on mobile / reduced
            motion it stays in flow above the CTA. */}
        <div className="cine-headline order-1 w-full max-w-6xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#125bff]/25 bg-[#125bff]/10 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-[#9fbeff] uppercase">
            The training app · iOS &amp; Android soon
          </span>
          <h1 className="mt-6 font-display text-5xl leading-[0.95] font-semibold tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
            The daily minimum is free.
            <br />
            <span className="text-[#8ab4ff]">Progression is the product.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
            A free daily routine holds your baseline. Kinova Pro writes next
            week&apos;s targets — advance, hold, or regress.
          </p>
        </div>

        {/* The premium card: side copy · phone · wordmark. Height follows the
            phone (no fixed clamp) so the phone is never clipped; vertical
            padding gives it breathing room inside the card. */}
        <div className="cine-card order-3 relative w-[92vw] max-w-6xl rounded-[2.25rem] px-6 py-6 sm:rounded-[2.5rem] sm:px-10 md:order-2 lg:py-6">
          <div className="cine-grid" aria-hidden="true" />
          <div className="cine-sheen" aria-hidden="true" />
          <div className="cine-grain" aria-hidden="true" />

          <div className="relative z-10 grid h-full items-center gap-8 lg:grid-cols-3 lg:gap-6">
            <div className="cine-side cine-side--l order-3 text-center lg:order-1 lg:text-left">
              <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-white lg:text-3xl">
                Built around your week
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#bcd0ff]/70 lg:mx-0">
                Log a session and the engine writes the next one — advance,
                hold, or regress. A rough week bends the plan, not the
                direction.
              </p>
            </div>

            <div className="cine-phone-tilt order-1 flex justify-center lg:order-2">
              <PhoneMockup />
            </div>

            <div className="cine-side cine-side--r order-2 flex justify-center lg:order-3 lg:justify-end">
              <span className="max-w-full font-display text-5xl font-black tracking-tight text-white/90 uppercase lg:text-6xl xl:text-7xl">
                Kinova
              </span>
            </div>
          </div>
        </div>

        {/* Store CTA — the primary action, revealed just below the phone at the
            end of the scrub. On mobile it sits high, right under the headline. */}
        <div className="cine-cta order-2 flex w-full justify-center md:order-3">
          <StoreBadges />
        </div>
      </section>
    </div>
  );
}
