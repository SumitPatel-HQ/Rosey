"use client";

interface Feature {
   number: string;
   title: string;
   subtitle: string;
   body: string;
   tag: string;
   accent: string;
   visual:
   | "campaign-brain"
   | "persona"
   | "timing"
   | "ghost"
   | "handoff"
   | "committee"
   | "objection"
   | "roi"
   | "link-engagement";
}

interface FeatureCardProps {
   feature: Feature;
   side: "visual" | "text";
}

export default function FeatureCard({ feature, side }: FeatureCardProps) {
   if (side === "text") {
      return <FeatureText feature={feature} />;
   }
   return <FeatureVisual feature={feature} />;
}

/* ═══════════════════════════════════════════
   TEXT SIDE
   ═══════════════════════════════════════════ */

function FeatureText({ feature }: { feature: Feature }) {
   return (
      <div className="flex flex-col gap-5 px-10 py-12">
         <span
            className="text-[0.8rem] text-[var(--text-tertiary)] font-medium tracking-[0.1em] font-[family-name:var(--font-body)]"
            style={{ fontFamily: "var(--font-body)" }}
         >
            {feature.number}
         </span>

         <h2
            className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.03em] text-[var(--text-primary)] leading-[1.1] font-[family-name:var(--font-heading)]"
            style={{ fontFamily: "var(--font-heading)" }}
         >
            {feature.title}
         </h2>

         <p
            className="text-[1.15rem] italic leading-[1.4]"
            style={{ color: feature.accent }}
         >
            {feature.subtitle}
         </p>

         <p className="text-base text-[var(--text-secondary)] leading-[1.7] max-w-[380px]">
            {feature.body}
         </p>
      </div>
   );
}

/* ═══════════════════════════════════════════
   VISUAL SIDE — unique HTML/CSS illustrations
   ═══════════════════════════════════════════ */

function FeatureVisual({ feature }: { feature: Feature }) {
   return (
      <div className="flex justify-center items-center">
         <div className="bg-[var(--bg-card)] border border-[var(--bg-border)] rounded-[24px] p-8 w-full max-w-[520px] min-h-[360px] flex flex-col justify-center">
            {feature.visual === "campaign-brain" && <CampaignBrainVisual />}
            {feature.visual === "persona" && <PersonaVisual />}
            {feature.visual === "timing" && <TimingVisual />}
            {feature.visual === "ghost" && <GhostVisual />}
            {feature.visual === "handoff" && <HandoffVisual />}
            {feature.visual === "committee" && <CommitteeMapperVisual />}
            {feature.visual === "objection" && <ObjectionPreloaderVisual />}
            {feature.visual === "roi" && <ROISimulatorVisual />}
            {feature.visual === "link-engagement" && <LinkEngagementTrackerVisual />}
         </div>
      </div>
   );
}

/* ─── Campaign Brain ─── */
function CampaignBrainVisual() {
   const nodes = ["Start", "Message", "2-Day Delay", "If Replied?"];

   return (
      <div
         className="rounded-2xl py-8 px-6 relative"
         style={{
            backgroundImage: "radial-gradient(var(--bg-border) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
         }}
      >
         <div className="flex items-center gap-2 flex-wrap justify-center">
            {nodes.map((node, i) => (
               <div key={node} className="flex items-center gap-2">
                  <div className="py-2 px-4 rounded-lg border border-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--text-primary)] text-xs font-medium whitespace-nowrap">
                     {node}
                  </div>
                  {i < nodes.length - 1 && (
                     <span className="text-[var(--accent-primary)] text-base">→</span>
                  )}
               </div>
            ))}
         </div>
         <p className="text-center mt-6 text-xs text-[var(--text-tertiary)] italic">
            &quot;Warm up 50 SaaS CTOs over 5 days&quot;
         </p>
      </div>
   );
}

