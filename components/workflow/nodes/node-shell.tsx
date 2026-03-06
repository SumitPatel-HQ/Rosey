"use client";

import type { LucideIcon } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";

type Accent = "emerald" | "blue" | "amber" | "violet" | "rose";

const accentStyles: Record<
  Accent,
  {
    shell: string;
    iconWrap: string;
    icon: string;
    eyebrow: string;
    title: string;
    handle: string;
    softHandle: string;
    input: string;
    badge: string;
  }
> = {
  emerald: {
    shell:
      "border-slate-200 bg-white shadow-[0_12px_30px_-26px_rgba(15,23,42,0.2)] dark:border-slate-800 dark:bg-slate-950",
    iconWrap: "bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800",
    icon: "text-slate-700 dark:text-slate-200",
    eyebrow: "text-slate-500 dark:text-slate-400",
    title: "text-slate-950 dark:text-slate-50",
    handle: "!bg-slate-900 dark:!bg-slate-100",
    softHandle: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
    input:
      "border-slate-200 bg-white focus:border-slate-400 focus:ring-slate-300/30 dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-600",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
  },
  blue: {
    shell:
      "border-slate-200 bg-white shadow-[0_12px_30px_-26px_rgba(15,23,42,0.2)] dark:border-slate-800 dark:bg-slate-950",
    iconWrap: "bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800",
    icon: "text-slate-700 dark:text-slate-200",
    eyebrow: "text-slate-500 dark:text-slate-400",
    title: "text-slate-950 dark:text-slate-50",
    handle: "!bg-slate-900 dark:!bg-slate-100",
    softHandle: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
    input:
      "border-slate-200 bg-white focus:border-slate-400 focus:ring-slate-300/30 dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-600",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
  },
  amber: {
    shell:
      "border-slate-200 bg-white shadow-[0_12px_30px_-26px_rgba(15,23,42,0.2)] dark:border-slate-800 dark:bg-slate-950",
    iconWrap: "bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800",
    icon: "text-slate-700 dark:text-slate-200",
    eyebrow: "text-slate-500 dark:text-slate-400",
    title: "text-slate-950 dark:text-slate-50",
    handle: "!bg-slate-900 dark:!bg-slate-100",
    softHandle: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
    input:
      "border-slate-200 bg-white focus:border-slate-400 focus:ring-slate-300/30 dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-600",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
  },
  violet: {
    shell:
      "border-slate-200 bg-white shadow-[0_12px_30px_-26px_rgba(15,23,42,0.2)] dark:border-slate-800 dark:bg-slate-950",
    iconWrap: "bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800",
    icon: "text-slate-700 dark:text-slate-200",
    eyebrow: "text-slate-500 dark:text-slate-400",
    title: "text-slate-950 dark:text-slate-50",
    handle: "!bg-slate-900 dark:!bg-slate-100",
    softHandle: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
    input:
      "border-slate-200 bg-white focus:border-slate-400 focus:ring-slate-300/30 dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-600",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
  },
  rose: {
    shell:
      "border-slate-200 bg-white shadow-[0_12px_30px_-26px_rgba(15,23,42,0.2)] dark:border-slate-800 dark:bg-slate-950",
    iconWrap: "bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800",
    icon: "text-slate-700 dark:text-slate-200",
    eyebrow: "text-slate-500 dark:text-slate-400",
    title: "text-slate-950 dark:text-slate-50",
    handle: "!bg-slate-900 dark:!bg-slate-100",
    softHandle: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
    input:
      "border-slate-200 bg-white focus:border-slate-400 focus:ring-slate-300/30 dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-600",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
  },
};

interface NodeShellProps {
  accent: Accent;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description?: string;
  badge?: string;
  children?: React.ReactNode;
  className?: string;
  minWidthClassName?: string;
  targetHandle?: boolean;
  sourceHandle?: boolean;
}

export function nodeInputClassName(accent: Accent) {
  return cn(
    "nodrag w-full rounded-xl border px-3 py-2 text-xs text-slate-700 shadow-sm outline-none transition focus:ring-4 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500",
    accentStyles[accent].input
  );
}

export function nodeBadgeClassName(accent: Accent) {
  return cn(
    "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
    accentStyles[accent].badge
  );
}

export function nodeSoftHandleLabelClassName(accent: Accent) {
  return cn(
    "rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
    accentStyles[accent].softHandle
  );
}

export function NodeShell({
  accent,
  icon: Icon,
  eyebrow,
  title,
  description,
  badge,
  children,
  className,
  minWidthClassName = "min-w-[240px]",
  targetHandle = true,
  sourceHandle = true,
}: NodeShellProps) {
  const styles = accentStyles[accent];

  return (
    <div
      className={cn(
        "relative overflow-visible rounded-[24px] border px-4 py-4 transition-shadow",
        minWidthClassName,
        styles.shell,
        className
      )}
    >
      {targetHandle ? (
        <Handle
          type="target"
          position={Position.Top}
          className={cn(
            "!h-3 !w-3 !border-2 !border-white shadow-sm dark:!border-slate-950",
            styles.handle
          )}
        />
      ) : null}

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", styles.iconWrap)}>
            <Icon className={cn("h-5 w-5", styles.icon)} />
          </div>
          <div className="space-y-1">
            <p className={cn("text-[10px] font-semibold uppercase tracking-[0.22em]", styles.eyebrow)}>
              {eyebrow}
            </p>
            <div>
              <h3 className={cn("text-sm font-semibold leading-none", styles.title)}>{title}</h3>
              {description ? (
                <p className="mt-1 max-w-[18rem] text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
        {badge ? <span className={nodeBadgeClassName(accent)}>{badge}</span> : null}
      </div>

      {children ? <div className="space-y-3">{children}</div> : null}

      {sourceHandle ? (
        <Handle
          type="source"
          position={Position.Bottom}
          className={cn(
            "!h-3 !w-3 !border-2 !border-white shadow-sm dark:!border-slate-950",
            styles.handle
          )}
        />
      ) : null}
    </div>
  );
}
