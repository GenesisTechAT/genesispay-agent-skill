# OpenClaw

OpenClaw reads MCP servers from `mcp.servers` in `~/.openclaw/openclaw.json`.

## Hosted, with OAuth (no key to copy)

```bash
openclaw mcp set genesispay '{"url":"https://genesispay.finance/mcp","transport":"streamable-http","auth":"oauth"}'
openclaw mcp login genesispay
```

`login` prints a GenesisPay sign-in URL and waits on `http://127.0.0.1:8989/oauth/callback`.
Open the URL, sign in and approve access for **OpenClaw MCP**. Check the result with
`openclaw mcp probe genesispay`; sign out with `openclaw mcp logout genesispay`.
If the browser runs on another machine, copy the `code` from the redirect and run
`openclaw mcp login genesispay --code <code>`.

## Local stdio server with an agent key

[`openclaw.json`](openclaw.json) runs the same tools through
`npx -y @genesis-tech/genesispay-mcp@2.0.0` with `GENESISPAY_AGENT_KEY` and
`GENESISPAY_BASE_URL`.

Either way, GenesisPay enforces your spending limits and approvals server-side.

## Catalog only

To search GenesisPay without an account and without any payment tool, see
[`agent-plugins/genesispay-catalog`](../agent-plugins/genesispay-catalog).
