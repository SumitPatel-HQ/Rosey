"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Mail,
  Reply,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowRight,
  Activity,
} from "lucide-react";
import type { EnrichedAnalytics, ActivityEvent } from "@/types";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";

// ── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtext,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtext?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Pipeline Funnel ─────────────────────────────────────────────────────────

function PipelineFunnel({
  pipeline,
  total,
}: {
  pipeline: EnrichedAnalytics["pipeline"];
  total: number;
}) {
  if (total === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Pipeline Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {pipeline
            .filter((p) => p.count > 0)
            .map((stage) => {
              const pct = Math.round((stage.count / total) * 100);
              return (
                <div key={stage.stage} className="group">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="text-muted-foreground">
                        {stage.stage}
                      </span>
                    </div>
                    <span className="font-semibold">
                      {stage.count}{" "}
                      <span className="text-xs text-muted-foreground font-normal">
                        ({pct}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: stage.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Send Velocity Chart ─────────────────────────────────────────────────────

function SendVelocityChart({
  dailyVolume,
}: {
  dailyVolume: EnrichedAnalytics["dailyVolume"];
}) {
  const hasData = dailyVolume.some((d) => d.sent > 0 || d.replies > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Send Volume & Replies (30d)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            No send data yet — activate a campaign to see trends
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatted = dailyVolume.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Send Volume & Replies (30d)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                fontSize: "12px",
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--popover))",
                color: "hsl(var(--popover-foreground))",
              }}
            />
            <Area
              type="monotone"
              dataKey="sent"
              stroke="#60a5fa"
              fill="#60a5fa"
              fillOpacity={0.15}
              strokeWidth={2}
              name="Sent"
            />
            <Area
              type="monotone"
              dataKey="replies"
              stroke="#a78bfa"
              fill="#a78bfa"
              fillOpacity={0.15}
              strokeWidth={2}
              name="Replies"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Follow-up Effectiveness ─────────────────────────────────────────────────

function FollowupChart({
  data,
}: {
  data: EnrichedAnalytics["followupEffectiveness"];
}) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Follow-up Effectiveness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            No follow-up data yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Follow-up Effectiveness
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                fontSize: "12px",
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--popover))",
                color: "hsl(var(--popover-foreground))",
              }}
              formatter={(value, name) => {
                if (name === "replyRate") return [`${value}%`, "Reply Rate"];
                return [value, name === "sent" ? "Sent" : "Replies"];
              }}
            />
            <Bar dataKey="sent" fill="#93c5fd" radius={[4, 4, 0, 0]} name="sent" />
            <Bar dataKey="replies" fill="#c4b5fd" radius={[4, 4, 0, 0]} name="replies" />
          </BarChart>
        </ResponsiveContainer>
        {/* Reply rate labels below */}
        <div className="flex gap-2 mt-2 justify-center">
          {data.map((d) => (
            <div
              key={d.step}
              className="text-center text-xs text-muted-foreground"
            >
              <span className="font-semibold text-foreground">
                {d.replyRate}%
              </span>{" "}
              reply
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Activity Feed ───────────────────────────────────────────────────────────

function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
            No activity yet
          </div>
        </CardContent>
      </Card>
    );
  }

  const actionIcons: Record<string, React.ElementType> = {
    send_email: Mail,
    start: ArrowRight,
    end: CheckCircle,
    condition: Activity,
    wait: Clock,
  };

  const actionColors: Record<string, string> = {
    success: "text-foreground",
    failed: "text-foreground",
    skipped: "text-muted-foreground",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
          {events.slice(0, 30).map((event) => {
            const Icon = actionIcons[event.action] || Activity;
            const color = actionColors[event.status] || "text-muted-foreground";
            const timeAgo = getRelativeTime(event.createdAt);
            return (
              <div
                key={event.id}
                className="flex items-start gap-2 py-1.5 text-xs border-b border-muted/50 last:border-0"
              >
                <Icon className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium truncate">
                      {event.leadName}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1 py-0 border-0 ${
                        event.status === "success"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : event.status === "failed"
                            ? "bg-red-500/15 text-red-400"
                            : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {event.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground truncate">
                    {formatAction(event.action)} — {event.leadEmail}
                  </p>
                </div>
                <span className="text-muted-foreground whitespace-nowrap flex-shrink-0">
                  {timeAgo}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Lead Performance Table ──────────────────────────────────────────────────

function LeadPerformanceTable({
  leads,
}: {
  leads: EnrichedAnalytics["leadPerformance"];
}) {
  if (leads.length === 0) return null;

  const statusColors: Record<string, string> = {
    queued: "bg-zinc-500/15 text-zinc-400",
    active: "bg-blue-500/15 text-blue-400",
    waiting: "bg-amber-500/15 text-amber-400",
    completed: "bg-emerald-500/15 text-emerald-400",
    failed: "bg-red-500/15 text-red-400",
    pending_review: "bg-violet-500/15 text-violet-400",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Lead Performance ({leads.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Lead</th>
                <th className="pb-2 font-medium">Company</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium text-center">Replied</th>
                <th className="pb-2 font-medium text-center">Follow-ups</th>
                <th className="pb-2 font-medium">Last Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.slice(0, 20).map((lead) => (
                <tr
                  key={lead.campaignLeadId}
                  className="border-b border-muted/50 last:border-0"
                >
                  <td className="py-2 pr-4">
                    <div className="font-medium truncate max-w-[150px]">
                      {lead.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {lead.email}
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground truncate max-w-[120px]">
                    {lead.company || "—"}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[lead.status] || ""}`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    {lead.replied ? (
                      <span className="text-foreground">✓</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2 text-center font-mono text-xs">
                    {lead.followupCount}
                  </td>
                  <td className="py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {lead.lastActionTime
                      ? getRelativeTime(lead.lastActionTime)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length > 20 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Showing 20 of {leads.length} leads
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Overview Tab (main export) ──────────────────────────────────────────────

interface OverviewTabProps {
  analytics: EnrichedAnalytics;
}

export function OverviewTab({ analytics }: OverviewTabProps) {
  const stats = [
    {
      label: "Total Leads",
      value: analytics.totalLeads,
      icon: Users,
      color: "text-foreground bg-muted",
    },
    {
      label: "Emails Sent",
      value: analytics.emailsSent,
      icon: Mail,
      color: "text-foreground bg-muted",
      subtext: analytics.emailsSkipped > 0
        ? `${analytics.emailsSkipped} skipped`
        : undefined,
    },
    {
      label: "Replies",
      value: analytics.replies,
      icon: Reply,
      color: "text-foreground bg-muted",
    },
    {
      label: "Reply Rate",
      value: `${analytics.replyRate}%`,
      icon: TrendingUp,
      color: "text-foreground bg-muted",
    },
    {
      label: "Completed",
      value: analytics.completed,
      icon: CheckCircle,
      color: "text-foreground bg-muted",
      subtext: `${analytics.failed} failed`,
    },
    {
      label: "In Progress",
      value: analytics.inProgress,
      icon: Clock,
      color: "text-foreground bg-muted",
      subtext: `${analytics.totalFollowups} follow-ups`,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PipelineFunnel
          pipeline={analytics.pipeline}
          total={analytics.totalLeads}
        />
        <SendVelocityChart dailyVolume={analytics.dailyVolume} />
      </div>

      {/* Follow-up + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FollowupChart data={analytics.followupEffectiveness} />
        <ActivityFeed events={analytics.recentActivity} />
      </div>

      {/* Lead table */}
      <LeadPerformanceTable leads={analytics.leadPerformance} />
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatAction(action: string): string {
  switch (action) {
    case "send_email":
      return "Email sent";
    case "start":
      return "Workflow started";
    case "end":
      return "Workflow completed";
    case "condition":
      return "Condition checked";
    case "wait":
      return "Wait started";
    default:
      return action;
  }
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
