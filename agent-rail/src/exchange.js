// HypeLens Agent Rail — EXECUTION (builder-code monetized).
// Reuses Module 3 verbatim: hl-actions.js builds every action (builder fee
// pinned inside buildOrderAction), hl-signer.js signs through the vendored
// SDK with the deterministic-hash gate. TESTNET-FIRST: mainnet placement is
// hard-blocked by MAINNET_PLACEMENT_ENABLED=false inside the shipped
// hl-actions.js — flipping it requires the operator's testnet money-path
// proof + explicit sign-off, exactly like the extension.
//
// Env: HYPELENS_AGENT_PK   — agent-wallet private key (approved via approveAgent)
//      HYPELENS_NET        — 'testnet' (default) | 'mainnet' (blocked until enabled)
import { loadShipped } from './load.js';
import { pretradeCheck } from './core.js';

const net = () => process.env.HYPELENS_NET || 'testnet';

export function status() {
  const { actions, signer } = loadShipped();
  const st = signer.selfTest();
  return {
    net: net(),
    mainnetPlacementEnabled: actions.MAINNET_PLACEMENT_ENABLED,
    builder: actions.BUILDER, builderFeeTenthsBp: actions.BUILDER_F, maxFeeRate: actions.MAX_BUILDER_FEE_RATE,
    signerReady: st.ok, signerError: st.ok ? null : st.error,
    hasAgentKey: Boolean(process.env.HYPELENS_AGENT_PK)
  };
}

function assertPlacementAllowed(actions) {
  if (net() === 'mainnet' && !actions.MAINNET_PLACEMENT_ENABLED) {
    throw new Error('MAINNET PLACEMENT DISABLED — testnet money-path proof + operator sign-off required (Module 3 gate). Set HYPELENS_NET=testnet.');
  }
  if (!process.env.HYPELENS_AGENT_PK) throw new Error('HYPELENS_AGENT_PK not set — run the approve flow first (see approvePayloads)');
}

// One-time master-wallet approvals (EIP-712 payloads the MASTER signs in the
// user's own wallet — the rail never touches the master key):
//   1. approveAgent(agentAddress)  2. approveBuilderFee (0.01% to HypeLens)
export function approvePayloads(agentAddress) {
  const { actions } = loadShipped();
  return {
    approveAgent: actions.buildApproveAgent(net(), agentAddress),
    approveBuilderFee: actions.buildApproveBuilderFee(net()),
    note: 'Sign both with the MASTER wallet (EIP-712), POST each as {action, signature, nonce} to ' + actions.NET[net()].exchange
  };
}

export function newAgentWallet() {
  const { signer, sdk } = loadShipped();
  const pk = sdk.randomPrivateKey();
  return { privateKey: pk, address: signer.addressFromPrivateKey(pk), note: 'store as HYPELENS_AGENT_PK; approve via approvePayloads(address)' };
}

async function assetMeta(coin) {
  const { actions } = loadShipped();
  const r = await fetch(actions.NET[net()].info, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'meta' })
  });
  const meta = await r.json();
  const i = meta.universe.findIndex((u) => u.name === coin.toUpperCase());
  if (i < 0) throw new Error('coin not on ' + net() + ': ' + coin);
  return { assetIndex: i, szDecimals: meta.universe[i].szDecimals };
}

// Risk-checked order placement. Refuses verdict='danger' (liq inside a wall)
// unless override=true — the rail's whole point.
export async function placeOrder({ coin, isBuy, size, entryPx, slPx = null, tpPx = null, leverage = null, override = false, skipRiskCheck = false }) {
  const { actions, signer } = loadShipped();
  assertPlacementAllowed(actions);
  let risk = null;
  if (!skipRiskCheck && leverage) {
    // risk data is mainnet-real even when executing on testnet
    risk = await pretradeCheck({ coin, dir: isBuy ? 'long' : 'short', leverage, entryPx });
    if (risk.verdict === 'danger' && !override) {
      return { placed: false, refused: 'liq price ' + risk.liqPx + ' lands inside a $' + Math.round(risk.wall.sizeUsd / 1e6) + 'M wall — pass override:true to force', risk };
    }
  }
  const { assetIndex, szDecimals } = await assetMeta(coin);
  const action = actions.buildOrderAction({ assetIndex, szDecimals, isBuy, entryPx, size, slPx, tpPx });
  const nonce = actions.nonce();
  const signed = await signer.signL1(process.env.HYPELENS_AGENT_PK, action, nonce, net() === 'testnet', null);
  const res = await fetch(actions.NET[net()].exchange, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: signed.action, signature: signed.signature, nonce: signed.nonce })
  });
  const body = await res.json().catch(() => ({}));
  return { placed: res.ok && body.status === 'ok', net: net(), response: body, risk, builderFeeAttached: true };
}
