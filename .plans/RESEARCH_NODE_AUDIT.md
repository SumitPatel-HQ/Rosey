# Research Node Audit Report

**Generated:** 2026-03-07  
**Codebase:** COHERENCE-26_NEURALNEXUS (project name: "rosey")

---

## 1. Executive Summary

**A dedicated "Research Lead" workflow node does NOT exist** in this codebase. There is no Tavily integration anywhere — no imports, no API key references, no Tavily SDK in `package.json`. However, {a substantial lead **enrichment** system already exists} via `lib/enrichment.ts` using **Jina Reader** (company website scraping) and **Exa.ai** (LinkedIn profiles, professional web presence, company news). This enrichment is triggered **manually per-lead** from the leads table UI (`/api/leads/[id]/enrich`) and stores results in the `leads.enriched_data` JSONB column. The existing `send_email` node handler *does* pass `enriched_data` to the LLM prompt — but only if the lead was enriched beforehand via the manual button. There is **no in-workflow "research" node** that would automatically run enrichment/research as a pipeline step before email generation. To implement a Research Lead node, you need: (1) a new node type in the workflow engine, (2) a Tavily-based research service (or extend existing enrichment), (3) frontend node registration, and (4) optionally a dedicated `research_result` DB field (or reuse `enriched_data`).

---

## 2. Existing Node Types

| Node Type | Engine Normalized Type | Handler File | Frontend Component | What It Does | Status |
|---|---|---|---|---|---|
| `start` | `start` | `lib/engine.ts` → `campaignHandlers.start` | `components/workflow/nodes/start-node.tsx` | Logs a "start" action; no-op entry point | ✅ Implemented |
| `send_email` / `sendEmail` / `sendFollowup` | `send_email` | `lib/engine.ts` → `campaignHandlers.send_email` | `components/workflow/nodes/send-email-node.tsx` | Generates email via LLM (`lib/openai.ts`), sends via Gmail, manages threading & labels | ✅ Implemented |
| `wait` | `wait` | `lib/engine.ts` → `campaignHandlers.wait` | `components/workflow/nodes/wait-node.tsx` | Pauses execution for N days/hours/minutes/seconds | ✅ Implemented |
| `condition` / `checkReply` | `condition` | `lib/engine.ts` → `campaignHandlers.condition` | `components/workflow/nodes/condition-node.tsx` | Checks if lead has replied to the thread (yes/no branch) | ✅ Implemented |
| `end` | `end` | `lib/engine.ts` → `campaignHandlers.end` | `components/workflow/nodes/end-node.tsx` | Marks workflow execution as complete | ✅ Implemented |
| `research` | — | — | — | **DOES NOT EXIST** | ❌ Missing |

**Registration files:**
- Engine type normalization: `lib/workflow-engine.ts` → `normalizeNodeType()` (switch statement)
- Frontend node registry: `components/workflow/nodes/index.ts` → `nodeTypes` map
- Frontend drag palette: `components/workflow/node-palette.tsx` → `nodeItems` array
- Workflow store default data: `stores/workflow-store.ts` → `defaultData` map

---

## 3. Current Email Generation Logic

### LLM Call Location

- **File:** `lib/openai.ts`
- **Function:** `generateMessage(prompt, lead, productDescription, options)`
- **Called from:** `lib/engine.ts` → `campaignHandlers.send_email` handler (lines ~237 and ~263)
- **LLM Provider:** Azure OpenAI (env vars: `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_BASE_URL`)
- **Model:** `gpt-5.3-chat`

### Exact Prompt (System Message)

```
You are an expert B2B outreach copywriter.
[The product being promoted is: ${productDescription}.]
[You are writing on behalf of ${senderEmail}. When signing off, use the name derived from that email address — never write placeholder text like [Your Name], [Sender], or similar.]
[This is a follow-up email / This is the first email in an outreach sequence.]
Based on the user's instructions, generate both a subject line and an email body.
Respond with JSON: {"subject": "...", "body": "<html>...</html>"}.
The body must be valid HTML suitable for email. Keep it concise (3-5 sentences).

[IF enriched_data exists and has personalization_hooks:]
Enriched lead intelligence (scraped from the web — use these to make the email feel personal and deeply researched):
- Job title: ${enrichedData.job_title}
- Bio: ${enrichedData.bio}
- Company: ${enrichedData.company_description}
- Recent news: ${enrichedData.recent_news}
- Likely pain points: ${enrichedData.pain_points.join(", ")}
- Personalization hooks to weave in: ${enrichedData.personalization_hooks.join(" | ")}
Reference 1-2 of these hooks naturally — do NOT list them verbatim. Make the email feel like you did your homework.
```

### User Message

```
${effectivePrompt}    // campaign author's prompt with {{name}}/{{company}}/{{industry}} interpolated

${personalizationInstruction}
// If lead provided: "Recipient: {name} at {company} in {industry}. Personalise the email specifically for them."
// If lead is null: "Write the email as a reusable template. Use {{name}}, {{company}}, {{industry}} placeholders."
```

