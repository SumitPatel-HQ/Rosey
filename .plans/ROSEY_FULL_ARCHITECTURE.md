# ROSEY — Complete System Architecture
> **Project:** COHERENCE-26 | NEURALNEXUS
> **Stack:** Next.js 16 · Supabase Postgres · Azure OpenAI · Gmail API · WhatsApp (Baileys) · Clerk Auth · Exa · Tavily · Jina

---

## MASTER ARCHITECTURE MAP

```
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║                                    ROSEY PLATFORM                                           ║
╠══════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                              ║
║   ┌─────────────────────────────────────────────────────────────────────────────────────┐   ║
║   │                         USER BROWSER (Client)                                       │   ║
║   │  Landing Page  │  Dashboard  │  Workflow Builder  │  Leads  │  Inbox  │  Analytics  │   ║
║   └─────────────────────────────┬───────────────────────────────────────────────────────┘   ║
║                                 │ HTTPS / REST                                               ║
║   ┌─────────────────────────────▼───────────────────────────────────────────────────────┐   ║
║   │                    NEXT.JS 16 APP (Modular Monolith)                                │   ║
║   │  ┌──────────────┐  ┌────────────────────┐  ┌──────────────┐  ┌──────────────────┐  │   ║
║   │  │  App Router  │  │  API Route Handler │  │   Workflow   │  │  Clerk Auth      │  │   ║
║   │  │  + React     │  │  /api/**           │  │   Engine     │  │  Middleware      │  │   ║
║   │  │  + @xyflow   │  │                    │  │  lib/engine  │  │                  │  │   ║
║   │  └──────────────┘  └────────────────────┘  └──────────────┘  └──────────────────┘  │   ║
║   └─────────┬────────────────────┬──────────────────────┬──────────────────────────────┘   ║
║             │                    │                      │                                    ║
║   ┌─────────▼──────┐  ┌──────────▼───────────┐  ┌──────▼──────────────────────────────┐   ║
║   │  Supabase      │  │  AI & Research APIs   │  │  External Messaging Services        │   ║
║   │  Postgres      │  │  Azure OpenAI         │  │  Gmail API (OAuth)                  │   ║
║   │                │  │  Exa API              │  │  WhatsApp Web (Baileys)              │   ║
║   │  13 migrations │  │  Tavily API           │  │                                     │   ║
║   └────────────────┘  │  Jina Reader          │  └─────────────────────────────────────┘   ║
║                       └───────────────────────┘                                             ║
║                                                                                              ║
║   ┌──────────────────────────────────────────────────────────────────────────────────────┐  ║
║   │                      WORKER PROCESS  (worker/index.ts)                               │  ║
║   │   Polling Loop every 10s  →  POST /api/engine/run                                    │  ║
║   │   WhatsApp Internal Gateway  127.0.0.1:3002  (Baileys WebSocket)                     │  ║
║   └──────────────────────────────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 1. FRONTEND ARCHITECTURE

```
APP ROUTER PAGES
═══════════════════════════════════════════════════════════════

/                               → Marketing Landing Page

/dashboard                      → Product Picker
  └── Product Cards Grid
        name · leads count · campaigns count · created date
        + New Product CTA

/products/new                   → Create Product Form
  └── name, description, sender email

/{productId}/leads              → Lead Management Page
  ├── Upload CSV Button         → POST /api/leads/upload
  ├── Leads Table               name · email · company · industry · tags · created
  ├── Enrich Button (per lead)  → POST /api/leads/[id]/enrich
  └── Search / Filter bar

/{productId}/campaigns          → Campaign List Page
  ├── Campaign Cards            name · status badge · leads count · created date
  └── + New Campaign CTA

/{productId}/campaigns/[id]     → Campaign Detail (Main Page)
  ├── TAB: Workflow Builder
  │     ├── React Flow Canvas   @xyflow/react
  │     ├── Node Palette Sidebar
  │     │     start · send_email · send_whatsapp · wait
  │     │     condition · auto_reply · end
  │     ├── Node Inspector Panel  (config per selected node)
  │     ├── Zustand Store        stores/workflow-store.ts
  │     ├── Save Draft Button    → PATCH /api/campaigns/[id]
  │     ├── Preview Email Button → POST /api/campaigns/[id]/preview-email
  │     └── Run Campaign Button  → POST /api/campaigns/[id]/run
  │
  ├── TAB: Leads Panel
  │     ├── Assign leads to campaign
  │     ├── Import leads from product pool
  │     └── Lead status per campaign  (queued / active / waiting / done)
  │
  ├── TAB: Inbox / Thread View
  │     ├── Conversations List    per lead (Not Yet Contacted / Replied)
  │     ├── Gmail Thread Display  full email chain
  │     ├── Manual Reply          POST /api/campaign-leads/[id]/reply
  │     ├── AI-Assisted Reply     POST /api/campaign-leads/[id]/compose
  │     └── Status badges         queued · sent · replied · failed
  │
  ├── TAB: Automation Context
  │     ├── Knowledge Base editor  (product context for auto_reply AI)
  │     └── PATCH /api/campaigns/[id]/automation
  │
  └── TAB: Analytics Dashboard
        ├── hooks/use-analytics-dashboard.ts  (periodic refresh)
        ├── KPI Cards: sent · opened · replied · failed
        ├── Deliverability events timeline
        └── GET /api/campaigns/[id]/analytics-dashboard

