"use client";

import { useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import useIsomorphicLayoutEffect from "@/hooks/useIsomorphicLayoutEffect";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Navbar() {
   const navRef = useRef<HTMLElement>(null);
   const router = useRouter();
   const { isSignedIn } = useAuth();
   const { signOut } = useClerk();

   useIsomorphicLayoutEffect(() => {
      const ctx = gsap.context(() => {
         gsap.fromTo(
            navRef.current,
            { y: -80, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", delay: 0.2 }
         );
      }, navRef);

      return () => ctx.revert();
   }, []);

   return (
      <nav
         ref={navRef}
         className="fixed top-8 left-5 right-5 mx-auto max-w-[1100px] z-[100] flex justify-between items-center pl-8 pr-6 h-16 bg-[rgba(0,0,0,0)] backdrop-blur-[50px] backdrop-saturate-[180%] rounded-[100px] border border-[rgba(255, 255, 255, 0.22)] border-t-[rgba(245,237,237,0.10)] shadow-[0_16px_35px_-18px_rgba(0,0,0,0.50),inset_0_1px_1px_rgba(245,237,237,0.08)] opacity-0"
      >
         {/* Logo */}
         <a
            href="#"
            className="flex items-center gap-2 text-[1.15rem] font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]"
            style={{ fontFamily: "var(--font-heading)" }}
         >
            <span className="text-[var(--accent-primary)] text-[1.2rem]">
               ◈
            </span>
            Rosey
         </a>

         {/* Nav Links */}
         <div className="flex gap-8 items-center">
            {["Features", "How It Works", "Dashboard", "Contact"].map((link) => (
               <a
                  key={link}
                  href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-[var(--text-secondary)] text-[0.875rem] transition-colors duration-200 ease-in-out hover:text-[var(--accent-primary)] font-[family-name:var(--font-body)]"
                  style={{ fontFamily: "var(--font-body)" }}
               >
                  {link}
               </a>
            ))}
         </div>

         <div className="flex items-center gap-3">
            {!isSignedIn ? (
               <Link
                  href="/sign-in"
                  className="px-5 py-2 rounded-[100px] border border-[var(--accent-primary)] text-[var(--accent-primary)] text-[0.875rem] font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--accent-primary)] hover:text-[var(--text-primary)] bg-transparent font-[family-name:var(--font-body)]"
                  style={{ fontFamily: "var(--font-body)" }}
               >
                  Sign In
               </Link>
            ) : null}

            {isSignedIn ? (
               <button
                  type="button"
                  onClick={() => void signOut({ redirectUrl: "/" })}
                  className="px-5 py-2 rounded-[100px] border border-[var(--accent-primary)] text-[var(--accent-primary)] text-[0.875rem] font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--accent-primary)] hover:text-[var(--text-primary)] bg-transparent font-[family-name:var(--font-body)]"
                  style={{ fontFamily: "var(--font-body)" }}
               >
                  Sign Out
               </button>
            ) : (
               <button
                  type="button"
                  onClick={() => router.push("/sign-up")}
                  className="px-5 py-2 rounded-[100px] border border-[rgba(255,255,255,0.14)] text-[var(--text-primary)] text-[0.875rem] font-semibold transition-all duration-200 ease-in-out bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] font-[family-name:var(--font-body)]"
                  style={{ fontFamily: "var(--font-body)" }}
               >
                  Sign Up
               </button>
            )}
         </div>
      </nav>
   );
}
