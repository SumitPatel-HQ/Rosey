"use client";

import { memo, useCallback } from "react";
import { Handle, Position, useReactFlow, type NodeProps, type Node } from "@xyflow/react";
import { Mail } from "lucide-react";
import type { SendEmailNodeData } from "@/types";

type SendEmailNodeType = Node<SendEmailNodeData, "send_email">;

function SendEmailNodeComponent({ id, data }: NodeProps<SendEmailNodeType>) {
  const { updateNodeData } = useReactFlow();

  const handleChange = useCallback(
    (field: keyof SendEmailNodeData, value: string) => {
      updateNodeData(id, { [field]: value });
    },
    [id, updateNodeData]
  );

  return (
    <div className="rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 shadow-sm min-w-[220px]">
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white">
          <Mail className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
          Send Email
        </span>
      </div>
      <div className="space-y-2">
        <input
          className="nodrag w-full rounded border border-blue-200 bg-white dark:bg-blue-950/50 px-2 py-1 text-xs placeholder:text-muted-foreground"
          placeholder="Subject prompt..."
          value={(data.subject_prompt as string) || ""}
          onChange={(e) => handleChange("subject_prompt", e.target.value)}
        />
        <textarea
          className="nodrag w-full rounded border border-blue-200 bg-white dark:bg-blue-950/50 px-2 py-1 text-xs placeholder:text-muted-foreground resize-none"
          placeholder="Body prompt for AI..."
          rows={2}
          value={(data.body_prompt as string) || ""}
          onChange={(e) => handleChange("body_prompt", e.target.value)}
        />
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
    </div>
  );
}

export const SendEmailNode = memo(SendEmailNodeComponent);
