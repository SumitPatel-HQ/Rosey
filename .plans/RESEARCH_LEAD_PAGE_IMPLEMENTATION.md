# Research Lead — Lead Page Implementation Spec

**Approach:** Manual per-lead action button on the leads page (same UX pattern as "Enrich with AI")  
**Not a workflow node** — research is triggered by the user, persisted to the DB, then automatically consumed by the workflow engine when a campaign runs.

---

## 1. Overview & Architecture

The Research Lead feature gives users a one-click button in the leads table to trigger deep web research on any lead. It runs three parallel Tavily web searches (company overview, person background, industry challenges), synthesizes the results with an LLM, and persists the structured output to a new `research_result` JSONB column on the `leads` table.

When a campaign's `send_email` workflow node later runs for that lead, it reads `lead.research_result` from the DB and injects it into the LLM system prompt — producing emails that reference real, specific research about the lead's company and industry. No user intervention is needed at campaign time.

### How It Relates to Existing "Enrich with AI"

The app already has a near-identical feature: **"Enrich with AI"** (Exa.ai + Jina Reader, stores to `leads.enriched_data`). Research Lead follows the exact same layered pattern:

| Layer | Enrich with AI (existing) | Research Lead (new) |
|---|---|---|
| Data source | Exa.ai (LinkedIn/web) + Jina Reader (company site) | Tavily REST API (general web search) |
| LLM synthesis | Azure OpenAI | Azure OpenAI (same provider) |
| DB column | `leads.enriched_data` (JSONB) | `leads.research_result` (JSONB) |
| API route | `POST /api/leads/[id]/enrich` | `POST /api/leads/[id]/research` |
| UI trigger | "Enrich with AI" in dropdown menu | "Research Lead" in dropdown menu |
| Status indicator | `<Sparkles /> Enriched` in table row | `<Search /> Researched` in table row |
| Campaign usage | `generateMessage(..., { enrichedData: ... })` | `generateMessage(..., { researchData: ... })` |

---

## 2. Stack & Prerequisites

| Requirement | Detail |
|---|---|
| **Framework** | Next.js (App Router), TypeScript |
| **Database** | Supabase (Postgres + JSONB) via `supabase-js` |
| **Web search** | Tavily REST API — direct `fetch`, **no SDK needed** |
| **LLM** | Azure OpenAI (npm `openai` package; model: `gpt-5.3-chat`) |
| **UI** | Tailwind CSS + shadcn/ui (`Button`, `DropdownMenuItem`, `Badge`) |
| **Toast notifications** | `sonner` |
| **Icons** | `lucide-react` (`Search`, `Loader2`) |

**New env var required — add to `.env.local`:**
```
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxx
```

No new npm packages. Tavily is called via bare `fetch`. Azure OpenAI is already configured via `AZURE_OPENAI_API_KEY` + `AZURE_OPENAI_BASE_URL`.

---

## 3. Files Changed

| # | File | Action | Purpose |
|---|---|---|---|
| 1 | `supabase/migrations/008_research_result.sql` | **Create** | Adds `research_result` JSONB column to `leads` table |
| 2 | `lib/research.ts` | **Create** | Tavily search service + LLM synthesis |
| 3 | `types/index.ts` | **Modify** | Add `ResearchResult` interface + `Lead.research_result` field |
| 4 | `lib/openai.ts` | **Modify** | Accept `researchData` option in `generateMessage()`, inject into system prompt |
| 5 | `lib/engine.ts` | **Modify** | Pass `research_result` from lead context to `generateMessage()` calls |
| 6 | `app/api/leads/[id]/research/route.ts` | **Create** | API route — fetches lead, calls `researchLead()`, persists result |
| 7 | `components/leads/leads-table.tsx` | **Modify** | Add "Research Lead" dropdown item, loading state, status indicator |
| 8 | `.env.local` | **Modify** | Add `TAVILY_API_KEY` |

---

