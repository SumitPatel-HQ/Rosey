export interface Product {
  id: string;
  name: string;
  description: string | null;
  sheet_id: string | null;
  drive_folder_id: string | null;
  gmail_label_prefix: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  product_id: string;
  name: string;
  email: string;
  company: string | null;
  industry: string | null;
  tags: string[];
  contacted: boolean;
  created_at: string;
}

export interface Campaign {
  id: string;
  product_id: string;
  name: string;
  workflow_json: WorkflowJSON;
  status: "draft" | "active" | "paused" | "completed";
  gmail_label_id: string | null;
  created_at: string;
}

export interface CampaignLead {
  id: string;
  campaign_id: string;
  lead_id: string;
  current_node_id: string;
  status: "queued" | "waiting" | "active" | "completed" | "failed";
  followup_count: number;
  last_action_time: string | null;
  next_action_time: string;
  replied: boolean;
  thread_id: string | null;
  created_at: string;
  lead?: Lead;
  campaign?: Campaign;
}

export interface Log {
  id: string;
  campaign_lead_id: string;
  action: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface WorkflowJSON {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: { x: number; y: number; zoom: number };
}

export interface WorkflowNode {
  id: string;
  type: "start" | "send_email" | "wait" | "condition" | "end";
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

export interface SendEmailNodeData {
  subject_prompt: string;
  body_prompt: string;
  [key: string]: unknown;
}

export interface WaitNodeData {
  duration: number;
  unit: "hours" | "days";
  [key: string]: unknown;
}

export interface ConditionNodeData {
  check: "replied" | "not_replied";
  [key: string]: unknown;
}
