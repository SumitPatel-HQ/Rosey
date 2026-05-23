"use client";

import { useRef } from "react";
import gsap from "gsap";
import "gsap/ScrollTrigger"; // registers ScrollTrigger plugin, used via gsap context
import { useGSAP } from "@gsap/react";
import FeatureCard from "./FeatureCard";
import { useBoot } from "@/providers/BootProvider";

// ScrollTrigger registration is handled once in GSAPProvider.

const features = [
   {
      number: "01",
      title: "Campaign Brain",
      subtitle: "Describe your goal. Rosey builds the workflow.",
      body: 'Type "Warm up 50 SaaS CTOs over 5 days" and Campaign Brain generates a complete multi-step outreach workflow — nodes, delays, branches, and all.',
      tag: "Natural Language → Workflow",
      accent: "var(--accent-primary)",
      visual: "campaign-brain" as const,
   },
   {
      number: "02",
      title: "Persona Intelligence",
      subtitle: "Every message shaped by personality, never templates.",
      body: "Rosey enriches each lead with Crystal DISC data (D, I, S, or C) and writes messages in the style each buyer naturally responds to.",
      tag: "Crystal · DISC Profiles",
      accent: "var(--accent-secondary)",
      visual: "persona" as const,
   },
   {
      number: "03",
      title: "Circadian Timing",
      subtitle: "Sent when your lead is most likely to open it.",
      body: "Rosey analyzes each lead's historical email engagement timestamps and calculates their personal optimal send window.",
      tag: "Per-Lead Timing Engine",
      accent: "var(--accent-primary)",
      visual: "timing" as const,
   },
   {
      number: "04",
      title: "Ghost Detector",
      subtitle: "Silence isn't the end. It's a signal.",
      body: "When a lead goes dark, Rosey diagnoses why — bad timing, tone mismatch, spam filters — and generates a completely new re-engagement strategy.",
      tag: "AI Silence Analysis",
      accent: "var(--accent-secondary)",
      visual: "ghost" as const,
   },
   {
      number: "05",
      title: "Human Handoff Intelligence",
      subtitle: "When it's time for a human, they can't possibly fail.",
      body: "When a lead's readiness score crosses 70, Rosey hands off with a complete AI call brief — personality summary, objections, and recommended opener.",
      tag: "Readiness Score · Call Brief",
      accent: "var(--accent-secondary)",
      visual: "handoff" as const,
   },
   {
      number: "06",
      title: "Committee Mapper",
      subtitle: "Refine leads using existing account intelligence.",
      body: "Rosey maps decision makers, influencers, and blockers from existing lead history so your campaign targets the full buying committee instead of a single contact.",
      tag: "Buying Committee Intelligence",
      accent: "var(--accent-primary)",
      visual: "committee" as const,
   },
   {
      number: "07",
      title: "Objection Pre-loader",
      subtitle: "Predict objections before the first reply lands.",
      body: "Based on persona, role, and campaign context, Rosey forecasts likely objections and pre-loads AI-generated responses so reps can answer in seconds.",
      tag: "Predictive Reply Library",
      accent: "var(--accent-secondary)",
      visual: "objection" as const,
   },
   {
      number: "08",
      title: "ROI Simulator",
      subtitle: "See outcome scenarios before you launch.",
      body: "Run expected-send, open, reply, and meeting projections with adjustable assumptions to understand campaign upside and risk before a single email goes out.",
      tag: "Pre-Launch Forecasting",
      accent: "var(--accent-primary)",
      visual: "roi" as const,
   },
   {
      number: "09",
      title: "Link Engagement Tracker",
      subtitle: "Turn clicks into insights in real time.",
      body: "Measure every interaction across your outreach links, spot high-intent behavior instantly, and prioritize leads based on true engagement signals.",
      tag: "Real-Time Click Intelligence",
      accent: "var(--accent-secondary)",
      visual: "link-engagement" as const,
   },
];

