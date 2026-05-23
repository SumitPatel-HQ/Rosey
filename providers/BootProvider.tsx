"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface BootContextType {
   isBooted: boolean;
}

const BootContext = createContext<BootContextType>({ isBooted: false });

export function useBoot() {
   return useContext(BootContext);
}

export default function BootProvider({ children }: { children: ReactNode }) {
   const [isBooted, setIsBooted] = useState(false);
   const [isFading, setIsFading] = useState(false);

   useEffect(() => {
      // 1. Force native scroll restoration off
      if ("scrollRestoration" in history) {
         history.scrollRestoration = "manual";
      }

      // 2. Capture initial scroll position
      const targetScrollY = window.scrollY || 0;
      
      // Force scroll to top while layout settles to prevent dirty trigger calculations
      if (targetScrollY > 0) {
         window.scrollTo(0, 0);
      }

      // 3. Wait for layout and fonts to stabilize
      const boot = async () => {
         await document.fonts.ready;
         
         // Give React/Next.js one more frame to ensure everything is painted
         await new Promise(resolve => setTimeout(resolve, 50));

         setIsBooted(true);

         // 4. Restore scroll and fade out after React flushes effects
         setTimeout(() => {
            if (targetScrollY > 0) {
               window.scrollTo(0, targetScrollY);
               // Let ScrollTrigger know we jumped, if it's already registered globally
               if (typeof window !== "undefined" && (window as any).ScrollTrigger) {
                  (window as any).ScrollTrigger.refresh();
               }
            }
            // 5. Fade out the curtain smoothly
            setIsFading(true);
         }, 100);
      };

      if (document.readyState === "complete") {
         boot();
      } else {
         window.addEventListener("load", boot);
         return () => window.removeEventListener("load", boot);
      }
   }, []);

   return (
      <BootContext.Provider value={{ isBooted }}>
         {children}
         {/* Cinematic Curtain */}
         {!isBooted || isFading ? (
            <div
               className={`fixed inset-0 z-[9999] bg-[var(--bg-base)] pointer-events-none transition-opacity duration-[1200ms] ease-[cubic-bezier(0.8,0,0.2,1)] ${isFading ? "opacity-0" : "opacity-100"}`}
               onTransitionEnd={() => {
                  if (isFading) setIsFading(false); // remove curtain entirely
               }}
            />
         ) : null}
      </BootContext.Provider>
   );
}
