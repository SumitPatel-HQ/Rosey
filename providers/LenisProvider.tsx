"use client";

import { ReactNode, useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function LenisProvider({ children }: { children: ReactNode }) {
   const lenisRef = useRef<Lenis | null>(null);

   useEffect(() => {
      const mobile = window.matchMedia("(max-width: 768px)").matches;

      const lenis = new Lenis({
         duration: mobile ? 1.2 : 1.8,
         easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
         orientation: "vertical",
         gestureOrientation: "vertical",
         smoothWheel: true,
         wheelMultiplier: 0.8,
         // Mobile touch needs a higher multiplier so the page keeps up with your finger
         touchMultiplier: mobile ? 2.2 : 1.0,
         // Higher lerp = snappier catch-up; desktop stays cinematic, mobile feels responsive
         lerp: mobile ? 0.12 : 0.05,
      });

      lenisRef.current = lenis;

      // Sync Lenis with GSAP's ticker
      function update(time: number) {
         lenis.raf(time * 1000);
      }

      gsap.ticker.add(update);
      gsap.ticker.lagSmoothing(0);

      // Connect Lenis scroll to ScrollTrigger
      lenis.on("scroll", ScrollTrigger.update);

      return () => {
         gsap.ticker.remove(update);
         lenis.destroy();
         lenisRef.current = null;
      };
   }, []);

   return <>{children}</>;
}