export default function FeaturesSection() {
   const sectionRef = useRef<HTMLElement>(null);
   const headerRef = useRef<HTMLDivElement>(null);
   const cardsTrackRef = useRef<HTMLDivElement>(null);
   const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
   const { isBooted } = useBoot();

   const totalFeatures = features.length;
   const navOffset = "6.5rem";

   // Balanced scroll distance: 90 was too fast, 160 was too slow
   const featureScrollVh = 120;
   const introScrollVh = 100;
   const totalScrollVh = introScrollVh + totalFeatures * featureScrollVh;

   useGSAP(() => {
      if (!isBooted) return;

      const header = headerRef.current;
      const cardsTrack = cardsTrackRef.current;
      if (!header || !cardsTrack) return;

      // 1. Header Entrance
      gsap.fromTo(
         header,
         { y: 100, opacity: 0, scale: 0.98 }, // Grounded y, micro-depth scale
         {
            y: 0,
            opacity: 1,
            scale: 1,
            ease: "power3.out", // More luxurious curve than power2
            scrollTrigger: {
               trigger: cardsTrack,
               start: "top 85%",
               end: "top 30%",
               scrub: true,
            },
         }
      );

      // 2. Main Sequence Timeline
      // Using a single timeline guarantees tweens never overlap improperly 
      // even if the user scrolls very fast.
      const tl = gsap.timeline({
         scrollTrigger: {
            trigger: cardsTrack,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.5, // Low scrub because Lenis already handles the scroll smoothing
         }
      });

      // Dim the header while scrolling
      // (Removed: Header now stays visible as the section title)

      features.forEach((_, i) => {
         const featureEl = featureRefs.current[i];
         if (!featureEl) return;

         // Spacing each card out on the timeline.
         // A card enters over 1.0, stays for 1.0, and exits over 1.0.
         // Next card starts entering slightly before the previous one finishes exiting.
         const startTime = i * 2.5;

         tl.fromTo(featureEl,
            { opacity: 0, y: 80, scale: 0.98 },
            { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out" },
            startTime
         );

         if (i < totalFeatures - 1) {
            tl.to(featureEl,
               { opacity: 0, y: -60, scale: 0.98, duration: 1, ease: "power3.inOut" }, // Smooth exit rather than sharp power2.in
               startTime + 2.0 // Starts exiting exactly when the "stay" period ends
            );
         } else {
            // Give the last card a bit of extra timeline space to stay on screen
            tl.to({}, { duration: 1.5 }, startTime + 2.0);
         }
      });

      // Final header exit at the very end of the scroll track
      tl.to(header, { opacity: 0, duration: 0.5 }, "-=0.5");

   }, { scope: sectionRef, dependencies: [totalFeatures, isBooted] });

   return (
      <section ref={sectionRef} id="features" className="relative bg-[var(--bg-base)]">
         <div
            ref={cardsTrackRef}
            className="relative"
            style={{ height: `${totalScrollVh}vh` }}
         >
            <div
               className="sticky flex items-center justify-center"
               style={{ top: navOffset, height: `calc(100vh - ${navOffset})` }}
            >
               <div
                  ref={headerRef}
                  className="absolute top-12 inset-x-0 flex flex-col items-center pointer-events-none"
               >
                  <h2
                     className="text-[clamp(1.4rem,3vw,2.3rem)] text-[var(--text-primary)] text-center tracking-[-0.02em] whitespace-nowrap px-4 uppercase"
                     style={{ fontFamily: "var(--font-heading)" }}
                  >
                     How Rosey thinks, sends, and decides.
                  </h2>
               </div>

               {features.map((feature, i) => (
                  <div
                     key={i}
                     ref={(el) => { featureRefs.current[i] = el; }}
                     className="absolute inset-0 flex items-center justify-center pt-10"
                  >
                     <div className="grid grid-cols-[1.1fr_0.9fr] items-center gap-16 w-full max-w-[1200px]">
                        <FeatureCard feature={feature} side="visual" />
                        <FeatureCard feature={feature} side="text" />
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>
   );
}
