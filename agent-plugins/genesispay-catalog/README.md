# GenesisPay Catalog agent plugin

Search products, services and shops listed on
[GenesisPay](https://genesispay.finance/explore) from your agent, and read
their verified-purchase reviews.

This is a portable [Agent Plugins v1](https://agent-plugins.org/specification)
package. It contains:

- **`mcp.json`**: the hosted GenesisPay Catalog MCP server
  (`https://catalog.genesispay.finance/mcp/catalog`, Streamable HTTP). It is
  public and read-only: no sign-in, no key, and no tool that pays, orders or
  changes anything.
- **`skills/genesispay-catalog`**: an [Agent Skill](https://agentskills.io)
  that tells the agent how to search, compare, read reviews, and pass on how
  each result is bought.

There is no executable code and nothing that downloads or updates itself.

## Install in Hermes Agent

From the Hermes plugin catalog:

```bash
hermes plugins install genesispay-catalog
hermes plugins enable genesispay-catalog
```

Or directly from this repository:

```bash
hermes plugins install GenesisTechAT/genesispay-agent-skill/agent-plugins/genesispay-catalog --no-enable
hermes plugins enable genesispay-catalog
```

The tools load in your next session (or after `/reload-mcp`). Try:

> What's trending on GenesisPay right now?

## Install in OpenClaw

Add the server, then install the skill from ClawHub:

```bash
openclaw mcp set genesispay-catalog '{"url":"https://catalog.genesispay.finance/mcp/catalog","transport":"streamable-http"}'
openclaw skills install genesispay-catalog
```

## Tools

| Tool | What it does |
| --- | --- |
| `genesispay_catalog_search` | Search products and services by keyword, kind, shop or category. |
| `genesispay_catalog_shops` | Find shops listed on GenesisPay. |
| `genesispay_catalog_trending` | What is trending, ranked by recent distinct buyers. |
| `genesispay_catalog_reviews` | Published reviews and rating of one product or service. |

All four are annotated `readOnlyHint: true`.

## What the server sees

Your search terms, filters and requested ids reach
`catalog.genesispay.finance`, which GenesisPay (Genesis Technologies) operates.
Nothing identifies you: there is no sign-in, and the plugin stores no
credentials. The server is rate limited per client.

## Buying is a separate connection

The catalog never pays. To let an agent buy within limits you set, connect the
separate GenesisPay MCP server at `https://genesispay.finance/mcp` (OAuth
sign-in to your own GenesisPay account; spending limits and approvals are
enforced by GenesisPay, not by the agent). In Hermes:

```bash
hermes mcp add genesispay --url https://genesispay.finance/mcp --auth oauth --connect-timeout 300
```

Only add it if you want your agent to spend from your GenesisPay agent wallet.
See the [GenesisPay MCP docs](https://genesispay.finance/docs/mcp).

## License

MIT
