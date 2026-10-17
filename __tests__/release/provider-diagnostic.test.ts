/** @jest-environment node */
import {
  providerDiagnostic,
  redactProviderMessage,
  safeProviderDiagnostic,
} from "../../scripts/release/provider-diagnostic.mjs";

const fakeSecret = 'fixture-only"token:/with space\\and\nnewline=47';
const knownVariants = [
  fakeSecret,
  encodeURIComponent(fakeSecret),
  JSON.stringify(fakeSecret).slice(1, -1),
  Buffer.from(fakeSecret).toString("base64"),
  Buffer.from(fakeSecret).toString("base64url"),
];
const options = { secrets: [fakeSecret] };
const textOf = (value: unknown) =>
  typeof value === "string" ? value : (JSON.stringify(value) ?? "");
function expectNoKnownSecret(value: unknown) {
  const text = textOf(value);
  for (const variant of knownVariants) expect(text).not.toContain(variant);
  expect(text).not.toContain(JSON.stringify(fakeSecret).slice(1, -1));
}

describe("bounded provider diagnostics from actual CLI output shapes", () => {
  test.each([
    [
      "text",
      "",
      "Error: Upload exceeds the account limit of 20 MB; request was rejected.",
    ],
    [
      "JSON error envelope",
      JSON.stringify({
        status: "error",
        reason: "unexpected_error",
        error: {
          code: "size_limit_exceeded",
          message:
            "Upload exceeds the account limit of 20 MB; request was rejected.",
          statusCode: 413,
        },
      }),
      "",
    ],
    [
      "JSON text error",
      JSON.stringify({
        status: "error",
        reason: "size_limit_exceeded",
        error:
          "Upload exceeds the account limit of 20 MB; request was rejected.",
      }),
      "",
    ],
    [
      "JSON-lines with unrelated progress",
      [
        JSON.stringify({ type: "progress", message: "Checking project" }),
        JSON.stringify({
          level: "error",
          code: "size_limit_exceeded",
          message:
            "Upload exceeds the account limit of 20 MB; request was rejected.",
          statusCode: 413,
        }),
      ].join("\n"),
      "",
    ],
    [
      "progress then pretty JSON",
      "Vercel CLI 63.1.2\nUploading [===   ]\n" +
        JSON.stringify(
          {
            status: "error",
            error: {
              code: "size_limit_exceeded",
              message:
                "Upload exceeds the account limit of 20 MB; request was rejected.",
            },
          },
          null,
          2,
        ),
      "",
    ],
  ])(
    "retains actionable unknown error details from %s",
    (_, stdout, stderr) => {
      const diagnostic = providerDiagnostic(stdout, stderr);
      expect(diagnostic?.message).toContain("account limit of 20 MB");
      expect(diagnostic?.message?.length).toBeLessThanOrEqual(612);
      expect(diagnostic?.message).not.toContain("Checking project");
    },
  );

  test("retains unknown reason/code and HTTP status without requiring a fixed historical label", () => {
    expect(
      providerDiagnostic(
        JSON.stringify({
          status: "error",
          reason: "unexpected_error",
          error: {
            code: "size_limit_exceeded",
            message: "The upload cannot exceed 20 MB on this account.",
            statusCode: 413,
          },
          hint: "Run the suggested owner command",
          next: "vercel settings change",
          headers: { authorization: fakeSecret },
        }),
        "",
        options,
      ),
    ).toEqual({
      reason: "unexpected_error",
      code: "size_limit_exceeded",
      message: "The upload cannot exceed 20 MB on this account.",
      httpStatus: 413,
    });
  });

  test("extracts the terminal error after more than 16 KiB of progress", () => {
    const diagnostic = providerDiagnostic(
      "Uploading source chunk\n".repeat(2000) +
        JSON.stringify({
          status: "error",
          reason: "unexpected_error",
          error: {
            code: "upload_payload_rejected",
            message: "Upload payload exceeded the project size limit by 4 MB.",
          },
        }),
      "",
    );
    expect(diagnostic).toMatchObject({
      reason: "unexpected_error",
      code: "upload_payload_rejected",
      message: "Upload payload exceeded the project size limit by 4 MB.",
    });
  });

  test("bounded capture preserves the terminal failure even beyond the full capture window", () => {
    const diagnostic = providerDiagnostic(
      "unrelated progress\n".repeat(70000) +
        "\nError: Source upload failed because the project has reached its file limit.\n",
      "",
    );
    expect(diagnostic?.message).toContain("reached its file limit");
    expect(diagnostic?.message?.length).toBeLessThanOrEqual(612);
  });

  test("preserves structured multi-line details as readable bounded text", () => {
    const diagnostic = providerDiagnostic(
      JSON.stringify({
        status: "error",
        error: {
          code: "upload_payload_rejected",
          message:
            "Upload rejected.\nPayload 24 MB exceeds the 20 MB limit.\nRemove stale output before review.",
        },
      }),
      "",
    );
    expect(diagnostic?.message).toContain("Upload rejected.");
    expect(diagnostic?.message).toContain("24 MB exceeds the 20 MB limit");
    expect(diagnostic?.message).toContain("Remove stale output before review");
    expect(diagnostic?.message).not.toMatch(/[\r\n]/);
  });

  test("malformed JSON remains untrusted while an independent plain terminal error is retained", () => {
    const stdout = '{"status":"error","error":{"message":"' + fakeSecret;
    const diagnostic = providerDiagnostic(
      stdout,
      "Error: Deployment request was rejected before creation.",
      options,
    );
    expect(diagnostic?.message).toContain("rejected before creation");
    expectNoKnownSecret(diagnostic);
    expect(() => providerDiagnostic(stdout, "", options)).not.toThrow();
    expectNoKnownSecret(providerDiagnostic(stdout, "", options));
  });

  test("never promotes progress, hints, suggested commands or success messages into error details", () => {
    const diagnostic = providerDiagnostic(
      [
        JSON.stringify({ status: "ok", message: "No errors were found" }),
        JSON.stringify({ status: "progress", message: "Uploading source" }),
        JSON.stringify({
          status: "error",
          hint: "Error: run a private owner command",
          next: "vercel promote private-target",
        }),
      ].join("\n"),
      "Hint: Error: run a private owner command\nNext command: Error: vercel promote private-target",
    );
    expect(diagnostic).toBeUndefined();
  });
});