## 4. Database Migration

**File:** `supabase/migrations/008_research_result.sql`

```sql
-- Add research_result column for Tavily-based lead research
ALTER TABLE leads ADD COLUMN IF NOT EXISTS research_result JSONB DEFAULT NULL;

-- Index for quickly finding researched vs un-researched leads
CREATE INDEX IF NOT EXISTS idx_leads_researched ON leads ((research_result IS NOT NULL));
```

Run this against your Supabase project via the SQL editor or `supabase db push`. The `IF NOT EXISTS` guards make it safe to run multiple times.

---

## 5. TypeScript Types

**File:** `types/index.ts`

Add the new `ResearchResult` interface **before** the `Lead` interface:

```ts
export interface ResearchResult {
  company_overview: string | null;      // 2-3 sentence company description
  industry_challenges: string[];         // top 3 challenges in this industry
  recent_news: string[];                 // up to 3 recent news items
  competitive_landscape: string | null; // brief competitive context
  pain_points: string[];                 // 3-5 specific pain points
  talking_points: string[];              // 3-5 outreach conversation starters
  sources: string[];                     // URLs of Tavily search results used
  researched_at: string;                // ISO 8601 timestamp
}
```

Add `research_result` to the `Lead` interface (after the existing `enriched_data` field):

```ts
export interface Lead {
  id: string;
  product_id: string;
  name: string;
  email: string;
  company: string | null;
  industry: string | null;
  tags: string[];
  enriched_data: EnrichedLeadData | null;
  research_result: ResearchResult | null;   // ← ADD THIS
  custom_fields: Record<string, unknown> | null;
  created_at: string;
}
```

**Do NOT** add `"research"` or `"researchLead"` to the `WorkflowNode.type` union — this approach has no workflow node.

---

## 6. Research Service

**File:** `lib/research.ts` *(new file)*

Full implementation — copy exactly:

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

async function tavilySearch(
  query: string,
  maxResults = 5
): Promise<TavilySearchResult[]> {
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

  // Three parallel Tavily searches for comprehensive coverage
  const [companyResults, personResults, industryResults] =
    await Promise.allSettled([
      // 1. Company overview + recent news
      company
        ? tavilySearch(
            `${company} company overview recent news ${industry} 2025 2026`,
            5
          )
        : Promise.resolve([]),
      // 2. Person/lead professional background
      tavilySearch(
        `${name}${company ? ` ${company}` : ""} professional background`,
        3
      ),
      // 3. Industry challenges and trends
      industry
        ? tavilySearch(
            `${industry} industry challenges pain points trends 2026`,
            3
          )
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

  // Graceful degradation: all searches empty → return empty result, no LLM call
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

  // Compile all search results into one markdown-structured document
  const searchContext = allResults
    .map(
      (section) =>
        `### ${section.label}\n\n` +
        section.results
          .map((r) => `**${r.title}** (${r.url})\n${r.content}`)
          .join("\n\n")
    )
    .join("\n\n---\n\n");

  // LLM synthesis: produce structured JSON output from raw search results
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
    model: "gpt-5.3-chat",       // ← replace with your deployed model name
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

### `tavilySearch` function — key design decisions

- **Private** — not exported. Only `researchLead` is the public API.
- **`AbortController` + 15-second timeout** — prevents the route from hanging if Tavily is slow.
- **Graceful key-missing handling** — if `TAVILY_API_KEY` is absent, logs a warning and returns `[]` without throwing. The rest of the feature degrades to an empty result rather than crashing.
- **Graceful HTTP error handling** — non-`ok` responses log and return `[]`, not throw.

### `researchLead` function — key design decisions

- **`Promise.allSettled`** — one failed search doesn't abort the others. Each resolved independently.
- **Empty-result short-circuit** — if all three searches return empty, returns a zero-data `ResearchResult` without making a (costly) LLM call.
- **`sources` and `researched_at` are appended post-parse** — the LLM only produces the six intelligence fields. Source URLs and the timestamp are merged in code, not hallucinated.
- **`response_format: { type: "json_object" }`** — forces the LLM to always return parseable JSON.

---

## 7. API Route

**File:** `app/api/leads/[id]/research/route.ts` *(new file)*

Copy the structure of the existing `app/api/leads/[id]/enrich/route.ts` exactly — only the import and field name change:

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
    const researchResult = await researchLead(lead as Lead);

    const { error: updateError } = await supabase
      .from("leads")
      .update({ research_result: researchResult })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ research_result: researchResult });
  } catch (err) {
    console.error("Research failed for lead", id, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Research failed" },
      { status: 500 }
    );
  }
}
```

**Important:** The `params` object is a `Promise` in Next.js App Router — always `await params` before destructuring.

---

## 8. LLM Prompt Update

**File:** `lib/openai.ts` — `generateMessage()` function

### 8a. Update options type signature

```ts
export async function generateMessage(
  prompt: string,
  lead: Lead | null,
  productDescription?: string,
  options?: {
    senderEmail?: string;
    isFollowUp?: boolean;
    enrichedData?: EnrichedLeadData | null;
    researchData?: ResearchResult | null;   // ← ADD
  }
): Promise<{ subject: string; body: string }>
```

Also add `ResearchResult` to the import line:

```ts
import type { Lead, EnrichedLeadData, ResearchResult } from "@/types";
```

### 8b. Extract the option and build the instruction block

After the existing `enrichedData` extraction, add:

```ts
const researchData = options?.researchData;

