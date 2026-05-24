"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useBoot } from "@/providers/BootProvider";

if (typeof window !== "undefined") {
   gsap.registerPlugin(ScrollTrigger);
}

export default function ContactSection() {
   const sectionRef = useRef<HTMLElement>(null);
   const { isBooted } = useBoot();

   useEffect(() => {
      if (!isBooted) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
         const tl = gsap.timeline({
            scrollTrigger: {
               trigger: sectionRef.current,
               start: "top 85%",
               toggleActions: "play none none none",
            }
         });

         // 1. Cinematic Section Reveal
         tl.from(sectionRef.current, {
            opacity: 0,
            y: 30, // Reduced from 50 to feel more grounded
            scale: 0.98,
            duration: 1.8,
            ease: "expo.out",
         });

         // 2. Atmospheric Build-up
         // The glow fades in slower than the UI, creating a sense of environmental depth
         const glow = sectionRef.current?.querySelector(".contact-glow");
         if (glow) {
            tl.from(glow, {
               opacity: 0,
               duration: 2.5,
               ease: "power2.out",
            }, 0.5); // Starts slightly after the section begins revealing
         }
      }, sectionRef);

      return () => ctx.revert();
   }, [isBooted]);

   return (
      <section
         ref={sectionRef}
         id="contact"
         className="min-h-[70vh] flex flex-col items-center justify-center px-8 py-24 bg-[var(--bg-base)] relative overflow-hidden"
      >
         {/* Ambient glow */}
         <div
            className="contact-glow absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[60%] h-[60%] pointer-events-none"
            style={{
               background:
                  "radial-gradient(ellipse at center, rgba(215, 35, 35, 0.12) 0%, transparent 70%)",
            }}
         />

         {/* Heading */}
         <h2
            className="text-[clamp(2.5rem,5vw,4rem)] text-center leading-[1.1] tracking-[-0.03em] text-[var(--text-primary)] max-w-[600px] mb-6 relative font-[family-name:var(--font-heading)]"
            style={{ fontFamily: "var(--font-heading)" }}
         >
            Ready to let{" "}
            <span className="gradient-text">Rosey</span>
            <br />
            do the outreach?
         </h2>

         {/* Sub-copy */}
         <p
            className="text-[1.125rem] text-[var(--text-secondary)] text-center max-w-[520px] leading-[1.7] mb-10 relative"
         >
            Join teams using Rosey to run intelligent, personalized outreach
            that&apos;s safe, compliant, and built around the human conversation.
         </p>

         {/* Email Form */}
         <form
            action="/dashboard"
            className="flex flex-col sm:flex-row gap-3 w-full max-w-[480px] relative"
         >
            <input
               type="email"
               placeholder="Enter your work email"
               className="flex-1 px-6 py-[1.1rem] bg-[var(--bg-card)] border border-[var(--bg-border)] rounded-full text-[var(--text-primary)] text-[1.05rem] outline-none transition-all duration-200 ease-in-out font-[family-name:var(--font-body)] focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_2px_rgba(215,35,35,0.25)] placeholder:text-[var(--text-tertiary)]"
               style={{ fontFamily: "var(--font-body)" }}
            />
            <button
               type="submit"
               className="px-8 py-[1.1rem] bg-[var(--accent-primary)] text-[var(--text-primary)] rounded-full text-[1.05rem] font-[750] whitespace-nowrap transition-all duration-200 ease-in-out shadow-[0_10px_40px_var(--accent-primary-glow)] hover:-translate-y-[2px] hover:shadow-[0_15px_50px_var(--accent-primary-glow)] font-[family-name:var(--font-body)]"
               style={{ fontFamily: "var(--font-body)" }}
            >
               Go to Dashboard →
            </button>
         </form>

         {/* Bottom note */}
         <p
            className="mt-6 text-[0.8125rem] text-[var(--text-tertiary)] text-center leading-[1.6] relative"
         >
            No cold email scripts. No manual follow-ups.
            <br />
            Just leads that are ready to talk.
         </p>
      </section>
   );
}