/{productId}/settings           → Product Settings
  └── sender email · knowledge base · rate limits
```

---

## 2. API LAYER — COMPLETE ROUTE MAP

```
╔══════════════════════════════════════════════════════════╗
║  PRODUCTS                                                ║
╠══════════════════════════════════════════════════════════╣
║  POST   /api/products                 Create product     ║
║  GET    /api/products                 List all products  ║
║  GET    /api/products/[id]            Get single product ║
║  PATCH  /api/products/[id]            Update product     ║
║  DELETE /api/products/[id]            Delete product     ║
╠══════════════════════════════════════════════════════════╣
║  LEADS                                                   ║
╠══════════════════════════════════════════════════════════╣
║  GET    /api/leads                    List leads         ║
║  POST   /api/leads                    Create lead        ║
║  GET    /api/leads/[id]               Get lead           ║
║  PATCH  /api/leads/[id]               Update lead        ║
║  DELETE /api/leads/[id]               Delete lead        ║
║  POST   /api/leads/upload             CSV bulk import    ║
║  POST   /api/leads/[id]/enrich        Enrich lead        ║
║  GET    /api/leads/find               Discover via search║
╠══════════════════════════════════════════════════════════╣
║  CAMPAIGNS                                               ║
╠══════════════════════════════════════════════════════════╣
║  POST   /api/campaigns                Create campaign    ║
║  GET    /api/campaigns/[id]           Get campaign       ║
║  PATCH  /api/campaigns/[id]           Update workflow    ║
║  DELETE /api/campaigns/[id]           Delete campaign    ║
║  POST   /api/campaigns/[id]/run       Activate campaign  ║
║  GET    /api/campaigns/[id]/leads     List campaign_leads║
║  GET    /api/campaigns/[id]/automation  Get KB context   ║
║  PATCH  /api/campaigns/[id]/automation  Update KB context║
║  GET    /api/campaigns/[id]/analytics   Metrics          ║
║  GET    /api/campaigns/[id]/analytics-dashboard  Dashboard║
║  GET    /api/campaigns/[id]/deliverability  Events       ║
║  POST   /api/campaigns/[id]/preview-email  Email preview ║
╠══════════════════════════════════════════════════════════╣
║  CONVERSATIONS                                           ║
╠══════════════════════════════════════════════════════════╣
║  GET    /api/campaign-leads/[id]/thread   Gmail thread   ║
║  POST   /api/campaign-leads/[id]/compose  AI draft reply ║
║  POST   /api/campaign-leads/[id]/reply    Send reply     ║
╠══════════════════════════════════════════════════════════╣
║  ENGINE & COMPLIANCE                                     ║
╠══════════════════════════════════════════════════════════╣
║  POST   /api/engine/run               Execute due leads  ║
║  GET    /api/compliance/audit         Compliance report  ║
║  GET    /api/unsubscribe/[token]      HMAC unsubscribe   ║
║  POST   /api/warmup/schedule          Warm-up config     ║
╠══════════════════════════════════════════════════════════╣
║  WHATSAPP BRIDGE                                         ║
╠══════════════════════════════════════════════════════════╣
║  GET    /api/whatsapp/status          Session status     ║
║  GET    /api/whatsapp/qr              QR code auth       ║
║  POST   /api/whatsapp/session         Session management ║
║  POST   /api/whatsapp/preview         Preview WA message ║
╚══════════════════════════════════════════════════════════╝
```

---

## 3. WORKFLOW ENGINE — DEEP DIVE

```
ENGINE EXECUTION CYCLE  (lib/engine.ts)
═══════════════════════════════════════════════════════════════════════

  POST /api/engine/run
          │
          ▼
  ┌───────────────────────────────────────────────────────┐
  │  Step 1: Fetch all campaigns WHERE status = 'active'  │
  └────────────────────────┬──────────────────────────────┘
                           │
                           ▼
  ┌───────────────────────────────────────────────────────┐
  │  Step 2: Parse workflow JSON                          │
  │  lib/workflow-engine.ts                               │
  │  → validate node types                               │
  │  → build execution graph                             │
  └────────────────────────┬──────────────────────────────┘
                           │
                           ▼
  ┌───────────────────────────────────────────────────────┐
  │  Step 3: Ensure Gmail label per campaign              │
  │  Label format: {ProductName} - {CampaignName}        │
  └────────────────────────┬──────────────────────────────┘
                           │
                           ▼
  ┌───────────────────────────────────────────────────────┐
  │  Step 4: Enforce send budget                          │
  │  ├── Check warmup_schedules for this account         │
  │  ├── Count emails sent this hour from logs           │
  │  └── If over budget → skip campaign this tick        │
  └────────────────────────┬──────────────────────────────┘
                           │
                           ▼
  ┌───────────────────────────────────────────────────────┐
  │  Step 5: Claim due rows atomically                    │
  │  SELECT * FROM campaign_leads                        │
  │  WHERE status IN ('queued','waiting')                │
  │  AND next_action_time <= NOW()                       │
  │  AND campaign_id = $1                                │
  │  FOR UPDATE SKIP LOCKED                              │
  │  LIMIT {budget_remaining}                            │
  └────────────────────────┬──────────────────────────────┘
                           │
                           ▼
  ┌───────────────────────────────────────────────────────┐
  │  Step 6: Execute node handler per lead                │
  │  (see Node Execution Matrix below)                   │
  └────────────────────────┬──────────────────────────────┘
                           │
                           ▼
  ┌───────────────────────────────────────────────────────┐
  │  Step 7: Persist state                                │
  │  ├── UPDATE campaign_leads SET status, node, time    │
  │  ├── INSERT INTO logs (event_type, metadata)         │
  │  └── INSERT INTO deliverability_events               │
  └────────────────────────┬──────────────────────────────┘
                           │
                           ▼
  ┌───────────────────────────────────────────────────────┐
  │  Step 8: Auto-complete check                          │
  │  IF no active/queued/waiting rows remain             │
  │  → UPDATE campaigns SET status = 'completed'         │
  └───────────────────────────────────────────────────────┘


