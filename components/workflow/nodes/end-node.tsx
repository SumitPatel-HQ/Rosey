"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Square } from "lucide-react";

type EndNodeType = Node<Record<string, never>, "end">;

function EndNodeComponent(_props: NodeProps<EndNodeType>) {
  return (
    <div className="rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950/30 px-4 py-3 shadow-sm min-w-[140px]">
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white">
          <Square className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-semibold text-red-700 dark:text-red-400">
          End
        </span>
      </div>
    </div>
  );
}

export const EndNode = memo(EndNodeComponent);