/* ─── Persona Visual ─── */
function PersonaVisual() {
   const quads = [
      { label: "D", desc: "Short · Direct · ROI-first", color: "var(--accent-primary)" },
      { label: "I", desc: "Warm · Story-driven", color: "var(--accent-secondary)" },
      { label: "S", desc: "Empathetic · Low-pressure", color: "var(--accent-secondary-dim)" },
      { label: "C", desc: "Data-heavy · Structured", color: "var(--accent-primary-dim)" },
   ];

   return (
      <div>
         <div className="grid grid-cols-2 gap-3 mb-4">
            {quads.map((q) => (
               <div
                  key={q.label}
                  className="p-5 rounded-xl bg-[var(--bg-elevated)] text-center"
               >
                  <div
                     className="text-2xl font-bold mb-1 font-[family-name:var(--font-heading)]"
                     style={{ color: q.color, fontFamily: "var(--font-heading)" }}
                  >
                     {q.label}
                  </div>
                  <div className="text-[0.65rem] text-[var(--text-secondary)] leading-[1.4]">
                     {q.desc}
                  </div>
               </div>
            ))}
         </div>
         {/* Lead tag */}
         <div className="py-[0.6rem] px-4 rounded-lg bg-[var(--bg-elevated)] flex items-center">
            <span className="text-[0.8rem] text-[var(--text-primary)]">
               Priya S. — D-type detected
            </span>
         </div>
      </div>
   );
}

/* ─── Timing Visual ─── */
function TimingVisual() {
   const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
   const heights = [40, 55, 35, 90, 50, 25, 20];

   return (
      <div>
         <div className="flex items-end justify-center gap-[0.6rem] h-[140px] mb-4 relative">
            {days.map((day, i) => (
               <div key={day} className="text-center flex-1">
                  <div
                     className="min-h-[12px] rounded-t-[6px] rounded-b-[2px] transition-colors duration-300 ease-in-out mb-2"
                     style={{
                        height: `${heights[i]}%`,
                        background: i === 3 ? "var(--accent-primary)" : "var(--bg-elevated)",
                     }}
                  />
                  <span
                     className={`text-[0.65rem] ${i === 3 ? "text-[var(--accent-primary)] font-semibold" : "text-[var(--text-tertiary)] font-normal"}`}
                  >
                     {day}
                  </span>
               </div>
            ))}
         </div>
         {/* Best window pill */}
         <div className="text-center">
            <span className="inline-block py-[0.35rem] px-4 rounded-full bg-[var(--accent-primary-glow)] text-[var(--accent-primary)] text-xs font-semibold mb-2">
               Best window: Thu 8–9am
            </span>
            <p className="text-[0.7rem] text-[var(--text-tertiary)]">
               Confidence: High · Based on 3 opens
            </p>
         </div>
      </div>
   );
}

