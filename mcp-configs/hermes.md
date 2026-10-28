# Hermes Agent

Hermes reads MCP servers from `mcp_servers` in `~/.hermes/config.yaml`.

## The GenesisPay catalog

The catalog is public and read-only: it searches products and shops listed on
GenesisPay and reads verified-purchase reviews. No account, no key, and no tool
that pays or orders.

```bash
hermes mcp add genesispay-catalog --url https://catalog.genesispay.finance/mcp/catalog
```

Or declare it yourself:

```yaml
mcp_servers:
  genesispay-catalog:
    url: https://catalog.genesispay.finance/mcp/catalog
```

The tools load in your next session (or after `/reload-mcp`).

## Plugin with the catalog skill

The [`genesispay-catalog`](../agent-plugins/genesispay-catalog) plugin bundles
the same server with a short skill on how to use it:

```bash
hermes plugins install GenesisTechAT/genesispay-agent-skill/agent-plugins/genesispay-catalog --no-enable
hermes plugins enable genesispay-catalog
```
