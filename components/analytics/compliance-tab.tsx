"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle, Ban, Mail } from "lucide-react";
import type { ComplianceAudit, EnrichedAnalytics } from "@/types";

interface ComplianceTabProps {
  compliance: ComplianceAudit | null;
  analytics?: EnrichedAnalytics | null;
}

export function ComplianceTab({ compliance }: ComplianceTabProps) {
  if (!compliance) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        Unable to load compliance data
      </div>
    );
  }

  const canSpamCompliant =
    compliance.unsubscribeRate < 0.01 && compliance.bounceCount < compliance.totalEmailsSent * 0.1;

  const metrics = [
    {
      label: "Total Emails Sent",
      value: compliance.totalEmailsSent,
      icon: Mail,
      color: "text-foreground bg-muted",
    },
    {
      label: "Suppressed Emails",
      value: compliance.suppressionCount,
      icon: Ban,
      color: "text-foreground bg-muted",
    },
    {
      label: "Unsubscribes",
      value: compliance.unsubscribeCount,
      icon: AlertTriangle,
      color: "text-foreground bg-muted",
    },
    {
      label: "Bounces",
      value: compliance.bounceCount,
      icon: AlertTriangle,
      color: "text-foreground bg-muted",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Status banner */}
      <Card className="relative rounded-2xl border-border dark:border-white/[0.03] bg-card shadow-sm dark:shadow-none dark:bg-white/[0.01] py-0 gap-0">
        <CardContent className="py-4 px-5 sm:px-6">
          <div className="flex items-center gap-3">
            {canSpamCompliant ? (
              <CheckCircle className="h-5 w-5 text-foreground" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-semibold text-sm">
                {canSpamCompliant
                  ? "CAN-SPAM Compliant"
                  : "Review Compliance Status"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {canSpamCompliant
                  ? "Your campaigns meet CAN-SPAM requirements. Unsubscribe links are included and bounce rates are healthy."
                  : "Your unsubscribe or bounce rates may need attention. Review the metrics below."}
              </p>
            </div>
            <Badge
              variant={canSpamCompliant ? "default" : "secondary"}
              className="ml-auto"
            >
              {canSpamCompliant ? "Passing" : "Review"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="relative rounded-2xl border-border dark:border-white/[0.03] bg-card shadow-sm dark:shadow-none dark:bg-white/[0.01] flex flex-col justify-between hover:bg-accent dark:hover:bg-white/[0.02] transition-colors group p-5 sm:p-6 gap-0">
            <div className="flex items-center gap-3 mb-3">
              <m.icon className={`h-6 w-6 shrink-0 ${m.color.split(' ')[0]}`} />
              <p className="text-3xl font-bold tracking-tight truncate">{m.value}</p>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{m.label}</p>
          </Card>
        ))}
      </div>

      {/* Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Unsubscribe Rate */}
        <Card className="relative rounded-2xl border-border dark:border-white/[0.03] bg-card shadow-sm dark:shadow-none dark:bg-white/[0.01] p-0 gap-0">
          <CardHeader className="p-5 sm:p-6 pb-2 sm:pb-3">
            <CardTitle className="text-sm font-medium">
              Unsubscribe Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 pt-0 sm:pt-0">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-3xl font-bold">
                  {(compliance.unsubscribeRate * 100).toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Industry threshold: &lt; 0.5%
                </p>
              </div>
              <div className="w-32">
                <div className="h-3 bg-muted rounded-full overflow-hidden relative">
                  <div
                    className="absolute left-0 top-0 h-full bg-red-400"
                    style={{
                      width: `${Math.min(
                        (compliance.unsubscribeRate * 100) / 1,
                        100
                      )}%`,
                    }}
                  />
                  {/* Threshold marker at 0.5% */}
                  <div className="absolute left-[50%] top-0 bottom-0 w-px bg-foreground/30 z-10" />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>Threshold 0.5%</span>
                  <span>1%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bounce Rate */}
        <Card className="relative rounded-2xl border-border dark:border-white/[0.03] bg-card shadow-sm dark:shadow-none dark:bg-white/[0.01] p-0 gap-0">
          <CardHeader className="p-5 sm:p-6 pb-2 sm:pb-3">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 pt-0 sm:pt-0">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-3xl font-bold">
                  {(compliance.bounceRate * 100).toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: &lt; 2%
                </p>
              </div>
              <div className="w-32">
                <div className="h-3 bg-muted rounded-full overflow-hidden relative">
                  <div
                    className="absolute left-0 top-0 h-full transition-all"
                    style={{
                      width: `${Math.min(
                        (compliance.bounceRate * 100) / 5,
                        100
                      )}%`,
                      backgroundColor:
                        compliance.bounceRate > 0.02 ? "#f87171" : "#34d399",
                    }}
                  />
                  {/* Threshold marker at 2% */}
                  <div className="absolute left-[40%] top-0 bottom-0 w-px bg-foreground/30 z-10" />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>Threshold 2%</span>
                  <span>5%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent unsubscribes */}
      {compliance.recentUnsubscribes.length > 0 && (
        <Card className="relative rounded-2xl border-border dark:border-white/[0.03] bg-card shadow-sm dark:shadow-none dark:bg-white/[0.01] p-0 gap-0">
          <CardHeader className="p-5 sm:p-6 pb-2 sm:pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Recent Unsubscribes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 pt-0 sm:pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {compliance.recentUnsubscribes.slice(0, 10).map((unsub) => (
                    <tr
                      key={unsub.id}
                      className="border-b border-muted/50 last:border-0"
                    >
                      <td className="py-2 pr-4 font-medium">{unsub.email}</td>
                      <td className="py-2 text-muted-foreground">
                        {new Date(unsub.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
