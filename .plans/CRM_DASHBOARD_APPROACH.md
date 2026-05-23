# NeuralNexus — CRM Dashboard Analytics: Full Build Approach

> **Created:** March 7, 2026  
> **Scope:** Frontend analytics page rebuild + backend API/schema additions for 9 features  
> **Current State:** Analytics page is a single flat stats-grid component. Backend is ~11% ready.

---

## Problem Statement

The current analytics page (`/[productId]/campaigns/[campaignId]/analytics`) renders 8 stat cards (total leads, emails sent, follow-ups, replies, reply rate, completed, in progress, failed) via a single `AnalyticsPanel` component. There is no drill-down, no charts, no AI insights, no real-time behavior — just flat counters from one API call.

We need a full CRM-style dashboard with 9 intelligent modules, each requiring both frontend components and backend infrastructure.

---

## Architecture Decision: Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Campaign Analytics Dashboard                    [Campaign Selector]│
├──────────────────────┬──────────────────────────────────────────────┤
│                      │                                              │
│  COMMAND CENTER      │   MAIN PANEL (tabbed/routed)                 │
│  ─────────────────   │   ───────────────────────────                │
│  Health Score  📊    │   Tab content renders:                       │
│  ──────────────      │                                              │
│  72 / 100            │   • Health → Score breakdown + AI insights   │
│  ▓▓▓▓▓▓▓░░░         │   • Signals → Timeline + engagement feed     │
│                      │   • Ghosts → Lead list + re-engage actions   │
│  Quick Stats         │   • Objections → Predicted objections grid   │
│  ──────────────      │   • ROI → Simulator + forecast charts        │
│  📧 142 sent         │   • Optimize → A/B variants + winner cards   │
│  💬 23 replies       │   • Compliance → Audit trail + rate status   │
│  👻 8 ghosts         │   • Deliverability → Domain health + ISP     │
│  ✅ 96% compliant    │   • Behavior → Visitor timeline (future)     │
│                      │                                              │
│  Alerts              │                                              │
│  ──────────────      │                                              │
│  ⚠️ 3 objections     │                                              │
│  🔥 5 warm leads     │                                              │
│                      │                                              │
├──────────────────────┴──────────────────────────────────────────────┤
│  BOTTOM BAR: Compliance status • Rate limit budget • Send velocity  │
└─────────────────────────────────────────────────────────────────────┘
```

**Component tree:**
```
analytics/page.tsx
├── DashboardShell (layout wrapper)
│   ├── CommandCenter (left sidebar)
│   │   ├── HealthScoreWidget (mini)
│   │   ├── QuickStats
│   │   └── AlertsFeed
│   ├── MainPanel (right, tabbed)
│   │   ├── HealthTab
│   │   ├── WarmSignalsTab
│   │   ├── GhostDetectorTab
│   │   ├── ObjectionTab
│   │   ├── ROISimulatorTab
│   │   ├── SelfOptimizeTab
│   │   ├── ComplianceTab
│   │   ├── DeliverabilityTab
│   │   └── BehaviorTab (placeholder)
│   └── BottomBar (compliance/rate status)
```

---

## Implementation Phases

We split this into 4 phases. Each phase delivers a working increment — no phase depends on external services that don't already exist (Gmail, OpenAI, Supabase are already integrated).

---

## PHASE 1 — Foundation + Compliance + Deliverability (Backend ~30-40% exists)

**Why first:** These have the most existing backend code. Compliance is a legal requirement before scaling. Deliverability protects sender reputation.

### 1A. Database Migrations

**Migration 008: Compliance tables**
```sql
-- Suppression list (global do-not-email)
CREATE TABLE suppression_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL, -- 'unsubscribe' | 'bounce_hard' | 'complaint' | 'manual'
  source TEXT,          -- which campaign/system added it
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bounce tracking
ALTER TABLE logs ADD COLUMN bounce_type TEXT; -- 'hard' | 'soft' | null

