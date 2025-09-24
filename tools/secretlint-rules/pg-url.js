const messages = {
  CREDENTIALS: "Potential secret: Postgres URL with credentials detected",
  NEON_HOST: "Potential secret: Neon host appears in committed text",
};

const creator = {
  meta: {
    id: "custom-pg-url",
    docs: { description: "Flag postgres URLs with creds or Neon hosts" },
    type: "scanner",
    supportedContentTypes: ["text"],
    messages,
  },
  create(context) {
    const pgWithCreds =
      /\bpostgres(?:ql)?:\/\/[^:\/\s]+:[^@\s]+@[^\/\s]+\/[^\s"'`?]+/gi;
    const neonHost = /\bep-[a-z0-9-]+\.c-\d\.[a-z0-9-]+\.aws\.neon\.tech\b/gi;

    // allow-list for obvious dummy locals or placeholders
    const allowDummy =
      /\bpostgres(?:ql)?:\/\/(?:[a-z0-9._-]+:[^@\s]+@)?(localhost|127\.0\.0\.1)(:\d+)?\/[a-z0-9_-]+/i;

    return {
      file({ content }) {
        let match;

        while ((match = pgWithCreds.exec(content))) {
          const value = match[0];
          if (value.includes("<") || value.includes(">")) continue;
          if (allowDummy.test(value)) continue;
          context.report({
            message: messages.CREDENTIALS,
            messageId: "CREDENTIALS",
            range: [match.index, match.index + value.length],
          });
        }

        while ((match = neonHost.exec(content))) {
          const value = match[0];
          context.report({
            message: messages.NEON_HOST,
            messageId: "NEON_HOST",
            range: [match.index, match.index + value.length],
          });
        }
      },
    };
  },
};

module.exports = { creator };
