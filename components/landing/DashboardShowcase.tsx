"use client";

import { useRef } from "react";
import gsap from "gsap";
import "gsap/ScrollTrigger"; // registers ScrollTrigger plugin, used via gsap context
import useIsomorphicLayoutEffect from "@/hooks/useIsomorphicLayoutEffect";
import { useBoot } from "@/providers/BootProvider";

// ScrollTrigger registration is handled once in GSAPProvider.

const kpis = [
   { label: "Emails Sent", value: "247", color: "var(--accent-primary)" },
   { label: "Replies", value: "31", color: "var(--accent-secondary)" },
   { label: "Reply Rate", value: "12.6%", color: "var(--accent-secondary-dim)" },
   { label: "In Handoff", value: "4", color: "var(--accent-primary)" },
];

const leads = [
   { initials: "PS", name: "Priya Sharma", company: "FinStack", score: 82, status: "Ready to Call", statusColor: "var(--accent-secondary)", statusBg: "var(--accent-secondary-glow)" },
   { initials: "AK", name: "Arjun Kapoor", company: "DataPulse", score: 65, status: "Warming Up", statusColor: "var(--accent-primary)", statusBg: "var(--accent-primary-glow)" },
   { initials: "MG", name: "Meera Gupta", company: "CloudNine", score: 71, status: "Ready to Call", statusColor: "var(--accent-secondary)", statusBg: "var(--accent-secondary-glow)" },
];