const researchInstruction =
  researchData &&
  (researchData.talking_points.length > 0 || researchData.pain_points.length > 0)
    ? `\n\nDeep research intelligence (from web search — use to make the email highly relevant):\n` +
      (researchData.company_overview
        ? `- Company overview: ${researchData.company_overview}\n`
        : "") +
      (researchData.recent_news?.length
        ? `- Recent news: ${researchData.recent_news.join("; ")}\n`
        : "") +
      (researchData.pain_points?.length
        ? `- Pain points: ${researchData.pain_points.join(", ")}\n`
        : "") +
      (researchData.talking_points?.length
        ? `- Talking points: ${researchData.talking_points.join(" | ")}\n`
        : "") +
      (researchData.competitive_landscape
        ? `- Competitive context: ${researchData.competitive_landscape}\n`
        : "") +
      `Weave 1-2 of these research insights naturally into the email.`
    : "";
```

### 8c. Append to the system message

At the end of the system message `content` string, append `researchInstruction` alongside the existing `enrichmentInstruction`:

```ts
content:
  "You are an expert B2B outreach copywriter. " +
  // ... existing instructions ...
  enrichmentInstruction +
  researchInstruction,   // ← ADD at the end
```

### Guard condition rationale

The `researchInstruction` is only non-empty when `talking_points.length > 0 || pain_points.length > 0`. This prevents injecting a useless "Deep research intelligence:" block when the Tavily searches returned nothing (all fields empty arrays/nulls). An empty block would waste context window and potentially confuse the LLM.

---

## 9. Campaign Engine Update

**File:** `lib/engine.ts` — inside `campaignHandlers.send_email`

Both `generateMessage()` calls in the `send_email` handler must pass through the research data. The lead object is already fetched from the DB at context-building time (using `select("*")` on `campaign_leads` with a joined `lead`), so `context.lead.research_result` is populated if the user previously clicked "Research Lead" for that lead.

Find every call to `generateMessage(...)` inside `send_email` and add `researchData` to the options object:

**Before:**
```ts
const { subject, body } = await generateMessage(prompt, context.lead, context.productDescription, {
  senderEmail: senderEmail,
  isFollowUp: false,
  enrichedData: context.lead.enriched_data,
});
```

**After:**
```ts
const { subject, body } = await generateMessage(prompt, context.lead, context.productDescription, {
  senderEmail: senderEmail,
  isFollowUp: false,
  enrichedData: context.lead.enriched_data,
  researchData: context.lead.research_result ?? null,   // ← ADD
});
```

Apply this to **both** `generateMessage` calls in the handler (the first-email call and the follow-up call). If `research_result` is `null` (lead was never researched), the option is ignored by `generateMessage` — no behavior change for un-researched leads.

---

## 10. Leads Table UI

**File:** `components/leads/leads-table.tsx`

### 10a. Add state variables

Near the existing `enrichingId` / `enrichedIds` state declarations:

```ts
const [researchingId, setResearchingId] = useState<string | null>(null);
const [researchedIds, setResearchedIds] = useState<Set<string>>(
  () => new Set(leads.filter((l) => l.research_result).map((l) => l.id))
);
```

### 10b. Add the handler function

After (or alongside) the existing `handleEnrich` function:

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

### 10c. Add icon import

Add `Search` to the lucide-react import line:

```ts
import { MoreVertical, Trash2, Loader2, Sparkles, Search } from "lucide-react";
```

### 10d. Add table column header

In the `<TableHeader>` section, add a "Researched" column header after the "Enriched" header:

```tsx
<TableHead>Enriched</TableHead>
<TableHead>Researched</TableHead>   {/* ← ADD */}
```

Remember to also increment the `colCount` calculation by 1.

### 10e. Add status indicator cell

In the `<TableBody>` row, after the existing Enriched cell:

```tsx
{/* Existing Enriched cell */}
<TableCell>
  {enrichedIds.has(lead.id) ? (
    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
      <Sparkles className="h-3 w-3" /> Enriched
    </span>
  ) : (
    <span className="text-xs text-muted-foreground">—</span>
  )}