-- Unsubscribe token per campaign_lead
ALTER TABLE campaign_leads ADD COLUMN unsubscribe_token UUID DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX idx_cl_unsub_token ON campaign_leads(unsubscribe_token);
```

**Migration 009: Deliverability tables**
```sql
-- Warmup schedule per campaign
CREATE TABLE warmup_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  day_number INT NOT NULL,          -- day 1, 2, 3...
  max_emails INT NOT NULL,          -- allowed volume for that day
  actual_sent INT DEFAULT 0,
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily deliverability snapshot
CREATE TABLE deliverability_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  emails_sent INT DEFAULT 0,
  bounces_hard INT DEFAULT 0,
  bounces_soft INT DEFAULT 0,
  complaints INT DEFAULT 0,
  replies INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, date)
);
```

### 1B. Backend API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/unsubscribe/[token]` | GET | Render unsubscribe confirmation page |
| `/api/unsubscribe/[token]` | POST | Process unsubscribe → add to suppression list |
| `/api/compliance/audit` | GET | Return compliance metrics for a campaign (bounce rate, unsub rate, suppression count) |
| `/api/campaigns/[id]/deliverability` | GET | Return daily deliverability metrics + warmup status |
| `/api/warmup/schedule` | POST | Create/update warmup schedule for a campaign |

### 1C. Engine Changes

- **`lib/gmail.ts` → `sendEmail()`**: Inject `List-Unsubscribe` header + unsubscribe link footer into every email
- **`lib/engine.ts`**: Before sending, check `suppression_list` for recipient email. Skip if suppressed.
- **`lib/engine.ts`**: After send, update `deliverability_metrics` daily aggregates
- **`lib/engine.ts`**: If warmup schedule exists, use `warmup_schedules.max_emails` instead of flat rate limit

### 1D. Frontend Components

```
components/analytics/
├── compliance-tab.tsx      — Audit trail table, bounce/unsub rates, suppression list viewer
├── deliverability-tab.tsx  — Daily send volume chart, bounce rate trend, warmup progress bar
└── bottom-bar.tsx          — Rate limit budget remaining, compliance score badge
```

**Data hooks:**
```
hooks/
├── use-compliance.ts       — fetches /api/compliance/audit
└── use-deliverability.ts   — fetches /api/campaigns/[id]/deliverability
```

---

## PHASE 2 — Health Score + Warm Signals (Backend ~0-20% exists)

**Why second:** Health Score is the central nervous system — Ghost Detector, ROI Simulator, and Self-Optimizing all depend on engagement data.

### 2A. Database Migrations

