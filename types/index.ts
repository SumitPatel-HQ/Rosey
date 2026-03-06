export interface Product {
  id: string;
  name: string;
  description: string | null;
  sheet_id: string | null;
  drive_folder_id: string | null;
  gmail_label_prefix: string | null;
  created_at: string;
}

export interface EnrichedLeadData {
  job_title?: string | null;
  bio?: string | null;
  company_description?: string | null;
  recent_news?: string | null;
  interests?: string[];
  pain_points?: string[];
  personalization_hooks: string[];
  sources_used: string[];
  scraped_at: string;
}

export interface Lead {
  id: string;
  product_id: string;
  name: string;
  email: string;
  company: string | null;
  industry: string | null;
  tags: string[];
  enriched_data: EnrichedLeadData | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  product_id: string;
  name: string;
  workflow_json: WorkflowJSON;
  status: "draft" | "active" | "completed";
  gmail_label_id: string | null;
  /** Max outbound emails per hour for this campaign. null = unlimited. */
  email_rate_limit_per_hour: number | null;
  created_at: string;
  product?: Product;
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
  last_message_id: string | null;
  thread_subject: string | null;
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

export interface ThreadMessage {
  messageId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  isOutbound: boolean;
}

export interface WorkflowJSON {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: { x: number; y: number; zoom: number };
}

export interface WorkflowNode {
  id: string;
  type:
    | "start"
    | "send_email"
    | "sendEmail"
    | "wait"
    | "condition"
    | "checkReply"
    | "sendFollowup"
    | "end";
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  condition?: string;
}

export interface SendEmailNodeData {
  prompt: string;
  mode: "personalized" | "same_for_all";
  cached_subject?: string;
  cached_body?: string;
  [key: string]: unknown;
}

export interface WaitNodeData {
  duration: number;
  unit: "seconds" | "minutes" | "hours" | "days";
  [key: string]: unknown;
}

export interface ConditionNodeData {
  check: "replied" | "not_replied";
  [key: string]: unknown;
}
