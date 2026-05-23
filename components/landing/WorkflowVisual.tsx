"use client";

import { useRef } from "react";
import gsap from "gsap";
import useIsomorphicLayoutEffect from "@/hooks/useIsomorphicLayoutEffect";
import Image from "next/image";

export default function WorkflowVisual() {
   const containerRef = useRef<HTMLDivElement>(null);

   useIsomorphicLayoutEffect(() => {
      const ctx = gsap.context(() => {
         // Container entrance
         gsap.from(containerRef.current, {
            opacity: 0,
            x: 60,
            scale: 0.95,
            duration: 1,
            ease: "power3.out",
            delay: 0.5,
         });

         // Floating loop
         gsap.to(containerRef.current, {
            y: -12,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: 2,
         });
      }, containerRef);

      return () => ctx.revert();
   }, []);

   return (
      <div className="relative flex justify-center w-full">
         <div
            ref={containerRef}
            className="w-full shadow-[0_30px_60px_rgba(0,0,0,0.50)] rounded-[24px] overflow-hidden border border-[var(--bg-border)]"
         >
            <Image
               src="/workflow.png"
               alt="Rosey Workflow"
               width={1178}
               height={660}
               className="w-full h-auto block"
            />
         </div>
      </div>
   );
}