</TableCell>

{/* ADD: Researched cell */}
<TableCell>
  {researchedIds.has(lead.id) ? (
    <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
      <Search className="h-3 w-3" /> Researched
    </span>
  ) : (
    <span className="text-xs text-muted-foreground">—</span>
  )}
</TableCell>
```

### 10f. Add dropdown menu item

Inside the `<DropdownMenuContent>` for each lead, after the existing "Enrich with AI" item:

```tsx
{/* Existing enrich item */}
<DropdownMenuItem
  onClick={() => handleEnrich(lead)}
  disabled={enrichingId === lead.id}
>
  {enrichingId === lead.id ? (
    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  ) : (
    <Sparkles className="h-4 w-4 mr-2" />
  )}
  {enrichedIds.has(lead.id) ? "Re-enrich" : "Enrich with AI"}
</DropdownMenuItem>

{/* ADD: Research item */}
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

---

## 11. End-to-End Data Flow

```
User clicks "Research Lead" in leads table dropdown
         ↓
POST /api/leads/{id}/research
         ↓
route.ts: fetches lead row from Supabase
         ↓
lib/research.ts: researchLead(lead)
         ↓
  ┌─ tavilySearch("{company} overview news {industry}", 5)
  ├─ tavilySearch("{name} {company} professional background", 3)   ← Promise.allSettled (parallel)
  └─ tavilySearch("{industry} challenges pain points trends", 3)
         ↓
allResults compiled — empty sections silently dropped
         ↓
  If allResults empty → return ResearchResult with all empty fields (no LLM call)
  Else → compile searchContext markdown document
         ↓
Azure OpenAI gpt-5.3-chat synthesis
  System: "You are a B2B sales researcher... return JSON with these 6 fields"
  User:   searchContext
  response_format: { type: "json_object" }
         ↓
Parse JSON → spread parsed fields + append sources[] + researched_at
         ↓
route.ts: UPDATE leads SET research_result = {result} WHERE id = {id}
         ↓
route.ts: return JSON { research_result: result }
         ↓
leads-table.tsx: setResearchedIds adds lead.id → row shows <Search /> Researched
toast.success("X researched with web intelligence")

═══════════════════════════════════════════════════════
Later — when campaign processes this lead:
═══════════════════════════════════════════════════════

engine.ts: campaignHandlers.send_email
  context.lead is fetched from DB (includes research_result if it was set)
         ↓
generateMessage(prompt, lead, productDescription, {
  enrichedData: context.lead.enriched_data,          // Exa/Jina enrichment (if any)
  researchData: context.lead.research_result ?? null  // Tavily research (if any)
})
         ↓
lib/openai.ts: builds researchInstruction block only if
  researchData.talking_points.length > 0 || researchData.pain_points.length > 0
         ↓
System prompt includes:
  "Deep research intelligence (from web search — use to make the email highly relevant):
   - Company overview: ...
   - Recent news: ...
   - Pain points: ...
   - Talking points: ...
   - Competitive context: ...
   Weave 1-2 of these research insights naturally into the email."
         ↓
Email generated with research-informed, specific talking points
```

