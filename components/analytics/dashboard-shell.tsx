"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CommandCenter } from "@/components/analytics/command-center";
import { OverviewTab } from "@/components/analytics/overview-tab";
import { ComplianceTab } from "@/components/analytics/compliance-tab";
import { DeliverabilityTab } from "@/components/analytics/deliverability-tab";
import { BottomBar } from "@/components/analytics/bottom-bar";
import { useAnalyticsDashboard } from "@/hooks/use-analytics-dashboard";
import {
  BarChart3,
  Shield,
  Radio,
  Loader2,
} from "lucide-react";

type Tab = "overview" | "compliance" | "deliverability";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "compliance", label: "Compliance", icon: Shield },
  { id: "deliverability", label: "Deliverability", icon: Radio },
];

interface DashboardShellProps {
  campaignId: string;
  campaignName?: string;
}

export function DashboardShell({ campaignId, campaignName }: DashboardShellProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const { analytics, compliance, deliverability, warmup, loading } =
    useAnalyticsDashboard(campaignId);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p className="text-base">Loading...</p>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-full overflow-hidden" data-lenis-prevent>
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border dark:border-white/5 bg-background/80 backdrop-blur-sm shrink-0 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8  flex items-center justify-center shrink-0">
            <BarChart3 className="h-4 w-4 text-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight truncate">Campaign Intelligence</h1>
            {campaignName && (
              <p className="text-xs text-muted-foreground truncate">{campaignName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab pills */}
          <div className="flex items-center bg-muted dark:bg-white/[0.02] border border-border dark:border-white/[0.05] rounded-xl p-1 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 h-7 text-xs font-semibold rounded-lg transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-background shadow-sm dark:bg-white/[0.08] text-foreground ring-1 ring-black/20 dark:ring-white/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-white/[0.04]"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Sidebar — hidden on mobile */}
        <div
          className="hidden md:block w-56 lg:w-64 border-r border-border dark:border-white/5 bg-muted dark:bg-white/[0.02] overflow-y-auto flex-shrink-0 scrollbar-none"
          data-lenis-prevent
        >
          <CommandCenter
            analytics={analytics}
            deliverability={deliverability}
            warmup={warmup}
          />
        </div>

        {/* Main panel */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-none"
          data-lenis-prevent
        >
          {activeTab === "overview" && analytics && (
            <OverviewTab analytics={analytics} />
          )}
          {activeTab === "compliance" && (
            <ComplianceTab compliance={compliance} analytics={analytics} />
          )}
          {activeTab === "deliverability" && (
            <DeliverabilityTab
              deliverability={deliverability}
              warmup={warmup}
              analytics={analytics}
            />
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <BottomBar
        analytics={analytics}
        compliance={compliance}
        deliverability={deliverability}
        warmup={warmup}
      />
    </div>
  );
}
