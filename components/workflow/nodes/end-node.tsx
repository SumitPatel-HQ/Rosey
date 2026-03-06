"use client";

import { memo } from "react";
import { Square } from "lucide-react";
import { NodeShell } from "./node-shell";

function EndNodeComponent() {
  return (
    <NodeShell
      accent="rose"
      icon={Square}
      eyebrow="Exit Point"
      title="Complete Flow"
      description="Stop processing this lead after the campaign reaches its terminal state."
      badge="End"
      minWidthClassName="min-w-[260px]"
      sourceHandle={false}
    />
  );
}

export const EndNode = memo(EndNodeComponent);