### Lead Fields Currently Passed to LLM

| Field | How Used | Source |
|---|---|---|
| `lead.name` | Interpolated into prompt `{{name}}` + personalization instruction | DB `leads.name` |
| `lead.email` | Interpolated into prompt `{{email}}` | DB `leads.email` |
| `lead.company` | Interpolated into prompt `{{company}}` + personalization instruction | DB `leads.company` |
| `lead.industry` | Interpolated into prompt `{{industry}}` + personalization instruction | DB `leads.industry` |
| `lead.enriched_data.*` | Appended to system prompt if present (job_title, bio, company_description, recent_news, pain_points, personalization_hooks) | DB `leads.enriched_data` (JSONB) |
| `lead.tags` | ❌ NOT used | — |
| `lead.custom_fields` | ❌ NOT used | — |

### Is Research/Context Data Used?

**Conditionally YES** — but only if `enriched_data` was previously populated by a manual enrichment action (user clicking "Enrich with AI" in the leads table). There is **no automatic research step** in the workflow pipeline. If a lead hasn't been manually enriched, the email is generated with only name/email/company/industry.

---

## 4. Research Functionality Check

| Component | Status | Details |
|---|---|---|
| **Tavily integration** | ❌ MISSING | Zero references to "tavily", "TAVILY_API_KEY", or any Tavily SDK in the entire codebase. Not in `package.json`. |
| **GROQ integration** | ❌ MISSING | Zero references to "GROQ_API_KEY" or Groq SDK. LLM calls use Azure OpenAI exclusively. |
| **Exa.ai integration** | ✅ EXISTS | `lib/enrichment.ts` — neural search for LinkedIn profiles, professional web presence, company news. SDK: `exa-js` in `package.json`. |
| **Jina Reader integration** | ✅ EXISTS | `lib/enrichment.ts` — scrapes company website and about page via `r.jina.ai`. No API key needed. |
| **`enriched_data` DB field** | ✅ EXISTS | `leads.enriched_data` JSONB column, added in migration `005_lead_enrichment.sql`. |
| **`research_result` DB field** | ❌ MISSING | No such column exists. Only `enriched_data`. |
| **Research node type in engine** | ❌ MISSING | `normalizeNodeType()` in `lib/workflow-engine.ts` throws on any unrecognized type. No "research" case. |
| **Research node in frontend** | ❌ MISSING | Not in `nodeTypes` registry, not in `NodePalette`, no component file. |
| **Lead enrichment worker** | ❌ MISSING (as workflow step) | Enrichment exists only as a manual per-lead API call (`POST /api/leads/[id]/enrich`). The worker (`worker/index.ts`) only polls `/api/engine/run` which processes workflow nodes — enrichment is not part of workflow execution. |
| **Background enrichment job** | ❌ MISSING | No batch/background enrichment. The worker is a simple 10-second interval poller for the campaign engine. |

### Environment Variables

No `.env` or `.env.example` file exists in the repository. Based on code references, the required env vars are:

| Variable | Referenced In | Purpose |
|---|---|---|
| `AZURE_OPENAI_API_KEY` | `lib/openai.ts`, `lib/enrichment.ts` | Azure OpenAI API key for LLM calls |
| `AZURE_OPENAI_BASE_URL` | `lib/openai.ts`, `lib/enrichment.ts` | Azure OpenAI endpoint URL |
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/client.ts` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/engine.ts` | Supabase service role key (server-side) |
| `GMAIL_USER_EMAIL` | `lib/engine.ts` | Sender email address for outbound |
| `EXA_API_KEY` | `lib/enrichment.ts` | Exa.ai API key (optional, enrichment degrades gracefully) |
| `WORKER_SECRET` | `worker/index.ts`, `app/api/engine/run/route.ts` | Auth token for worker → engine |
| `ENGINE_BASE_URL` / `NEXT_PUBLIC_APP_URL` | `worker/index.ts` | Base URL for engine API |
| `TAVILY_API_KEY` | **NOWHERE** | ❌ Not referenced anywhere |
| `GROQ_API_KEY` | **NOWHERE** | ❌ Not referenced anywhere |

---

## 5. Gap Analysis

To implement a **Research Lead** workflow node, the following pieces are missing:

1. **No "research" node type in the workflow engine** — `normalizeNodeType()` in `lib/workflow-engine.ts` will throw `Unsupported workflow node type: research` if encountered.

2. **No research handler in campaign handlers** — `campaignHandlers` in `lib/engine.ts` only has: `start`, `send_email`, `wait`, `condition`, `end`.

3. **No Tavily integration** — No SDK, no API key, no web search function. The existing enrichment uses Exa.ai + Jina Reader instead.

