# NeuralNexus — Backend Feature Audit Report

> **Audit Date:** March 7, 2026  
> **Scope:** Backend-only review — API routes, engine, worker, database schema, utilities  
> **Purpose:** Gap analysis of 9 planned features against the current codebase  
> **Action:** Read-only audit. No implementations have been made.

---

## Executive Summary

| # | Feature | Status | Coverage |
|---|---------|--------|----------|
| 1 | Health Score 📊 | ❌ Missing | 0% |
| 2 | Warm Signals ✨ | 🟡 Partial | ~20% |
| 3 | Ghost Detector 👻 | ❌ Missing | 0% |
| 4 | Objection Preloader 🛡️ | ❌ Missing | 0% |
| 5 | ROI Simulator 📈 | ❌ Missing | 0% |
| 6 | Self-Optimizing 🧠 | 🟡 Minimal | ~10% |
| 7 | Compliance Guardian ✅ | 🟡 Partial | ~30% |
| 8 | Email Deliverability 📧 | 🟢 Basic | ~40% |


**Overall backend readiness: ~11%** — The core email-sending engine and workflow system work, but almost all intelligent/analytical features are absent.

---

## Current Backend Architecture (Quick Reference)

Before diving into the feature audit, here is what the backend currently provides:

| Layer | Files | Role |
|-------|-------|------|
| **Database** | `supabase/migrations/001–007` | 5 tables: `products`, `leads`, `campaigns`, `campaign_leads`, `logs` |
| **Workflow Engine** | `lib/workflow-engine.ts` | Generic graph walker — supports `start`, `send_email`, `wait`, `condition`, `end` nodes |
| **Campaign Engine** | `lib/engine.ts` | Orchestrates campaign execution: claims leads, processes workflow steps, sends emails, rate-limits |
| **Email** | `lib/gmail.ts` | Gmail API wrapper — send, thread management, labels, reply detection |
| **AI Generation** | `lib/openai.ts` | Azure OpenAI (GPT-5.3) — generates email subject + body from prompts |
| **Enrichment** | `lib/enrichment.ts` | Scrapes lead data via Jina Reader + Exa.ai (LinkedIn, company site, news) |
| **Reply Sync** | `lib/reply-sync.ts` | Detects Gmail thread replies, marks `campaign_leads.replied` |
| **Worker** | `worker/index.ts` | Standalone Node.js process — polls `/api/engine/run` every 10s |
| **API Routes** | `app/api/**` | 16 endpoints — CRUD for products/leads/campaigns, engine trigger, analytics, email compose/reply/thread |

---

## 1. Health Score 📊

**Goal:** Real-time score per lead + AI-generated insights on what's working.

### What Exists

**Nothing.** There is no scoring system anywhere in the codebase.

### What's Missing

| Component | Details |
|-----------|---------|
| **Database schema** | No `health_score`, `score_history`, or `score_factors` columns/tables. The `campaign_leads` table only tracks `status`, `replied`, and `followup_count`. |
| **Scoring algorithm** | No logic to compute a health score from available signals (reply status, followup count, time since last action, enrichment quality, etc.). |
| **AI insights** | The OpenAI integration (`lib/openai.ts`) is only used for email generation. No prompt exists for analyzing lead health or campaign effectiveness. |
| **API endpoint** | No `/api/leads/[id]/health-score` or similar route. |
| **Real-time updates** | No WebSocket/SSE/polling mechanism to push score changes to the frontend. |
| **Aggregation** | No campaign-level health scoring — the analytics endpoint (`/api/campaigns/[id]/analytics`) returns only flat counts (emails sent, replies, failed, etc.). |

### Available Building Blocks

- `campaign_leads.replied` (boolean) — single engagement signal
- `campaign_leads.followup_count` (integer) — outreach depth
- `campaign_leads.status` — lifecycle stage
- `leads.enriched_data` (JSONB) — enrichment completeness could factor into score
- `logs` table — full action audit trail with timestamps and metadata

### Gap Rating: **Critical** — No foundation exists.

---

## 2. Warm Signals ✨

**Goal:** Auto-trigger follow-ups based on engagement signals.

### What Exists

**Reply detection is the only warm signal currently tracked.**

