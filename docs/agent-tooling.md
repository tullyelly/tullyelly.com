# Project agent tooling

Codex project skills live in `.agents/skills`. Vercel skills were installed from
the sources linked in the [official directory](https://vercel.com/docs/agent-resources/skills):

| Skill                       | Source path                                                | Files |
| --------------------------- | ---------------------------------------------------------- | ----- |
| vercel-cli                  | vercel/vercel: skills/vercel-cli                           | 28    |
| next-best-practices         | vercel-labs/openreview: .agents/skills/next-best-practices | 20    |
| vercel-react-best-practices | vercel-labs/agent-skills: skills/react-best-practices      | 76    |
| web-design-guidelines       | vercel-labs/agent-skills: skills/web-design-guidelines     | 1     |

The React skill directory uses its declared skill name. Existing repository and
Neon skills remain in place. Reload Codex to discover newly installed skills.

Project MCP configuration is `.codex/config.toml`. It retains the existing Neon
read-only endpoint and adds `mcp_servers.vercel` with URL
`https://mcp.vercel.com`. No token is stored in this file. Follow the
[official Vercel MCP instructions](https://vercel.com/docs/agent-resources/vercel-mcp)
and approve the browser OAuth prompt through the Codex MCP connection UI after
reloading. A URL entry alone does not establish authenticated connectivity.

Verification on October 10, 2026:

- All four skill entrypoints exist and declare the expected names; TOML parses.
- Existing Vercel CLI 63.1.2 on WSL Node 22.18.0 runs successfully;
  `vercel whoami --non-interactive` confirms the existing `tullyelly` login.
- The MCP endpoint responds with HTTP 401 and an OAuth resource metadata
  challenge without credentials. Authenticated tool discovery remains pending.
- The terminal's Codex CLI 0.25.0 lacks the documented `mcp add` subcommand.
  Its HTTP MCP compatibility is unverified. No CLI upgrade was performed;
  use the current Codex client connection UI, or update the terminal CLI separately
  if terminal MCP access is needed.
- This checkout has no `.vercel/project.json`; no project link was created.

No deployments, production settings changes, database access, commits, or pull
requests were performed. Global Codex settings, VS Code/WSL settings, npm
dependencies, authentication files, environment files, `vercel.json`, existing
Neon configuration, and the user's unrelated `.gitignore` edit were preserved.

Skills are upstream guidance; repository instructions and explicit user
authorization still govern actions. Installing a CLI skill does not authorize
deployments, environment pulls, project linking, or production changes.
