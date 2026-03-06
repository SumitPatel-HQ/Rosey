"use client";

import { memo, useCallback } from "react";
import { Handle, Position, useReactFlow, type NodeProps, type Node } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import type { ConditionNodeData } from "@/types";

type ConditionNodeType = Node<ConditionNodeData, "condition">;

function ConditionNodeComponent({ id, data }: NodeProps<ConditionNodeType>) {
  const { updateNodeData } = useReactFlow();

  const handleCheck = useCallback(
    (value: string) => {
      updateNodeData(id, { check: value });
    },
    [id, updateNodeData]
  );

  return (
    <div className="rounded-lg border-2 border-purple-500 bg-purple-50 dark:bg-purple-950/30 px-4 py-3 shadow-sm min-w-[200px]">
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
      />
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500 text-white">
          <GitBranch className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">
          Condition
        </span>
      </div>
      <select
        className="nodrag w-full rounded border border-purple-200 bg-white dark:bg-purple-950/50 px-2 py-1 text-xs"
        value={(data.check as string) || "replied"}
        onChange={(e) => handleCheck(e.target.value)}
      >
        <option value="replied">Replied?</option>
        <option value="not_replied">Not Replied?</option>
      </select>
      <div className="flex justify-between mt-3 text-[10px] font-medium text-muted-foreground px-1">
        <span className="text-green-600">Yes</span>
        <span className="text-red-500">No</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
        style={{ left: "30%" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white"
        style={{ left: "70%" }}
      />
    </div>
  );
}

export const ConditionNode = memo(ConditionNodeComponent);
