import OpenAI from "openai";
import type { Lead } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_BASE_URL,
});

/**
 * Generate an email subject and HTML body from a single natural-language prompt.
 *
 * @param prompt  - The campaign author's intent, e.g. "Announce our strawberry promo with humour".
 * @param lead    - When provided the AI personifies the email for that specific lead.
 *                  When null the AI uses {{name}}, {{company}}, {{industry}} as literal
 *                  placeholders so one template can be substituted for every lead.
 * @param productDescription - Optional product context injected into the system prompt.
 */
export async function generateMessage(
  prompt: string,
  lead: Lead | null,
  productDescription?: string
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

  const completion = await openai.chat.completions.create({
    model: "gpt-5.3-chat",
    messages: [
      {
        role: "system",
        content:
          "You are an expert B2B outreach copywriter. " +
          (productDescription ? `The product being promoted is: ${productDescription}. ` : "") +
          "Based on the user's instructions, generate both a subject line and an email body. " +
          'Respond with JSON: {"subject": "...", "body": "<html>...</html>"}. ' +
          "The body must be valid HTML suitable for email. Keep it concise (3-5 sentences).",
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
