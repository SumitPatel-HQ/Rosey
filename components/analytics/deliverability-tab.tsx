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
} from "recharts";

interface DeliverabilityTabProps {
  deliverability: DeliverabilityDashboard | null;
  warmup: WarmupDashboard | null;
  analytics?: EnrichedAnalytics | null;
}

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
      <Card
        className={
          isHealthy
            ? "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900"
            : "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900"
        }
      >
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            {isHealthy ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
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
          color="text-blue-600 bg-blue-100"
        />
        <MetricCard
          label="Hard Bounces"
          value={deliverability.hardBounces}
          icon={AlertTriangle}
          color="text-red-600 bg-red-100"
        />
        <MetricCard
          label="Soft Bounces"
          value={deliverability.softBounces}
          icon={AlertTriangle}
          color="text-amber-600 bg-amber-100"
        />
        <MetricCard
          label="Complaints"
          value={deliverability.complaints}
          icon={AlertTriangle}
          color="text-orange-600 bg-orange-100"
        />
      </div>

      {/* Warmup progress */}
      {warmup && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Warmup Schedule
              </CardTitle>
              <Badge variant={warmup.enabled ? "default" : "secondary"}>
                {warmup.enabled ? `Day ${warmup.schedule?.day_number || 1} — ${warmup.schedule?.phase || "warmup"}` : "Disabled"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
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
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-blue-500 to-green-500 transition-all duration-700"
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Bounce Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
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
      </CardContent>
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
  const phaseColors: Record<string, string> = {
    warmup: "#f59e0b",
    rampup: "#3b82f6",
    full: "#22c55e",
  };

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">
        Projected daily send capacity
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={projection}>
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
            contentStyle={{
              borderRadius: "8px",
              fontSize: "12px",
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--popover))",
              color: "hsl(var(--popover-foreground))",
            }}
            formatter={(value, _name, props) => [
              value,
              `Limit (${(props as { payload?: { phase?: string } })?.payload?.phase || ""})`,
            ]}
          />
          <Bar dataKey="limit" radius={[2, 2, 0, 0]}>
            {projection.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={phaseColors[entry.phase] || "#6b7280"}
                opacity={entry.day <= currentDay ? 1 : 0.3}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function BounceBreakdownChart({
  deliverability,
}: {
  deliverability: DeliverabilityDashboard;
}) {
  const data = [
    { type: "Delivered", count: Math.max(0, deliverability.sent - deliverability.hardBounces - deliverability.softBounces - deliverability.complaints), color: "#22c55e" },
    { type: "Hard Bounce", count: deliverability.hardBounces, color: "#ef4444" },
    { type: "Soft Bounce", count: deliverability.softBounces, color: "#f59e0b" },
    { type: "Complaints", count: deliverability.complaints, color: "#f97316" },
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
