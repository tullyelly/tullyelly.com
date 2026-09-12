/** @jest-environment node */

const mockSend = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: (...args: unknown[]) => mockSend(...args),
    },
  })),
}));

import { Resend } from "resend";
import { sendCommentNotification } from "@/lib/email/sendCommentNotification";

const mockResend = jest.mocked(Resend);

const notification = {
  commentId: "comment-123",
  postSlug: "test-chronicle",
  commenterDisplayName: "Test Commenter",
  commentBody: "This is the full comment body.",
  createdAt: new Date("2026-09-11T15:30:00.000Z"),
};

const emailEnvironment = [
  "RESEND_API_KEY",
  "COMMENT_NOTIFICATION_TO",
  "COMMENT_NOTIFICATION_FROM",
  "NEXT_PUBLIC_SITE_URL",
] as const;

const originalEnvironment = Object.fromEntries(
  emailEnvironment.map((key) => [key, process.env[key]]),
);

function configureEmail() {
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.COMMENT_NOTIFICATION_TO = "owner@example.com";
  process.env.COMMENT_NOTIFICATION_FROM = "Chronicles <comments@example.com>";
  process.env.NEXT_PUBLIC_SITE_URL = "https://tullyelly.com";
}

describe("sendCommentNotification", () => {
  beforeEach(() => {
    mockResend.mockClear();
    mockSend.mockReset();
    for (const key of emailEnvironment) {
      delete process.env[key];
    }
  });

  afterAll(() => {
    for (const key of emailEnvironment) {
      const originalValue = originalEnvironment[key];
      if (originalValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalValue;
      }
    }
  });

  it("does not initialize Resend or send when configuration is absent", async () => {
    await expect(sendCommentNotification(notification)).resolves.toBe(false);

    expect(mockResend).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("sends the complete notification with a comments deep link", async () => {
    configureEmail();
    mockSend.mockResolvedValue({
      data: { id: "email-123" },
      error: null,
      headers: null,
    });

    await expect(sendCommentNotification(notification)).resolves.toBe(true);

    expect(mockResend).toHaveBeenCalledWith("re_test_key");
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Chronicles <comments@example.com>",
        to: "owner@example.com",
        subject: "New comment on test-chronicle",
        text: expect.stringContaining("This is the full comment body."),
        html: expect.stringContaining("This is the full comment body."),
      }),
    );

    const [message] = mockSend.mock.calls[0] as [
      { text: string; html: string },
    ];
    expect(message.text).toContain(
      "https://tullyelly.com/shaolin/test-chronicle#comments",
    );
    expect(message.html).toContain(
      'href="https://tullyelly.com/shaolin/test-chronicle#comments"',
    );
    expect(message.text).toContain("Test Commenter");
    expect(message.text).toContain("2026-09-11T15:30:00.000Z");
    expect(message.text).toContain("comment-123");
  });

  it("escapes commenter-controlled values in the HTML message", async () => {
    configureEmail();
    mockSend.mockResolvedValue({
      data: { id: "email-123" },
      error: null,
      headers: null,
    });

    await sendCommentNotification({
      ...notification,
      postSlug: 'test&chronicle"><',
      commenterDisplayName: '<img src=x onerror="alert(1)">',
      commentBody: '<script>alert("unsafe")</script> & more\nnext line',
    });

    const [message] = mockSend.mock.calls[0] as [{ html: string }];
    expect(message.html).not.toContain("<script>");
    expect(message.html).not.toContain("<img");
    expect(message.html).not.toContain('onerror="alert(1)"');
    expect(message.html).toContain(
      "&lt;script&gt;alert(&quot;unsafe&quot;)&lt;/script&gt; &amp; more",
    );
    expect(message.html).toContain(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
    expect(message.html).toContain(
      'href="https://tullyelly.com/shaolin/test&amp;chronicle&quot;&gt;&lt;#comments"',
    );
  });

  it("rejects when Resend returns an API error", async () => {
    configureEmail();
    mockSend.mockResolvedValue({
      data: null,
      error: {
        name: "invalid_api_key",
        message: "API key is invalid",
        statusCode: 403,
      },
      headers: null,
    });

    await expect(sendCommentNotification(notification)).rejects.toThrow(
      "Resend rejected comment notification (invalid_api_key, status 403)",
    );
  });
});
