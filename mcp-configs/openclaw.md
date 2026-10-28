# OpenClaw

OpenClaw reads MCP servers from `mcp.servers` in `~/.openclaw/openclaw.json`.

## The GenesisPay catalog

The catalog is public and read-only: it searches products and shops listed on
GenesisPay and reads verified-purchase reviews. No account, no key, and no tool
that pays or orders.

```bash
openclaw mcp set genesispay-catalog '{"url":"https://catalog.genesispay.finance/mcp/catalog","transport":"streamable-http"}'
openclaw mcp probe genesispay-catalog
```

## The catalog skill

Install the skill from ClawHub once it is published there
(`openclaw skills install @Smokefarmer/genesispay-catalog`), or from a clone
of this repository:

```bash
git clone --depth 1 https://github.com/GenesisTechAT/genesispay-agent-skill
openclaw skills install ./genesispay-agent-skill/agent-plugins/genesispay-catalog/skills/genesispay-catalog
```

See [`agent-plugins/genesispay-catalog`](../agent-plugins/genesispay-catalog)
for what the catalog's tools do.
