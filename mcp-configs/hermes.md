# Hermes Agent

Hermes reads MCP servers from `mcp_servers` in `~/.hermes/config.yaml`.

## Hosted, with OAuth (no key to copy)

```bash
hermes mcp add genesispay --url https://genesispay.finance/mcp --auth oauth --connect-timeout 300
```

Your browser opens the GenesisPay sign-in. Approve access for **Hermes Agent**;
the command waits up to five minutes, then lists the tools. They load in your
next session (or after `/reload-mcp`). Sign in again later with
`hermes mcp login genesispay`.

## Local stdio server with an agent key

```yaml
mcp_servers:
  genesispay:
    command: "npx"
    args: ["-y", "@genesis-tech/genesispay-mcp@2.0.0"]
    env:
      GENESISPAY_AGENT_KEY: "gp_ag_your_key"
      GENESISPAY_BASE_URL: "https://your-genesispay-instance.example"
```

## Asking before each payment

Either way, mark the server untrusted so Hermes asks you before every tool call
that is not read-only, `genesispay_pay` included:

```yaml
mcp_servers:
  genesispay:
    # … one of the two forms above …
    trust: untrusted
```

GenesisPay still enforces your spending limits and approvals server-side; this
adds a confirmation in Hermes on top.

## The skill

```bash
hermes skills install https://raw.githubusercontent.com/GenesisTechAT/genesispay-agent-skill/main/SKILL.md
```

## Catalog only

To search GenesisPay without an account and without any payment tool, install
the read-only catalog plugin instead: see
[`agent-plugins/genesispay-catalog`](../agent-plugins/genesispay-catalog).