4. **No research-specific DB field** — The existing `enriched_data` JSONB column could potentially be reused, but there's no `research_result` or similar field for storing per-workflow-run research output.

5. **No research node frontend component** — No `research-node.tsx` in `components/workflow/nodes/`.

6. **No research entry in the node palette** — `components/workflow/node-palette.tsx` `nodeItems` array doesn't include a research node.

7. **No research entry in the workflow store** — `stores/workflow-store.ts` `defaultData` map doesn't include default data for a `research` node type.

8. **No research entry in the TypeScript types** — `types/index.ts` `WorkflowNode.type` union doesn't include `"research"`.

9. **Enrichment is manual-only** — Even the existing Exa.ai enrichment runs only when a user clicks "Enrich with AI" in the leads table. It is never triggered automatically as part of a workflow campaign run.

10. **No GROQ_API_KEY or Groq SDK** — If the plan is to use Groq for research synthesis (per the user's mention), neither the key nor the SDK exists.

---

## 6. Implementation Plan

> Research Lead node is **MISSING** — follow Steps 1-5 below to implement.

### Step 1: Database

The existing `leads.enriched_data` JSONB column (migration `005_lead_enrichment.sql`) can store research results. However, if you want a **separate** research result that persists independently of the Exa/Jina enrichment, create a new migration:

**File to create:** `supabase/migrations/008_research_result.sql`

```sql
-- Add research_result column for Tavily-based workflow research
ALTER TABLE leads ADD COLUMN IF NOT EXISTS research_result JSONB DEFAULT NULL;

-- Index for quickly finding researched vs un-researched leads
CREATE INDEX IF NOT EXISTS idx_leads_researched ON leads ((research_result IS NOT NULL));
```

Also update the TypeScript types:

**File to modify:** `types/index.ts`

Add to the `Lead` interface:

```ts
export interface Lead {
  // ... existing fields ...
  research_result: ResearchResult | null;  // ADD THIS
}
```

Add new type:

```ts
export interface ResearchResult {
  company_overview: string | null;
  industry_challenges: string[];
  recent_news: string[];
  competitive_landscape: string | null;
  pain_points: string[];
  talking_points: string[];
  sources: string[];
  researched_at: string;
}
```

---

### Step 2: Research Service

**File to create:** `lib/research.ts`

Complete implementation using Tavily for web search + Azure OpenAI (existing provider) for synthesis:
use npm i @tavily/n8n-nodes-tavily to install
```ts
import OpenAI from "openai";
import type { Lead, ResearchResult } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_BASE_URL,
});

const TAVILY_API_URL = "https://api.tavily.com/search";
const TAVILY_TIMEOUT_MS = 15_000;

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilySearchResult[];
  answer?: string;
}

async function tavilySearch(query: string, maxResults = 5): Promise<TavilySearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn("TAVILY_API_KEY not set — skipping Tavily search");
    return [];
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TAVILY_TIMEOUT_MS);

  try {
    const res = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: maxResults,
        include_answer: false,
        search_depth: "advanced",
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`Tavily search failed: ${res.status}`);
      return [];
    }

    const data = (await res.json()) as TavilyResponse;
    return data.results || [];
  } catch (err) {
    console.error("Tavily search error:", err);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function researchLead(lead: Lead): Promise<ResearchResult> {
  const company = lead.company || "";
  const industry = lead.industry || "";
  const name = lead.name;

  // Run multiple Tavily searches in parallel for comprehensive coverage
  const [companyResults, personResults, industryResults] = await Promise.allSettled([
    // 1. Company overview + recent news
    company
      ? tavilySearch(`${company} company overview recent news ${industry} 2025 2026`, 5)
      : Promise.resolve([]),
    // 2. Person/lead professional background
    tavilySearch(
      `${name}${company ? ` ${company}` : ""} professional background`,
      3
    ),
    // 3. Industry challenges and trends
    industry
      ? tavilySearch(`${industry} industry challenges pain points trends 2026`, 3)
      : Promise.resolve([]),
  ]);

  const allResults: { label: string; results: TavilySearchResult[] }[] = [];

  if (companyResults.status === "fulfilled" && companyResults.value.length > 0) {
    allResults.push({ label: "Company Research", results: companyResults.value });
  }
  if (personResults.status === "fulfilled" && personResults.value.length > 0) {
    allResults.push({ label: "Person Research", results: personResults.value });
  }
  if (industryResults.status === "fulfilled" && industryResults.value.length > 0) {
    allResults.push({ label: "Industry Research", results: industryResults.value });
  }

  const sources = allResults.flatMap((r) => r.results.map((s) => s.url));

  if (allResults.length === 0) {
    return {
      company_overview: null,
      industry_challenges: [],
      recent_news: [],
      competitive_landscape: null,
      pain_points: [],
      talking_points: [],
      sources: [],
      researched_at: new Date().toISOString(),
    };
  }

  // Compile all search results into a single context document
  const searchContext = allResults
    .map(
      (section) =>
        `### ${section.label}\n\n` +
        section.results
          .map((r) => `**${r.title}** (${r.url})\n${r.content}`)
          .join("\n\n")
    )
    .join("\n\n---\n\n");

  // Synthesize with LLM
  const systemPrompt = `You are an expert B2B sales researcher. Analyse the web search results below and produce structured research about a lead for use in sales outreach.

Lead info:
- Name: ${name}
- Email: ${lead.email}
- Company: ${company || "unknown"}
- Industry: ${industry || "unknown"}

Return a JSON object with this exact shape:
{
  "company_overview": "string or null — 2-3 sentence overview of the company",
  "industry_challenges": ["top 3 challenges facing this industry right now"],
  "recent_news": ["up to 3 recent news items about the company or person"],
  "competitive_landscape": "string or null — brief competitive context",
  "pain_points": ["3-5 specific pain points this lead/company likely faces"],
  "talking_points": ["3-5 specific conversation starters for outreach — reference real details from the research"]
}

Focus on actionable intelligence for crafting personalised outreach emails.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.3-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Web search results:\n\n${searchContext}` },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return {
      company_overview: null,
      industry_challenges: [],
      recent_news: [],
      competitive_landscape: null,
      pain_points: [],
      talking_points: [],
      sources,
      researched_at: new Date().toISOString(),
    };
  }

  const parsed = JSON.parse(raw) as Omit<ResearchResult, "sources" | "researched_at">;

  return {
    ...parsed,
    sources,
    researched_at: new Date().toISOString(),
  };
}
```

---

### Step 3: Workflow Engine Integration

#### 3a. Add `research` to the normalized type union

**File to modify:** `lib/workflow-engine.ts`

**Before:**
```ts
export type NormalizedWorkflowNodeType =
  | "start"
  | "send_email"
  | "wait"
  | "condition"
  | "end";
