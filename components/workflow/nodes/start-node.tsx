"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Play } from "lucide-react";

type StartNodeType = Node<Record<string, never>, "start">;

function StartNodeComponent(_props: NodeProps<StartNodeType>) {
  return (
    <div className="rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950/30 px-4 py-3 shadow-sm min-w-[140px]">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white">
          <Play className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-semibold text-green-700 dark:text-green-400">
          Start
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
      />
    </div>
  );
}

export const StartNode = memo(StartNodeComponent);
