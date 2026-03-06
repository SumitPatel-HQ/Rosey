"use client";

import { memo, useCallback } from "react";
import { Handle, Position, useReactFlow, type NodeProps, type Node } from "@xyflow/react";
import { Clock } from "lucide-react";
import type { WaitNodeData } from "@/types";

type WaitNodeType = Node<WaitNodeData, "wait">;

function WaitNodeComponent({ id, data }: NodeProps<WaitNodeType>) {
  const { updateNodeData } = useReactFlow();

  const handleDuration = useCallback(
    (value: string) => {
      const num = parseInt(value) || 1;
      updateNodeData(id, { duration: num });
    },
    [id, updateNodeData]
  );

  const handleUnit = useCallback(
    (value: string) => {
      updateNodeData(id, { unit: value });
    },
    [id, updateNodeData]
  );

  return (
    <div className="rounded-lg border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 shadow-sm min-w-[180px]">
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white"
      />
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white">
          <Clock className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
          Wait
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          className="nodrag w-16 rounded border border-amber-200 bg-white dark:bg-amber-950/50 px-2 py-1 text-xs text-center"
          type="number"
          min={1}
          value={(data.duration as number) || 1}
          onChange={(e) => handleDuration(e.target.value)}
        />
        <select
          className="nodrag rounded border border-amber-200 bg-white dark:bg-amber-950/50 px-2 py-1 text-xs"
          value={(data.unit as string) || "days"}
          onChange={(e) => handleUnit(e.target.value)}
        >
          <option value="hours">hours</option>
          <option value="days">days</option>
        </select>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white"
      />
    </div>
  );
}

export const WaitNode = memo(WaitNodeComponent);
