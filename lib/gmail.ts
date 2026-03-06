import { google } from "googleapis";

function normalizeEmail(value: string | undefined | null): string | null {
  if (!value) return null;
  const match = value.match(/<([^>]+)>/);
  const email = (match?.[1] || value).trim().toLowerCase();
  return email || null;
}

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

export async function sendEmail(params: {
  to: string;
  subject: string;
  htmlBody: string;
  threadId?: string;
  replyToMessageId?: string;
}): Promise<{ messageId: string; threadId: string; rfcMessageId: string | null }> {
  const gmail = getGmailClient();
  const { to, subject, htmlBody, threadId, replyToMessageId } = params;

  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const messageParts = [
    `From: ${process.env.GMAIL_USER_EMAIL}`,
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    ...(replyToMessageId
      ? [
          `In-Reply-To: ${replyToMessageId}`,
          `References: ${replyToMessageId}`,
        ]
      : []),
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

  const sentMessageId = res.data.id!;
  const metadata = await gmail.users.messages.get({
    userId: "me",
    id: sentMessageId,
    format: "metadata",
    metadataHeaders: ["Message-ID"],
  });
  const messageIdHeader =
    metadata.data.payload?.headers?.find(
      (header) => header.name?.toLowerCase() === "message-id"
    )?.value || null;

  return {
    messageId: sentMessageId,
    threadId: res.data.threadId!,
    rfcMessageId: messageIdHeader,
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

export async function applyLabelToMessage(
  messageId: string,
  labelId: string
): Promise<void> {
  const gmail = getGmailClient();
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
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
  const normalizedSender = normalizeEmail(senderEmail);

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
    const fromEmail = normalizeEmail(fromHeader?.value);
    return Boolean(fromEmail && normalizedSender && fromEmail !== normalizedSender);
  });
}

function decodeMessageBody(
  payload: {
    mimeType?: string | null;
    body?: { data?: string | null } | null;
    parts?: typeof payload[] | null;
  } | null | undefined
): string {
  if (!payload) return "";

  // Prefer text/html, fall back to text/plain
  if (
    payload.mimeType === "text/html" ||
    payload.mimeType === "text/plain"
  ) {
    const data = payload.body?.data;
    if (data) {
      const decoded = Buffer.from(
        data.replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
      ).toString("utf-8");
      if (payload.mimeType === "text/plain") {
        return decoded.replace(/\n/g, "<br>");
      }
      return decoded;
    }
  }

  if (payload.parts) {
    // Try html part first
    const htmlPart = payload.parts.find((p) => p?.mimeType === "text/html");
    if (htmlPart) return decodeMessageBody(htmlPart);
    // Fall back to text/plain
    const textPart = payload.parts.find((p) => p?.mimeType === "text/plain");
    if (textPart) return decodeMessageBody(textPart);
    // Recurse into multipart
    for (const part of payload.parts) {
      const result = decodeMessageBody(part);
      if (result) return result;
    }
  }

  return "";
}

export async function getThreadMessages(
  threadId: string
): Promise<import("@/types").ThreadMessage[]> {
  const gmail = getGmailClient();
  const senderEmail = (process.env.GMAIL_USER_EMAIL || "").toLowerCase();

  const res = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "full",
  });

  const messages = res.data.messages || [];

  return messages.map((msg) => {
    const headers = msg.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

    const from = getHeader("from");
    const to = getHeader("to");
    const subject = getHeader("subject");
    const date = getHeader("date");
    const body = decodeMessageBody(msg.payload as Parameters<typeof decodeMessageBody>[0]);

    const fromEmail = normalizeEmail(from) || "";
    const isOutbound = Boolean(
      senderEmail && fromEmail && fromEmail === senderEmail.toLowerCase()
    );

    return {
      messageId: msg.id || "",
      from,
      to,
      subject,
      date,
      body,
      isOutbound,
    };
  });
}
