"use client";

import { memo, useCallback } from "react";
import { useReactFlow, type NodeProps, type Node } from "@xyflow/react";
import { Mail } from "lucide-react";
import type { SendEmailNodeData } from "@/types";
import { NodeShell, nodeInputClassName } from "./node-shell";

type SendEmailNodeType = Node<SendEmailNodeData, "send_email">;

function SendEmailNodeComponent({ id, data, selected }: NodeProps<SendEmailNodeType>) {
  const { updateNodeData } = useReactFlow();

  const mode = (data.mode as string) || "personalized";

  const handlePromptChange = useCallback(
    (value: string) => {
      updateNodeData(id, { prompt: value });
    },
    [id, updateNodeData]
  );

  const handleModeChange = useCallback(
    (newMode: "personalized" | "same_for_all") => {
      // Clear any cached email when switching modes so it regenerates
      updateNodeData(id, { mode: newMode, cached_subject: undefined, cached_body: undefined });
    },
    [id, updateNodeData]
  );

  return (
    <NodeShell
      id={id}
      selected={selected}
      accent="blue"
      icon={Mail}
      eyebrow="Outreach"
      title="Send AI Email"
      description="Describe the email you want to send — subject and body are generated automatically."
      badge="Action"
      minWidthClassName="min-w-[320px]"
    >
      <label className="block space-y-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Email Prompt
        </span>
        <textarea
          className={nodeInputClassName("blue")}
          placeholder="e.g. We are launching a new promo for our strawberry flavour — write a fun, humorous email for our leads"
          rows={4}
          value={(data.prompt as string) || ""}
          onChange={(e) => handlePromptChange(e.target.value)}
        />
      </label>

      <div className="space-y-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Generation Mode
        </span>
        <div className="flex rounded-md overflow-hidden border border-blue-200 dark:border-blue-800">
          <button
            type="button"
            onClick={() => handleModeChange("personalized")}
            className={`flex-1 px-3 py-1.5 text-[11px] font-medium transition-colors ${
              mode === "personalized"
                ? "bg-blue-500 text-white"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800"
            }`}
          >
            Personalized
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("same_for_all")}
            className={`flex-1 px-3 py-1.5 text-[11px] font-medium border-l border-blue-200 dark:border-blue-800 transition-colors ${
              mode === "same_for_all"
                ? "bg-blue-500 text-white"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800"
            }`}
          >
            Same for all
          </button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
          {mode === "personalized"
            ? "AI generates a unique email for each lead using their details."
            : "AI generates one email for all leads. Use {{name}}, {{company}}, {{industry}} for personal touches."}
        </p>
      </div>

      {mode === "same_for_all" && data.cached_subject && (
        <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2 space-y-1">
          <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            Pre-generated
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
            {data.cached_subject as string}
          </p>
          <button
            type="button"
            onClick={() => updateNodeData(id, { cached_subject: undefined, cached_body: undefined })}
            className="text-[10px] text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 underline"
          >
            Clear · regenerate on next run
          </button>
        </div>
      )}
    </NodeShell>
  );
}

export const SendEmailNode = memo(SendEmailNodeComponent);
