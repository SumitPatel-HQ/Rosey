import OpenAI from "openai";
import type { Lead, SendEmailNodeData } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_BASE_URL,
});

export async function generateMessage(
  nodeData: SendEmailNodeData,
  lead: Lead
): Promise<{ subject: string; body: string }> {
  const interpolate = (text: string) =>
    text
      .replace(/\{\{name\}\}/g, lead.name)
      .replace(/\{\{email\}\}/g, lead.email)
      .replace(/\{\{company\}\}/g, lead.company || "your company")
      .replace(/\{\{industry\}\}/g, lead.industry || "your industry");

  const subjectPrompt = interpolate(nodeData.subject_prompt || "Write a professional outreach email subject line");
  const bodyPrompt = interpolate(nodeData.body_prompt || "Write a professional outreach email");

  const completion = await openai.chat.completions.create({
    model: "gpt-5.3-chat",
    messages: [
      {
        role: "system",
        content:
          "You are an expert B2B outreach copywriter. Write concise, personalized, professional emails. " +
          "Respond with JSON: {\"subject\": \"...\", \"body\": \"<html>...</html>\"}. " +
          "The body should be valid HTML suitable for email. Keep it brief (3-5 sentences).",
      },
      {
        role: "user",
        content: `Subject guidance: ${subjectPrompt}\n\nBody guidance: ${bodyPrompt}\n\nRecipient: ${lead.name} at ${lead.company || "unknown company"} in ${lead.industry || "unknown industry"}.`,
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
