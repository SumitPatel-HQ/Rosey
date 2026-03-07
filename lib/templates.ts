import type { WorkflowJSON } from "@/types";

// ── Product Templates ────────────────────────────────────────────────────────

export interface ProductTemplate {
  id: string;
  label: string;
  description: string;
  name: string;
  productDescription: string;
}

export const productTemplates: ProductTemplate[] = [
  {
    id: "b2b-saas",
    label: "B2B SaaS",
    description: "A software-as-a-service product for businesses",
    name: "My B2B SaaS",
    productDescription:
      "A B2B SaaS platform that helps companies streamline their operations with AI-powered automation, reducing manual work and improving team productivity.",
  },
  {
    id: "dev-tools",
    label: "Developer Tools",
    description: "SDK, API, or dev-focused product",
    name: "DevTool Pro",
    productDescription:
      "A developer tools platform offering APIs and SDKs that simplify complex integrations, helping engineering teams ship faster with fewer bugs.",
  },
  {
    id: "consulting",
    label: "Consulting / Agency",
    description: "Professional services outreach",
    name: "Growth Agency",
    productDescription:
      "A growth consulting agency specializing in helping B2B startups scale their go-to-market strategy through data-driven outreach and demand generation.",
  },
  {
    id: "marketplace",
    label: "Marketplace / Platform",
    description: "Two-sided marketplace or platform product",
    name: "ConnectHub",
    productDescription:
      "A B2B marketplace connecting enterprise buyers with vetted service providers, streamlining procurement and vendor management.",
  },
];

// ── Campaign Workflow Templates ─────────────────────────────────────────────

export interface CampaignTemplate {
  id: string;
  label: string;
  description: string;
  campaignName: string;
  workflow: WorkflowJSON;
}