NODE EXECUTION MATRIX
═══════════════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────────────────────────────────────────────────────────────┐
  │ NODE TYPE        │ FULL EXECUTION LOGIC                                                  │
  ├──────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ start            │ → Initialize lead in workflow                                         │
  │                  │ → Set current_node_id                                                 │
  │                  │ → Outcome: advance to next node                                       │
  ├──────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ research         │ → Exa search: "{name} {company} linkedin news"                        │
  │                  │ → Tavily search: "{company} pain points challenges 2026"              │
  │                  │ → Jina extract: company website if URL available                     │
  │                  │ → Azure OpenAI: synthesize into 150-word research summary            │
  │                  │ → UPDATE leads SET research_result = '...'                           │
  │                  │ → Outcome: advance to next node                                       │
  ├──────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ send_email       │ MODE: personalized                                                    │
  │                  │   → Build prompt from: user_prompt + lead_fields + research_result   │
  │                  │   → Azure OpenAI → JSON { subject, body }                            │
  │                  │   MODE: same_for_all                                                  │
  │                  │   → Use cached version, replace {{name}} {{company}} vars            │
  │                  │ → Pre-send safety check (spam words, frequency)                      │
  │                  │ → Gmail API: send with threadId continuity                           │
  │                  │ → Apply campaign Gmail label                                          │
  │                  │ → UPDATE campaign_leads SET gmail_thread_id                          │
  │                  │ → INSERT deliverability_events (sent)                                │
  │                  │ → Outcome: advance to next node                                       │
  ├──────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ send_whatsapp    │ → Build WA message via Azure OpenAI                                   │
  │                  │ → POST 127.0.0.1:3002/send                                           │
  │                  │ → { phone: lead.phone, message: generated_text }                    │
  │                  │ → UPDATE campaign_leads SET whatsapp_state                           │
  │                  │ → Outcome: advance to next node                                       │
  ├──────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ wait             │ → Read config: duration + unit (minutes/hours/days)                   │
  │                  │ → Calculate: next_action_time = NOW() + duration                     │
  │                  │ → Randomization: if min_duration + max_duration set,                 │
  │                  │     pick random value in range                                        │
  │                  │ → UPDATE campaign_leads SET next_action_time, status='waiting'       │
  │                  │ → Outcome: waiting (engine skips until time reached)                 │
  ├──────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ condition        │ → Evaluate: does gmail_thread_id have a reply?                        │
  │                  │ → OR: does whatsapp_state show a reply?                              │
  │                  │ → Branch: YES path or NO path (both edges required)                  │
  │                  │ → Outcome: yes / no                                                   │
  ├──────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ auto_reply       │ → Read latest reply from Gmail thread                                 │
  │                  │ → Load product knowledge_base from products table                    │
  │                  │ → Azure OpenAI: "Can KB answer this question? Y/N + draft reply"    │
  │                  │ → If YES: send reply via Gmail API                                   │
  │                  │ → Branch: answered / unanswered                                      │
  │                  │ → Outcome: answered / unanswered                                     │
  ├──────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ end              │ → UPDATE campaign_leads SET status = 'completed'                      │
  │                  │ → INSERT logs (campaign_run_lead_completed)                           │
  │                  │ → Outcome: terminal                                                   │
  └──────────────────┴──────────────────────────────────────────────────────────────────────┘