describe("credential redaction before provider diagnostics leave the process", () => {
  test.each([
    encodeURIComponent("postgresql://fixture:private@localhost/app"),
    "postgresql:\\/\\/fixture:private@localhost/app",
  ])(
    "redacts encoded connection strings from ordinary text %#",
    (connection) => {
      const diagnostic = providerDiagnostic(
        "",
        `Error: Provider rejected ${connection}; source upload denied.`,
      );
      expect(diagnostic?.message).toContain("source upload denied");
      for (const value of ["fixture", "private", "localhost", "postgresql"])
        expect(diagnostic?.message).not.toContain(value);
    },
  );
  test.each(knownVariants)(
    "removes a known credential transport representation %#",
    (variant) => {
      const message = redactProviderMessage(
        "Error: Upload rejected; credential " +
          variant +
          "; account file limit exceeded.",
        options,
      );
      expect(message).toContain("account file limit exceeded");
      expect(message).toContain("[REDACTED]");
      expectNoKnownSecret(message);
    },
  );

  test("sanitizes known credentials in structured, text, and already-parsed boundary inputs", () => {
    const message =
      "Request denied for " +
      encodeURIComponent(fakeSecret) +
      "; upload payload remains too large.";
    const candidates = [
      providerDiagnostic(
        JSON.stringify({
          status: "error",
          error: { code: "unexpected_error", message },
        }),
        "",
        options,
      ),
      providerDiagnostic("", "Error: " + message, options),
      safeProviderDiagnostic(
        {
          reason: "unexpected_error",
          message,
          headers: { cookie: fakeSecret },
          hint: fakeSecret,
        },
        options,
      ),
    ];
    for (const diagnostic of candidates) {
      expect(diagnostic?.message).toContain("upload payload remains too large");
      expectNoKnownSecret(diagnostic);
      expect(diagnostic).not.toHaveProperty("headers");
      expect(diagnostic).not.toHaveProperty("hint");
    }
  });

  test.each([
    ["Authorization", "Authorization: Bearer FAKE_AUTH_HEADER_VALUE_47"],
    ["Cookie", "Cookie: session=FAKE_COOKIE_VALUE_47; csrf=FAKE_CSRF_VALUE_47"],
    ["Set-Cookie", "Set-Cookie: session=FAKE_SET_COOKIE_VALUE_47; HttpOnly"],
    ["Bearer", "Bearer FAKE_BEARER_VALUE_47"],
    ["Basic", "Basic ZmFrZTpmaXh0dXJlLW9ubHk="],
    ["key-value", 'api_key="FAKE_API_KEY_VALUE_47"'],
    ["CLI token", "--token FAKE_CLI_TOKEN_VALUE_47"],
    [
      "Postgres URL",
      "postgresql://fakeuser:FAKE_DB_PASSWORD_47@localhost/private?sslmode=require",
    ],
    [
      "SQL connection fields",
      "host=fake-db.invalid user=fakeuser password=FAKE_SQL_PASSWORD_47 dbname=private",
    ],
    ["unlabeled opaque credential", "Qp8Zy2Lm5Ns9Kv4Br7Dx1Fa6Hg3Jt0Wc"],
    [
      "private key",
      "-----BEGIN PRIVATE KEY-----\nFAKE_PRIVATE_KEY_VALUE_47\n-----END PRIVATE KEY-----",
    ],
  ])(
    "removes %s values without a configured known-secret list",
    (_, sensitive) => {
      const message = redactProviderMessage(
        "Error: provider rejected upload.\n" +
          sensitive +
          "\nThe request exceeded the account file limit.",
      );
      expect(message).toContain("account file limit");
      expect(message).not.toContain(sensitive);
      expect(message).not.toContain("FAKE_");
      expect(message).not.toContain("fake-db.invalid");
      expect(message).not.toContain("fakeuser");
      expect(message).not.toContain("Qp8Zy2Lm5Ns9Kv4Br7Dx1Fa6Hg3Jt0Wc");
    },
  );

  test("redacts before truncation and never emits a planted token prefix at the boundary", () => {
    const shortSecret = "fixture:short/token+47";
    const message = redactProviderMessage(
      "Error: " +
        "safe words ".repeat(53) +
        shortSecret +
        " tail details ".repeat(100),
      { secrets: [shortSecret] },
    );
    expect(message).toContain("[REDACTED]");
    expect(message).not.toContain(shortSecret);
    expect(message).not.toContain("fixture:short");
    expect(message?.length).toBeLessThanOrEqual(612);
    expect(message).toContain("[truncated]");
  });

  test("hostile diagnostic identifiers, headers, status values and extra envelopes remain untrusted", () => {
    const diagnostic = safeProviderDiagnostic(
      {
        reason: fakeSecret,
        code: "unexpected_error\nCookie: FAKE_COOKIE_VALUE_47",
        message: "Request failed because the upload is too large.",
        httpStatus: 999,
        classification: "attacker-selected-classification",
        headers: { authorization: fakeSecret },
        body: fakeSecret,
      },
      options,
    );
    expect(diagnostic).toEqual({
      message: "Request failed because the upload is too large.",
    });
    expectNoKnownSecret(diagnostic);
  });
});