| Component | File | Details |
|-----------|------|---------|
| Reply sync | `lib/reply-sync.ts` | `syncCampaignReplyStatus()` checks Gmail threads for inbound messages. Marks `campaign_leads.replied = true`. |
| Reply-based acceleration | `lib/reply-sync.ts:L72–L78` | When a reply is detected on a waiting lead, `next_action_time` is set to `now()` so the engine picks it up immediately instead of waiting for the timer. |
| Condition node branching | `lib/engine.ts:L324–L370` | The workflow `condition` node checks `replied` / `not_replied` and branches `yes` / `no`. |
| Pre-sweep reply sweep | `lib/engine.ts:L500–L540` | `sweepRepliedLeads()` proactively checks all waiting leads before each engine tick. |

### What's Missing

| Component | Details |
|-----------|---------|
| **Email open tracking** | No tracking pixel injected into outbound emails. `lib/gmail.ts:sendEmail()` sends raw HTML with no pixel. No `/api/track/open` endpoint. |
| **Click tracking** | No link rewriting or redirect endpoint. Links in AI-generated emails go directly to their destination. |
| **Engagement scoring** | Reply is binary (`true`/`false`). No multi-signal scoring (opens = 1pt, clicks = 3pts, reply = 10pts, etc.). |
| **Auto-follow-up triggers** | Follow-ups are workflow-driven only (wait → condition → send_email). No signal-based triggers outside the predefined workflow. |
| **Signal-based personalization** | No mechanism to feed engagement signals back into the AI prompt for context-aware follow-ups. |
| **Webhook/event system** | No event bus or webhook dispatch when signals arrive. Reply detection is synchronous and poll-based. |

### Gap Rating: **High** — Only 1 of ~5 signal types is implemented. Follow-up automation exists but is static (workflow-only), not signal-reactive.

---

## 3. Ghost Detector 👻

**Goal:** Re-engage unresponsive leads with fresh context.

### What Exists

**Nothing purpose-built.** However, some adjacent primitives are present:

- `campaign_leads.replied = false` can identify non-responders
- `campaign_leads.last_action_time` reveals when the last outreach occurred
- `campaign_leads.status = 'completed'` with `replied = false` means the full workflow ran without a response
- `campaign_leads.followup_count` shows how many touches were made

These are passive data points — there is **no active ghost detection or re-engagement logic**.

### What's Missing

| Component | Details |
|-----------|---------|
| **Ghost detection algorithm** | No logic to identify leads who haven't engaged after N days / N touchpoints. No "staleness" threshold. |
| **Ghost classification** | No categorization (e.g., "went dark after initial email", "opened but never replied", "never opened"). |
| **Re-engagement campaigns** | No mechanism to auto-create or auto-assign leads to re-engagement workflows. |
| **Fresh context injection** | No system to gather new data (recent news, job changes) and use it to craft re-engagement emails. The enrichment system exists but is one-shot — no re-enrichment triggers. |
| **Ghost analytics** | No dashboard metrics for ghost rate, re-engagement success, or decay curves. |
| **API endpoints** | No `/api/leads/ghosts` or `/api/campaigns/[id]/re-engage` routes. |

### Gap Rating: **Critical** — Zero implementation. Raw data exists in the DB but nothing acts on it.

---

## 4. Objection Preloader 🛡️

**Goal:** Predict objections and pre-load AI-generated responses.

### What Exists

**Nothing.** The AI system (`lib/openai.ts`) generates outreach emails only. No objection-handling capability.

### What's Missing

| Component | Details |
|-----------|---------|
| **Objection taxonomy** | No database table or enum for common objection types (pricing, timing, competitor, authority, etc.). |
| **Prediction model** | No logic to predict likely objections based on lead profile, industry, company size, or enrichment data. The enrichment data includes `pain_points` but these aren't mapped to objection categories. |
| **Pre-loaded responses** | No AI-generated objection responses. No prompt template for "given this lead and this likely objection, generate a counter-argument." |
| **Inbox integration** | The manual reply system (`/api/campaign-leads/[id]/reply`) sends user-composed replies. No AI-assisted reply suggestions. |
| **Response library** | No stored objection/response pairs for reuse across campaigns. |
| **Real-time suggestions** | No mechanism to surface objection responses when a lead replies with pushback. |

