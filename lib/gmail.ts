import { google } from "googleapis";

function getGmailClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });
  return google.gmail({ version: "v1", auth: oauth2Client });
}

export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  threadId?: string
): Promise<{ messageId: string; threadId: string }> {
  const gmail = getGmailClient();

  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const messageParts = [
    `From: ${process.env.GMAIL_USER_EMAIL}`,
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "",
    htmlBody,
  ];

  const rawMessage = Buffer.from(messageParts.join("\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: rawMessage,
      threadId: threadId || undefined,
    },
  });

  return {
    messageId: res.data.id!,
    threadId: res.data.threadId!,
  };
}

export async function getOrCreateLabel(name: string): Promise<string> {
  const gmail = getGmailClient();

  const res = await gmail.users.labels.list({ userId: "me" });
  const existing = res.data.labels?.find((l) => l.name === name);
  if (existing) return existing.id!;

  const created = await gmail.users.labels.create({
    userId: "me",
    requestBody: {
      name,
      messageListVisibility: "show",
      labelListVisibility: "labelShow",
    },
  });
  return created.data.id!;
}

export async function applyLabelToThread(
  threadId: string,
  labelId: string
): Promise<void> {
  const gmail = getGmailClient();
  await gmail.users.threads.modify({
    userId: "me",
    id: threadId,
    requestBody: {
      addLabelIds: [labelId],
    },
  });
}

export async function hasThreadReceivedReply(
  threadId: string,
  senderEmail: string
): Promise<boolean> {
  const gmail = getGmailClient();

  const res = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "metadata",
    metadataHeaders: ["From"],
  });

  const messages = res.data.messages || [];
  if (messages.length <= 1) return false;

  return messages.slice(1).some((msg) => {
    const fromHeader = msg.payload?.headers?.find(
      (h) => h.name?.toLowerCase() === "from"
    );
    return fromHeader && !fromHeader.value?.includes(senderEmail);
  });
}