LEAD STATUS LIFECYCLE
═══════════════════════════════════════════════════════════════════════

  queued ──→ active ──→ (workflow executes node-by-node)
                            │
              ┌─────────────┼──────────────┐
              ▼             ▼              ▼
           waiting      completed       failed
              │
              └──→ (delay expires OR reply detected)
                        │
                        ▼
                     queued  (re-enters engine)
```

---

## 4. WORKER PROCESS ARCHITECTURE

```
worker/index.ts
═══════════════════════════════════════════════════════════

  Process Boot
       │
       ├──→ Start WhatsApp Gateway Server (127.0.0.1:3002)
       │         │
       │         ├── GET  /status        → Baileys session status
       │         ├── GET  /qr            → QR code PNG for auth
       │         ├── POST /send          → Send WA message
       │         │     body: { phone, message }
       │         ├── GET  /check-reply   → Poll for new WA replies
       │         └── POST /session       → Reset/manage session
       │
       │         Baileys WebSocket → WhatsApp Web
       │         Auth persistence: ./whatsapp-session/ (multi-file)
       │
       └──→ Start Polling Loop
                 │
                 every 10 seconds:
                 │
                 POST http://localhost:8080/api/engine/run
                 Headers: { Authorization: Bearer WORKER_SECRET }
                 │
                 ▼
                 Engine processes due campaign_leads
