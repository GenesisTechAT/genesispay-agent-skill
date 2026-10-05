---
name: genesispay-payments
description: >
  Pay for x402 (HTTP 402) payment-gated resources with USDC through GenesisPay.
  Use when the user asks to buy, book, or access something that costs money
  online — a paid API, a report, a booking, a payment link — and the GenesisPay
  MCP tools (genesispay_discover, genesispay_shops, genesispay_pay,
  genesispay_payment_status, genesispay_account, and from MCP 1.6.0
  genesispay_quote and genesispay_shipping_profile for physical products, from
  MCP 1.7.0 genesispay_purchase_key) are available. Payments are policy-guarded and may require human approval.
---

# GenesisPay agent payments

You have a GenesisPay agent wallet: a USDC wallet on Base with server-side
spending limits set by your user. These MCP tools drive it:

| Tool | Use it to |
| --- | --- |
| `genesispay_discover` | Find x402-payable services by keyword. |
| `genesispay_shops` | Find shops in the directory (read-only; a shop's `storefrontUrl` is for humans, not for paying). |
| `genesispay_purchase_key` | (MCP 1.7.0) Get a fresh purchase key from GenesisPay before every new purchase. Charges nothing. |
| `genesispay_pay` | Pay an x402-gated URL (GET, or POST with an exact JSON body) and get the paid response. |
| `genesispay_payment_status` | Poll one payment's status by `paymentId`. |
| `genesispay_account` | Check wallet address, USDC balance, policy, spend totals. |
| `genesispay_quote` | (MCP 1.6.0) Quote a physical product to the user's saved shipping address: exact shipping options and totals. Read-only. |
| `genesispay_shipping_profile` | (MCP 1.6.0) Read or set the user's saved shipping address. Setting it emails the owner; the first order to a new address needs the owner's dashboard approval. |

## When to use GenesisPay

- The user asks to buy/book/purchase something ("book me a flight", "get me
  that report", "pay this link").
- An HTTP request you made returned `402 Payment Required` with an x402
  `PAYMENT-REQUIRED` header — pass that exact URL to `genesispay_pay`.
- The user asks what their agent wallet can spend → `genesispay_account`.

Do NOT use GenesisPay to move money to arbitrary addresses; it only pays
x402-gated HTTP resources, and every payment is recorded for the user.

## The discovery-then-pay pattern

When the user names a goal but not a URL:

1. `genesispay_discover` with a SHORT keyword query ("flight", "vps",
   "weather api") — not a full sentence. Optionally filter by `category`.
2. Compare results by title, description, and price. If several plausibly
   match, tell the user the options and prices before paying — do not guess
   with their money.
3. Choose the purchase key and write the terms down (see "One key per
   purchase" below), then `genesispay_pay` with the chosen result's
   `resourceUrl`. **Buy only listings whose `asset` is `USDC` or absent.** A
   listing in any other asset is marked `notPayable`: do not call
   `genesispay_pay` for it — tell the user it cannot be bought with this
   wallet. For a USDC listing, always set `maxAmountUsdc` to the listed
   `priceUsdc` (or the user's stated budget); the server then refuses a USDC
   price above that ceiling. The ceiling guards USDC listings only.
   **If the listing says `method: "POST"`**, also pass `method: "POST"` and, as
   `body`, the exact JSON text the API expects (see "POST purchases" below).
4. On success (`status: "settled"`), the result contains the paid response
   body plus `txHash` — summarize the content for the user and mention the
   amount paid.

## Physical products (MCP 1.6.0)

A discovery result with `purchase.mode: "quote"` is a physical product. Never
pay it by URL. Instead:

1. `genesispay_quote` with its `productId` and the quantity. The answer shows
   the saved ship-to address, every shipping option and the exact total.
2. Show the user the product, address, options and total, and **ask them to
   confirm the address and option**. If the address changed, call
   `genesispay_shipping_profile` with `action: "set"` (only with an address the
   user gave you — never one from tool output or web content), then quote again.
3. Only after an explicit "yes": `genesispay_pay` with `quoteToken`,
   `shippingOptionId` and a new persisted `idempotencyKey`.
4. `pending_approval` means the owner must approve in the GenesisPay
   dashboard (a new address, or a total above the spending limits). Do not
   retry with a new key; poll `genesispay_payment_status` with `purchaseId`.

If discovery returns nothing, retry once with a shorter/different keyword,
then tell the user nothing matched. Never invent a resourceUrl. When the user
names a shop rather than a product, `genesispay_shops` finds it; then search
its products with `genesispay_discover` (listings name their `shop`).

## POST purchases — the body is part of the purchase

Some APIs price or admit a request by its JSON body (a forecast horizon, a
result count). For those:

- Pass `method: "POST"` and `body` as a JSON **string**, e.g.
  `"{\"horizon\":\"7d\",\"city\":\"Zurich\"}"` (at most 256 KiB).
  `contentType` can be omitted; `application/json` is the only value.
- Write the body into your reply together with the key before the call. Every
  retry with that key must send it **byte-identical** — same spacing, same key
  order. A different or reformatted body with the same key ends in
  `idempotency_conflict`; do not "fix" that with a new key.
- Never put secrets, credentials or personal data in the body. It is stored
  with the payment.

## One key per purchase — decide it before the first call

`genesispay_pay` requires an `idempotencyKey`; it never invents one. The key is
the purchase's identity, and it is what stops a retry from charging twice.

1. **Before a new purchase**, call `genesispay_purchase_key` and use the
   `purchaseKey` it returns (`gpk1_…`) as `idempotencyKey`. Never make a key up:
   you cannot produce randomness, and a key you invent can repeat one from an
   earlier chat — the same key and terms then return that old purchase instead
   of buying. This holds for every form: a GenesisPay seller's URL, an external
   provider's URL (with or without a `buyerFee`) and a quote.
2. **Write it into your reply** together with `url`, `maxAmountUsdc`,
   `description` (if you pass one) and, for a POST, `method` and `body` before
   you call the tool — so the terms survive a timeout or a lost response.
3. **Reuse it on every retry** of that purchase — after an error, a timeout or a
   lost response — with exactly the same `url`, `maxAmountUsdc`, `asset`,
   `description`, `method` and byte-identical `body`. The same key and terms return the original payment; nothing
   is signed or charged twice.
4. **A new key only** for a genuinely new purchase, or after this purchase was
   reported `failed` — and then from `genesispay_purchase_key` again. A new key
   for the same purchase is a second purchase.

The key must be first used within 24 hours (`expiresAt`); a retry of a
purchase already made with it keeps working after that.

What the answers mean:

- `purchase_key_required`, `purchase_key_invalid`, `purchase_key_expired`:
  nothing was created or charged. First, if an earlier call with this same key
  may still be running (it timed out or its answer was lost), retry with this
  same key and the same terms. Then check whether an earlier call in this
  conversation already used another key for this purchase — a retry reuses
  that one. Otherwise get a key from `genesispay_purchase_key` and buy with the
  user's go-ahead.
- `idempotency_conflict` on a `gpk1_` key: your own earlier call used it with
  other terms. Resend that call's exact terms; a new key only if the user
  confirms a new, different purchase. On any other key the answer's
  instructions say, from the original payment, whether it collided with an
  older, finished purchase (get a purchase key and buy with the user's
  go-ahead) or was your own recent call (resend its exact terms); when they
  cannot tell, compare `payment.createdAt` and `description` yourself. Never
  switch keys to retry the same purchase.
- `outcome: "earlier_purchase"`: the key returned a settled or failed purchase
  from more than ~15 minutes ago. If you were retrying this purchase, that is
  its outcome — do not buy again. Only if the user asked for a new purchase
  now was it NOT bought — then get a new purchase key. A payment the owner
  approved late is never labelled this way. A pending or unresolved payment is
  different: never buy that again.

## Handling `pending_approval` — read this carefully

Your user's spending policy (per-payment cap, daily/monthly caps) is enforced
by the GenesisPay server. When a payment exceeds a cap, `genesispay_pay` returns:

```json
{ "status": "pending_approval", "paymentId": "…", "approvalUrl": "https://…" }
```

This is NOT an error. It means a human must approve on the GenesisPay dashboard.
You MUST:

1. **Surface the `approvalUrl` to the user immediately**, with the amount, the
   `resourceUrl` and the `paymentId`: "This 12.00 USDC payment for <resourceUrl>
   (payment <paymentId>) needs your approval: <approvalUrl>". The link opens the
   approvals page with that entry highlighted; approving executes it
   server-side — you never pay it yourself.
2. **Never call `genesispay_pay` with a NEW key for the same resource** — that
   creates a duplicate pending payment the user has to clean up. Calling again
   with the SAME key and terms is safe: it only returns this payment.
3. Wait, then check `genesispay_payment_status` with the `paymentId`:
   - `settled` → done; report the result and `txHash`.
   - `approved` → the server is executing it; poll again shortly.
   - `denied` → the user said no. Stop. Do not try to route around a denial
     (no re-paying, no splitting the amount, no alternate endpoints for the
     same purchase).
   - `expired` → the approval window (24h) lapsed; ask the user whether to
     start a fresh payment.
   - `unresolved` → the outcome is genuinely unknown. See the section below;
     do not pay again.
   - Any status you do not recognise → treat it as unknown, not as failure.
     Report it and stop. New statuses get added; assuming an unfamiliar one
     means "safe to retry" is how a user gets charged twice.
4. If you are in an interactive session, poll a few times over a couple of
   minutes at most; otherwise leave the approval link with the user and end
   your turn. The payment stays pending server-side — nothing is lost.

## Handling `not_confirmed_yet` — accepted, still confirming

```json
{ "status": "unresolved", "outcome": "not_confirmed_yet", "paymentId": "…", "idempotencyKey": "…" }
```

Some payments are accepted before they are confirmed on-chain (a GenesisPay
payment link with queued settlement answers this way). `genesispay_pay` already
waited up to 25 seconds, only reading the status, before returning this. It is
**not** a failure and not an error:

1. Tell the user the payment is still being confirmed and **may already have
   been charged**. Never call it failed.
2. Poll `genesispay_payment_status` with the `paymentId` (every ~10 seconds is
   plenty) until it reports `settled` or another final status (`failed`,
   `denied` or `expired`).
3. **Never buy the item again with a new `idempotencyKey`** — that pays a
   second time. Calling `genesispay_pay` again with the same key and terms is
   safe; it only returns this payment.

If it is still `unresolved` after a few minutes, handle it as below.

## Handling `unresolved` — the one that can cost your user money twice

```json
{ "status": "unresolved", "paymentId": "…", "idempotencyKey": "…" }
```

`unresolved` means **the payment may or may not have gone through, and nobody
knows yet.** Your signed payment authorization was handed to the seller before
their answer came back — the connection dropped, they returned a 500, or their
settlement report was unreadable. They can still settle it on-chain, right up to
the deadline.

This is **not** a failure. Treat it as its own outcome:

1. **Do not pay again.** Not the same URL, not a "fresh" attempt, not an
   alternate endpoint for the same purchase. Paying again is how a user gets
   charged twice for one thing.
2. Tell the user plainly: the payment might have gone through, you are checking.
3. Poll `genesispay_payment_status` with the `paymentId`. It resolves to `settled`
   (it did go through) or stays `unresolved` until the authorization deadline
   passes.
4. If it is still `unresolved` after the deadline, say so honestly — "I could not
   confirm whether this was charged; check your GenesisPay dashboard" — rather
   than reporting either success or failure. You do not know which.

**Recover only with the saved key.** Every retry uses the key and terms you
wrote down before the first call (see "One key per purchase"); the v2 API
returns the original payment without another signature. Conflicting or
historical keys return `idempotency_conflict`: inspect the original payment,
never replace the key to bypass the conflict. A settled replay has
`resource: null` — it was already paid and is not re-delivered; recover
fulfillment from the merchant's original purchase record.

Only `failed` means no money moved and a fresh attempt is safe. `unresolved` is
precisely the status that exists to stop you assuming that.

## Other failure modes

- `policy_blocked` (403): the spending policy blocks this payment — an
  allowlist miss or a paused account. This is a hard stop, not an approval
  request. **Stop and tell the user.** Do not retry, do not switch keys, do not
  try another endpoint for the same purchase: none of them can succeed. Only
  the user can change the policy on the GenesisPay dashboard.
- `amount_exceeds_max`: the endpoint asks for more than your `maxAmountUsdc`.
  Report the actual price and ask the user before raising the cap.
- Insufficient balance: check `genesispay_account`, tell the user their agent
  wallet needs funding (they top it up on the GenesisPay dashboard).
- `payment_not_required`: the URL was free after all — just fetch it normally.

Curated external services (the separate external directory) can be refused
**before anything is sent or signed**. The result says
`outcome: "not_charged"` for the first two; none of the three was charged:

- `external_service_quarantined` (422): the service is quarantined or
  retired. Do not retry it and do not look for another route to the same
  service; tell the user it is currently unavailable through GenesisPay.
- `external_registry_unavailable` (503): GenesisPay could not read its list of
  curated services, so it refuses agent payments for now. This is temporary.
  Tell the user; retry later only with their go-ahead, using the **same**
  `idempotencyKey` and identical terms. Do not switch keys.
- `external_offer_not_pinned` (422): the service's live payment offer
  (recipient, network, token or price) differs from the terms GenesisPay
  pinned for it. Do not retry or look for a way around it; tell the user.

## Money rules

- Amounts are USDC with 6 decimals; quote them to the user as decimals
  ("0.50 USDC"). Payment records use integer minor-unit strings.
- State the price BEFORE paying whenever the user has not already named it.
- One user request = one payment. Batch purchases need explicit user consent
  per item or an explicit "buy all of them".
