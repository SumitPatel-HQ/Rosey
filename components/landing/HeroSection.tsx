"use client";

import { useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import useIsomorphicLayoutEffect from "@/hooks/useIsomorphicLayoutEffect";
import WorkflowVisual from "./WorkflowVisual";
import { useBoot } from "@/providers/BootProvider";
import { useAuth } from "@clerk/nextjs";

export default function HeroSection() {
   const sectionRef = useRef<HTMLElement>(null);
   const badgeRef = useRef<HTMLDivElement>(null);
   const headingRef = useRef<HTMLDivElement>(null);
   const subRef = useRef<HTMLParagraphElement>(null);
   const ctaRef = useRef<HTMLDivElement>(null);
   const { isBooted } = useBoot();
   const { isSignedIn } = useAuth();
   const startBuildingHref = isSignedIn ? "/dashboard" : "/sign-in";
   const startBuildingLabel = isSignedIn ? "Dashboard" : "Start Building";

   useIsomorphicLayoutEffect(() => {
      if (!isBooted) return;

      const ctx = gsap.context(() => {
         const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.8 } });

         // 1. Unified Cinematic Entrance
         tl.from(badgeRef.current, { opacity: 0, y: 15 }, 0.2)
            .from(
               headingRef.current?.querySelectorAll(".hero-line") || [],
               { opacity: 0, y: 30, stagger: 0.15 },
               0.4
            )
            .from(subRef.current, { opacity: 0, y: 20 }, 0.8)
            .from(ctaRef.current, { opacity: 0, y: 20 }, 1.0);

         // 2. Continuous Z-Space Scroll Handoff
         const glow = sectionRef.current?.querySelector(".hero-glow");
         const content = sectionRef.current?.querySelector(".hero-content");

         if (glow && content) {
            // Subtle ambient parallax for the background glow
            gsap.to(glow, {
               y: "15%",
               ease: "none",
               scrollTrigger: {
                  trigger: sectionRef.current,
                  start: "top top",
                  end: "bottom top",
                  scrub: true,
               },
            });

            // The hero content recedes gently instead of just scrolling away flatly
            gsap.to(content, {
               y: "10%",
               opacity: 0.2, // Recede into background, but don't vanish instantly
               scale: 0.98,  // Micro-depth
               ease: "none",
               scrollTrigger: {
                  trigger: sectionRef.current,
                  start: "top top",
                  end: "bottom top",
                  scrub: true,
               },
            });
         }
      }, sectionRef);

      return () => ctx.revert();
   }, [isBooted]);

   return (
      <section
         ref={sectionRef}
         className="min-h-screen bg-[var(--bg-base)] relative flex items-center pt-24 md:pt-28 lg:pt-20 px-5 sm:px-8 pb-16 md:pb-8 overflow-hidden"
      >
         {/* Hero radial glow */}
         <div
            className="hero-glow absolute inset-0 bg-[var(--gradient-hero)] pointer-events-none z-0"
         />

         {/* Centered Content Container */}
         <div
            className="hero-content w-full max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1fr] items-center gap-10 lg:gap-[4rem] relative z-10"
         >
            {/* LEFT — Tagline */}
            <div className="pl-0 md:pl-5 lg:pl-9 text-center lg:text-left">
               {/* Heading */}
               <div ref={headingRef} className="mb-5 md:mb-6 pb-1 overflow-visible">
                  <h1
                     className="text-[clamp(2.4rem,7vw,4.4rem)] font-extrabold leading-[1.14] tracking-[-0.03em] text-[var(--text-primary)] normal-case overflow-visible font-[family-name:var(--font-body)]"
                  >
                     <span className="hero-line block leading-[1.08]">
                        Intelligent <span className="italic">outreach.</span>
                     </span>
                     <span className="hero-line block leading-[1.08]">
                        Perfectly <span className="italic">timed.</span>
                     </span>
                     <span
                        className="hero-line gradient-text block leading-[1.08] pb-[0.12em]"
                     >
                        Deeply <span className="italic">personal.</span>
                     </span>
                  </h1>
               </div>

               {/* Sub-copy */}
               <p
                  ref={subRef}
                  className="text-[clamp(0.95rem,1.2vw,1.12rem)] text-[var(--text-secondary)] leading-[1.75] max-w-[520px] mb-8 md:mb-10 mx-auto lg:mx-0"
               >
                  Discover how Rosey researches your leads, writes personalized messages at the perfect moment, and hands off to your team only when they&apos;re ready to close.
               </p>

               {/* CTAs */}
               <div
                  ref={ctaRef}
                  className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 md:gap-12"
               >
                  <Link
                     href={startBuildingHref}
                     className="w-full sm:w-auto px-8 md:px-11 py-[1rem] md:py-[1.1rem] bg-[var(--accent-primary)] text-[var(--text-primary)] rounded-[50px] text-[1rem] md:text-[1.05rem] font-[750] transition-all duration-200 ease-in-out shadow-[0_10px_40px_var(--accent-primary-glow)] hover:-translate-y-[2px] hover:shadow-[0_15px_50px_var(--accent-primary-glow)] text-center"
                  >
                     {startBuildingLabel}
                  </Link>
                  <button
                     className="flex items-center gap-[0.6rem] text-[var(--text-primary)] text-[1rem] md:text-[1.05rem] font-[650] transition-opacity duration-200 ease-in-out hover:opacity-70"
                  >
                     Watch Demo
                     <span className="text-[1.3rem]">→</span>
                  </button>
               </div>
            </div>

            {/* RIGHT — Workflow Visual: shown below text on mobile, right column on lg+ */}
            <div className="flex justify-center lg:justify-end lg:pr-4 w-full px-2 sm:px-4 lg:px-0">
               <WorkflowVisual />
            </div>
         </div>
      </section>
   );
}