export const campaignTemplates: CampaignTemplate[] = [
  {
    id: "simple-outreach",
    label: "Simple Outreach",
    description: "Send one email → wait → check reply → end",
    campaignName: "Simple Outreach",
    workflow: {
      nodes: [
        { id: "start-1", type: "start", position: { x: 300, y: 50 }, data: {} },
        {
          id: "email-1",
          type: "send_email",
          position: { x: 300, y: 180 },
          data: {
            prompt:
              "Write a short, personalized cold outreach email introducing our product. Keep it under 100 words, be conversational, and end with a soft CTA asking if they'd be open to a quick chat.",
            mode: "personalized",
          },
        },
        {
          id: "wait-1",
          type: "wait",
          position: { x: 300, y: 340 },
          data: { duration: 3, unit: "days" },
        },
        {
          id: "check-1",
          type: "condition",
          position: { x: 300, y: 500 },
          data: { check: "replied" },
        },
        { id: "end-replied", type: "end", position: { x: 100, y: 660 }, data: {} },
        { id: "end-no-reply", type: "end", position: { x: 500, y: 660 }, data: {} },
      ],
      edges: [
        { id: "e-1", source: "start-1", target: "email-1" },
        { id: "e-2", source: "email-1", target: "wait-1" },
        { id: "e-3", source: "wait-1", target: "check-1" },
        { id: "e-4", source: "check-1", target: "end-replied", sourceHandle: "yes" },
        { id: "e-5", source: "check-1", target: "end-no-reply", sourceHandle: "no" },
      ],
    },
  },
  {
    id: "two-step-followup",
    label: "2-Step Follow-up",
    description: "Email → wait → check → follow-up → wait → check → end",
    campaignName: "2-Step Follow-up",
    workflow: {
      nodes: [
        { id: "start-1", type: "start", position: { x: 350, y: 50 }, data: {} },
        {
          id: "email-1",
          type: "send_email",
          position: { x: 350, y: 180 },
          data: {
            prompt:
              "Write a personalized cold email introducing our product. Focus on a specific pain point for the recipient's industry. Under 120 words, end with a question.",
            mode: "personalized",
          },
        },
        {
          id: "wait-1",
          type: "wait",
          position: { x: 350, y: 340 },
          data: { duration: 3, unit: "days" },
        },
        {
          id: "check-1",
          type: "condition",
          position: { x: 350, y: 480 },
          data: { check: "replied" },
        },
        { id: "end-replied-1", type: "end", position: { x: 100, y: 600 }, data: {} },
        {
          id: "email-2",
          type: "send_email",
          position: { x: 500, y: 620 },
          data: {
            prompt:
              "Write a brief follow-up email referencing the previous email. Add new value — mention a case study or specific benefit. Keep it under 80 words. Friendly, not pushy.",
            mode: "personalized",
          },
        },
        {
          id: "wait-2",
          type: "wait",
          position: { x: 500, y: 780 },
          data: { duration: 4, unit: "days" },
        },
        {
          id: "check-2",
          type: "condition",
          position: { x: 500, y: 920 },
          data: { check: "replied" },
        },
        { id: "end-replied-2", type: "end", position: { x: 300, y: 1060 }, data: {} },
        { id: "end-final", type: "end", position: { x: 700, y: 1060 }, data: {} },
      ],
      edges: [
        { id: "e-1", source: "start-1", target: "email-1" },
        { id: "e-2", source: "email-1", target: "wait-1" },
        { id: "e-3", source: "wait-1", target: "check-1" },
        { id: "e-4", source: "check-1", target: "end-replied-1", sourceHandle: "yes" },
        { id: "e-5", source: "check-1", target: "email-2", sourceHandle: "no" },
        { id: "e-6", source: "email-2", target: "wait-2" },
        { id: "e-7", source: "wait-2", target: "check-2" },
        { id: "e-8", source: "check-2", target: "end-replied-2", sourceHandle: "yes" },
        { id: "e-9", source: "check-2", target: "end-final", sourceHandle: "no" },
      ],
    },
  },
  {
    id: "three-step-drip",
    label: "3-Step Drip",
    description: "Three emails with increasing urgency, reply checks between each",
    campaignName: "3-Step Drip Campaign",
    workflow: {
      nodes: [
        { id: "start-1", type: "start", position: { x: 350, y: 50 }, data: {} },
        {
          id: "email-1",
          type: "send_email",
          position: { x: 350, y: 180 },
          data: {
            prompt:
              "Write a warm, personalized introduction email. Mention a specific pain point for the recipient's industry and how our product addresses it. Under 100 words.",
            mode: "personalized",
          },
        },
        {
          id: "wait-1",
          type: "wait",
          position: { x: 350, y: 340 },
          data: { duration: 2, unit: "days" },
        },
        {
          id: "check-1",
          type: "condition",
          position: { x: 350, y: 480 },
          data: { check: "replied" },
        },
        { id: "end-1", type: "end", position: { x: 100, y: 600 }, data: {} },
        {
          id: "email-2",
          type: "send_email",
          position: { x: 500, y: 620 },
          data: {
            prompt:
              "Write a follow-up email adding social proof — mention a relevant customer or metric. Keep it under 80 words. Reference the previous email briefly.",
            mode: "personalized",
          },
        },
        {
          id: "wait-2",
          type: "wait",
          position: { x: 500, y: 780 },
          data: { duration: 3, unit: "days" },
        },
        {
          id: "check-2",
          type: "condition",
          position: { x: 500, y: 920 },
          data: { check: "replied" },
        },
        { id: "end-2", type: "end", position: { x: 300, y: 1040 }, data: {} },
        {
          id: "email-3",
          type: "send_email",
          position: { x: 650, y: 1060 },
          data: {
            prompt:
              "Write a final breakup email. Be friendly but direct — let them know this is the last email. Offer one last clear CTA. Under 60 words.",
            mode: "personalized",
          },
        },
        { id: "end-3", type: "end", position: { x: 650, y: 1220 }, data: {} },
      ],
      edges: [
        { id: "e-1", source: "start-1", target: "email-1" },
        { id: "e-2", source: "email-1", target: "wait-1" },
        { id: "e-3", source: "wait-1", target: "check-1" },
        { id: "e-4", source: "check-1", target: "end-1", sourceHandle: "yes" },
        { id: "e-5", source: "check-1", target: "email-2", sourceHandle: "no" },
        { id: "e-6", source: "email-2", target: "wait-2" },
        { id: "e-7", source: "wait-2", target: "check-2" },
        { id: "e-8", source: "check-2", target: "end-2", sourceHandle: "yes" },
        { id: "e-9", source: "check-2", target: "email-3", sourceHandle: "no" },
        { id: "e-10", source: "email-3", target: "end-3" },
      ],
    },
  },
  {
    id: "broadcast",
    label: "Broadcast (Same Email)",
    description: "Send one identical email to all leads — no follow-ups",
    campaignName: "Broadcast",
    workflow: {
      nodes: [
        { id: "start-1", type: "start", position: { x: 300, y: 50 }, data: {} },
        {
          id: "email-1",
          type: "send_email",
          position: { x: 300, y: 200 },
          data: {
            prompt:
              "Write a professional announcement email about our product launch / update. Include key benefits in bullet points. Use {{name}} and {{company}} placeholders. Under 150 words.",
            mode: "same_for_all",
          },
        },
        { id: "end-1", type: "end", position: { x: 300, y: 380 }, data: {} },
      ],
      edges: [
        { id: "e-1", source: "start-1", target: "email-1" },
        { id: "e-2", source: "email-1", target: "end-1" },
      ],
    },
  },
];