### Relevant Enrichment Data (Unused)

The `enriched_data` JSONB field contains `pain_points[]` and `personalization_hooks[]` from Exa.ai — these could theoretically feed an objection prediction system but currently are only used for initial email personalization.

### Gap Rating: **Critical** — No foundation. Would require new AI prompts, a response library system, and inbox-level integration.

---

## 5. ROI Simulator 📈

**Goal:** Predict campaign outcomes before launch.

### What Exists

**Nothing.** The analytics endpoint returns post-hoc metrics only.

Current analytics payload (`/api/campaigns/[id]/analytics`):
```json
{
  "totalLeads": 0,
  "emailsSent": 0,
  "emailsSkipped": 0,
  "replies": 0,
  "replyRate": 0,
  "completed": 0,
  "failed": 0,
  "inProgress": 0,
  "totalFollowups": 0
}
```

This is **historical reporting**, not predictive simulation.

### What's Missing

| Component | Details |
|-----------|---------|
| **Historical benchmarks** | No aggregation of past campaign performance across products/industries to establish baseline metrics. |
| **Prediction model** | No ML/statistical model to forecast reply rates, conversion rates, or revenue impact. |
| **Simulation engine** | No "what-if" parameter system (e.g., "what if I email 500 leads with this template at this rate?"). |
| **Lead scoring input** | No lead quality scoring that could feed conversion probability estimates. |
| **Revenue modeling** | No deal value or pipeline integration. No concept of revenue/opportunity in the data model. |
| **API endpoint** | No `/api/campaigns/[id]/simulate` or `/api/campaigns/[id]/forecast` route. |
| **Confidence intervals** | No statistical framework for prediction accuracy. |

### Gap Rating: **Critical** — Requires historical data aggregation, statistical modeling, and a new API surface. No building blocks exist beyond raw log data.

---

## 6. Self-Optimizing 🧠

**Goal:** A/B test messages, learn from results, auto-improve.

### What Exists

**Minimal — email caching only, no optimization loop.**

| Component | File | Details |
|-----------|------|---------|
| Template caching | `lib/engine.ts:L225–L270` | When `mode = "same_for_all"`, the first generated email is cached as `cached_subject` / `cached_body` in the workflow JSON. Subsequent leads receive the same template with placeholder substitution. |
| Two generation modes | `lib/engine.ts:L200–L290` | `personalized` (unique per lead) vs `same_for_all` (one template, many leads). But there is **no variant management** — only one version is ever generated. |

### What's Missing

| Component | Details |
|-----------|---------|
| **A/B variant generation** | No system to create 2+ message variants for the same workflow step. The `send_email` node produces exactly one output. |
| **Variant assignment** | No mechanism to randomly assign leads to variant groups (50/50, 33/33/33, etc.). |
| **Performance tracking per variant** | No way to attribute replies/opens/clicks back to a specific message version. Logs record `cache_hit: true/false` but not variant IDs. |
| **Statistical significance testing** | No chi-squared, Bayesian, or other framework to determine a winner. |
| **Auto-selection** | No "promote the winner" logic. No multi-armed bandit or similar algorithm. |
| **Prompt evolution** | No system to iteratively refine AI prompts based on outcome data. |
| **Learning feedback loop** | No pipeline from analytics → AI → improved prompts. The AI generates and forgets. |
| **Database schema** | No `variants`, `experiments`, or `ab_tests` tables. |

### Gap Rating: **Critical** — Only the single-template caching mechanism exists. A/B testing, learning, and auto-improvement are entirely absent.

---

## 7. Compliance Guardian ✅

**Goal:** Transparent audit trail + rate limits.

### What Exists

**Rate limiting and basic logging are in place.**

| Component | File | Details |
|-----------|------|---------|
| **Email rate limiting** | `lib/engine.ts:L590–L615` | Per-campaign hourly rate limit. Queries `logs` for emails sent in the last hour. Skips campaign if budget exhausted. Budget checked before each lead. |
| **Rate limit config** | `supabase/migrations/006` | `campaigns.email_rate_limit_per_hour` — nullable integer column. `NULL = unlimited`. |
| **Action logging** | `lib/engine.ts:L64–L78` | Every workflow action logged to `logs` table: `send_email`, `wait`, `condition`, `end`, `error`. Includes `status`, `metadata` (JSONB), and `created_at`. |
| **Worker auth** | `app/api/engine/run/route.ts` | `WORKER_SECRET` bearer token gates the engine endpoint. |
| **Thread tracking** | `campaign_leads` columns | `thread_id`, `last_message_id`, `thread_subject` provide a partial email audit trail. |