**Migration 010: Engagement tracking**
```sql
-- Engagement events (opens, clicks, replies mapped to leads)
CREATE TABLE engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_lead_id UUID REFERENCES campaign_leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,  -- 'open' | 'click' | 'reply' | 'bounce'
  metadata JSONB,            -- { url, user_agent, ip_hash, etc. }
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ee_cl ON engagement_events(campaign_lead_id);
CREATE INDEX idx_ee_type ON engagement_events(event_type, created_at);

-- Tracking tokens (maps pixel/link hits back to campaign_leads)
CREATE TABLE tracking_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_lead_id UUID REFERENCES campaign_leads(id) ON DELETE CASCADE,
  token_type TEXT NOT NULL,  -- 'open' | 'click'
  target_url TEXT,           -- original URL for click tracking
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Migration 011: Health scores**
```sql
CREATE TABLE lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_lead_id UUID REFERENCES campaign_leads(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  factors JSONB NOT NULL,    -- { reply: 40, opens: 20, recency: 15, enrichment: 10, followups: 15 }
  ai_insight TEXT,           -- one-liner from GPT: "Lead engaged after 2nd follow-up, showing pricing interest"
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ls_cl ON lead_scores(campaign_lead_id);
```

### 2B. Backend API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/track/open/[token]` | GET | 1x1 pixel endpoint. Logs open event, returns transparent GIF |
| `/api/track/click/[token]` | GET | Logs click event, 302 redirects to original URL |
| `/api/campaigns/[id]/signals` | GET | Return engagement event feed for campaign (paginated) |
| `/api/campaigns/[id]/health-overview` | GET | Return aggregated health scores + AI insights for all leads |
| `/api/leads/[id]/health-score` | GET | Return individual lead health score + breakdown |

### 2C. Scoring Algorithm (new file: `lib/health-score.ts`)

```
Scoring Formula (0–100):
┌──────────────────────────────┬────────┐
│ Factor                       │ Weight │
├──────────────────────────────┼────────┤
│ Reply received               │ 40 pts │
│ Email opens (1+ = 10, 3+ = 20)│ 20 pts │
│ Click-throughs (any = 15)    │ 15 pts │
│ Recency (last action < 48h)  │ 10 pts │
│ Enrichment completeness      │ 10 pts │
│ Follow-up depth (2+ = 5)     │  5 pts │
└──────────────────────────────┴────────┘
```

**AI Insight generation:**
- After scoring, if score changed by ≥10 points from last calc, call OpenAI with lead context + score factors
- Prompt: "Given this lead's engagement pattern: {factors}. Generate a 1-sentence insight for the sales rep."
- Store in `lead_scores.ai_insight`

### 2D. Engine Changes

- **`lib/gmail.ts` → `sendEmail()`**: Inject tracking pixel `<img src="/api/track/open/{token}">` before `</body>`
- **`lib/gmail.ts` → `sendEmail()`**: Rewrite links through `/api/track/click/{token}?url=ORIGINAL`
- **`lib/engine.ts`**: After each workflow tick, recalculate health score for processed leads
- **New**: Generate tracking tokens when sending emails, store in `tracking_tokens` table

### 2E. Frontend Components

```
components/analytics/
├── health-tab.tsx          — Score distribution histogram, top/bottom leads table, AI insight cards
├── health-score-widget.tsx — Mini score display for command center sidebar
├── warm-signals-tab.tsx    — Real-time engagement feed (opens, clicks, replies), timeline view
└── signal-badge.tsx        — Inline badge showing warm/cold/hot status
```

**Key UI patterns:**
- Health tab: Score gauge (0-100) with color gradient, factor breakdown bar chart, AI insight callout
- Warm signals: Reverse-chronological feed with icons per event type, auto-refresh every 30s
- Score distribution: Histogram showing how many leads fall in 0-25, 25-50, 50-75, 75-100 buckets

---

## PHASE 3 — Ghost Detector + Objection Preloader + Self-Optimizing (Backend ~0-10% exists)

**Why third:** These are AI-heavy features that build on Phase 2's engagement data + scoring infrastructure.

### 3A. Database Migrations

**Migration 012: Ghost detection + Objections + A/B**
```sql
-- Ghost status tracking
ALTER TABLE campaign_leads ADD COLUMN ghost_status TEXT; -- null | 'at_risk' | 'ghost' | 're_engaged'
ALTER TABLE campaign_leads ADD COLUMN last_engagement_at TIMESTAMPTZ;

-- Objection library
CREATE TABLE objection_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  category TEXT NOT NULL,       -- 'pricing' | 'timing' | 'competitor' | 'authority' | 'need' | 'trust'
  trigger_pattern TEXT,         -- regex or keyword pattern that matches in replies
  response_template TEXT,       -- AI-generated suggested response
  times_used INT DEFAULT 0,
  success_rate DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predicted objections per lead
CREATE TABLE lead_objections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_lead_id UUID REFERENCES campaign_leads(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  confidence DECIMAL NOT NULL,  -- 0.0 to 1.0
  reasoning TEXT,               -- why AI predicted this
  suggested_response TEXT,
  predicted_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B test variants
CREATE TABLE ab_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,        -- which workflow send_email node
  variant_label TEXT NOT NULL,  -- 'A', 'B', 'C'
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  assigned_count INT DEFAULT 0,
  open_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, node_id, variant_label)
);

-- Track which variant each lead received
ALTER TABLE campaign_leads ADD COLUMN ab_variant_id UUID REFERENCES ab_variants(id);
```

### 3B. Backend API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/campaigns/[id]/ghosts` | GET | Return ghost/at-risk leads with last engagement timestamps |
| `/api/campaigns/[id]/re-engage` | POST | Trigger re-enrichment + new outreach for selected ghost leads |
| `/api/leads/[id]/objections` | GET | Return predicted objections for a lead |
| `/api/campaign-leads/[id]/suggest-reply` | POST | AI-generate reply suggestion given detected objection |
| `/api/campaigns/[id]/ab-test` | POST | Create A/B variants for a send_email node |
| `/api/campaigns/[id]/variants` | GET | Return variant performance metrics |
| `/api/campaigns/[id]/promote-winner` | POST | Lock winning variant, reassign remaining leads |

### 3C. New Library Files

**`lib/ghost-detector.ts`**
```
Ghost Classification:
- "at_risk": No engagement in 72+ hours after last outreach, workflow not complete
- "ghost": Workflow completed, replied=false, 0 opens in last 7 days
- "re_engaged": Was ghost, but new engagement detected after re-engagement campaign

Detection runs: After each engine tick + on-demand via API
Re-engagement: Re-enrich lead (fresh news/data), generate new AI email with fresh context
```

**`lib/objection-engine.ts`**
```
Prediction Flow:
1. Analyze lead profile (industry, company size, enrichment data)
2. Cross-reference with objection_templates for this product
3. Score likelihood per category using OpenAI
4. Store top 3 predicted objections with confidence scores

Reply Analysis Flow:
1. When reply detected, classify reply content against objection categories
2. Match to best objection_template
3. Generate contextual response suggestion via OpenAI
4. Surface in inbox panel as suggested reply
```

**`lib/ab-testing.ts`**
```
A/B Test Flow:
1. Campaign author creates 2-3 variants for a send_email node
2. Engine randomly assigns leads to variants (even distribution)
3. Track opens/clicks/replies per variant via engagement_events
4. After N sends (configurable, default 50 per variant), calculate winner
5. Statistical significance: chi-squared test on reply rates
6. Auto-promote winner or surface recommendation in dashboard
```

### 3D. Engine Changes

- **`lib/engine.ts` → `processCampaignLead()`**: 
  - If A/B variants exist for current send_email node, select variant instead of generating new
  - After workflow completes, run ghost classification
  - Update `last_engagement_at` on any engagement event
- **`lib/engine.ts`**: Add post-reply hook that triggers objection classification

### 3E. Frontend Components

```
components/analytics/
├── ghost-detector-tab.tsx    — Ghost/at-risk lead table, re-engage button, decay timeline
├── objection-tab.tsx         — Predicted objections grid, confidence bars, response previews
├── self-optimize-tab.tsx     — Variant cards with metrics, winner badge, significance indicator
├── suggest-reply-modal.tsx   — AI reply suggestion overlay for inbox panel
└── ab-variant-creator.tsx    — Modal to create/edit A/B variants per workflow node
```

**Key UI patterns:**
- Ghost detector: Lead cards with "days silent" counter, traffic-light status (green/yellow/red), batch re-engage action
- Objections: Category cards (Pricing 🏷️, Timing ⏰, etc.) with confidence %, expandable response preview
- A/B testing: Side-by-side variant cards showing open rate, reply rate, with "promote" button when significance reached

---

## PHASE 4 — ROI Simulator + Behavior Crystal (Backend 0% exists)

**Why last:** ROI needs historical data from Phase 1-3 to be meaningful. Behavior Crystal is a separate subsystem.

### 4A. Database Migrations

**Migration 013: ROI + Behavior**
```sql
-- Campaign benchmarks (aggregated historical performance)
CREATE TABLE campaign_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  industry TEXT,
  avg_open_rate DECIMAL,
  avg_reply_rate DECIMAL,
  avg_conversion_rate DECIMAL,
  avg_time_to_reply_hours DECIMAL,
  sample_size INT,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simulation runs (saved predictions)
CREATE TABLE simulation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  parameters JSONB NOT NULL,     -- { lead_count, rate_limit, workflow_steps, industry_mix }
  predictions JSONB NOT NULL,    -- { predicted_opens, predicted_replies, predicted_conversions, confidence }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Website behavior events (for Behavior Crystal)
CREATE TABLE visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_token TEXT NOT NULL,   -- anonymous cookie/fingerprint
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,  -- null until identified
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE page_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES visitor_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,      -- 'pageview' | 'scroll' | 'click' | 'form_start'
  page_url TEXT NOT NULL,
  metadata JSONB,                -- { scroll_depth, time_on_page, referrer }
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pe_session ON page_events(session_id);
```

### 4B. Backend API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/campaigns/[id]/simulate` | POST | Run ROI simulation with given parameters |
| `/api/benchmarks` | GET | Return historical benchmarks by product/industry |
| `/api/track/pageview` | POST | Ingest page view event from tracking script |
| `/api/leads/[id]/behavior` | GET | Return behavior timeline for an identified lead |
| `/api/visitors/identify` | POST | Link anonymous visitor_token to lead_id |

### 4C. New Library Files

**`lib/roi-simulator.ts`**
```
Simulation Flow:
1. Accept parameters: { leadCount, rateLimit, workflowSteps, industryMix }
2. Pull campaign_benchmarks for matching product/industry
3. Apply bayesian model:
   - Base rate = historical avg_reply_rate for industry
   - Adjust for: enrichment completeness, workflow complexity, rate limit impact
   - Monte Carlo: run 1000 simulations with variance
4. Return: {
     predictedOpens: { low, mid, high },
     predictedReplies: { low, mid, high },
     predictedConversions: { low, mid, high },
     confidence: 0.0-1.0,
     recommendations: string[]  // AI-generated suggestions
   }
```

**`lib/behavior-tracker.ts`** (backend receiver only — Chrome extension is separate)
```
Event Processing:
1. Receive pageview/click/scroll events from tracking script
2. Upsert visitor_session (create or update last_seen)
3. Store page_event with metadata
4. If visitor identified (email match), link to lead_id
5. Calculate behavior score: frequency × recency × depth
```

### 4D. Frontend Components

```
components/analytics/
├── roi-simulator-tab.tsx     — Parameter sliders, prediction gauges, confidence bands, recommendation cards
├── behavior-tab.tsx          — Visitor timeline, page flow diagram, behavior score (placeholder until extension built)
└── benchmark-chart.tsx       — Industry comparison bar chart
```

### 4E. Chrome Extension (Separate Repo — Out of Scope)

The Behavior Crystal Chrome extension is a separate project. The backend API endpoints (`/api/track/pageview`, `/api/visitors/identify`) should be built in Phase 4 so the extension can integrate when ready. The frontend tab will show a "Connect Extension" placeholder until the extension exists.

---

## Frontend Architecture Details

### New File Structure

```
components/analytics/
├── dashboard-shell.tsx         — Main layout: sidebar + tabs + bottom bar
├── command-center.tsx          — Left sidebar: health widget, quick stats, alerts
├── bottom-bar.tsx              — Compliance score, rate budget, velocity
├── health-tab.tsx              — Phase 2
├── health-score-widget.tsx     — Phase 2 (sidebar mini)
├── warm-signals-tab.tsx        — Phase 2
├── ghost-detector-tab.tsx      — Phase 3
├── objection-tab.tsx           — Phase 3
├── roi-simulator-tab.tsx       — Phase 4
├── self-optimize-tab.tsx       — Phase 3
├── compliance-tab.tsx          — Phase 1
├── deliverability-tab.tsx      — Phase 1
├── behavior-tab.tsx            — Phase 4 (placeholder)
├── signal-badge.tsx            — Reusable warm/cold badge
├── score-gauge.tsx             — Reusable 0-100 circular gauge
├── suggest-reply-modal.tsx     — Phase 3 (used from inbox panel)
├── ab-variant-creator.tsx      — Phase 3
└── benchmark-chart.tsx         — Phase 4

hooks/
├── use-campaign-analytics.ts   — Master hook: fetches all analytics data
├── use-health-scores.ts        — Phase 2
├── use-engagement-events.ts    — Phase 2
├── use-compliance.ts           — Phase 1
├── use-deliverability.ts       — Phase 1
├── use-ghost-detection.ts      — Phase 3
├── use-objections.ts           — Phase 3
├── use-ab-testing.ts           — Phase 3
├── use-roi-simulation.ts       — Phase 4
└── use-behavior.ts             — Phase 4
```

### Shared UI Patterns

All tabs follow a consistent layout:
```tsx
<TabContent>
  <TabHeader title="..." description="..." icon={...} />
  <MetricsRow>  {/* 3-4 key numbers */} </MetricsRow>
  <MainVisualization /> {/* Chart / table / feed */}
  <ActionPanel />  {/* Buttons: re-engage, promote, simulate, etc. */}
</TabContent>
```

### State Management

- **Server state**: React hooks with `fetch` + `useState` (existing pattern — no new deps needed)
- **Tab state**: URL search params (`?tab=health`) for deep-linking
- **Refresh**: Auto-refresh via `setInterval` (30s for signals, 60s for scores, 5min for deliverability)
- **Optimistic updates**: For actions (re-engage, promote variant) — update UI immediately, rollback on error

### Charts & Visualization

Use lightweight approach — avoid heavy chart libraries:
- **Option A**: Recharts (already common in Next.js projects, ~45kb gzipped)
- **Option B**: CSS-only bars/gauges for simple metrics + Recharts only for time-series
- **Recommended**: Option B for Phase 1-2, add Recharts in Phase 3 when A/B charts are needed

---

## Backend Implementation Notes

### Type Additions (`types/index.ts`)

```typescript
// Phase 1
interface ComplianceMetrics {
  bounceRate: number;
  unsubscribeRate: number;
  complaintRate: number;
  suppressionCount: number;
  canSpamCompliant: boolean;
  rateLimitBudgetRemaining: number;
}

interface DeliverabilityMetrics {
  date: string;
  emailsSent: number;
  bouncesHard: number;
  bouncesSoft: number;
  complaints: number;
  replies: number;
}

interface WarmupSchedule {
  dayNumber: number;
  maxEmails: number;
  actualSent: number;
  startedAt: string | null;
}

// Phase 2
interface EngagementEvent {
  id: string;
  campaignLeadId: string;
  eventType: 'open' | 'click' | 'reply' | 'bounce';
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface LeadHealthScore {
  score: number;
  factors: {
    reply: number;
    opens: number;
    clicks: number;
    recency: number;
    enrichment: number;
    followups: number;
  };
  aiInsight: string | null;
  calculatedAt: string;
}

interface HealthOverview {
  averageScore: number;
  distribution: { bucket: string; count: number }[];
  topLeads: (CampaignLead & { score: number })[];
  bottomLeads: (CampaignLead & { score: number })[];
  aiSummary: string;
}

// Phase 3
interface GhostLead {
  campaignLead: CampaignLead;
  ghostStatus: 'at_risk' | 'ghost' | 're_engaged';
  daysSilent: number;
  lastEngagementAt: string | null;
  reEngageReady: boolean;
}

interface PredictedObjection {
  category: string;
  confidence: number;
  reasoning: string;
  suggestedResponse: string;
}

interface ABVariant {
  id: string;
  variantLabel: string;
  subject: string;
  body: string;
  assignedCount: number;
  openCount: number;
  clickCount: number;
  replyCount: number;
  isWinner: boolean;
  openRate: number;
  replyRate: number;
}

// Phase 4
interface SimulationResult {
  predictedOpens: { low: number; mid: number; high: number };
  predictedReplies: { low: number; mid: number; high: number };
  predictedConversions: { low: number; mid: number; high: number };
  confidence: number;
  recommendations: string[];
}
```

### OpenAI Prompt Templates Needed

| Feature | Prompt Purpose | Input | Output |
|---------|---------------|-------|--------|
| Health Score | Generate lead insight | Score factors + lead profile | 1-sentence insight |
| Health Overview | Campaign summary | All scores + engagement data | 2-3 sentence overview |
| Ghost Re-engage | Fresh outreach email | Re-enriched data + history | Subject + body |
| Objection Predict | Classify likely objections | Lead profile + industry + enrichment | Top 3 categories + confidence |
| Objection Reply | Suggest reply to objection | Reply content + objection type + product | Reply text |
| ROI Recommend | Campaign optimization tips | Simulation params + benchmarks | 3-5 recommendations |
| A/B Variant | Generate alternative copy | Original prompt + variant instruction | Subject + body variant |

### Security Considerations

- **Tracking pixels**: Hash IPs before storing (no raw PII in engagement_events)
- **Unsubscribe tokens**: UUID-based, not guessable, one-click unsubscribe (CAN-SPAM compliant)
- **Click tracking**: Validate redirect URLs against allowlist to prevent open redirect attacks
- **Behavior Crystal**: All visitor data anonymized until explicit identification via email match
- **Rate limit**: Never expose rate limit internals to unauthenticated requests
- **Suppression list**: Immutable — leads can only be added, never removed (compliance audit trail)

---

## Migration Dependency Graph

```
Migration 008 (Compliance)          ← Phase 1, no deps
Migration 009 (Deliverability)      ← Phase 1, no deps
Migration 010 (Engagement tracking) ← Phase 2, no deps
Migration 011 (Health scores)       ← Phase 2, depends on 010
Migration 012 (Ghosts + Objections + A/B) ← Phase 3, depends on 010, 011
Migration 013 (ROI + Behavior)      ← Phase 4, depends on 010
```

---

## What We Can Build NOW vs What Needs Backend First

### Can build frontend immediately (mock data → swap to real API later):
- Dashboard shell layout + tab navigation
- Command center sidebar structure
- Compliance tab (wire to existing logs data for audit trail)
- Bottom bar (wire to existing rate limit data)
- Score gauge component
- Signal badge component
- All tab skeletons with placeholder states

### Needs backend first:
- Health score calculations (need scoring algorithm + API)
- Open/click tracking (need pixel injection + tracking endpoints)
- Ghost detection (need classification algorithm + API)
- Objection predictions (need OpenAI prompts + API)
- A/B variant management (need variant CRUD + engine integration)
- ROI simulation (need historical benchmarks + prediction model)
- Behavior tracking (need event ingestion + Chrome extension)

---

## Recommended Build Order (Sprint Plan)

```
SPRINT 1 (Foundation)
├── Dashboard shell + tab UI + command center layout
├── Migration 008 + 009
├── Compliance tab (backend + frontend)
├── Deliverability tab (backend + frontend)
└── Bottom bar with live rate limit data

SPRINT 2 (Intelligence Core)
├── Migration 010 + 011
├── Tracking pixel + click tracking (backend)
├── Health score algorithm + API (backend)
├── Health tab + warm signals tab (frontend)
└── Command center health widget

SPRINT 3 (AI Features)
├── Migration 012
├── Ghost detector (backend + frontend)
├── Objection engine (backend + frontend)
├── A/B testing (backend + frontend)
└── Suggest-reply integration in inbox panel

SPRINT 4 (Predictive + Behavior)
├── Migration 013
├── ROI simulator (backend + frontend)
├── Behavior Crystal backend endpoints
├── Behavior tab placeholder
└── Campaign benchmarks aggregation job
```

---

## Summary

| Metric | Value |
|--------|-------|
| New DB migrations | 6 (008–013) |
| New DB tables | 9 |
| New/altered columns | ~8 |
| New API routes | ~17 |
| New lib files | 5 (`health-score`, `ghost-detector`, `objection-engine`, `ab-testing`, `roi-simulator`) |
| New frontend components | ~20 |
| New hooks | ~10 |
| OpenAI prompt templates | 7 |
| Phases | 4 |
| External dependency | 1 (Chrome extension — Phase 4, separate repo) |
