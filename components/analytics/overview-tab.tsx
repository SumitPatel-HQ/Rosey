"use client";

import { Users, Mail, Reply, TrendingUp, CheckCircle, Clock, ArrowRight, Activity, Zap } from "lucide-react";
import type { EnrichedAnalytics, ActivityEvent } from "@/types";
import {
  AreaChart, Area, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const TOOLTIP = {
  borderRadius: "10px", fontSize: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
  backgroundColor: "rgba(10,10,10,0.95)",
  color: "#e5e7eb",
  boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
};

// ── Hero KPI Banner ──────────────────────────────────────────────────────────

function HeroBanner({ analytics }: { analytics: EnrichedAnalytics }) {
  const score = analytics.healthScore.overall;
  const scoreColor = score >= 85 ? "#34d399" : score >= 70 ? "#22d3ee" : score >= 55 ? "#fbbf24" : "#f87171";
  const replyRate = analytics.replyRate;

  const insight =
    analytics.totalLeads === 0 ? "Load leads to begin your campaign outreach."
    : analytics.emailsSent === 0 ? "Campaign is ready — activate to start sending."
    : analytics.replies === 0 ? "Emails are out. First replies typically arrive within 24–48 hours."
    : replyRate >= 15 ? `Strong ${replyRate}% reply rate — your messaging is resonating.`
    : replyRate >= 8 ? `${replyRate}% reply rate — solid start, consider A/B testing subject lines.`
    : `${replyRate}% reply rate — try personalizing opening lines for higher engagement.`;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card shadow-sm dark:shadow-none border border-border dark:border-white/[0.03] bg-gradient-to-b from-muted/50 dark:from-white/[0.02] to-transparent p-5 sm:p-8">
      <div className="relative flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
        {/* Score */}
        <div className="flex items-center gap-5 shrink-0">
          <div className="relative">
            <svg width={88} height={88} className="-rotate-90 overflow-visible">
              <circle cx={44} cy={44} r={38} fill="none" stroke="currentColor" className="text-muted dark:text-white/[0.03]" strokeWidth={6} />
              <circle cx={44} cy={44} r={38} fill="none" stroke={scoreColor} strokeWidth={6}
                strokeDasharray={2 * Math.PI * 38}
                strokeDashoffset={2 * Math.PI * 38 * (1 - score / 100)}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 10px ${scoreColor}40)`, transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold leading-none tracking-tight">{score}</span>
              <span className="text-[10px] font-semibold mt-0.5" style={{ color: scoreColor }}>{analytics.healthScore.grade}</span>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Health Score</p>
            <p className="text-3xl font-bold tabular-nums tracking-tight" style={{ color: scoreColor }}>{analytics.replyRate}%</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Reply Rate</p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-20 bg-border dark:bg-white/[0.04]" />
        <div className="md:hidden w-full h-px bg-border dark:bg-white/[0.04]" />

        {/* AI insight */}
        <div className="flex-1 min-w-0 md:py-2">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-6 w-6  flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">AI Insight</span>
          </div>
          <p className="text-[15px] text-foreground/90 leading-relaxed max-w-2xl">{insight}</p>
        </div>
      </div>
    </div>
  );
}

// ── KPI Grid ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string;
}) {
  return (
    <div className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-card shadow-sm dark:shadow-none dark:bg-white/[0.01] hover:bg-accent dark:hover:bg-white/[0.02] border border-border dark:border-white/[0.03] transition-colors">
      <div className="absolute inset-0 bg-gradient-to-br from-card dark:from-white/[0.01] to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <Icon className="h-6 w-6 shrink-0" style={{ color: accent }} />
          <p className="text-3xl font-bold tracking-tight tabular-nums truncate">{value}</p>
        </div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/60 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── Funnel ───────────────────────────────────────────────────────────────────

function PremiumFunnel({ pipeline, total }: { pipeline: EnrichedAnalytics["pipeline"]; total: number }) {
  if (total === 0) return null;
  const stages = pipeline.filter((p) => p.count > 0);
  const max = stages[0]?.count || 1;

  return (
    <div className="relative rounded-2xl border border-border dark:border-white/[0.03] bg-card shadow-sm dark:shadow-none dark:bg-white/[0.01] p-5 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-semibold">Pipeline Funnel</p>
          <p className="text-xs text-muted-foreground mt-0.5">{total} total leads</p>
        </div>
      </div>
      <div className="space-y-3">
        {stages.map((stage, i) => {
          const pct = Math.round((stage.count / max) * 100);
          const conv = i > 0 ? Math.round((stage.count / (stages[i - 1]?.count || 1)) * 100) : 100;
          return (
            <div key={stage.stage}>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="font-medium">{stage.stage}</span>
                <div className="flex items-center gap-2">
                  {i > 0 && <span className="text-muted-foreground">{conv}% from prev</span>}
                  <span className="font-semibold tabular-nums">{stage.count}</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted dark:bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: stage.color, boxShadow: `0 0 8px ${stage.color}60` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Velocity Chart ───────────────────────────────────────────────────────────

function VelocityChart({ dailyVolume }: { dailyVolume: EnrichedAnalytics["dailyVolume"] }) {
  const hasData = dailyVolume.some((d) => d.sent > 0 || d.replies > 0);
  const data = dailyVolume.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <div className="relative rounded-2xl border border-border dark:border-white/[0.03] bg-card shadow-sm dark:shadow-none dark:bg-white/[0.01] p-5 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-semibold">Send Velocity</p>
          <p className="text-xs text-muted-foreground mt-0.5">Emails sent vs replies</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-400" />Sent</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" />Replies</span>
        </div>
      </div>
      {!hasData ? (
        <div className="h-48 flex flex-col items-center justify-center gap-2 text-center">
          <Mail className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No send data yet</p>
          <p className="text-xs text-muted-foreground/60">Activate your campaign to see trends appear here</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="replyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP} />
            <Area type="monotone" dataKey="sent" stroke="#22d3ee" strokeWidth={2} fill="url(#sentGrad)" dot={false} />
            <Area type="monotone" dataKey="replies" stroke="#34d399" strokeWidth={2} fill="url(#replyGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── Follow-up Chart ──────────────────────────────────────────────────────────

function FollowupChart({ data }: { data: EnrichedAnalytics["followupEffectiveness"] }) {
  if (data.length === 0) {
    return (
      <div className="relative rounded-2xl border border-border dark:border-white/[0.03] bg-card shadow-sm dark:shadow-none dark:bg-white/[0.01] p-5 sm:p-6">
        <p className="text-sm font-semibold mb-1">Follow-up Effectiveness</p>
        <p className="text-xs text-muted-foreground mb-4">Reply rate by sequence step</p>
        <div className="h-48 flex flex-col items-center justify-center gap-2 text-center">
          <Activity className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No follow-up data yet</p>
          <p className="text-xs text-muted-foreground/60">Follow-up sequences will appear as they execute</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-border dark:border-white/[0.03] bg-card shadow-sm dark:shadow-none dark:bg-white/[0.01] p-5 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-semibold">Follow-up Effectiveness</p>
          <p className="text-xs text-muted-foreground mt-0.5">Volume & reply rate by step</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
          <YAxis yAxisId="rate" orientation="right" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} width={36} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip contentStyle={TOOLTIP} formatter={(v, name) => name === "replyRate" ? [`${v}%`, "Reply Rate"] : [v, name === "sent" ? "Sent" : "Replies"]} />
          <Bar dataKey="sent" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={18} />
          <Bar dataKey="replies" fill="#22d3ee" radius={[4, 4, 0, 0]} barSize={18} />
          <Line yAxisId="rate" type="monotone" dataKey="replyRate" stroke="#34d399" strokeWidth={2}
            dot={{ r: 3, fill: "#34d399", strokeWidth: 0 }}
            style={{ filter: "drop-shadow(0 0 4px #34d39980)" }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Activity Feed ─────────────────────────────────────────────────────────────

function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const iconMap: Record<string, React.ElementType> = {
    send_email: Mail, start: ArrowRight, end: CheckCircle, condition: Activity, wait: Clock,
  };
  const statusStyle: Record<string, string> = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
    skipped: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  return (
    <div className="relative rounded-2xl border border-border dark:border-white/[0.03] bg-card shadow-sm dark:shadow-none dark:bg-white/[0.01] p-5 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm font-semibold">Recent Activity</p>
        <span className="text-[10px] text-muted-foreground bg-muted dark:bg-white/5 border border-border dark:border-white/8 rounded-full px-2 py-0.5">
          {events.length} events
        </span>
      </div>
      {events.length === 0 ? (
        <div className="h-32 flex flex-col items-center justify-center gap-2 text-center">
          <Activity className="h-7 w-7 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground/60">Events will stream in as your campaign runs</p>
        </div>
      ) : (
        <div className="space-y-0 max-h-[280px] overflow-y-auto scrollbar-none">
          {events.slice(0, 30).map((event, i) => {
            const Icon = iconMap[event.action] || Activity;
            return (
              <div key={event.id} className={`flex items-start gap-3 py-2.5 ${i < events.length - 1 ? "border-b border-border dark:border-white/5" : ""}`}>
                <div className="h-6 w-6 rounded-md bg-muted dark:bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-medium truncate">{event.leadName}</span>
                    <span className={`text-[9px] px-1.5 py-0 rounded-full border ${statusStyle[event.status] || "bg-muted dark:bg-white/5 text-muted-foreground border-border dark:border-white/10"}`}>
                      {event.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{formatAction(event.action)} · {event.leadEmail}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap shrink-0">{getRelativeTime(event.createdAt)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Lead Table ────────────────────────────────────────────────────────────────

function LeadTable({ leads }: { leads: EnrichedAnalytics["leadPerformance"] }) {
  if (leads.length === 0) return null;

  const statusStyle: Record<string, string> = {
    queued: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    active: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    waiting: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
    pending_review: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  };

  return (
    <div className="relative rounded-2xl border border-border dark:border-white/[0.03] bg-card shadow-sm dark:shadow-none dark:bg-white/[0.01] overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-border dark:border-white/[0.03]">
        <div>
          <p className="text-sm font-semibold">Lead Performance</p>
          <p className="text-xs text-muted-foreground mt-0.5">{leads.length} contacts in sequence</p>
        </div>
        <span className="text-[10px] text-muted-foreground bg-muted dark:bg-white/5 border border-border dark:border-white/8 rounded-full px-2 py-0.5">
          {leads.filter(l => l.replied).length} replied
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border dark:border-white/5">
              {["Lead", "Company", "Status", "Replied", "Follow-ups", "Last Action"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 first:pl-5 last:pr-5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.slice(0, 20).map((lead, i) => {
              const initials = lead.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <tr key={lead.campaignLeadId} className={`border-b border-border dark:border-white/[0.04] hover:bg-accent dark:hover:bg-white/[0.03] transition-colors ${i === leads.length - 1 ? "border-0" : ""}`}>
                  <td className="px-4 py-3 first:pl-5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-500/30 to-emerald-500/20 border border-border dark:border-white/10 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-cyan-300">{initials}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate max-w-[130px]">{lead.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[130px]">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[100px]">{lead.company || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusStyle[lead.status] || "bg-muted dark:bg-white/5 text-muted-foreground border-border dark:border-white/10"}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {lead.replied
                      ? <span className="text-emerald-400 text-sm">✓</span>
                      : <span className="text-muted-foreground/40 text-sm">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-mono tabular-nums">{lead.followupCount}</span>
                  </td>
                  <td className="px-4 py-3 last:pr-5 text-[11px] text-muted-foreground whitespace-nowrap">
                    {lead.lastActionTime ? getRelativeTime(lead.lastActionTime) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {leads.length > 20 && (
          <p className="text-xs text-muted-foreground text-center py-3 border-t border-border dark:border-white/5">
            Showing 20 of {leads.length} leads
          </p>
        )}
      </div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

export function OverviewTab({ analytics }: { analytics: EnrichedAnalytics }) {
  const sendCoverage = analytics.totalLeads ? (analytics.emailsSent / analytics.totalLeads) * 100 : 0;
  const replyRateNum = analytics.emailsSent ? (analytics.replies / analytics.emailsSent) * 100 : 0;
  const completionRate = analytics.totalLeads ? (analytics.completed / analytics.totalLeads) * 100 : 0;

  const kpis = [
    { label: "Total Leads", value: analytics.totalLeads, sub: "Audience base", icon: Users, accent: "#94a3b8" },
    { label: "Emails Sent", value: analytics.emailsSent, sub: `${sendCoverage.toFixed(0)}% reach`, icon: Mail, accent: "#22d3ee" },
    { label: "Replies", value: analytics.replies, sub: analytics.replies > 0 ? "Inbox active" : "Awaiting first reply", icon: Reply, accent: "#34d399" },
    { label: "In Progress", value: analytics.inProgress, sub: `${analytics.totalFollowups} follow-ups`, icon: Clock, accent: "#fbbf24" },
    { label: "Completed", value: analytics.completed, sub: `${completionRate.toFixed(0)}% done`, icon: CheckCircle, accent: "#60a5fa" },
    { label: "Reply Rate", value: `${analytics.replyRate}%`, sub: `${replyRateNum.toFixed(1)}% of sent`, icon: TrendingUp, accent: "#a78bfa" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      <HeroBanner analytics={analytics} />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Charts & Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        <div className="xl:col-span-2 space-y-6 lg:space-y-8">
          <VelocityChart dailyVolume={analytics.dailyVolume} />
          <FollowupChart data={analytics.followupEffectiveness} />
        </div>
        <div className="space-y-6 lg:space-y-8">
          <PremiumFunnel pipeline={analytics.pipeline} total={analytics.totalLeads} />
          <ActivityFeed events={analytics.recentActivity} />
        </div>
      </div>

      <LeadTable leads={analytics.leadPerformance} />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAction(action: string): string {
  const map: Record<string, string> = {
    send_email: "Email sent", start: "Workflow started", end: "Workflow completed",
    condition: "Condition checked", wait: "Wait started",
  };
  return map[action] ?? action;
}

function getRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