### What's Missing

| Component | Details |
|-----------|---------|
| **CAN-SPAM compliance** | No verification that emails include: (1) physical mailing address, (2) unsubscribe mechanism, (3) honest subject lines, (4) sender identification. AI-generated emails have no compliance template injection. |
| **Unsubscribe handling** | No `/api/unsubscribe` endpoint. No `List-Unsubscribe` header added in `lib/gmail.ts:sendEmail()`. No suppression list in the database. |
| **GDPR/CCPA** | No consent tracking. No data deletion endpoint. No right-to-access export. No `consent_given_at` column on leads. |
| **Bounce/complaint tracking** | No Gmail push notification or webhook to detect bounces. No `bounced` flag on campaign_leads. No complaint categorization. |
| **Suppression lists** | No global or per-product suppression/blocklist. A lead can be emailed across multiple campaigns with no dedup. |
| **SPF/DKIM/DMARC validation** | No domain authentication checks before sending. Gmail handles this at the provider level, but the app has no visibility or alerting. |
| **Compliance dashboard** | No API endpoint for compliance metrics (bounce rate, complaint rate, unsubscribe rate). |
| **Rate limit UI feedback** | Rate limit is enforced silently — no API to show how much budget remains. |

### Gap Rating: **Moderate** — The audit trail and rate limiting provide a solid foundation, but legal compliance (CAN-SPAM, GDPR) and email hygiene (bounces, suppression) are entirely absent.

---

## 8. Email Deliverability 📧

**Goal:** Domain warm-up + ISP monitoring.

### What Exists

**Functional Gmail integration with proper email threading.**

| Component | File | Details |
|-----------|------|---------|
| **Gmail API send** | `lib/gmail.ts:sendEmail()` | Sends via OAuth2 with proper MIME formatting, UTF-8 encoded subjects, `In-Reply-To` / `References` headers for threading. |
| **Thread management** | `lib/gmail.ts` | Thread ID tracking, label creation & application, message ID propagation. |
| **Reply detection** | `lib/gmail.ts:hasThreadReceivedReply()` | Checks thread for non-sender messages. Used to detect engagement. |
| **Thread history** | `lib/gmail.ts:getThreadMessages()` | Full thread retrieval with HTML body extraction, fallback to metadata-only mode if scope is restricted. |
| **Label organization** | `lib/gmail.ts:getOrCreateLabel()` | `{Product} - {Campaign}` labels auto-created and applied to threads for inbox organization. |
| **Rate limiting** | `lib/engine.ts` | Prevents sending bursts that might trigger spam filters. |

### What's Missing

| Component | Details |
|-----------|---------|
| **Domain warm-up automation** | No gradual volume ramp-up schedule. No system to start with low volume and increase over days/weeks. New campaigns can blast full volume immediately (only limited by `email_rate_limit_per_hour`). |
| **Warm-up schedule management** | No database tracking of warm-up phase, current day, or volume tier. |
| **ISP monitoring** | No monitoring of deliverability to specific ISPs (Gmail, Outlook, Yahoo). No inbox vs. spam folder detection. |
| **Bounce handling** | No classification of hard bounces (invalid address) vs. soft bounces (mailbox full). Failed sends are logged as `status: "failed"` with no bounce-type categorization. |
| **Complaint tracking** | No Gmail Postmaster Tools integration. No feedback loop for spam complaints. |
| **Sender reputation tracking** | No monitoring of sending domain reputation over time. |
| **Content spam scoring** | No pre-send spam score analysis. AI generates email content with no deliverability checks. |
| **IP rotation** | Single Gmail account — no rotation, no backup sending infrastructure. |
| **SPF/DKIM/DMARC reporting** | No DMARC aggregate/forensic report parsing. |
| **Deliverability analytics** | No API endpoint for deliverability metrics (inbox rate, bounce rate, spam rate). |
| **Sending time optimization** | No analysis of best send times for deliverability. Emails go out whenever the engine tick fires. |