```

**After:**
```ts
export type NormalizedWorkflowNodeType =
  | "start"
  | "send_email"
  | "wait"
  | "condition"
  | "end"
  | "research";
```

#### 3b. Add `research` case to `normalizeNodeType()`

**File to modify:** `lib/workflow-engine.ts`

**Before:**
```ts
    case "end":
      return "end";
    default:
      throw new Error(`Unsupported workflow node type: ${type}`);
```

**After:**
```ts
    case "end":
      return "end";
    case "research":
    case "researchLead":
      return "research";
    default:
      throw new Error(`Unsupported workflow node type: ${type}`);
```

#### 3c. Add `research` handler to campaign handlers

**File to modify:** `lib/engine.ts`

**Before** (the `end` handler):
```ts
  end: async (_node, context) => {
    await logAction(context.supabase, context.campaignLead.id, "end", "success");
    return { stop: true };
  },
```

**After** (add `research` handler before `end`):
```ts
  research: async (node, context) => {
    const { researchLead } = await import("@/lib/research");

    const research = await researchLead(context.lead);

    // Persist research_result on the lead record
    await context.supabase
      .from("leads")
      .update({ research_result: research })
      .eq("id", context.lead.id);

    // Also make it available in context for downstream nodes
    context.lead.research_result = research;

    await logAction(context.supabase, context.campaignLead.id, "research", "success", {
      sources_count: research.sources.length,
      pain_points_count: research.pain_points.length,
      talking_points_count: research.talking_points.length,
    });
  },

  end: async (_node, context) => {
    await logAction(context.supabase, context.campaignLead.id, "end", "success");
    return { stop: true };
  },
```

#### 3d. Update LLM prompt to use research_result

**File to modify:** `lib/openai.ts`

In the `generateMessage` function, after the existing `enrichmentInstruction` block, add:

```ts
  const researchInstruction = options?.researchData
    ? `\n\nDeep research intelligence (from web search — use to make the email highly relevant):\n` +
      (options.researchData.company_overview ? `- Company overview: ${options.researchData.company_overview}\n` : "") +
      (options.researchData.recent_news?.length ? `- Recent news: ${options.researchData.recent_news.join("; ")}\n` : "") +
      (options.researchData.pain_points?.length ? `- Pain points: ${options.researchData.pain_points.join(", ")}\n` : "") +
      (options.researchData.talking_points?.length ? `- Talking points: ${options.researchData.talking_points.join(" | ")}\n` : "") +
      (options.researchData.competitive_landscape ? `- Competitive context: ${options.researchData.competitive_landscape}\n` : "") +
      `Weave 1-2 of these research insights naturally into the email.`
    : "";
