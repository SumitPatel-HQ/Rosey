"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
} from "lucide-react";
import type {
  DeliverabilityDashboard,
  WarmupDashboard,
  EnrichedAnalytics,
} from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

interface DeliverabilityTabProps {
  deliverability: DeliverabilityDashboard | null;
  warmup: WarmupDashboard | null;
  analytics?: EnrichedAnalytics | null;
}

const CHART_TOOLTIP_STYLE = {
  borderRadius: "10px",
  fontSize: "12px",
  border: "1px solid hsl(var(--border))",
  backgroundColor: "hsl(var(--popover) / 0.96)",
  color: "hsl(var(--popover-foreground))",
  boxShadow: "0 12px 32px hsl(var(--background) / 0.45)",
};

export function DeliverabilityTab({
  deliverability,
  warmup,
}: DeliverabilityTabProps) {
  if (!deliverability) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        Unable to load deliverability data
      </div>
    );
  }

  const bounceRatePct = (deliverability.bounceRate * 100).toFixed(2);
  const isHealthy = deliverability.bounceRate < 0.03;

  return (
    <div className="p-6 space-y-6">
      {/* Domain health banner */}
      <Card className="relative rounded-2xl border-border dark:border-white/[0.03] bg-card shadow-sm dark:shadow-none dark:bg-white/[0.01] py-0 gap-0">
        <CardContent className="py-4 px-5 sm:px-6">
          <div className="flex items-center gap-3">
            {isHealthy ? (
              <CheckCircle className="h-5 w-5 text-foreground" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-semibold text-sm">
                {isHealthy ? "Sender reputation is healthy" : "Sender reputation needs attention"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isHealthy
                  ? `Bounce rate at ${bounceRatePct}% — well within safe thresholds`
                  : `Bounce rate at ${bounceRatePct}% — consider pausing and cleaning your list`}
              </p>
            </div>
            <Badge
              variant={isHealthy ? "default" : "secondary"}
              className="ml-auto"
            >
              {isHealthy ? "Healthy" : "At Risk"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Sent"
          value={deliverability.sent}
          icon={Activity}
          color="text-foreground bg-muted"
        />
        <MetricCard
          label="Hard Bounces"
          value={deliverability.hardBounces}
          icon={AlertTriangle}
          color="text-foreground bg-muted"
        />
        <MetricCard
          label="Soft Bounces"
          value={deliverability.softBounces}
          icon={AlertTriangle}
          color="text-foreground bg-muted"
        />
        <MetricCard
          label="Complaints"
          value={deliverability.complaints}
          icon={AlertTriangle}
          color="text-foreground bg-muted"
        />
      </div>

      {/* Warmup progress */}
      {warmup && (
        <Card className="relative rounded-2xl border-border dark:border-white/[0.03] bg-card shadow-sm dark:shadow-none dark:bg-white/[0.01] p-0 gap-0">
          <CardHeader className="p-5 sm:p-6 pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                Warmup Schedule
              </CardTitle>
              <Badge variant={warmup.enabled ? "default" : "secondary"}>
                {warmup.enabled ? `Day ${warmup.schedule?.day_number || 1} — ${warmup.schedule?.phase || "warmup"}` : "Disabled"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 pt-0 sm:pt-0">
            {warmup.enabled && warmup.schedule ? (
              <div className="space-y-4">
                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      Day {warmup.schedule.day_number} of 30
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground transition-all duration-700"
                      style={{
                        width: `${Math.min(
                          (warmup.schedule.day_number / 30) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>Warmup (1-7)</span>
                    <span>Ramp-up (8-21)</span>
                    <span>Full (22+)</span>
                  </div>
                </div>

                {/* Current limit */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Current Daily Limit</p>
                    <p className="text-xs text-muted-foreground">
                      Based on warmup day {warmup.schedule.day_number}
                    </p>
                  </div>
                  <p className="text-2xl font-bold">
                    {warmup.schedule.daily_limit}
                  </p>
                </div>

                {/* Projection chart */}
                <WarmupProjectionChart projection={warmup.projection} currentDay={warmup.schedule.day_number} />
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <p>Warmup is not enabled for this campaign.</p>
                <p className="text-xs mt-1">
                  Enable warmup to gradually increase send volume and protect sender reputation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bounce breakdown */}
      <Card className="relative rounded-2xl border-border dark:border-white/[0.03] bg-card shadow-sm dark:shadow-none dark:bg-white/[0.01] p-0 gap-0">
        <CardHeader className="p-5 sm:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-sm font-medium">
            Bounce Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 pt-0 sm:pt-0">
          <BounceBreakdownChart deliverability={deliverability} />
        </CardContent>
      </Card>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="relative rounded-2xl border-border dark:border-white/[0.03] bg-card shadow-sm dark:shadow-none dark:bg-white/[0.01] flex flex-col justify-between hover:bg-accent dark:hover:bg-white/[0.02] transition-colors group p-5 sm:p-6 gap-0">
      <div className="flex items-center gap-3 mb-3">
        <Icon className={`h-6 w-6 shrink-0 ${color.split(' ')[0]}`} />
        <p className="text-3xl font-bold tracking-tight truncate">{value}</p>
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </Card>
  );
}

function WarmupProjectionChart({
  projection,
  currentDay,
}: {
  projection: WarmupDashboard["projection"];
  currentDay: number;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">
        Projected daily send capacity
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={projection}>
          <defs>
            <linearGradient id="warmupGradWarm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.65} />
            </linearGradient>
            <linearGradient id="warmupGradRamp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.65} />
            </linearGradient>
            <linearGradient id="warmupGradFull" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.65} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            label={{ value: "Day", position: "bottom", fontSize: 11, offset: -5 }}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, _name, props) => [
              value,
              `Limit (${(props as { payload?: { phase?: string } })?.payload?.phase || ""})`,
            ]}
          />
          <ReferenceLine
            x={currentDay}
            stroke="hsl(var(--foreground) / 0.35)"
            strokeDasharray="3 3"
            label={{
              value: "Today",
              position: "top",
              fontSize: 10,
              fill: "hsl(var(--muted-foreground))",
            }}
          />
          <Bar dataKey="limit" radius={[4, 4, 0, 0]} barSize={10}>
            {projection.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.phase === "warmup"
                    ? "url(#warmupGradWarm)"
                    : entry.phase === "rampup"
                      ? "url(#warmupGradRamp)"
                      : "url(#warmupGradFull)"
                }
                opacity={entry.day <= currentDay ? 1 : 0.3}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center justify-end gap-3 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          Warmup
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          Ramp-up
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Full
        </span>
      </div>
    </div>
  );
}

function BounceBreakdownChart({
  deliverability,
}: {
  deliverability: DeliverabilityDashboard;
}) {
  const data = [
    { type: "Delivered", count: Math.max(0, deliverability.sent - deliverability.hardBounces - deliverability.softBounces - deliverability.complaints), color: "#34d399" },
    { type: "Hard Bounce", count: deliverability.hardBounces, color: "#f87171" },
    { type: "Soft Bounce", count: deliverability.softBounces, color: "#fbbf24" },
    { type: "Complaints", count: deliverability.complaints, color: "#fb923c" },
  ].filter((d) => d.count > 0);

  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
        No deliverability events recorded yet
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-3">
      {data.map((d) => {
        const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
        return (
          <div key={d.type}>
            <div className="flex items-center justify-between text-sm mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-muted-foreground">{d.type}</span>
              </div>
              <span className="font-semibold">
                {d.count}{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  ({pct}%)
                </span>
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: d.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