```

---

## 5. DATABASE SCHEMA — COMPLETE

```
╔══════════════════════════════════════════════════════════════════════╗
║  TABLE: products                                                     ║
╠══════════════════════════════════════════════════════════════════════╣
║  id                  UUID PRIMARY KEY                                ║
║  name                TEXT NOT NULL                                   ║
║  slug                TEXT UNIQUE                                     ║
║  description         TEXT                                            ║
║  knowledge_base      JSONB  ← used by auto_reply node               ║
║  sender_email        TEXT                                            ║
║  google_drive_folder_id TEXT                                         ║
║  google_sheet_id     TEXT                                            ║
║  created_at          TIMESTAMPTZ DEFAULT NOW()                       ║
╠══════════════════════════════════════════════════════════════════════╣
║  TABLE: leads                                                        ║
╠══════════════════════════════════════════════════════════════════════╣
║  id                  UUID PRIMARY KEY                                ║
║  product_id          UUID REFERENCES products(id)                    ║
║  name                TEXT                                            ║
║  email               TEXT NOT NULL                                   ║
║  company             TEXT                                            ║
║  title               TEXT                                            ║
║  industry            TEXT                                            ║
║  phone               TEXT  ← for WhatsApp                           ║
║  tags                TEXT[]                                          ║
║  custom_fields       JSONB                                           ║
║  enrichment_data     JSONB  ← Exa + Jina output                     ║
║  research_result     TEXT   ← research node output                  ║
║  last_contacted_at   TIMESTAMPTZ                                     ║
║  created_at          TIMESTAMPTZ DEFAULT NOW()                       ║
║  UNIQUE(product_id, email)                                           ║
╠══════════════════════════════════════════════════════════════════════╣
║  TABLE: campaigns                                                    ║
╠══════════════════════════════════════════════════════════════════════╣
║  id                  UUID PRIMARY KEY                                ║
║  product_id          UUID REFERENCES products(id)                    ║
║  name                TEXT NOT NULL                                   ║
║  status              TEXT  (draft|active|paused|completed)           ║
║  workflow_json       JSONB  ← full React Flow graph                  ║
║  automation_context  JSONB  ← KB + persona context                  ║
║  rate_limit          INT    ← emails per hour cap                   ║
║  gmail_label_id      TEXT                                            ║
║  gmail_label_name    TEXT                                            ║
║  created_at          TIMESTAMPTZ DEFAULT NOW()                       ║
║  updated_at          TIMESTAMPTZ DEFAULT NOW()                       ║
╠══════════════════════════════════════════════════════════════════════╣
║  TABLE: campaign_leads  (execution state per lead per campaign)      ║
╠══════════════════════════════════════════════════════════════════════╣
║  id                  UUID PRIMARY KEY                                ║
║  campaign_id         UUID REFERENCES campaigns(id)                   ║
║  lead_id             UUID REFERENCES leads(id)                       ║
║  status              TEXT  queued|active|waiting|completed|failed    ║
║  current_node_id     TEXT  ← which node lead is at                  ║
║  next_action_time    TIMESTAMPTZ                                     ║
║  gmail_thread_id     TEXT                                            ║
║  last_gmail_msg_id   TEXT                                            ║
║  whatsapp_state      JSONB                                           ║
║  attempt_count       INT DEFAULT 0                                   ║
║  last_error          TEXT                                            ║
║  created_at          TIMESTAMPTZ DEFAULT NOW()                       ║
║  updated_at          TIMESTAMPTZ DEFAULT NOW()                       ║
║  UNIQUE(campaign_id, lead_id)                                        ║
╠══════════════════════════════════════════════════════════════════════╣
║  TABLE: logs                                                         ║
╠══════════════════════════════════════════════════════════════════════╣
║  id                  UUID PRIMARY KEY                                ║
║  campaign_id         UUID                                            ║
║  campaign_lead_id    UUID                                            ║
║  node_id             TEXT                                            ║
║  event_type          TEXT  (message_sent|reply_detected|error|...)   ║
║  status              TEXT  (success|failed|skipped)                  ║
║  metadata            JSONB  ← subject, body, error detail           ║
║  created_at          TIMESTAMPTZ DEFAULT NOW()                       ║
╠══════════════════════════════════════════════════════════════════════╣
║  TABLE: suppression_list                                             ║
╠══════════════════════════════════════════════════════════════════════╣
║  id, email, reason (bounce|complaint|manual), created_at            ║
╠══════════════════════════════════════════════════════════════════════╣
║  TABLE: unsubscribes                                                 ║
╠══════════════════════════════════════════════════════════════════════╣
║  id, email, token (HMAC), campaign_lead_id, created_at              ║
╠══════════════════════════════════════════════════════════════════════╣
║  TABLE: warmup_schedules                                             ║
╠══════════════════════════════════════════════════════════════════════╣
║  id, product_id, sender_email                                        ║
║  day_1_limit, day_2_limit, ... day_N_limit                           ║
║  current_day, is_active, created_at                                  ║
╠══════════════════════════════════════════════════════════════════════╣
║  TABLE: deliverability_events                                        ║
╠══════════════════════════════════════════════════════════════════════╣
║  id, campaign_lead_id, event_type (sent|open|bounce|spam|click)      ║
║  provider_message_id, metadata JSONB, created_at                    ║
╚══════════════════════════════════════════════════════════════════════╝

KEY INDEXES:
  idx_campaign_leads_due    (status, next_action_time)  ← engine claiming
  idx_leads_product         (product_id)
  idx_campaigns_product     (product_id, status)
  idx_logs_campaign         (campaign_id, created_at DESC)
  idx_deliverability        (campaign_lead_id, event_type)

MIGRATIONS HISTORY:
  001_initial_schema.sql
  002_drop_leads_contacted.sql
  003_campaign_lead_thread_fields.sql
  004_remove_paused_campaign_status.sql
  005_lead_enrichment.sql
  006_campaign_rate_limit.sql
  007_lead_custom_fields.sql
  008_compliance.sql
  009_deliverability.sql
  010_automation_context.sql
  011_research_result.sql
  012_pending_review_status.sql
  013_whatsapp_fields.sql
