// Discover once, persist the purchase before sending, and recover that same order.
// npm install @genesis-tech/genesispay-agent@^1
// GENESISPAY_AGENT_KEY=gp_ag_... GENESISPAY_BASE_URL=https://your-instance.example \
//   node discover-and-pay.mjs "weather api" ./weather-order.json
// Re-run with the SAME order file after a timeout. Never delete it to retry.

import { randomUUID } from "node:crypto";
import { open, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  GenesisPayAgent,
  GenesisPayApprovalRejectedError,
  GenesisPayApprovalTimeoutError,
} from "@genesis-tech/genesispay-agent";

const query = process.argv[2] ?? "weather api";
const orderPath = process.argv[3];
if (!orderPath) throw new Error("Supply a durable order-file path as the third argument.");
const agent = new GenesisPayAgent();

async function readOrder() {
  const order = JSON.parse(await readFile(orderPath, "utf8"));
  if (!order || typeof order.idempotencyKey !== "string" || !order.idempotencyKey.trim() ||
      typeof order.url !== "string" || typeof order.maxAmountUsdc !== "string") {
    throw new Error("Invalid saved order. Recover its original identity; do not replace it.");
  }
  return order;
}

let order;
try {
  order = await readOrder();
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
  const [service] = await agent.discover(query, { limit: 5 });
  if (!service) throw new Error(`No services matched "${query}".`);
  const proposed = { idempotencyKey: randomUUID(), url: service.resourceUrl, maxAmountUsdc: service.priceUsdc };
  // Exclusive creation prevents concurrent processes from overwriting an order.
  let file;
  try {
    file = await open(orderPath, "wx", 0o600);
    await file.writeFile(JSON.stringify(proposed, null, 2));
    await file.sync();
    order = proposed;
  } catch (writeError) {
    if (writeError?.code !== "EEXIST") throw writeError;
    order = await readOrder();
  } finally {
    await file?.close();
  }
}

// Both new and concurrent/repeated readers flush the file and its directory
// before paying. A complete JSON read can precede the creator's own fsync.
const savedFile = await open(orderPath, "r");
try { await savedFile.sync(); } finally { await savedFile.close(); }
const savedDirectory = await open(dirname(resolve(orderPath)), "r");
try { await savedDirectory.sync(); } finally { await savedDirectory.close(); }

try {
  const result = await agent.pay(order.url, {
    idempotencyKey: order.idempotencyKey,
    maxAmountUsdc: order.maxAmountUsdc,
    waitForApproval: { timeoutMs: 5 * 60_000, pollIntervalMs: 5_000 },
  });
  console.log(`Payment ${result.paymentId}: ${result.status}`);
  if (result.response) console.log(result.body());
  else console.log("No captured resource body. Recover fulfillment from the merchant using this original payment ID.");
} catch (error) {
  if (error instanceof GenesisPayApprovalTimeoutError) {
    console.log(`Needs your approval: ${error.approvalUrl}`);
    console.log(`Follow payment ${error.payment.id}; keep this saved order file.`);
  } else if (error instanceof GenesisPayApprovalRejectedError) {
    console.log("The payment was denied or expired. Not retrying.");
  } else {
    // Includes unknown outcome/conflict: preserve this file and its original key.
    throw error;
  }
}