```

And append `researchInstruction` to the system message alongside `enrichmentInstruction`.

#### 3e. Update send_email handler to pass research_result

**File to modify:** `lib/engine.ts`

In the `send_email` handler, wherever `generateMessage()` is called, add `researchData: context.lead.research_result ?? null` to the options object.

---

### Step 4: Frontend Node

#### 4a. Create the Research Node component

**File to create:** `components/workflow/nodes/research-node.tsx`

A simple display-only node (no user configuration fields — research is fully automatic):

```tsx
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { NodeShell } from "./node-shell";
import { Search } from "lucide-react";

export function ResearchNode({ selected }: NodeProps) {
  return (
    <NodeShell
      title="Research Lead"
      icon={Search}
      color="teal"
      selected={selected}
      description="Automatically researches the lead using web search before email generation"
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </NodeShell>
  );
}
```

#### 4b. Register in node types

**File to modify:** `components/workflow/nodes/index.ts`

```ts
import { ResearchNode } from "./research-node";

export const nodeTypes: NodeTypes = {
  start: StartNode,
  send_email: SendEmailNode,
  research: ResearchNode,       // ADD
  wait: WaitNode,
  condition: ConditionNode,
  end: EndNode,
};
```

#### 4c. Add to node palette

**File to modify:** `components/workflow/node-palette.tsx`

Add to `nodeItems` array (after `send_email`, before `wait`):

```ts
{ type: "research", label: "Research Lead", icon: Search, color: "text-teal-600 bg-teal-100" },
```

Import `Search` from `lucide-react`.

#### 4d. Add default data in workflow store

**File to modify:** `stores/workflow-store.ts`

Add to `defaultData`:

```ts
research: {},
```

#### 4e. Update WorkflowNode type

**File to modify:** `types/index.ts`

Add `"research"` and `"researchLead"` to the `WorkflowNode.type` union:

```ts
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
    | "research"
    | "researchLead"
    | "end";
  // ...
}
```

---

### Step 5: Environment Variables

Add to `.env.local`:

```
# Tavily API key for Research Lead node (web search)
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxx
```

**No other new env vars needed** — the research service reuses the existing `AZURE_OPENAI_API_KEY` / `AZURE_OPENAI_BASE_URL` for LLM synthesis.


If you want to use **Groq** instead of Azure OpenAI for the research synthesis step (faster, cheaper), also add:

```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
```

And install the Groq SDK: `pnpm add groq-sdk`, then modify `lib/research.ts` to use Groq instead of OpenAI for the synthesis call.
"i don't want install groq api use exiting azure api "
---

## 7. Verdict

**Research Lead node MISSING — follow Steps 1–5 above to implement.**

### Summary of Changes Required

| # | What | File(s) | Type |
|---|---|---|---|
| 1 | DB migration for `research_result` column | `supabase/migrations/008_research_result.sql` | **Create** |
| 2 | Research service with Tavily + LLM | `lib/research.ts` | **Create** |
| 3 | `ResearchResult` type + update `Lead` interface | `types/index.ts` | **Modify** |
| 4 | Add `research` to normalized type union | `lib/workflow-engine.ts` | **Modify** |
| 5 | Add `research` case to `normalizeNodeType()` | `lib/workflow-engine.ts` | **Modify** |
| 6 | Add `research` handler to `campaignHandlers` | `lib/engine.ts` | **Modify** |
| 7 | Update `generateMessage` to accept `researchData` | `lib/openai.ts` | **Modify** |
| 8 | Update `send_email` handler to pass `research_result` | `lib/engine.ts` | **Modify** |
| 9 | Create `ResearchNode` component | `components/workflow/nodes/research-node.tsx` | **Create** |
| 10 | Register in `nodeTypes` map | `components/workflow/nodes/index.ts` | **Modify** |
| 11 | Add to `NodePalette` items | `components/workflow/node-palette.tsx` | **Modify** |
| 12 | Add default data in workflow store | `stores/workflow-store.ts` | **Modify** |
| 13 | Add `TAVILY_API_KEY` env var | `.env.local` | **Modify** |

### Dependency to Install

```bash
# No new npm package needed for Tavily — it uses the REST API directly via fetch.
# If using Groq instead of Azure OpenAI for synthesis:
pnpm add groq-sdk
```

---

## 8. Revised Plan — Research Lead as a Lead Page Action (NOT a Workflow Node)

> **Decision (2026-03-07):** Research Lead will be implemented as a manual on-demand button on the leads table page — identical in pattern to the existing "Enrich with AI" button. The workflow node approach (Steps 3a–3c and Step 4 above) is cancelled. The core service (`lib/research.ts`) and DB column remain the same.

---

### What Changes vs. the Original Plan

| # | Original Plan | Revised Plan |
|---|---|---|
| Trigger | Workflow engine auto-fires during campaign run | Manual button click in the leads table (like "Enrich with AI") |
| Entry point | `campaignHandlers.research` in `lib/engine.ts` | `POST /api/leads/[id]/research` API route |
| UI affordance | Drag-and-drop node in workflow canvas | Dropdown menu item per row in the leads table |
| Result availability | Only during active campaign runs | Always available; persisted to DB immediately on click |

---

### What to SKIP from the Original Plan (Steps Cancelled)

| # | File | What to skip |
|---|---|---|
| 4 | `lib/workflow-engine.ts` | Do NOT add `"research"` to `NormalizedWorkflowNodeType` |
| 5 | `lib/workflow-engine.ts` | Do NOT add `case "research": case "researchLead"` to `normalizeNodeType()` |
| 6 | `lib/engine.ts` | Do NOT add the `research` campaign handler |
| 9 | `components/workflow/nodes/research-node.tsx` | Do NOT create this file |
| 10 | `components/workflow/nodes/index.ts` | Do NOT register `ResearchNode` |
| 11 | `components/workflow/node-palette.tsx` | Do NOT add "Research Lead" to the drag palette |
| 12 | `stores/workflow-store.ts` | Do NOT add `research: {}` to `defaultData` |

Also in `types/index.ts`: do NOT add `"research" | "researchLead"` to the `WorkflowNode.type` union.

---

### Revised File Checklist (9 items)

| # | File | Action | Purpose |
|---|---|---|---|
| 1 | `supabase/migrations/008_research_result.sql` | **Create** | Adds `research_result JSONB DEFAULT NULL` column + index to `leads` table |
| 2 | `lib/research.ts` | **Create** | Tavily search + Azure OpenAI synthesis service |
| 3 | `types/index.ts` | **Modify** | Add `ResearchResult` interface; add `research_result: ResearchResult \| null` to `Lead` |
| 4 | `app/api/leads/[id]/research/route.ts` | **Create** | `POST` route — calls `researchLead()`, persists result to DB, returns it |
| 5 | `lib/openai.ts` | **Modify** | Add `researchData` option to `generateMessage()`; build + inject `researchInstruction` into system prompt |
| 6 | `lib/engine.ts` | **Modify** | Pass `researchData: context.lead.research_result ?? null` to both `generateMessage()` calls in `send_email` handler |
| 7 | `components/leads/leads-table.tsx` | **Modify** | Add state, `handleResearch()` handler, "Researched" status column, dropdown menu item |
| 8 | `.env.local` | **Modify** | Add `TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxx` |
| 9 | *(optional)* `components/leads/leads-table.tsx` | **Modify** | Inline research result display panel (company_overview, pain_points, talking_points, sources) |

---

### Step R1: Database Migration

**File to create:** `supabase/migrations/008_research_result.sql`

```sql
-- Add research_result column for Tavily-based lead research
ALTER TABLE leads ADD COLUMN IF NOT EXISTS research_result JSONB DEFAULT NULL;