test("capture-window clipping cannot expose a suffix of a configured credential", () => {
  const suffix = "tailmarker47";
  const prefix = "short!fixture$";
  const secret = prefix + suffix;
  const retainedStart =
    suffix + " Error: upload failed before deployment creation.";
  const stream =
    prefix + retainedStart + " ".repeat(1024 * 1024 - retainedStart.length);
  const diagnostic = providerDiagnostic(stream, "", { secrets: [secret] });
  expect(textOf(diagnostic)).not.toContain(suffix);
});

test("line-wrapped configured credentials cannot leak a partial value from plain error fallback", () => {
  const prefix = "short!fixture$";
  const suffix = "tailmarker47";
  const diagnostic = providerDiagnostic(
    "",
    "Error: authentication failed for " +
      prefix +
      "\n" +
      suffix +
      " could not authenticate.",
    { secrets: [prefix + suffix] },
  );
  expect(textOf(diagnostic)).not.toContain(prefix);
  expect(textOf(diagnostic)).not.toContain(suffix);
});

test.each([
  [
    "URI encoded",
    encodeURIComponent("short!fixture$tailmarker47").slice(0, 16),
  ],
  [
    "base64",
    Buffer.from("short!fixture$tailmarker47").toString("base64").slice(0, 16),
  ],
  [
    "JSON escaped",
    JSON.stringify('short"fixture$tailmarker47').slice(1, -1).slice(0, 16),
  ],
])(
  "process-buffer clipping cannot leak a configured %s credential prefix",
  (_, partial) => {
    const secret =
      _ === "JSON escaped"
        ? 'short"fixture$tailmarker47'
        : "short!fixture$tailmarker47";
    const diagnostic = providerDiagnostic(
      "",
      "Error: authentication failed for " + partial,
      { secrets: [secret] },
    );
    expect(textOf(diagnostic)).not.toContain(partial);
  },
);

test.each([
  [
    "URI encoded",
    "short!fixture$tailmarker47",
    encodeURIComponent("short!fixture$tailmarker47"),
  ],
  [
    "base64",
    "short!fixture$tailmarker47",
    Buffer.from("short!fixture$tailmarker47").toString("base64"),
  ],
  [
    "JSON escaped",
    'short"fixture$tailmarker47',
    JSON.stringify('short"fixture$tailmarker47').slice(1, -1),
  ],
])(
  "line wrapping cannot expose a configured %s credential suffix",
  (_, secret, encoded) => {
    const middle = Math.floor(encoded.length / 2),
      prefix = encoded.slice(0, middle),
      suffix = encoded.slice(middle);
    const diagnostic = providerDiagnostic(
      "",
      "Error: authentication failed for " +
        prefix +
        "\n" +
        suffix +
        " could not authenticate.",
      { secrets: [secret] },
    );
    expect(diagnostic?.message ?? "").not.toContain(prefix);
    expect(diagnostic?.message ?? "").not.toContain(suffix);
  },
);
