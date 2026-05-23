"use client";

import { useEffect, createContext, useContext, useState, ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useBoot } from "./BootProvider";

interface GSAPContextType {
   isReady: boolean;
}

const GSAPContext = createContext<GSAPContextType>({ isReady: false });

export function useGSAP() {
   return useContext(GSAPContext);
}

export default function GSAPProvider({ children }: { children: ReactNode }) {
   const [isReady, setIsReady] = useState(false);
   const { isBooted } = useBoot();

   useEffect(() => {
      gsap.registerPlugin(ScrollTrigger);

      // Do NOT use normalizeScroll(true) with Lenis.
      // It creates an additional scroll layer and causes conflicts.

      gsap.defaults({
         ease: "power2.out",
         duration: 1,
      });

      if (isBooted) {
         // Avoid synchronous setState in effect to prevent cascading renders
         const timer = setTimeout(() => {
            setIsReady(true);
         }, 0);

         return () => clearTimeout(timer);
      }
   }, [isBooted]);

   return (
      <GSAPContext.Provider value={{ isReady }}>
         {children}
      </GSAPContext.Provider>
   );
}
