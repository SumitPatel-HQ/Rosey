import OpenAI from "openai";
import type { Lead, EnrichedLeadData } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_BASE_URL,
});

/**
 * Generate an email subject and plain-text body from a single natural-language prompt.
 *
 * @param prompt  - The campaign author's intent, e.g. "Announce our strawberry promo with humour".
 * @param lead    - When provided the AI personifies the email for that specific lead.
 *                  When null the AI uses {{name}}, {{company}}, {{industry}} as literal
 *                  placeholders so one template can be substituted for every lead.
 * @param productDescription - Optional product context injected into the system prompt.
 * @param options.senderEmail - The From address; injected so the AI never writes [Your Name].
 * @param options.isFollowUp  - When true, instructs the AI this is a follow-up, not a cold intro.
 */
export async function generateMessage(
  prompt: string,
  lead: Lead | null,
  productDescription?: string,
  options?: { senderEmail?: string; isFollowUp?: boolean; enrichedData?: EnrichedLeadData | null }
): Promise<{ subject: string; body: string }> {
  const effectivePrompt = lead
    ? prompt
        .replace(/\{\{name\}\}/g, lead.name)
        .replace(/\{\{email\}\}/g, lead.email)
        .replace(/\{\{company\}\}/g, lead.company || "your company")
        .replace(/\{\{industry\}\}/g, lead.industry || "your industry")
    : prompt;

  const personalizationInstruction = lead
    ? `Recipient: ${lead.name} at ${lead.company || "unknown company"} in ${
        lead.industry || "unknown industry"
      }. Personalise the email specifically for them.`
    : "Write the email as a reusable template. Wherever you would reference the recipient's name, company, or industry, use the exact literal placeholders {{name}}, {{company}}, and {{industry}} instead of real values. Do NOT invent specific names or companies.";

  const senderEmail = options?.senderEmail;
  const isFollowUp = options?.isFollowUp ?? false;
  const enrichedData = options?.enrichedData;

  const enrichmentInstruction = enrichedData && enrichedData.personalization_hooks.length > 0
    ? `\n\nEnriched lead intelligence (scraped from the web — use these to make the email feel personal and deeply researched):\n` +
      (enrichedData.job_title ? `- Job title: ${enrichedData.job_title}\n` : "") +
      (enrichedData.bio ? `- Bio: ${enrichedData.bio}\n` : "") +
      (enrichedData.company_description ? `- Company: ${enrichedData.company_description}\n` : "") +
      (enrichedData.recent_news ? `- Recent news: ${enrichedData.recent_news}\n` : "") +
      (enrichedData.pain_points?.length ? `- Likely pain points: ${enrichedData.pain_points.join(", ")}\n` : "") +
      `- Personalization hooks to weave in: ${enrichedData.personalization_hooks.join(" | ")}\n` +
      `Reference 1-2 of these hooks naturally — do NOT list them verbatim. Make the email feel like you did your homework.`
    : "";

  const senderInstruction = senderEmail
    ? `You are writing on behalf of ${senderEmail}. When signing off, use the name derived from that email address — never write placeholder text like [Your Name], [Sender], or similar.`
    : "Never write placeholder text like [Your Name] or [Sender] in the sign-off.";

  const followUpInstruction = isFollowUp
    ? "This is a follow-up email in an ongoing thread — the recipient has not replied yet. Keep it short (2-3 sentences), reference the previous outreach briefly, and add urgency or a new angle based on the instructions below. Do NOT write a cold introduction."
    : "This is the first email in an outreach sequence.";

  const completion = await openai.chat.completions.create({
    model: "gpt-5.3-chat",
    messages: [
      {
        role: "system",
        content:
          "You are an expert B2B outreach copywriter. " +
          (productDescription ? `The product being promoted is: ${productDescription}. ` : "") +
          `${senderInstruction} ` +
          `${followUpInstruction} ` +
          "Based on the user's instructions, generate both a subject line and an email body. " +
          'Respond with JSON: {"subject": "...", "body": "..."}. ' +
          "The body must be plain text only — absolutely no HTML tags, no markdown, no bullet symbols, no em-dashes used as bullets. " +
          "Write the way a real person writes an email: short paragraphs separated by blank lines, natural conversational tone, no formal sign-off boilerplate. " +
          "Keep it concise (3-5 sentences max unless the prompt specifies otherwise). " +
          "End with a simple, direct call-to-action on its own line." +
          enrichmentInstruction,
      },
      {
        role: "user",
        content: `${effectivePrompt}\n\n${personalizationInstruction}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const parsed = JSON.parse(content) as { subject: string; body: string };
  return {
    subject: parsed.subject,
    body: parsed.body,
  };
}