```

---

## 6. AI & RESEARCH INTEGRATIONS

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    AI & RESEARCH LAYER                                   ║
╠══════════════════╦════════════════════════════════════════════════════════╣
║  Azure OpenAI    ║  USED IN                                               ║
╠══════════════════╬════════════════════════════════════════════════════════╣
║  Model:          ║  send_email node                                       ║
║  gpt-5.3-chat    ║  → prompt: user_prompt + lead fields + research_result ║
║                  ║  → output: { subject: string, body: string }           ║
║  Deployment      ╠════════════════════════════════════════════════════════╣
║  via Azure       ║  auto_reply node                                       ║
║  OpenAI          ║  → prompt: KB + latest reply from thread               ║
║  endpoint        ║  → output: { can_answer: bool, reply_text: string }    ║
║                  ╠════════════════════════════════════════════════════════╣
║                  ║  send_whatsapp node                                    ║
║                  ║  → prompt: WA-optimized copy for lead                  ║
║                  ╠════════════════════════════════════════════════════════╣
║                  ║  /api/leads/[id]/enrich                                ║
║                  ║  → synthesize Exa + Jina data into enrichment_data     ║
║                  ╠════════════════════════════════════════════════════════╣
║                  ║  research node                                         ║
║                  ║  → synthesize Exa + Tavily into research_result        ║
╠══════════════════╬════════════════════════════════════════════════════════╣
║  Exa API         ║  /api/leads/[id]/enrich                                ║
║                  ║  → search: "{name} {company} linkedin"                 ║
║                  ║  → returns: profile snippets, social data              ║
║                  ╠════════════════════════════════════════════════════════╣
║                  ║  research node                                         ║
║                  ║  → search: "{company} recent news funding"             ║
╠══════════════════╬════════════════════════════════════════════════════════╣
║  Tavily API      ║  /api/leads/find                                       ║
║                  ║  → lead discovery from web search                      ║
║                  ╠════════════════════════════════════════════════════════╣
║                  ║  research node                                         ║
║                  ║  → search: "{company} pain points challenges 2026"     ║
╠══════════════════╬════════════════════════════════════════════════════════╣
║  Jina Reader     ║  /api/leads/[id]/enrich                                ║
║                  ║  → extract text from company website URL               ║
║                  ║  → proxy: https://r.jina.ai/{url}                      ║
╚══════════════════╩════════════════════════════════════════════════════════╝
```

---

## 7. GMAIL INTEGRATION FLOW

```
OAuth Setup (one-time per product):
  User → Google OAuth2 → callback → store tokens in DB

Email Send Flow (send_email node):
  ┌─────────────────────────────────────────────────────────────┐
  │  1. Load stored OAuth tokens for product sender_email       │
  │  2. Refresh token if expired                                │
  │  3. Build MIME message:                                     │
  │     ├── To: lead.email                                      │
  │     ├── From: product.sender_email                          │
  │     ├── Subject: AI-generated subject                       │
  │     ├── Body: AI-generated HTML body                        │
  │     ├── In-Reply-To: previous_message_id (thread continuity)│
  │     ├── References: thread_references                       │
  │     └── X-Unsubscribe-Link: /api/unsubscribe/{HMAC_token}  │
  │  4. Gmail API: messages.send({ threadId })                  │
  │  5. Store: threadId, messageId in campaign_leads            │
  │  6. Apply label: gmail.users.messages.modify                │
  └─────────────────────────────────────────────────────────────┘

Reply Detection (condition node):
  ┌─────────────────────────────────────────────────────────────┐
  │  1. Load gmail_thread_id from campaign_leads                │
  │  2. Gmail API: threads.get({ id: threadId })                │
  │  3. Count messages in thread                                │
  │  4. If count > sent_count → reply detected                  │
  │  5. Store: last_gmail_msg_id, reply_detected_at             │
  └─────────────────────────────────────────────────────────────┘

Inbox Thread View (/api/campaign-leads/[id]/thread):
  → Gmail API: threads.get → parse message parts → return structured thread
  → Frontend renders full conversation chronologically
```

---

## 8. WHATSAPP INTEGRATION FLOW

```
Session Setup (one-time):
  User → /api/whatsapp/qr → GET 127.0.0.1:3002/qr
       → QR PNG rendered in UI
       → User scans with WhatsApp phone
       → Baileys saves session to ./whatsapp-session/

Message Send Flow (send_whatsapp node):
  ┌─────────────────────────────────────────────────────────────┐
  │  1. Engine calls internal gateway:                          │
  │     POST 127.0.0.1:3002/send                               │
  │     { phone: "+91XXXXXXXXXX", message: "generated text" }  │
  │  2. Baileys: sock.sendMessage(jid, { text: message })       │
  │  3. Store WA message ID in campaign_leads.whatsapp_state    │
  └─────────────────────────────────────────────────────────────┘

Reply Check (condition node with WA):
  → GET 127.0.0.1:3002/check-reply?phone=+91XXX
  → Baileys message event buffer checked
  → Returns { replied: bool, message: string }
```