-- Index for quickly querying researched vs un-researched leads
CREATE INDEX IF NOT EXISTS idx_leads_researched ON leads ((research_result IS NOT NULL));
```

Run via Supabase SQL editor or `supabase db push`. `ADD COLUMN IF NOT EXISTS` is safe to re-run. Defaults to `NULL` for all existing rows — no backfill needed.

---

### Step R2: TypeScript Types

**File to modify:** `types/index.ts`

Add `ResearchResult` interface **before** the `Lead` interface:

```ts
export interface ResearchResult {
  company_overview: string | null;       // 2-3 sentence overview, or null
  industry_challenges: string[];         // top 3 industry challenges right now
  recent_news: string[];                 // up to 3 recent news items
  competitive_landscape: string | null;  // brief competitive context, or null
  pain_points: string[];                 // 3-5 specific pain points
  talking_points: string[];              // 3-5 outreach conversation starters
  sources: string[];                     // all Tavily result URLs
  researched_at: string;                 // ISO 8601 timestamp
}
```

Add to the `Lead` interface after `enriched_data`:

```ts
research_result: ResearchResult | null;
```

---

### Step R3: Research Service

**File to create:** `lib/research.ts`

Pure TypeScript service — no Next.js or Supabase imports. Called from the API route.

```ts
import OpenAI from "openai";
import type { Lead, ResearchResult } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_BASE_URL,
});

const TAVILY_API_URL = "https://api.tavily.com/search";
const TAVILY_TIMEOUT_MS = 15_000;

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilySearchResult[];
  answer?: string;
}

