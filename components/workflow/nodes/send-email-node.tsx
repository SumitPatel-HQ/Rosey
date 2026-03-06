"use client";

import { memo, useCallback } from "react";
import { useReactFlow, type NodeProps, type Node } from "@xyflow/react";
import { Mail } from "lucide-react";
import type { SendEmailNodeData } from "@/types";
import { NodeShell, nodeInputClassName } from "./node-shell";

type SendEmailNodeType = Node<SendEmailNodeData, "send_email">;

function SendEmailNodeComponent({ id, data, selected }: NodeProps<SendEmailNodeType>) {
  const { updateNodeData } = useReactFlow();

  const handleChange = useCallback(
    (field: keyof SendEmailNodeData, value: string) => {
      updateNodeData(id, { [field]: value });
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
      description="Generate a subject line and body copy before sending the next message."
      badge="Action"
      minWidthClassName="min-w-[320px]"
    >
      <label className="block space-y-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Subject Prompt
        </span>
        <input
          className={nodeInputClassName("blue")}
          placeholder="Write a concise subject line for a warm outbound follow-up"
          value={(data.subject_prompt as string) || ""}
          onChange={(e) => handleChange("subject_prompt", e.target.value)}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Body Prompt
        </span>
        <textarea
          className={nodeInputClassName("blue")}
          placeholder="Draft a short, credible email that references the lead's context and suggests a next step."
          rows={4}
          value={(data.body_prompt as string) || ""}
          onChange={(e) => handleChange("body_prompt", e.target.value)}
        />
      </label>
    </NodeShell>
  );
}

export const SendEmailNode = memo(SendEmailNodeComponent);