/* ─── Ghost Visual ─── */
function GhostVisual() {
   const events = [
      { label: "Email 1 sent", filled: true },
      { label: "Email 2 sent", filled: true },
      { label: "Follow-up sent", filled: true },
      { label: "No response", filled: false },
      { label: "No response", filled: false },
   ];

   return (
      <div>
         {/* Timeline */}
         <div className="flex flex-col gap-2 mb-5">
            {events.map((ev, i) => (
               <div key={i} className="flex items-center gap-3 relative">
                  <div
                     className={`w-2.5 h-2.5 rounded-full shrink-0 border-2 ${ev.filled ? "bg-[var(--accent-primary)] border-[var(--accent-primary)]" : "bg-transparent border-[var(--text-tertiary)]"}`}
                  />
                  {i < events.length - 1 && (
                     <div className="absolute left-[5px] top-[14px] w-[1px] h-6 border-l border-dashed border-[var(--bg-border)]" />
                  )}
                  <span
                     className={`text-[0.8rem] ${ev.filled ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}
                  >
                     {ev.label}
                  </span>
               </div>
            ))}
         </div>
         {/* Diagnosis */}
         <div className="py-4 px-5 rounded-xl bg-[var(--accent-secondary-glow)] border border-[rgba(245,237,237,0.15)]">
            <p className="text-[0.8rem] text-[var(--accent-secondary)] font-semibold mb-1">
               Ghost detected · Tone mismatch
            </p>
            <p className="text-[0.75rem] text-[var(--text-secondary)] mb-3">
               C-type lead, sent I-style message. Switch to data-driven approach.
            </p>
            <span className="inline-block py-[0.35rem] px-4 rounded-full bg-[var(--accent-primary)] text-[var(--text-primary)] text-xs font-semibold cursor-pointer">
               Re-engage →
            </span>
         </div>
      </div>
   );
}

/* ─── Handoff Visual ─── */
function HandoffVisual() {
   const circumference = 2 * Math.PI * 58;
   const fill = circumference * (1 - 0.72);

   return (
      <div className="flex flex-col items-center gap-6">
         {/* Score ring */}
         <div className="relative w-[140px] h-[140px]">
            <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
               <circle cx="70" cy="70" r="58" fill="none" stroke="var(--bg-elevated)" strokeWidth="10" />
               <circle
                  cx="70"
                  cy="70"
                  r="58"
                  fill="none"
                  stroke="var(--accent-primary)"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={fill}
                  strokeLinecap="round"
               />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span
                  className="text-2xl font-bold text-[var(--accent-primary)] leading-none font-[family-name:var(--font-heading)]"
                  style={{ fontFamily: "var(--font-heading)" }}
               >
                  72
               </span>
               <span className="text-[0.7rem] text-[var(--text-tertiary)]">/ 100</span>
            </div>
         </div>

         {/* Call Brief */}
         <div className="w-full py-4 px-5 rounded-xl bg-[var(--bg-elevated)]">
            <div className="flex flex-col gap-2 text-[0.8rem]">
               <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Crystal</span>
                  <span className="py-[0.1rem] px-2 rounded bg-[var(--accent-primary-glow)] text-[var(--accent-primary)] font-semibold text-[0.7rem]">
                     D-type
                  </span>
               </div>
               <div className="text-[var(--text-secondary)]">
                  <span className="text-[var(--text-tertiary)] text-[0.7rem]">Objection: </span>
                  Budget approval
               </div>
               <div className="text-[var(--text-secondary)] italic text-[0.75rem]">
                  &quot;I&apos;ll keep this to 90 seconds...&quot;
               </div>
            </div>
            <div className="flex gap-2 mt-3">
               <button className="py-1.5 px-3 rounded-lg bg-[var(--accent-primary)] text-[var(--text-primary)] text-[0.75rem] font-semibold">
                  📞 Call Now
               </button>
               <button className="py-1.5 px-3 rounded-lg border border-[var(--bg-border)] text-[var(--text-secondary)] text-[0.75rem]">
                  📅 Send Calendly
               </button>
            </div>
         </div>
      </div>
   );
}

/* ─── Committee Mapper ─── */
function CommitteeMapperVisual() {
   const stakeholders = [
      { role: "Champion", person: "Head of Ops", tone: "var(--accent-primary)" },
      { role: "Economic Buyer", person: "VP Finance", tone: "var(--accent-secondary)" },
      { role: "Blocker", person: "IT Security", tone: "var(--text-tertiary)" },
   ];

   return (
      <div className="flex flex-col gap-4">
         <div className="text-center text-[0.72rem] text-[var(--text-tertiary)] tracking-[0.06em] uppercase">
            Existing leads expanded into buying committee
         </div>
         <div className="grid grid-cols-3 gap-3">
            {stakeholders.map((entry) => (
               <div
                  key={entry.role}
                  className="rounded-xl bg-[var(--bg-elevated)] py-3.5 px-2.5 border border-[var(--bg-border)] text-center"
               >
                  <div className="text-[0.65rem] text-[var(--text-tertiary)] mb-1">{entry.role}</div>
                  <div className="text-[0.78rem] font-semibold leading-[1.3]" style={{ color: entry.tone }}>{entry.person}</div>
               </div>
            ))}
         </div>
      </div>
   );
}

/* ─── Objection Pre-loader ─── */
function ObjectionPreloaderVisual() {
   const objections = [
      { objection: "No budget", response: "Phase rollout + fast payback model", confidence: "89%" },
      { objection: "Already using a tool", response: "Migration map with zero data loss", confidence: "84%" },
      { objection: "Timing not right", response: "Low-lift pilot plan in 7 days", confidence: "81%" },
   ];

   return (
      <div className="flex flex-col gap-3">
         {objections.map((item) => (
            <div
               key={item.objection}
               className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-elevated)] py-3 px-3.5"
            >
               <div className="text-[0.72rem] text-[var(--text-tertiary)] mb-1">
                  Predicted objection
               </div>
               <div className="text-[0.8rem] text-[var(--text-primary)] mb-[0.45rem] font-semibold">
                  {item.objection}
               </div>
               <div className="text-[0.72rem] text-[var(--text-secondary)] leading-[1.4]">
                  AI reply: {item.response}
               </div>
               <div className="text-[0.68rem] text-[var(--accent-secondary)] mt-[0.45rem]">
                  Confidence: {item.confidence}
               </div>
            </div>
         ))}
      </div>
   );
}

/* ─── ROI Simulator ─── */
function ROISimulatorVisual() {
   const metrics = [
      { label: "Projected Opens", value: "1,240", tone: "var(--accent-primary)" },
      { label: "Expected Replies", value: "188", tone: "var(--accent-secondary)" },
      { label: "Likely Meetings", value: "32", tone: "var(--accent-primary)" },
      { label: "Forecast Pipeline", value: "$142k", tone: "var(--accent-secondary)" },
   ];

   return (
      <div className="flex flex-col gap-4">
         <div className="h-[120px] rounded-2xl border border-[var(--bg-border)] bg-gradient-to-b from-[var(--accent-primary-glow)] to-transparent flex items-end p-3 gap-1.5">
            {[24, 38, 44, 58, 67, 78, 86].map((v, idx) => (
               <div
                  key={idx}
                  className="flex-1 rounded-t-md rounded-b-sm bg-[var(--accent-primary)]"
                  style={{ height: `${v}%` }}
               />
            ))}
         </div>
         <div className="grid grid-cols-2 gap-2">
            {metrics.map((metric) => (
               <div key={metric.label} className="rounded-lg bg-[var(--bg-elevated)] py-3 px-3">
                  <div className="text-[0.65rem] text-[var(--text-tertiary)] mb-1">{metric.label}</div>
                  <div className="text-[0.95rem] font-bold" style={{ color: metric.tone }}>{metric.value}</div>
               </div>
            ))}
         </div>
      </div>
   );
}

/* ─── Link Engagement Tracker ─── */
function LinkEngagementTrackerVisual() {
   const links = [
      { label: "Pricing deck", clicks: 38, ctr: "31%", tone: "var(--accent-primary)" },
      { label: "Case study", clicks: 24, ctr: "22%", tone: "var(--accent-secondary)" },
      { label: "Demo scheduler", clicks: 17, ctr: "15%", tone: "var(--accent-primary)" },
   ];

   return (
      <div className="flex flex-col gap-3.5">
         <div className="rounded-xl border border-[var(--bg-border)] bg-gradient-to-b from-[var(--accent-secondary-glow)] to-transparent py-3.5 px-4">
            <div className="flex justify-between items-center mb-2">
               <span className="text-[0.72rem] text-[var(--text-tertiary)] uppercase tracking-[0.06em]">
                  Live activity
               </span>
               <span className="text-[0.68rem] text-[var(--accent-secondary)] bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-full py-[0.16rem] px-2">
                  Updated now
               </span>
            </div>
            <div
               className="text-[1.45rem] text-[var(--text-primary)] leading-none font-[family-name:var(--font-heading)]"
               style={{ fontFamily: "var(--font-heading)" }}
            >
               79 Clicks
            </div>
            <div className="text-[0.75rem] text-[var(--text-secondary)] mt-1">
               12 high-intent leads flagged this hour
            </div>
         </div>

         <div className="flex flex-col gap-2">
            {links.map((item) => (
               <div
                  key={item.label}
                  className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] py-2.5 px-3"
               >
                  <div className="flex justify-between items-center mb-1">
                     <span className="text-[0.78rem] text-[var(--text-primary)]">{item.label}</span>
                     <span className="text-[0.72rem] font-semibold" style={{ color: item.tone }}>{item.ctr} CTR</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bg-card)] overflow-hidden">
                     <div
                        className="h-full rounded-full"
                        style={{
                           width: `${Math.min(item.clicks, 40) * 2.3}%`,
                           background: item.tone,
                        }}
                     />
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}
