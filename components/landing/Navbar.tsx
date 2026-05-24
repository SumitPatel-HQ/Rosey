"use client";

import { useRef, useState } from "react";
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
   const [menuOpen, setMenuOpen] = useState(false);

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

   const navLinks = ["Features", "How It Works", "Dashboard", "Contact"];

   return (
      <>
         <nav
            ref={navRef}
            className="fixed top-4 md:top-8 left-3 right-3 md:left-5 md:right-5 mx-auto max-w-[1100px] z-[100] flex justify-between items-center pl-5 md:pl-8 pr-4 md:pr-6 h-14 md:h-16 bg-[rgba(0,0,0,0)] backdrop-blur-[50px] backdrop-saturate-[180%] rounded-[100px] border border-[rgba(255,255,255,0.22)] border-t-[rgba(245,237,237,0.10)] shadow-[0_16px_35px_-18px_rgba(0,0,0,0.50),inset_0_1px_1px_rgba(245,237,237,0.08)] opacity-0"
         >
            {/* Logo */}
            <a
               href="#"
               className="flex items-center gap-2 text-[1.1rem] md:text-[1.15rem] font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]"
               style={{ fontFamily: "var(--font-heading)" }}
            >
               <span className="text-[var(--accent-primary)] text-[1.2rem]">◈</span>
               Rosey
            </a>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex gap-8 items-center">
               {navLinks.map((link) => (
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

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
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

            {/* Mobile Hamburger */}
            <button
               type="button"
               aria-label={menuOpen ? "Close menu" : "Open menu"}
               aria-expanded={menuOpen}
               onClick={() => setMenuOpen((v) => !v)}
               className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] shrink-0"
            >
               <span
                  className="block w-4 h-[1.5px] bg-[var(--text-primary)] rounded-full transition-all duration-300"
                  style={menuOpen ? { transform: "translateY(6.5px) rotate(45deg)" } : {}}
               />
               <span
                  className="block w-4 h-[1.5px] bg-[var(--text-primary)] rounded-full transition-all duration-300"
                  style={menuOpen ? { opacity: 0 } : {}}
               />
               <span
                  className="block w-4 h-[1.5px] bg-[var(--text-primary)] rounded-full transition-all duration-300"
                  style={menuOpen ? { transform: "translateY(-6.5px) rotate(-45deg)" } : {}}
               />
            </button>
         </nav>

         {/* Mobile Drawer Menu */}
         {menuOpen && (
            <div
               className="fixed inset-0 z-[99] md:hidden"
               onClick={() => setMenuOpen(false)}
            >
               <div
                  className="absolute top-[4.5rem] left-3 right-3 bg-[rgba(10,10,10,0.4)] backdrop-blur-[50px] backdrop-saturate-[180%] border border-[rgba(255,255,255,0.22)] border-t-[rgba(245,237,237,0.10)] rounded-[24px] p-6 flex flex-col gap-5 shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(245,237,237,0.08)]"
                  onClick={(e) => e.stopPropagation()}
               >
                  <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                     {navLinks.map((link) => (
                        <a
                           key={link}
                           href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                           onClick={() => setMenuOpen(false)}
                           className="px-4 py-3 rounded-[12px] text-[var(--text-secondary)] text-[1rem] font-medium transition-all duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--accent-primary)] active:bg-[rgba(255,255,255,0.1)]"
                           style={{ fontFamily: "var(--font-body)" }}
                        >
                           {link}
                        </a>
                     ))}
                  </nav>
                  <div className="border-t border-[rgba(255,255,255,0.08)] pt-4 flex flex-col gap-3">
                     {!isSignedIn ? (
                        <Link
                           href="/sign-in"
                           onClick={() => setMenuOpen(false)}
                           className="w-full text-center px-5 py-3 rounded-[100px] border border-[var(--accent-primary)] text-[var(--accent-primary)] text-[0.9rem] font-semibold transition-all duration-200 hover:bg-[var(--accent-primary)] hover:text-[var(--text-primary)] bg-transparent"
                           style={{ fontFamily: "var(--font-body)" }}
                        >
                           Sign In
                        </Link>
                     ) : null}
                     {isSignedIn ? (
                        <button
                           type="button"
                           onClick={() => { void signOut({ redirectUrl: "/" }); setMenuOpen(false); }}
                           className="w-full text-center px-5 py-3 rounded-[100px] border border-[var(--accent-primary)] text-[var(--accent-primary)] text-[0.9rem] font-semibold transition-all duration-200 hover:bg-[var(--accent-primary)] hover:text-[var(--text-primary)] bg-transparent"
                           style={{ fontFamily: "var(--font-body)" }}
                        >
                           Sign Out
                        </button>
                     ) : (
                        <button
                           type="button"
                           onClick={() => { router.push("/sign-up"); setMenuOpen(false); }}
                           className="w-full text-center px-5 py-3 rounded-[100px] border border-[rgba(255,255,255,0.14)] text-[var(--text-primary)] text-[0.9rem] font-semibold transition-all duration-200 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)]"
                           style={{ fontFamily: "var(--font-body)" }}
                        >
                           Sign Up
                        </button>
                     )}
                  </div>
               </div>
            </div>
         )}
      </>
   );
}