export default function DashboardShowcase() {
   const sectionRef = useRef<HTMLElement>(null);
   const { isBooted } = useBoot();

   useIsomorphicLayoutEffect(() => {
      if (!isBooted) return;
      const ctx = gsap.context(() => {
         // 1. Cinematic Card Reveal (Long-tail easing, reduced vertical travel)
         const cards = sectionRef.current?.querySelectorAll(".dash-card");
         if (cards) {
            gsap.from(cards, {
               opacity: 0,
               y: 40, // Subdued movement
               duration: 1.6,
               ease: "expo.out",
               stagger: 0.1, // Tighter stagger for a more cohesive group reveal
               scrollTrigger: {
                  trigger: sectionRef.current,
                  start: "top 75%", // slightly earlier
                  toggleActions: "play none none none",
               },
            });
         }

         // 2. Ambient Scroll Parallax
         // Keeps the section feeling alive rather than statically pinned
         gsap.to(sectionRef.current, {
            backgroundPosition: "0% 20%",
            ease: "none",
            scrollTrigger: {
               trigger: sectionRef.current,
               start: "top bottom",
               end: "bottom top",
               scrub: true,
            },
         });
      }, sectionRef);

      return () => ctx.revert();
   }, [isBooted]);

   const cardClass = "bg-[var(--bg-card)] border border-[var(--bg-border)] rounded-[20px] p-7 transition-shadow duration-300 ease-in-out";

   return (
      <section
         ref={sectionRef}
         id="dashboard"
         className="min-h-screen bg-[var(--bg-base)] px-16 py-24"
      >
         {/* Header */}
         <div className="text-center mb-16">
            <span className="section-label inline-flex mb-4">
               Live Intelligence
            </span>
            <h2
               className="text-[clamp(2rem,4vw,3rem)] text-[var(--text-primary)] tracking-[-0.03em] mt-4 leading-[1.15] font-[family-name:var(--font-heading)]"
               style={{ fontFamily: "var(--font-heading)" }}
            >
               The control room for every
               <br />
               outreach campaign you run.
            </h2>
         </div>

         {/* Cards grid */}
         <div className="grid grid-cols-2 auto-rows-auto gap-6 max-w-[900px] mx-auto">
            {/* Card 1 — Campaign Overview (wide, spans 2 cols) */}
            <div
               className={`dash-card col-span-full ${cardClass}`}
               onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow = "0 0 40px var(--accent-primary-glow)")
               }
               onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
               <div className="text-xs text-[var(--text-tertiary)] mb-5 tracking-[0.05em]">
                  Product Overview · my-b2b-saas
               </div>
               <div className="grid grid-cols-4 gap-5">
                  {kpis.map((kpi) => (
                     <div key={kpi.label}>
                        <div
                           className="text-[1.75rem] font-bold leading-[1.2] font-[family-name:var(--font-heading)]"
                           style={{ color: kpi.color, fontFamily: "var(--font-heading)" }}
                        >
                           {kpi.value}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)] mt-1">
                           {kpi.label}
                        </div>
                     </div>
                  ))}
               </div>
               {/* Sparkline bars */}
               <div className="flex items-end gap-[3px] h-10 mt-5">
                  {[30, 45, 35, 55, 70, 50, 65, 80, 60, 75, 85, 70].map((h, i) => (
                     <div
                        key={i}
                        className="flex-1 rounded-[2px]"
                        style={{
                           height: `${h}%`,
                           background: `linear-gradient(to top, var(--accent-primary-dim), var(--accent-primary))`,
                           opacity: 0.6 + (h / 100) * 0.4,
                        }}
                     />
                  ))}
               </div>
            </div>

            {/* Card 2 — Campaign Health Score */}
            <div
               className={`dash-card ${cardClass}`}
               onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow = "0 0 40px var(--accent-primary-glow)")
               }
               onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
               <div className="text-xs text-[var(--text-tertiary)] mb-5 tracking-[0.05em]">
                  Campaign Health Score
               </div>
               {/* Arc gauge */}
               <div className="flex justify-center mb-4">
                  <div className="relative w-[120px] h-[120px]">
                     <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
                        <circle
                           cx="60"
                           cy="60"
                           r="50"
                           fill="none"
                           stroke="var(--accent-primary)"
                           strokeWidth="8"
                           strokeDasharray={2 * Math.PI * 50}
                           strokeDashoffset={2 * Math.PI * 50 * (1 - 0.78)}
                           strokeLinecap="round"
                        />
                     </svg>
                     <div className="absolute inset-0 flex items-center justify-center text-[1.5rem] font-bold text-[var(--accent-primary)] font-[family-name:var(--font-heading)]" style={{ fontFamily: "var(--font-heading)" }}>
                        78
                     </div>
                  </div>
               </div>
               <p className="text-[0.8rem] text-[var(--text-secondary)] italic text-center leading-[1.5]">
                  Open rate trending up 6% this week. Subject line changes working.
               </p>
            </div>

            {/* Card 3 — Human Handoff Queue */}
            <div
               className={`dash-card ${cardClass}`}
               onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow = "0 0 40px var(--accent-primary-glow)")
               }
               onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
               <div className="text-xs text-[var(--text-tertiary)] mb-5 tracking-[0.05em]">
                  Human Handoff Queue
               </div>
               <div className="flex flex-col gap-3">
                  {leads.map((lead) => (
                     <div
                        key={lead.name}
                        className="flex items-center gap-3 px-3 py-[0.6rem] rounded-[10px] bg-[var(--bg-elevated)]"
                     >
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-[var(--bg-border)] flex items-center justify-center text-[0.65rem] font-semibold text-[var(--text-secondary)] shrink-0">
                           {lead.initials}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                           <div className="text-[0.8rem] font-medium text-[var(--text-primary)] leading-[1.3]">
                              {lead.name}
                           </div>
                           <div className="text-[0.7rem] text-[var(--text-tertiary)]">
                              {lead.company}
                           </div>
                        </div>
                        {/* Score bar */}
                        <div className="w-[50px] h-[5px] rounded-[3px] bg-[var(--bg-base)] overflow-hidden">
                           <div
                              className="h-full rounded-[3px]"
                              style={{
                                 width: `${lead.score}%`,
                                 background: "linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))",
                              }}
                           />
                        </div>
                        {/* Status */}
                        <span
                           className="text-[0.6rem] font-semibold px-2 py-[0.15rem] rounded-[4px] whitespace-nowrap"
                           style={{
                              background: lead.statusBg,
                              color: lead.statusColor,
                           }}
                        >
                           {lead.status}
                        </span>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </section>
   );
}