---

## 9. COMPLIANCE & DELIVERABILITY SYSTEM

```
┌──────────────────────────────────────────────────────────────────┐
│                  COMPLIANCE LAYER                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  UNSUBSCRIBE SYSTEM                                              │
│  ├── Every email footer contains unsubscribe link               │
│  ├── Link format: /api/unsubscribe/{HMAC_TOKEN}                  │
│  ├── HMAC generated from: email + campaign_id + secret          │
│  ├── On click: verify HMAC → add to suppression_list            │
│  └── campaign_lead forced to 'completed'                         │
│                                                                  │
│  SUPPRESSION LIST                                                │
│  ├── Checked before every send_email node execution             │
│  ├── Sources: unsubscribes, bounces, spam complaints            │
│  └── If suppressed → skip lead, mark completed                  │
│                                                                  │
│  WARM-UP SYSTEM                                                  │
│  ├── warmup_schedules table: per-sender ramp-up config          │
│  ├── Day 1: N emails max, Day 2: N+X, ...                       │
│  ├── Engine checks warmup overlay before claiming leads          │
│  └── Prevents new domain/inbox from sending at full volume       │
│                                                                  │
│  PER-HOUR SEND BUDGET                                            │
│  ├── campaigns.rate_limit = max emails per hour                 │
│  ├── Engine counts logs for this campaign in last 60 min        │
│  └── Stops claiming leads when budget hit                        │
│                                                                  │
│  DELIVERABILITY EVENTS                                           │
│  ├── sent, open (pixel), click, bounce, spam_complaint          │
│  └── Stored in deliverability_events, shown in analytics tab    │
│                                                                  │
│  COMPLIANCE AUDIT                                                │
│  └── GET /api/compliance/audit → full report on:                │
│       suppression list size, unsubscribe rate, bounce rate      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 10. SECURITY ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYER                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AUTH: Clerk                                                     │
│  ├── Middleware protects: /dashboard, /{productId}/*            │
│  ├── API routes: auth() helper from @clerk/nextjs               │
│  └── User identity available in all route handlers              │
│                                                                  │
│  WORKER AUTHENTICATION                                           │
│  ├── /api/engine/run requires Bearer token                      │
│  └── WORKER_SECRET env var — worker sends in Authorization hdr  │
│                                                                  │
│  UNSUBSCRIBE TOKEN SECURITY                                      │
│  └── HMAC-SHA256 signature on (email + campaign_id)             │
│       prevents forged unsubscribe attempts                       │
│                                                                  │
│  SUPABASE ACCESS                                                 │
│  ├── SUPABASE_SERVICE_ROLE_KEY used server-side only            │
│  ├── Never exposed to client                                     │
│  └── ⚠ Row-level security bypassed — add post-hackathon         │
│                                                                  │
│  KNOWN RISKS (Post-Hackathon To-Fix)                             │
│  ├── No per-user ownership check on productId/campaignId params │
│  ├── Service role key bypasses RLS                              │
│  └── Need idempotency keys on email sends                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 11. DEPLOYMENT ARCHITECTURE

```
PRODUCTION TOPOLOGY
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────┐
  │  Service A: Next.js Container    │
  │                                  │
  │  Dockerfile (multi-stage):       │
  │    Stage 1: deps                 │
  │      pnpm install --frozen       │
  │    Stage 2: builder              │
  │      pnpm build                  │
  │    Stage 3: runner               │
  │      next start                  │
  │                                  │
  │  Next output: standalone         │
  │  Port: 0.0.0.0:8080              │
  │  Env: all API keys + DB URL      │
  └──────────────────────────────────┘

  ┌──────────────────────────────────┐
  │  Service B: Worker Container     │
  │                                  │
  │  Command: pnpm worker            │
  │  Runs: worker/index.ts           │
  │  Exposes: 127.0.0.1:3002 (WA)   │
  │  Volume: ./whatsapp-session/     │
  │  Env: WORKER_SECRET + APP_URL    │
  └──────────────────────────────────┘

  ┌──────────────────────────────────┐
  │  Shared: Supabase Postgres       │
  │  (Managed cloud DB)              │
  │  Migrations: 001 → 013           │
  └──────────────────────────────────┘