async function tavilySearch(query: string, maxResults = 5): Promise<TavilySearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn("TAVILY_API_KEY not set — skipping Tavily search");
    return [];
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TAVILY_TIMEOUT_MS);

  try {
    const res = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: maxResults,
        include_answer: false,
        search_depth: "advanced",
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`Tavily search failed: ${res.status}`);
      return [];
    }

    const data = (await res.json()) as TavilyResponse;
    return data.results || [];
  } catch (err) {
    console.error("Tavily search error:", err);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function researchLead(lead: Lead): Promise<ResearchResult> {
  const company = lead.company || "";
  const industry = lead.industry || "";
  const name = lead.name;

  // Three parallel Tavily searches — Promise.allSettled so one failure never blocks others
  const [companyResults, personResults, industryResults] = await Promise.allSettled([
    company
      ? tavilySearch(`${company} company overview recent news ${industry} 2025 2026`, 5)
      : Promise.resolve([]),
    tavilySearch(`${name}${company ? ` ${company}` : ""} professional background`, 3),
    industry
      ? tavilySearch(`${industry} industry challenges pain points trends 2026`, 3)
      : Promise.resolve([]),
  ]);

  const allResults: { label: string; results: TavilySearchResult[] }[] = [];

  if (companyResults.status === "fulfilled" && companyResults.value.length > 0)
    allResults.push({ label: "Company Research", results: companyResults.value });
  if (personResults.status === "fulfilled" && personResults.value.length > 0)
    allResults.push({ label: "Person Research", results: personResults.value });
  if (industryResults.status === "fulfilled" && industryResults.value.length > 0)
    allResults.push({ label: "Industry Research", results: industryResults.value });

  const sources = allResults.flatMap((r) => r.results.map((s) => s.url));

  // Graceful degradation — no LLM call needed if all searches returned nothing
  if (allResults.length === 0) {
    return {
      company_overview: null,
      industry_challenges: [],
      recent_news: [],
      competitive_landscape: null,
      pain_points: [],
      talking_points: [],
      sources: [],
      researched_at: new Date().toISOString(),
    };
  }

  // Compile results into a single markdown context document for the LLM
  const searchContext = allResults
    .map(
      (section) =>
        `### ${section.label}\n\n` +
        section.results
          .map((r) => `**${r.title}** (${r.url})\n${r.content}`)
          .join("\n\n")
    )
    .join("\n\n---\n\n");

  const systemPrompt = `You are an expert B2B sales researcher. Analyse the web search results below and produce structured research about a lead for use in sales outreach.

Lead info:
- Name: ${name}
- Email: ${lead.email}
- Company: ${company || "unknown"}
- Industry: ${industry || "unknown"}

Return a JSON object with this exact shape:
{
  "company_overview": "string or null — 2-3 sentence overview of the company",
  "industry_challenges": ["top 3 challenges facing this industry right now"],
  "recent_news": ["up to 3 recent news items about the company or person"],
  "competitive_landscape": "string or null — brief competitive context",
  "pain_points": ["3-5 specific pain points this lead/company likely faces"],
  "talking_points": ["3-5 specific conversation starters — reference real details from the research"]
}

Focus on actionable intelligence for crafting personalised outreach emails.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.3-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Web search results:\n\n${searchContext}` },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return {
      company_overview: null,
      industry_challenges: [],
      recent_news: [],
      competitive_landscape: null,
      pain_points: [],
      talking_points: [],
      sources,
      researched_at: new Date().toISOString(),
    };
  }

  const parsed = JSON.parse(raw) as Omit<ResearchResult, "sources" | "researched_at">;
  return { ...parsed, sources, researched_at: new Date().toISOString() };
}
```

---

### Step R4: API Route

**File to create:** `app/api/leads/[id]/research/route.ts`

Mirrors `app/api/leads/[id]/enrich/route.ts` exactly in structure:

```ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { researchLead } from "@/lib/research";
import type { Lead } from "@/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  try {
    const result = await researchLead(lead as Lead);

    const { error: updateError } = await supabase
      .from("leads")
      .update({ research_result: result })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ research_result: result });
  } catch (err) {
    console.error("Research failed for lead", id, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Research failed" },
      { status: 500 }
    );
  }
}
```

> Note: `params: Promise<{ id: string }>` with `await params` matches the Next.js 15 App Router convention used in all other route files in this project.

---

### Step R5: LLM Prompt Integration

When a campaign `send_email` node runs for a researched lead, it should automatically inject the stored research data into the email prompt.

#### R5a — Update `generateMessage()` in `lib/openai.ts`

Add `researchData?: ResearchResult | null` to the `options` parameter type and import `ResearchResult` from `@/types`.

Inside the function, after extracting `enrichedData`:

```ts
const researchData = options?.researchData;

const researchInstruction = researchData &&
  (researchData.talking_points.length > 0 || researchData.pain_points.length > 0)
  ? `\n\nDeep research intelligence (from web search — use to make the email highly relevant):\n` +
    (researchData.company_overview ? `- Company overview: ${researchData.company_overview}\n` : "") +
    (researchData.recent_news?.length ? `- Recent news: ${researchData.recent_news.join("; ")}\n` : "") +
    (researchData.pain_points?.length ? `- Pain points: ${researchData.pain_points.join(", ")}\n` : "") +
    (researchData.talking_points?.length ? `- Talking points: ${researchData.talking_points.join(" | ")}\n` : "") +
    (researchData.competitive_landscape ? `- Competitive context: ${researchData.competitive_landscape}\n` : "") +
    `Weave 1-2 of these research insights naturally into the email.`
  : "";
