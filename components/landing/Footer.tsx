"use client";

import { Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
   return (
      /*
       * Outer wrapper: same bg-surface as the card so the padding gap
       * around the floating card is invisible — no black bars.
       */
      <div className="bg-[var(--bg-base)] px-6 md:px-10">
         <footer className="relative bg-[var(--bg-surface)] border border-[var(--bg-border)] overflow-hidden rounded-t-[5rem] z-10">
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-50" />

            <div className="max-w-7xl mx-auto px-6 md:px-16 py-16 mt-8">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
                  {/* Brand & Description */}
                  <div className="md:col-span-2 space-y-6">
                     <a
                        href="#"
                        className="flex items-center gap-2 text-3xl font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]"
                        style={{ fontFamily: "var(--font-heading)" }}
                     >
                        <span className="text-[var(--accent-primary)] drop-shadow-[0_0_10px_rgba(215,35,35,0.5)]">◈</span>
                        Rosey
                     </a>
                     <p className="text-[var(--text-secondary)] text-sm max-w-sm leading-relaxed">
                        An advanced AI agent building the future of automated outreach and campaign management. Precise, cinematic, and intelligent.
                     </p>
                     <div className="flex gap-4 pt-4">
                        <a href="#" className="p-2.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary-glow)] transition-all shadow-lg">
                           <Twitter size={18} />
                        </a>
                        <a href="#" className="p-2.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary-glow)] transition-all shadow-lg">
                           <Github size={18} />
                        </a>
                        <a href="#" className="p-2.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary-glow)] transition-all shadow-lg">
                           <Linkedin size={18} />
                        </a>
                     </div>
                  </div>

                  {/* Links Column 1 */}
                  <div className="space-y-6">
                     <h4 className="text-[var(--text-primary)] font-semibold tracking-wider text-sm uppercase">Platform</h4>
                     <ul className="space-y-4">
                        {["Features", "Dashboard", "Workflow", "Integrations"].map((link) => (
                           <li key={link}>
                              <a
                                 href={`#${link.toLowerCase()}`}
                                 className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:translate-x-1 inline-block transition-all duration-200"
                              >
                                 {link}
                              </a>
                           </li>
                        ))}
                     </ul>
                  </div>

                  {/* Links Column 2 */}
                  <div className="space-y-6">
                     <h4 className="text-[var(--text-primary)] font-semibold tracking-wider text-sm uppercase">Company</h4>
                     <ul className="space-y-4">
                        {["About", "Contact", "Privacy", "Terms"].map((link) => (
                           <li key={link}>
                              <a
                                 href={`#${link.toLowerCase()}`}
                                 className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:translate-x-1 inline-block transition-all duration-200"
                              >
                                 {link}
                              </a>
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>

               {/* Bottom Bar */}
               <div className="mt-16 pt-8 border-t border-[var(--bg-border)] flex flex-col md:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-[var(--text-tertiary)]">
                     © {new Date().getFullYear()} Rosey. All rights reserved.
                  </p>
            
               </div>
            </div>
         </footer>
      </div>
   );
}