### Gap Rating: **Moderate** — Gmail handles authentication (SPF/DKIM) at the provider level, but the application has no awareness of deliverability metrics, warm-up needs, or bounce categorization. The rate limiter is the only protective measure.

---

## 9. Behavior Crystal 🔍

**Goal:** Chrome extension tracking website behavior.

### What Exists

**Nothing.** This is an entirely separate system with no backend presence.

### What's Missing

| Component | Details |
|-----------|---------|
| **Tracking script/pixel** | No JavaScript snippet generation for embedding on websites. No `/api/track` endpoint. |
| **Chrome extension backend** | No API endpoints to receive browser extension events (page visits, time on page, scroll depth, etc.). |
| **Visitor identification** | No cookie/fingerprint → lead correlation system. No visitor sessions table. |
| **Event ingestion** | No event storage schema. No `events` or `page_views` table. |
| **Real-time notifications** | No WebSocket/SSE endpoint to push live visitor activity to the dashboard. |
| **Behavioral scoring** | No scoring model based on page visits, visit frequency, or content engagement. |
| **Lead correlation** | No mechanism to match anonymous website visitors to known leads in the `leads` table. |
| **Privacy compliance** | No cookie consent management or opt-out mechanism for tracked visitors. |
| **Extension manifest** | No Chrome extension source code, manifest, or build configuration in the repo. |

### Gap Rating: **Critical** — This is a greenfield feature requiring an entirely new subsystem (tracking infrastructure, event ingestion, Chrome extension, real-time delivery, privacy layer).

---

## Database Schema Gap Analysis

### Current Schema (7 migrations)

```
products          — id, name, description, sheet_id, drive_folder_id, gmail_label_prefix
leads             — id, product_id, name, email, company, industry, tags[], enriched_data, custom_fields
campaigns         — id, product_id, name, workflow_json, status, gmail_label_id, email_rate_limit_per_hour
campaign_leads    — id, campaign_id, lead_id, current_node_id, status, followup_count,
                     last_action_time, next_action_time, replied, thread_id, last_message_id, thread_subject
logs              — id, campaign_lead_id, action, status, metadata, created_at
```

### Missing Tables / Columns for Feature Parity

| Feature | Required Schema Changes |
|---------|------------------------|
| Health Score | `lead_scores` table (lead_id, score, factors JSONB, calculated_at) |
| Warm Signals | `engagement_events` table (lead_id, event_type, metadata, created_at); open/click tracking columns |
| Ghost Detector | `ghost_status` on campaign_leads or a `ghost_leads` view; `last_engagement_at` column |
| Objection Preloader | `objections` table (id, category, lead_id, predicted_at); `objection_responses` table |
| ROI Simulator | `campaign_benchmarks` table; historical aggregation views; `predicted_metrics` JSONB |
| Self-Optimizing | `ab_variants` table (campaign_id, node_id, variant_id, content, performance); `experiments` table |
| Compliance | `suppression_list` table; `consent_log` table; `bounces` table; `unsubscribes` table; `List-Unsubscribe` header support |
| Deliverability | `deliverability_metrics` table; `warmup_schedules` table; bounce_type on logs |
| Behavior Crystal | `visitor_sessions` table; `page_events` table; `visitor_lead_map` table |

---

## API Route Coverage

### Existing Routes (16 endpoints)

| Endpoint | Methods | Feature Coverage |
|----------|---------|-----------------|
| `/api/products` | GET, POST | Core CRUD |
| `/api/products/[id]` | GET | Core CRUD |
| `/api/campaigns` | GET, POST | Core CRUD |
| `/api/campaigns/[id]` | GET, PUT, DELETE | Core CRUD |
| `/api/campaigns/[id]/run` | POST | Engine control |
| `/api/campaigns/[id]/leads` | GET, POST | Lead assignment |
| `/api/campaigns/[id]/analytics` | GET | Basic stats (counts only) |
| `/api/campaigns/[id]/preview-email` | GET, POST | Email preview |
| `/api/leads` | GET, POST | Core CRUD |
| `/api/leads/upload` | POST | CSV/JSON import |
| `/api/leads/[id]` | DELETE | Core CRUD |
| `/api/leads/[id]/enrich` | POST | Enrichment |
| `/api/campaign-leads/[id]/compose` | POST | AI email generation |
| `/api/campaign-leads/[id]/reply` | POST | Manual reply |
| `/api/campaign-leads/[id]/thread` | GET | Thread history |
| `/api/engine/run` | POST | Worker-triggered engine tick |

