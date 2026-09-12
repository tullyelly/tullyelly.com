/** @jest-environment node */

import { POST } from "@/app/api/comments/route";

const mockAfter = jest.fn();
const mockGetCurrentUser = jest.fn();
const mockSendCommentNotification = jest.fn();
const mockSql = jest.fn();

jest.mock("next/server", () => ({
  after: (callback: () => Promise<void>) => mockAfter(callback),
}));

jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));

jest.mock("@/lib/db", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    mockSql(strings, values),
}));

jest.mock("@/lib/email/sendCommentNotification", () => ({
  sendCommentNotification: (notification: unknown) =>
    mockSendCommentNotification(notification),
}));

function makeRequest() {
  return new Request("http://localhost/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      postSlug: "test-chronicle",
      body: "This is a comment.",
    }),
  });
}

describe("POST /api/comments notifications", () => {
  beforeEach(() => {
    mockAfter.mockReset();
    mockGetCurrentUser.mockReset();
    mockSendCommentNotification.mockReset();
    mockSql.mockReset();

    mockGetCurrentUser.mockResolvedValue({ id: "user-123" });
    mockSql.mockResolvedValue([
      {
        id: "comment-123",
        post_slug: "test-chronicle",
        user_id: "user-123",
        user_name: "Test Commenter",
        body: "This is a comment.",
        created_at: new Date("2026-09-11T15:30:00.000Z"),
      },
    ]);
  });

  it("keeps a created comment successful when notification delivery fails", async () => {
    let notificationCallback: (() => Promise<void>) | undefined;
    mockAfter.mockImplementation((callback: () => Promise<void>) => {
      notificationCallback = callback;
    });
    mockSendCommentNotification.mockRejectedValue(
      new Error("Resend unavailable"),
    );
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const response = await POST(makeRequest());

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: "comment-123",
      post_slug: "test-chronicle",
      user_id: "user-123",
      user_name: "Test Commenter",
      body: "This is a comment.",
      created_at: "2026-09-11T15:30:00.000Z",
    });
    expect(mockAfter).toHaveBeenCalledTimes(1);
    expect(mockSendCommentNotification).not.toHaveBeenCalled();

    await expect(notificationCallback?.()).resolves.toBeUndefined();
    expect(mockSendCommentNotification).toHaveBeenCalledWith({
      commentId: "comment-123",
      postSlug: "test-chronicle",
      commenterDisplayName: "Test Commenter",
      commentBody: "This is a comment.",
      createdAt: "2026-09-11T15:30:00.000Z",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[comments] notification failed",
      expect.objectContaining({
        commentId: "comment-123",
        postSlug: "test-chronicle",
        error: expect.any(Error),
      }),
    );

    consoleError.mockRestore();
  });
});