```

Append `researchInstruction` to the system message string after `enrichmentInstruction`.

The guard `(talking_points.length > 0 || pain_points.length > 0)` ensures the block is only injected when actual research content exists. If `researchData` is `null`, `researchInstruction` is `""` — zero impact.

#### R5b — Update `send_email` handler in `lib/engine.ts`

In both `generateMessage()` calls inside `campaignHandlers.send_email`, add:

```ts
researchData: context.lead.research_result ?? null,
```

`context.lead` is fetched from DB at engine boot, so `research_result` is already populated if the user clicked "Research Lead" before activating the campaign.

---

### Step R6: UI — Leads Table Button

**File to modify:** `components/leads/leads-table.tsx`

#### New state (alongside existing `enrichingId` / `enrichedIds`):

```ts
const [researchingId, setResearchingId] = useState<string | null>(null);
const [researchedIds, setResearchedIds] = useState<Set<string>>(
  () => new Set(leads.filter((l) => l.research_result).map((l) => l.id))
);
```

#### New handler (alongside existing `handleEnrich`):

```ts
async function handleResearch(lead: Lead) {
  setResearchingId(lead.id);
  try {
    const res = await fetch(`/api/leads/${lead.id}/research`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    setResearchedIds((prev) => new Set([...prev, lead.id]));
    toast.success(`${lead.name} researched with web intelligence`);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Research failed");
  } finally {
    setResearchingId(null);
  }
}
```

#### New table header column (alongside "Enriched"):

```tsx
<TableHead>Researched</TableHead>
```

#### New table cell per row (alongside the "Enriched" cell):

```tsx
<TableCell>
  {researchedIds.has(lead.id) ? (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
      <Search className="h-3 w-3" /> Researched
    </span>
  ) : (
    <span className="text-xs text-muted-foreground">—</span>
  )}
</TableCell>
```

#### New dropdown menu item (after "Enrich with AI"):

```tsx
<DropdownMenuItem
  onClick={() => handleResearch(lead)}
  disabled={researchingId === lead.id}
>
  {researchingId === lead.id ? (
    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  ) : (
    <Search className="h-4 w-4 mr-2" />
  )}
  {researchedIds.has(lead.id) ? "Re-research" : "Research Lead"}
</DropdownMenuItem>
```

#### Updated import line (add `Search`):

```ts
import { MoreVertical, Trash2, Loader2, Sparkles, Search } from "lucide-react";
```

---

### End-to-End Data Flow

```
User clicks "Research Lead" on a row in the leads table
  ↓
handleResearch(lead) → setResearchingId(lead.id) [spinner shown in dropdown]
  ↓
POST /api/leads/{id}/research
  ↓
route.ts: fetches full lead row from Supabase
  → calls researchLead(lead) from lib/research.ts
      → Promise.allSettled([
          tavilySearch("Acme Corp company overview SaaS 2025 2026", 5),
          tavilySearch("John Smith Acme Corp professional background", 3),
          tavilySearch("SaaS industry challenges pain points trends 2026", 3),
        ])
      → compiles results into markdown context document
      → Azure OpenAI gpt-5.3-chat synthesizes into structured JSON
      → returns ResearchResult { company_overview, pain_points, talking_points, sources, researched_at }
  → supabase.from("leads").update({ research_result: result }).eq("id", id)
  → returns { research_result: result } to client
  ↓
setResearchedIds(prev => new Set([...prev, lead.id]))
toast.success("John Smith researched with web intelligence")
Row now shows green "Researched" badge
  ↓
[Later — campaign send_email node fires for this lead]
  ↓
lib/engine.ts: context.lead loaded from DB — research_result already populated
  → generateMessage(prompt, lead, product, { researchData: context.lead.research_result })
  ↓
lib/openai.ts: researchInstruction built from pain_points + talking_points + company_overview
  → appended to LLM system message
  → email generated with research insights woven in naturally
```

---

### Failure Modes & Graceful Degradation

| Scenario | Behavior |
|---|---|
| `TAVILY_API_KEY` not set | `tavilySearch` returns `[]`, service returns empty `ResearchResult`, route responds 200 |
| Tavily HTTP error | Returns `[]`, logged to console, other searches unaffected |
| Tavily timeout > 15s | `AbortController` fires, caught in `catch`, returns `[]` |
| All 3 searches return empty | Returns empty `ResearchResult` — no LLM call made (saves cost) |
| LLM returns null content | Returns empty `ResearchResult` with collected `sources` |
| Lead has no `company` | Company search is `company ? tavilySearch(...) : Promise.resolve([])` — skipped |
| Lead has no `industry` | Industry search skipped the same way |
| `send_email` runs before lead is researched | `context.lead.research_result` is `null` → `researchInstruction` is `""` → email unaffected |
