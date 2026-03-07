"use client";

import { useRef } from "react";
import gsap from "gsap";
import useIsomorphicLayoutEffect from "@/hooks/useIsomorphicLayoutEffect";
import WorkflowVisual from "./WorkflowVisual";

export default function HeroSection() {
   const sectionRef = useRef<HTMLElement>(null);
   const badgeRef = useRef<HTMLDivElement>(null);
   const headingRef = useRef<HTMLDivElement>(null);
   const subRef = useRef<HTMLParagraphElement>(null);
   const ctaRef = useRef<HTMLDivElement>(null);

   useIsomorphicLayoutEffect(() => {
      const ctx = gsap.context(() => {
         // Badge
         gsap.from(badgeRef.current, {
            opacity: 0,
            y: 20,
            duration: 0.6,
            ease: "power2.out",
            delay: 0.3,
         });

         // Heading lines
         const lines = headingRef.current?.querySelectorAll(".hero-line");
         if (lines) {
            gsap.from(lines, {
               opacity: 0,
               y: 40,
               duration: 0.8,
               ease: "power3.out",
               stagger: 0.15,
               delay: 0.5,
            });
         }

         // Sub copy
         gsap.from(subRef.current, {
            opacity: 0,
            y: 20,
            duration: 0.8,
            ease: "power2.out",
            delay: 0.8,
         });

         // CTAs
         gsap.from(ctaRef.current, {
            opacity: 0,
            y: 20,
            duration: 0.6,
            ease: "power2.out",
            delay: 1.0,
         });

      }, sectionRef);

      return () => ctx.revert();
   }, []);

   return (
      <section
         ref={sectionRef}
         style={{
            height: "100vh",
            background: "var(--bg-base)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            padding: "5rem 2rem 2rem",
            overflow: "hidden",
         }}
      >
         {/* Hero radial glow */}
         <div
            style={{
               position: "absolute",
               top: 0,
               left: 0,
               right: 0,
               bottom: 0,
               background: "var(--gradient-hero)",
               pointerEvents: "none",
               zIndex: 0,
            }}
         />

         {/* Centered Content Container */}
         <div
            style={{
               width: "100%",
               maxWidth: "1400px",
               margin: "0 auto",
               display: "grid",
               gridTemplateColumns: "1.2fr 0.8fr",
               alignItems: "center",
               gap: "6.5rem",
               position: "relative",
               zIndex: 1,
            }}
         >
            {/* LEFT — Tagline */}
            <div style={{ paddingLeft: "2.25rem" }}>
               {/* Heading */}
               <div ref={headingRef} style={{ margin: "0 0 1.5rem", paddingBottom: "0.25rem", overflow: "visible" }}>
                  <h1
                     style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "clamp(3rem, 4.9vw, 4.4rem)",
                        fontWeight: 800,
                        lineHeight: 1.14,
                        letterSpacing: "-0.03em",
                        color: "var(--text-primary)",
                        textTransform: "none",
                        overflow: "visible",
                      }}
                  >
                     <span className="hero-line" style={{ display: "block", lineHeight: 1.08 }}>
                        Intelligent outreach.
                     </span>
                     <span className="hero-line" style={{ display: "block", lineHeight: 1.08 }}>
                        Perfectly timed.
                     </span>
                     <span
                        className="hero-line gradient-text"
                        style={{ display: "block", lineHeight: 1.08, paddingBottom: "0.12em" }}
                     >
                        Deeply personal.
                     </span>
                  </h1>
               </div>

               {/* Sub-copy */}
               <p
                  ref={subRef}
                  style={{
                     fontSize: "clamp(1rem, 1.2vw, 1.12rem)",
                     color: "var(--text-secondary)",
                     lineHeight: 1.75,
                     maxWidth: "520px",
                     marginBottom: "2.5rem",
                  }}
               >
                  Discover how Rosey researches your leads, writes personalized messages at the perfect moment, and hands off to your team only when they&apos;re ready to close.
               </p>

               {/* CTAs */}
               <div
                  ref={ctaRef}
                  style={{
                     display: "flex",
                     alignItems: "center",
                     gap: "3rem",
                  }}
               >
                  <button
                     style={{
                        padding: "1.1rem 2.8rem",
                        background: "var(--accent-primary)",
                        color: "var(--text-primary)",
                        borderRadius: "50px",
                        fontSize: "1.05rem",
                        fontWeight: 750,
                        transition: "transform 200ms ease, box-shadow 200ms ease",
                        boxShadow: "0 10px 40px var(--accent-primary-glow)",
                     }}
                     onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 15px 50px var(--accent-primary-glow)";
                     }}
                     onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 10px 40px var(--accent-primary-glow)";
                     }}
                  >
                     Start Building
                  </button>
                  <button
                     style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        color: "var(--text-primary)",
                        fontSize: "1.05rem",
                        fontWeight: 650,
                        transition: "opacity 200ms ease",
                     }}
                     onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                     onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                     Watch Demo
                     <span style={{ fontSize: "1.3rem" }}>→</span>
                  </button>
               </div>
            </div>

            {/* RIGHT — Workflow Visual */}
            <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: "1rem" }}>
               <WorkflowVisual />
            </div>
         </div>
      </section>
   );
}
