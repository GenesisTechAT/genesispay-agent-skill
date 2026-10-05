# genesispay-agent-skill

Give your AI agent a wallet it can't blow up: this repo packages everything an
agent needs to pay for x402 (HTTP 402) resources through
[GenesisPay](https://genesispay.finance) — USDC on Base, with spending limits and
human approvals enforced server-side.

What's here:

| Path | Contents |
| --- | --- |
| [`SKILL.md`](SKILL.md) | The agent skill: when to use the GenesisPay tools, the discovery-then-pay pattern, and how to handle `pending_approval` and `unresolved` correctly. |
| [`mcp-configs/`](mcp-configs) | Copy-paste MCP server config for Claude Code, Codex, Claude Desktop, OpenClaw, and Hermes. |
| [`examples/`](examples) | Minimal scripts using [`@genesis-tech/genesispay-agent`](https://github.com/GenesisTechAT/genesispay-js) directly. |

## Prerequisites

1. A GenesisPay account with an agent account created (dashboard → Agents).
2. An agent API key (`gp_ag_...`) from the agent's Keys tab.
3. USDC in the agent wallet (fund from the agent's Overview tab; on Base
   Sepolia use the faucet panel).

## Quick start (Claude Code)

```bash
claude mcp add genesispay \
  --env GENESISPAY_AGENT_KEY=gp_ag_your_key \
  --env GENESISPAY_BASE_URL=https://your-genesispay-instance.example \
  -- npx -y @genesis-tech/genesispay-mcp@1.8.0

mkdir -p .claude/skills/genesispay-payments
cp SKILL.md .claude/skills/genesispay-payments/SKILL.md
```

Then just ask:

> Find a weather API I can pay for and get tomorrow's forecast for Vienna.
> Spend at most 0.50 USDC.

The agent will call `genesispay_discover`, pick a listing, and `genesispay_pay` its
`resourceUrl` with `maxAmountUsdc: "0.50"`.

## Quick start (Codex)

```bash
codex mcp add genesispay --env GENESISPAY_AGENT_KEY=gp_ag_your_key --env GENESISPAY_BASE_URL=https://your-genesispay-instance.example -- npx -y @genesis-tech/genesispay-mcp@1.8.0

cat SKILL.md >> AGENTS.md
```

Codex has no skills directory, so `AGENTS.md` is where the same instructions go.
See [`mcp-configs/codex.md`](mcp-configs/codex.md) for the `config.toml` form.

Other clients: see [`mcp-configs/`](mcp-configs) for Claude Desktop, OpenClaw,
and Hermes snippets — all run the same stdio server via `npx -y @genesis-tech/genesispay-mcp@1.8.0`
with the two env vars.

## How approvals work

Payments above the account's caps do not fail — they pause as
`pending_approval` and the tool result carries an `approvalUrl`. The skill
instructs the model to surface that URL to you (approve or deny on the GenesisPay
dashboard) and to poll `genesispay_payment_status` instead of retrying the
payment. Denials are final; approvals execute server-side.

## Body-priced APIs and "not confirmed yet"

From MCP server 1.1.0, `genesispay_pay` can buy an API priced by its request
body: when a discovery listing says `method: POST`, the model passes
`method: "POST"` and the exact JSON text as `body`. The body is part of the
purchase — a retry with the same key must send it byte-identical, and a
reformatted body with the same key ends in `idempotency_conflict`. Keep secrets
and personal data out of it. POST purchases need a GenesisPay deployment that
confirms them; against an older one the purchase is reported as an unknown
outcome, never as a success.

A payment accepted before it is confirmed on-chain makes `genesispay_pay` wait
up to 25 seconds, read-only. If it is still unconfirmed, the result says
`outcome: "not_confirmed_yet"`: the model tells you it may already have been
charged, polls `genesispay_payment_status`, and never buys again with a new key.

`genesispay_shops` searches the shop directory (read-only).

## Physical products (MCP server 1.6.0)

MCP 1.6.0 lists WooCommerce shop products in `genesispay_discover` as
`purchase.mode: "quote"`. `genesispay_quote` returns exact shipping options and
totals for the user's saved address (`genesispay_shipping_profile`), and
`genesispay_pay` with the quote token orders and pays in one step under the
same spending limits. A new address or an over-limit total waits for the
owner's dashboard approval; nothing is sent to the shop before that. Hosts that
support MCP Apps show an inline product card. See [`SKILL.md`](SKILL.md).

## Curated external services (MCP server 1.4.0)

MCP server 1.4.0 adds a separate, curated directory of independent x402
services (`genesispay_discover_external`), stored results
(`genesispay_result`), service descriptions and verified-purchase reviews.
A curated service can be refused before anything is sent or signed —
`external_service_quarantined`, `external_registry_unavailable` or
`external_offer_not_pinned`; the first two come back as
`outcome: "not_charged"`. [`SKILL.md`](SKILL.md) says how the model handles
each.

## Whose wallet is it

**Yours.** The agent wallet is an embedded wallet held at Privy and owned by
your GenesisPay account — not a pooled balance, and not a wallet GenesisPay
owns. GenesisPay signs payments from it only as an additional signer you
delegated, confined by a policy that permits signing a payment authorization and
nothing else, and you can withdraw that delegation from the dashboard at any
time: the signer is detached at Privy, permanently.

Two consequences worth knowing. Your agent's **budget is simply what you funded
that wallet with** — there is no separate ledger to drift, and the most a
compromise could ever spend is what is in it. And because what gets signed is a
real EIP-3009 authorization, your agent can pay **any** x402 server, not only
resources GenesisPay settles.

The agent API key is not a private key. It authenticates your agent to
GenesisPay; it cannot move money on its own, and every payment it triggers is
policy-checked server-side and recorded on your dashboard.

## The four tools

| Tool | Description |
| --- | --- |
| `genesispay_discover` | Keyword search over the GenesisPay discovery directory of x402-payable services. |
| `genesispay_pay` | Pay an x402-gated URL (optional `maxAmountUsdc` guard) and return the paid response. |
| `genesispay_payment_status` | Poll a payment (`pending_approval`, `approved`, `settled`, `denied`, `failed`, `expired`, `unresolved`). |
| `genesispay_account` | Wallet address, USDC balance, spending policy, spend totals. |

## `unresolved`: the status that stops double-charges

If a seller takes your agent's signed payment and then times out or errors, the
outcome is genuinely unknown — they can still settle it. GenesisPay records that
as **`unresolved`** rather than `failed`, because `failed` would claim no money
moved, and nobody knows that yet. The skill tells the model to report it
honestly and poll, never to pay again.

Before the first `genesispay_pay` call, generate and persist one `idempotencyKey`
with the purchase. The strict v2 tool requires it and never generates a hidden
key. Reuse it with identical request terms on retries. The original payment is
returned without another signature or resource fetch. A settled replay has
`resource: null`; recover fulfillment using the merchant's original payment
record. An `idempotency_conflict` names different or historical terms; inspect
the original payment instead of changing the key. Deploy v2 before updating the
SDK/MCP; v1 remains compatible for older integrations.

## Related

- SDKs and MCP server source: [GenesisTechAT/genesispay-js](https://github.com/GenesisTechAT/genesispay-js)
- npm: [`@genesis-tech/genesispay-mcp`](https://www.npmjs.com/package/@genesis-tech/genesispay-mcp),
  [`@genesis-tech/genesispay-agent`](https://www.npmjs.com/package/@genesis-tech/genesispay-agent)

## License

[MIT](LICENSE) © GenesisTech
