import { redactSecrets } from "@/lib/profile/redact";

describe("redactSecrets", () => {
  it("redacts matching keys deeply", () => {
    const input = {
      token: "abc",
      nested: {
        refresh_token: "xyz",
        safe: "value",
        items: [{ sessionToken: "123" }, { id: "ok", secretKey: "nope" }],
      },
    };

    const output = redactSecrets(input);

    expect(output).toEqual({
      token: "[REDACTED]",
      nested: {
        refresh_token: "[REDACTED]",
        safe: "value",
        items: [
          { sessionToken: "[REDACTED]" },
          { id: "ok", secretKey: "[REDACTED]" },
        ],
      },
    });

    expect(input.nested.refresh_token).toBe("xyz");
  });

  it("returns primitives untouched", () => {
    expect(redactSecrets("plain")).toBe("plain");
    expect(redactSecrets(5)).toBe(5);
    expect(redactSecrets(null)).toBeNull();
    expect(redactSecrets(undefined)).toBeUndefined();
  });
});