### Missing Routes for Full Feature Set

| Feature | Required New Routes |
|---------|---------------------|
| Health Score | `GET /api/leads/[id]/health-score`, `GET /api/campaigns/[id]/health-overview` |
| Warm Signals | `POST /api/track/open/[token]`, `GET /api/track/click/[token]`, `GET /api/campaigns/[id]/signals` |
| Ghost Detector | `GET /api/campaigns/[id]/ghosts`, `POST /api/campaigns/[id]/re-engage` |
| Objection Preloader | `GET /api/leads/[id]/objections`, `POST /api/campaign-leads/[id]/suggest-reply` |
| ROI Simulator | `POST /api/campaigns/[id]/simulate`, `GET /api/benchmarks` |
| Self-Optimizing | `POST /api/campaigns/[id]/ab-test`, `GET /api/campaigns/[id]/variants`, `POST /api/campaigns/[id]/promote-winner` |
| Compliance | `GET /api/unsubscribe/[token]`, `GET /api/compliance/audit`, `GET /api/suppression-list` |
| Deliverability | `GET /api/deliverability/[domain]`, `POST /api/warmup/schedule`, `GET /api/campaigns/[id]/deliverability` |
| Behavior Crystal | `POST /api/track/pageview`, `GET /api/leads/[id]/behavior`, `WS /api/realtime/visitors` |

---

## Priority Recommendations

Based on the audit, here is a suggested implementation order weighted by backend complexity and dependency chains:

| Priority | Feature | Reason |
|----------|---------|--------|
| **P0** | Compliance Guardian ✅ | 30% done. Legal risk mitigation. Unsubscribe + CAN-SPAM are table stakes before scaling sends. |
| **P0** | Email Deliverability 📧 | 40% done. Domain warm-up prevents immediate reputation damage when sending at scale. |
| **P1** | Warm Signals ✨ | 20% done. Open/click tracking unlocks data for Health Score, Ghost Detector, and Self-Optimizing. |
| **P1** | Health Score 📊 | 0% done. Requires Warm Signals data. Foundation for Ghost Detector and ROI Simulator. |
| **P2** | Ghost Detector 👻 | 0% done. Depends on Health Score + Warm Signals to detect disengagement patterns. |
| **P2** | Self-Optimizing 🧠 | 10% done. A/B testing is an isolated system but needs engagement data to measure winners. |
| **P3** | Objection Preloader 🛡️ | 0% done. AI-heavy feature. Can leverage existing OpenAI integration but needs reply analysis. |
| **P3** | ROI Simulator 📈 | 0% done. Needs historical campaign data to build prediction models. Best added after data accumulates. |
| **P4** | Behavior Crystal 🔍 | 0% done. Entirely separate subsystem (Chrome extension + tracking infra). Highest effort, lowest dependency on current code. |

---

## Key Observations

1. **The engine is solid.** The workflow engine + campaign processor is well-structured with clean separation of concerns, proper error handling, and a claim-based concurrency model. This is a good foundation.

2. **AI integration is single-purpose.** OpenAI is only used for email generation. Expanding it to scoring, predictions, and objection handling would multiply its value.

3. **The log table is underutilized.** Every action is logged with timestamps and metadata, but this data is only surfaced as flat counts in analytics. It's a goldmine for Health Score, Ghost Detection, and ROI predictions.

4. **Enrichment data is write-once.** Lead enrichment runs once and is never refreshed. Ghost re-engagement and objection prediction would benefit from periodic re-enrichment.

5. **No event/pub-sub system.** Everything is request-driven or poll-based. Warm signals, real-time scoring, and behavior tracking all need an event layer.

6. **Single Gmail account.** All sending goes through one OAuth2 credential set. This is a bottleneck for deliverability, warm-up, and compliance at scale.
