<div align="center">
  <img src="https://img.shields.io/badge/STATUS-ACTIVE%20DEVELOPMENT-00f2fe?style=for-the-badge&labelColor=333333" alt="Status" />
  <img src="https://img.shields.io/badge/NEXT.JS-16.1.6-000000?style=for-the-badge&logo=nextdotjs&logoColor=white&labelColor=333333" alt="Next.js" />
  <img src="https://img.shields.io/badge/NODE.JS-WORKER-339933?style=for-the-badge&logo=nodedotjs&logoColor=white&labelColor=333333" alt="Node.js Worker" />
  <img src="https://img.shields.io/badge/GEMINI-AI%20POWERED-4285F4?style=for-the-badge&logo=google&logoColor=white&labelColor=333333" alt="Gemini" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge&labelColor=333333" alt="License" />

  <br />
  <br />

  <h1>ROSEY</h1>
  
  <h3><b>Intelligent Omnichannel Campaign & Lead Generation Platform</b></h3>
  <p><i>Orchestrate your B2B outreach across Email and WhatsApp seamlessly.</i><br/>
  <i>Leverage AI to personalize content and sync replies effortlessly.</i></p>
</div>

<br />

## Overview

Welcome to **Rosey**! Rosey is an advanced, AI-powered omnichannel outreach platform designed to orchestrate B2B campaigns across Email (Gmail) and WhatsApp seamlessly. Built with a focus on high performance, reliability, and a premium "cinematic" user experience, Rosey combines a visual workflow builder with AI-driven content generation and lead enrichment.

---

## Key Features

- **Visual Workflow Builder:** Drag-and-drop interface powered by React Flow (`@xyflow/react`) to map out complex multi-step, multi-channel campaigns.
- **Omnichannel Outreach:** Send personalized messages through:
  - **Email:** Direct integration with Gmail OAuth2 for sending and replying.
  - **WhatsApp:** Background worker integration utilizing `@whiskeysockets/baileys` to manage a secure connection to WhatsApp.
- **AI-Powered Content Generation:** Uses Google's **Gemini API** (via OpenAI compatibility) for dynamic email body, subject line, and WhatsApp message generation based on customizable knowledge bases and tones.
- **Lead Enrichment:** Integrates with Exa AI (`exa-js`) and Tavily for deep lead research, generating personalization hooks that the AI weaves naturally into your outreach.
- **Smart Reply Detection:** Automatically syncs inbox replies to halt automated follow-ups and even drafts context-aware auto-replies using LLM reasoning.
- **Beautiful Analytics Dashboard:** Fully responsive, premium-grade dashboard built with Recharts, providing real-time deliverability and compliance metrics.
- **Cinematic UI Experience:** Silky-smooth interactions powered by GSAP, Lenis (smooth scrolling), and Tailwind CSS v4.

---

## Tech Stack

- **Framework:** Next.js 16.1 (App Router) & React 19
- **Styling:** Tailwind CSS v4, shadcn/ui, Radix UI
- **Animations:** GSAP, Lenis
- **Authentication:** Clerk
- **Database / Backend:** Supabase (PostgreSQL)
- **Workflow Engine:** Custom TypeScript engine backed by a background worker polling loop
- **Integrations:**
  - Gmail API (`googleapis`)
  - WhatsApp (`@whiskeysockets/baileys`)
  - AI Models (Gemini via `openai` SDK)
  - Search/Enrichment (Exa API, Tavily)

---

## Getting Started

### Prerequisites

- Node.js 20+
- `pnpm` (recommended) or `npm`
- A Google Cloud Console project (for Gmail API OAuth2 & Service Accounts)
- Supabase project
- Clerk Application
- Gemini API Key
- WhatsApp account (for scanning QR code via terminal)

### 1. Clone & Install

```bash
git clone https://github.com/SumitPatel-HQ/Rosey.git
```
```bash
cd COHERENCE-26_NEURALNEXUS
```
```bash
pnpm install
```

### 2. Environment Setup

Create a `.env.local` file in the root of the project based on the provided `.env.example`:

```bash
cp .env.example .env.local
```

You will need to configure the following core services:
- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Clerk:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- **Gmail OAuth2:** `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`
- **Gemini:** `GEMINI_API_KEY` (Defaults to `gemini-3-flash-preview` model)
- **Shared Secret:** `WORKER_SECRET` (Secure string shared between Next.js and the background worker)

### 3. Running the Application

Rosey requires both the Next.js frontend/API and the background Node.js worker to be running simultaneously.

**Start the Next.js Development Server:**
```bash
pnpm dev
```

---

## Project Structure

```text
.
├── app/                  # Next.js App Router
│   ├── api/              # API Routes (Engine endpoints, webhooks)
│   ├── dashboard/        # Main user dashboard
│   ├── [productId]/      # Product & Campaign specific views
│   └── sign-in/          # Clerk Authentication
├── components/           # React Components
│   ├── analytics/        # Recharts dashboard and metrics tabs
│   ├── ui/               # Reusable shadcn/ui components
│   ├── workflow/         # React Flow visual builder nodes
│   └── landing/          # Homepage & Marketing components
├── lib/                  # Core Business Logic
│   ├── engine.ts         # Workflow node processing
│   ├── gmail.ts          # Gmail integration and OAuth handling
│   ├── openai.ts         # AI content generation via Gemini
│   └── deliverability.ts # Compliance and bounce tracking
├── worker/               # Background Node.js Process
│   ├── index.ts          # Main polling loop
│   └── whatsapp-gateway.ts # Internal WhatsApp socket server
└── types/                # Shared TypeScript definitions
```

---

## Architecture Notes

- **Workflow Execution:** When a campaign is launched, Next.js inserts tasks into Supabase. The background worker polls the Next.js `/api/engine/run` endpoint (secured via `WORKER_SECRET`), which processes pending nodes (emails, WhatsApp messages, delays).
- **WhatsApp Gateway:** The worker spins up an internal HTTP server on port `3002`. The Next.js API communicates with this internal gateway to send WhatsApp messages, keeping the heavy WebSockets logic completely decoupled from Next.js serverless functions.
- **Resilience:** The system prioritizes reliability. If the WhatsApp socket disconnects, the worker automatically attempts to reconnect and logs errors gracefully. Partial failures do not crash the engine.

---

## License

This project is licensed under the [MIT License](LICENSE).
