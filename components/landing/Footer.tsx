"use client";

export default function Footer() {
   return (
      <footer
         style={{
            background: "var(--bg-base)",
            borderTop: "1px solid var(--bg-border)",
         }}
      >
         {/* Row 1 */}
         <div
            style={{
               display: "flex",
               justifyContent: "space-between",
               alignItems: "center",
               padding: "1.5rem 4rem",
            }}
         >
            <a
               href="#"
               style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontFamily: "var(--font-heading)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
               }}
            >
               <span style={{ color: "var(--accent-primary)" }}>◈</span>
               Rosey
            </a>

            <div style={{ display: "flex", gap: "2rem" }}>
               {["Features", "Dashboard", "Contact", "Privacy"].map((link) => (
                  <a
                     key={link}
                     href={`#${link.toLowerCase()}`}
                     style={{
                        color: "var(--text-tertiary)",
                        fontSize: "0.8125rem",
                        transition: "color 200ms ease",
                     }}
                     onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "var(--text-secondary)")
                     }
                     onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "var(--text-tertiary)")
                     }
                  >
                     {link}
                  </a>
               ))}
            </div>
         </div>

         {/* Row 2 */}
         <div
            style={{
               display: "flex",
               justifyContent: "space-between",
               padding: "0 4rem 1.5rem",
               fontSize: "0.8125rem",
               color: "var(--text-tertiary)",
            }}
         >
            <span>© 2026 Rosey. All rights reserved.</span>
            <span>Built with Next.js · Powered by AI</span>
         </div>
      </footer>
   );
}