```

---

## 12. COMPLETE END-TO-END FLOW

```
FULL LIFECYCLE: Lead Upload → Research → Email → Reply → End
══════════════════════════════════════════════════════════════════════

  1. USER UPLOADS CSV
     POST /api/leads/upload
     → papaparse: parse CSV rows
     → validate: email required, deduplicate
     → INSERT INTO leads (batch)
     → Return: { imported: N, failed: M }

  2. USER CREATES CAMPAIGN + WORKFLOW
     POST /api/campaigns  (name + product_id)
     User drags nodes on React Flow canvas:
       [Start] → [Research] → [Send Email] → [Wait 2d] → [Condition]
                                                              ↓ YES → [End]
                                                              ↓ NO  → [Send Email] → [End]
     PATCH /api/campaigns/[id]  (save workflow_json)

  3. USER RUNS CAMPAIGN
     POST /api/campaigns/[id]/run
     → Validate workflow JSON
     → INSERT campaign_leads for selected leads (status: queued)
     → UPDATE campaigns SET status = 'active'
     → Immediate engine tick

  4. ENGINE TICK (every 10s via worker)
     Worker → POST /api/engine/run
     Engine claims due campaign_leads:

     For each lead at node 'research':
     ├── Exa: search company news
     ├── Tavily: search pain points
     ├── Jina: extract company website
     ├── Azure OpenAI: synthesize research_result
     └── UPDATE leads SET research_result, advance to send_email

     For each lead at node 'send_email':
     ├── Load research_result from leads table
     ├── Build personalized prompt with research context
     ├── Azure OpenAI → { subject, body }
     ├── Check suppression_list → skip if suppressed
     ├── Check warmup + rate limit budgets
     ├── Gmail API → send message
     ├── Store threadId in campaign_leads
     └── Advance to wait node

     For each lead at node 'wait':
     ├── Calculate: next_action_time = NOW() + random(min, max)
     └── Set status = 'waiting'

     (2 days later, engine picks it up again)

     For each lead at node 'condition':
     ├── Gmail API: check thread for new messages
     ├── Replied? → YES path → advance to End
     └── Not replied? → NO path → advance to Send Email #2

  5. MANUAL INBOX REPLY
     User opens Inbox tab → selects lead
     GET /api/campaign-leads/[id]/thread → full Gmail thread
     User clicks "AI-Assisted" →
     POST /api/campaign-leads/[id]/compose → AI draft
     User edits + sends →
     POST /api/campaign-leads/[id]/reply → Gmail send

  6. UNSUBSCRIBE
     Lead clicks footer link →
     GET /api/unsubscribe/{HMAC_TOKEN}
     → Verify HMAC
     → INSERT suppression_list
     → INSERT unsubscribes
     → UPDATE campaign_leads SET status = 'completed'

  7. CAMPAIGN COMPLETES
     Engine tick finds 0 active/queued/waiting rows →
     UPDATE campaigns SET status = 'completed'
     Analytics tab shows final metrics
```

---

## 13. KEY FILES QUICK REFERENCE

```
lib/
  engine.ts               ← CORE: orchestration loop, node dispatch
  workflow-engine.ts      ← Workflow JSON parser, graph traversal
  gmail.ts                ← Gmail OAuth send/receive, label management
  openai.ts               ← Azure OpenAI email/WA/reply generation
  enrichment.ts           ← Exa + Jina lead enrichment (manual)
  compliance.ts           ← Suppression checks, unsubscribe footer
  deliverability.ts       ← Daily limits, warmup schedule, bounce classify
  lead-finder.ts          ← Tavily-powered lead discovery
  templates.ts            ← Knowledge base / template management

worker/
  index.ts                ← Polling scheduler (10s tick)
  whatsapp-gateway.ts     ← Baileys HTTP gateway server

app/api/
  engine/run/route.ts     ← Engine trigger endpoint
  leads/upload/route.ts   ← CSV import
  leads/[id]/enrich/      ← Exa + Jina + Azure enrichment
  campaigns/[id]/run/     ← Campaign activation
  unsubscribe/[token]/    ← HMAC unsubscribe handler
  whatsapp/*/             ← WA bridge endpoints

app/[productId]/
  campaigns/[id]/page.tsx ← Builder + all tabs shell
  leads/page.tsx          ← Lead management

components/campaign/      ← All campaign UI (builder, inbox, analytics)
components/workflow/      ← React Flow node palette + node cards
stores/workflow-store.ts  ← Zustand workflow graph state
types/index.ts            ← All shared TypeScript types

supabase/migrations/
  001 → 013              ← Full schema history

Dockerfile               ← Multi-stage: deps → builder → runner
middleware.ts            ← Clerk auth route protection
```
