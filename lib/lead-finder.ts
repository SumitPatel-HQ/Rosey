import OpenAI from "openai";
import type { Product } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_BASE_URL,
});

const TAVILY_API_URL = "https://api.tavily.com/search";
const TAVILY_TIMEOUT_MS = 15_000;

export interface CandidateLead {
  name: string;
  email: string;
  company: string | null;
  industry: string | null;
  job_title: string | null;
  source_url: string | null;
}

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
  maxResults = 10
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
      console.error(`Tavily search failed: ${res.status} ${res.statusText}`);
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

export async function findLeads(
  userQuery: string,
  product: Pick<Product, "name" | "description">
): Promise<CandidateLead[]> {
  // Inject product context into the search query so results are relevant
  const productContext = [product.name, product.description]
    .filter(Boolean)
    .join(" — ");

  const searchQuery = productContext
    ? `${userQuery} — relevant to: ${productContext}`
    : userQuery;

  const results = await tavilySearch(searchQuery, 10);

  if (results.length === 0) {
    return [];
  }

  // Compile search results into a document for the LLM
  const searchContext = results
    .map((r) => `**${r.title}** (${r.url})\n${r.content}`)
    .join("\n\n---\n\n");

  const systemPrompt = `You are a B2B lead extraction assistant. Given web search results, extract individual people who could be sales leads.

Product being sold: ${product.name}${product.description ? ` — ${product.description}` : ""}
User's search intent: ${userQuery}

Return a JSON object with this exact shape:
{
  "leads": [
    {
      "name": "Full Name",
      "email": "",
      "company": "Company name or null",
      "industry": "Industry or null",
      "job_title": "Job title or null",
      "source_url": "URL where this person was found or null"
    }
  ]
}

Rules:
- Extract real, named individuals only — no generic job roles without a name
- If an email is found in the page, include it; otherwise leave it as empty string ""
- Include the source URL from the search result where the person was found
- If no relevant leads are found, return { "leads": [] }
- Do not hallucinate data — only extract what is present in the search results`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.3-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Web search results:\n\n${searchContext}` },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return [];

    const parsed = JSON.parse(raw) as { leads: CandidateLead[] };
    return Array.isArray(parsed.leads) ? parsed.leads : [];
  } catch (err) {
    console.error("Lead extraction LLM call failed:", err);
    return [];
  }
}
