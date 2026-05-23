/**
 * Lead Enrichment Agent
 *
 * Scrapes publicly available information about a lead from:
 *  1. Company website (derived from their email domain) — via Jina Reader
 *  2. LinkedIn profile — via Exa.ai neural search (free tier: 1000 req/mo)
 *  3. Professional web presence — via Exa.ai
 *  4. Company news — via Exa.ai
 *
 * Exa.ai (https://exa.ai) is purpose-built for finding professional profiles
 * and understands LinkedIn structure natively.
 * Set EXA_API_KEY in .env.local to enable Exa-powered sources.
 */

import OpenAI from "openai";
import Exa from "exa-js";
import type { Lead } from "@/types";
import type { EnrichedLeadData } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const JINA_BASE = "https://r.jina.ai/";
const FETCH_TIMEOUT_MS = 12_000;

async function fetchWithJina(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${JINA_BASE}${url}`, {
      signal: controller.signal,
      headers: {
        Accept: "text/markdown",
        "X-Return-Format": "markdown",
      },
    });
    if (!res.ok) return "";
    const text = await res.text();
    return text.slice(0, 4000);
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

function getEmailDomain(email: string): string | null {
  const parts = email.split("@");
  if (parts.length !== 2) return null;
  const domain = parts[1].toLowerCase();
  const generic = [
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
    "icloud.com", "protonmail.com", "me.com", "live.com",
  ];
  return generic.includes(domain) ? null : domain;
}

/**
 * Uses Exa.ai to search for a lead's LinkedIn profile and return the text content.
 * Exa natively understands LinkedIn and retrieves profile page text.
 */
async function fetchExaSources(lead: Lead): Promise<{ label: string; content: string }[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return [];

  const exa = new Exa(apiKey);
  const company = lead.company || "";
  const industry = lead.industry || "";
  const results: { label: string; content: string }[] = [];

  // Run all Exa queries in parallel
  const [linkedInResult, personWebResult, newsResult] = await Promise.allSettled([
    // 1. LinkedIn profile search — Exa's neural search is excellent here
    exa.searchAndContents(
      `${lead.name}${company ? ` ${company}` : ""} LinkedIn profile`,
      {
        numResults: 3,
        includeDomains: ["linkedin.com"],
        text: { maxCharacters: 3000 },
        type: "neural",
      }
    ),
    // 2. General professional web presence (bio, interviews, mentions)
    exa.searchAndContents(
      `"${lead.name}"${company ? ` "${company}"` : ""} ${industry} professional`,
      {
        numResults: 3,
        excludeDomains: ["linkedin.com"],
        text: { maxCharacters: 3000 },
        type: "neural",
      }
    ),
    // 3. Recent company news
    company
      ? exa.searchAndContents(
          `${company} ${industry} company news funding product launch 2025 2026`,
          {
            numResults: 3,
            text: { maxCharacters: 2000 },
            type: "neural",
            startPublishedDate: "2025-01-01",
          }
        )
      : Promise.resolve(null),
  ]);

  if (linkedInResult.status === "fulfilled" && linkedInResult.value?.results?.length) {
    const combined = linkedInResult.value.results
      .map((r) => `[${r.title ?? ""}](${r.url})\n${r.text ?? ""}`)
      .join("\n\n")
      .slice(0, 4000);
    if (combined.trim().length > 100) {
      results.push({ label: "LinkedIn profiles (via Exa)", content: combined });
    }
  }

  if (personWebResult.status === "fulfilled" && personWebResult.value?.results?.length) {
    const combined = personWebResult.value.results
      .map((r) => `[${r.title ?? ""}](${r.url})\n${r.text ?? ""}`)
      .join("\n\n")
      .slice(0, 4000);
    if (combined.trim().length > 100) {
      results.push({ label: "Professional web presence (via Exa)", content: combined });
    }
  }

  if (
    newsResult.status === "fulfilled" &&
    newsResult.value &&
    "results" in newsResult.value &&
    newsResult.value.results?.length
  ) {
    const combined = (newsResult.value.results as Array<{ title?: string; url: string; text?: string }>)
      .map((r) => `[${r.title ?? ""}](${r.url})\n${r.text ?? ""}`)
      .join("\n\n")
      .slice(0, 3000);
    if (combined.trim().length > 100) {
      results.push({ label: "Company news (via Exa)", content: combined });
    }
  }

  return results;
}

export async function enrichLead(lead: Lead): Promise<EnrichedLeadData> {
  const domain = getEmailDomain(lead.email);
  const sections: { label: string; content: string }[] = [];

  // ── 1. Jina: company website (no API key needed, reliable) ──────────────
  const jinaFetches: { label: string; url: string }[] = [];
  if (domain) {
    jinaFetches.push({ label: `Company site (${domain})`, url: `https://${domain}` });
    jinaFetches.push({ label: `Company about page`, url: `https://${domain}/about` });
  }

  const [jinaResults, exaResults] = await Promise.all([
    Promise.allSettled(jinaFetches.map((s) => fetchWithJina(s.url))),
    fetchExaSources(lead),
  ]);

  jinaResults.forEach((result, i) => {
    const content = result.status === "fulfilled" ? result.value : "";
    if (content.trim().length > 100) {
      sections.push({ label: jinaFetches[i].label, content });
    }
  });

  // ── 2. Exa: LinkedIn + professional web + company news ───────────────────
  sections.push(...exaResults);

  const sourcesUsed = sections.map((s) => s.label);

  if (sections.length === 0) {
    return {
      personalization_hooks: [],
      sources_used: [],
      scraped_at: new Date().toISOString(),
    };
  }

  const scrapedContent = sections
    .map((s) => `### ${s.label}\n\n${s.content}`)
    .join("\n\n---\n\n");

  const systemPrompt = `You are an expert B2B sales researcher. Analyse the scraped web content below and extract structured enrichment data about this lead.

Lead info:
- Name: ${lead.name}
- Email: ${lead.email}
- Company: ${lead.company || "unknown"}
- Industry: ${lead.industry || "unknown"}

Return a JSON object with this exact shape:
{
  "job_title": "string or null — their job title if found",
  "bio": "string or null — 1-2 sentence summary of the person",
  "company_description": "string or null — what the company does in 1-2 sentences",
  "recent_news": "string or null — notable recent news about the company or person",
  "interests": ["array of professional interests or focus areas"],
  "pain_points": ["array of likely business pain points or challenges they face"],
  "personalization_hooks": ["array of 3-5 specific talking points that make an outreach email feel personal and relevant — reference real details from the scraped data"]
}

If a field cannot be determined from the data, set it to null or an empty array.
Focus on personalization_hooks — these are the most important output.`;

  const completion = await openai.chat.completions.create({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Scraped web content:\n\n${scrapedContent}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return {
      personalization_hooks: [],
      sources_used: sourcesUsed,
      scraped_at: new Date().toISOString(),
    };
  }

  const parsed = JSON.parse(raw) as Omit<EnrichedLeadData, "scraped_at" | "sources_used">;

  return {
    ...parsed,
    sources_used: sourcesUsed,
    scraped_at: new Date().toISOString(),
  };
}
