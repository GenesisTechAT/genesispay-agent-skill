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

Once the entry is live in the Hermes plugin catalog:

```bash
hermes plugins install genesispay-catalog
hermes plugins enable genesispay-catalog
```

Until then, directly from this repository:

```bash
hermes plugins install GenesisTechAT/genesispay-agent-skill/agent-plugins/genesispay-catalog --no-enable
hermes plugins enable genesispay-catalog
```

The tools load in your next session (or after `/reload-mcp`). Try:

> Which shops are on GenesisPay?

## Install in OpenClaw

Add the server, then install the skill from ClawHub once it is published there:

```bash
openclaw mcp set genesispay-catalog '{"url":"https://catalog.genesispay.finance/mcp/catalog","transport":"streamable-http"}'
openclaw skills install @Smokefarmer/genesispay-catalog
```

Or install the skill from a clone of this repository:

```bash
git clone --depth 1 https://github.com/GenesisTechAT/genesispay-agent-skill
openclaw skills install ./genesispay-agent-skill/agent-plugins/genesispay-catalog/skills/genesispay-catalog
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

## Buying

The catalog never pays or orders. Each result's `howToBuy` field and page link
say where it is bought, typically the shop's own checkout.

## License

MIT
