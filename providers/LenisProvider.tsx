"use client";

import { ReactNode, useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useBoot } from "./BootProvider";

export default function LenisProvider({ children }: { children: ReactNode }) {
   const lenisRef = useRef<Lenis | null>(null);
   const { isBooted } = useBoot();

   useEffect(() => {
      if (!isBooted) return;

      const mobile = window.matchMedia("(max-width: 768px)").matches;

      const lenis = new Lenis({
         duration: mobile ? 1.2 : 1.35,
         easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
         orientation: "vertical",
         gestureOrientation: "both",
         smoothWheel: true,
         wheelMultiplier: mobile ? 1 : 0.9,
         touchMultiplier: mobile ? 2.2 : 1.0,
         lerp: mobile ? 0.12 : 0.1,
         virtualScroll: (data) => {
            if (!(data.event instanceof WheelEvent)) return true;
            if (data.event.ctrlKey) return false;
            const absY = Math.abs(data.deltaY);
            const absX = Math.abs(data.deltaX);
            const isLikelyTrackpad = data.event.deltaMode === 0 && absY > 0 && absY < 40;

            if (isLikelyTrackpad) {
               data.deltaY *= 1.45;
               data.deltaX *= 1.2;
            } else if (absY > 0 && absY < 120 && absX > 0 && absX < 120) {
               data.deltaY *= 1.15;
               data.deltaX *= 1.1;
            }
            return true;
         },
      });

      lenisRef.current = lenis;

      lenis.on("scroll", ScrollTrigger.update);

      function update(time: number) {
         lenis.raf(time * 1000);
      }

      gsap.ticker.add(update);
      gsap.ticker.lagSmoothing(0);

      return () => {
         gsap.ticker.remove(update);
         lenis.destroy();
         lenisRef.current = null;
      };
   }, [isBooted]);

   return <>{children}</>;
}