---

## 12. Failure Modes & Graceful Degradation

| Scenario | Behavior |
|---|---|
| `TAVILY_API_KEY` not set | `tavilySearch` returns `[]` silently; `researchLead` returns empty `ResearchResult`; route saves it; no crash |
| Tavily HTTP error (4xx/5xx) | `tavilySearch` logs and returns `[]`; other searches unaffected |
| Tavily timeout (>15s) | `AbortController` fires; caught in `catch`; returns `[]` |
| All 3 searches return empty | `researchLead` returns empty `ResearchResult` with no LLM call |
| LLM returns null content | Returns `ResearchResult` with empty fields + collected `sources` |
| Lead has no `company` | Company + person search still run with name only; industry search skipped |
| Lead has no `industry` | Industry search skipped; company + person search still run |
| `research_result` is null at campaign time | `researchData: null` passed to `generateMessage`; `researchInstruction` is `""`; email unaffected |
| Research never run for a lead | Exactly same behavior as today — email generated from name/company/industry + `enriched_data` only |

---

## 13. Implementation Checklist

- [ ] Run `supabase/migrations/008_research_result.sql` against your Supabase project
- [ ] Create `lib/research.ts` with `tavilySearch()` (private) + `researchLead()` (exported)
- [ ] Add `ResearchResult` interface to `types/index.ts`
- [ ] Add `research_result: ResearchResult | null` to `Lead` interface in `types/index.ts`
- [ ] Add `ResearchResult` to import in `lib/openai.ts`
- [ ] Add `researchData?: ResearchResult | null` to `generateMessage()` options parameter
- [ ] Build `researchInstruction` string in `generateMessage()` body
- [ ] Append `researchInstruction` to the system message
- [ ] Add `researchData: context.lead.research_result ?? null` to both `generateMessage()` calls in `lib/engine.ts`
- [ ] Create `app/api/leads/[id]/research/route.ts`
- [ ] Add `researchingId` + `researchedIds` state to `components/leads/leads-table.tsx`
- [ ] Add `handleResearch(lead)` function to `components/leads/leads-table.tsx`
- [ ] Add `Search` to lucide-react imports in `leads-table.tsx`
- [ ] Add "Researched" column header to table
- [ ] Add "Researched" status cell to each table row
- [ ] Add "Research Lead" / "Re-research" dropdown menu item to each row
- [ ] Add `TAVILY_API_KEY=tvly-xxxxx` to `.env.local`
- [ ] Apply DB migration via Supabase SQL editor

---

## 14. What This Does NOT Change

- No new workflow node types
- No changes to `lib/workflow-engine.ts` (`normalizeNodeType`, `NormalizedWorkflowNodeType`)
- No changes to `stores/workflow-store.ts`
- No changes to `components/workflow/nodes/`
- No changes to `components/workflow/node-palette.tsx`
- No new npm packages
- The existing `enriched_data` / `enrichLead` / `EnrichedLeadData` system is completely unaffected
