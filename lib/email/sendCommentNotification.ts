import "server-only";

import { Resend } from "resend";

export type CommentNotification = {
  commentId: string;
  postSlug: string;
  commenterDisplayName: string;
  commentBody: string;
  createdAt: string | Date;
};

type CommentNotificationConfig = {
  apiKey: string;
  from: string;
  siteUrl: string;
  to: string;
};

function getCommentNotificationConfig(): CommentNotificationConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.COMMENT_NOTIFICATION_FROM?.trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  const to = process.env.COMMENT_NOTIFICATION_TO?.trim();

  if (!apiKey || !from || !siteUrl || !to) {
    return null;
  }

  return { apiKey, from, siteUrl, to };
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

function formatTimestamp(createdAt: string | Date): string {
  return createdAt instanceof Date ? createdAt.toISOString() : createdAt;
}

export async function sendCommentNotification(
  notification: CommentNotification,
): Promise<boolean> {
  const config = getCommentNotificationConfig();
  if (!config) {
    return false;
  }

  const timestamp = formatTimestamp(notification.createdAt);
  const chronicleUrl = `${config.siteUrl}/shaolin/${notification.postSlug}#comments`;
  const resend = new Resend(config.apiKey);
  const { error } = await resend.emails.send({
    from: config.from,
    to: config.to,
    subject: `New comment on ${notification.postSlug}`,
    text: [
      "A new Shaolin Chronicle comment was posted.",
      "",
      `Commenter: ${notification.commenterDisplayName}`,
      `Chronicle: ${notification.postSlug}`,
      `Comment ID: ${notification.commentId}`,
      `Timestamp: ${timestamp}`,
      "",
      notification.commentBody,
      "",
      `View the comments: ${chronicleUrl}`,
    ].join("\n"),
    html: [
      "<h1>New Shaolin Chronicle comment</h1>",
      `<p><strong>Commenter:</strong> ${escapeHtml(notification.commenterDisplayName)}</p>`,
      `<p><strong>Chronicle:</strong> ${escapeHtml(notification.postSlug)}</p>`,
      `<p><strong>Comment ID:</strong> ${escapeHtml(notification.commentId)}</p>`,
      `<p><strong>Timestamp:</strong> ${escapeHtml(timestamp)}</p>`,
      `<div style="white-space: pre-wrap">${escapeHtml(notification.commentBody)}</div>`,
      `<p><a href="${escapeHtml(chronicleUrl)}">View the comments</a></p>`,
    ].join("\n"),
  });

  if (error) {
    throw new Error(
      `Resend rejected comment notification (${error.name}, status ${error.statusCode ?? "unknown"}): ${error.message}`,
    );
  }

  return true;
}
