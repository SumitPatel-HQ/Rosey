import type { NodeTypes } from "@xyflow/react";
import { StartNode } from "./start-node";
import { SendEmailNode } from "./send-email-node";
import { WaitNode } from "./wait-node";
import { ConditionNode } from "./condition-node";
import { EndNode } from "./end-node";

export const nodeTypes: NodeTypes = {
  start: StartNode,
  send_email: SendEmailNode,
  wait: WaitNode,
  condition: ConditionNode,
  end: EndNode,
};

export { StartNode, SendEmailNode, WaitNode, ConditionNode, EndNode };
