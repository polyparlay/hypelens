// HypeLens Module 3 — Hyperliquid EXCHANGE action builders (PURE, no signing).
// -----------------------------------------------------------------------------
// Testnet-first. The BUILDER address is PINNED here and must NEVER be read from
// the page. All numeric normalization (float_to_wire, szDecimals) lives here so
// it can be unit-tested; the vendored SDK's actionSorter still owns msgpack key
// order for the hash. Exposes window.HLX3.actions.
(function (g) {
  'use strict';
  const X3 = g.HLX3 = g.HLX3 || {};

  // --- HARD BLOCK: mainnet placement is DISABLED in code until testnet proof +
  // an explicit, separate operator sign-off. While false, the mainnet network
  // option is hidden, setNet('mainnet') is refused, and any mainnet /exchange
  // POST is rejected (defense-in-depth in the background too). ---
  const MAINNET_PLACEMENT_ENABLED = false;

  // --- PINNED constants (never sourced from the page) ---
  const BUILDER = '0x9548B8E9554a1968843B3C380431b10996247c88';   // HypeLens builder
  const BUILDER_F = 10;                 // f=10 tenths-of-a-bp = 1bp = 0.01% (f ≤ 100 perps)
  const MAX_BUILDER_FEE_RATE = '0.01%'; // approveBuilderFee maxFeeRate
  const AGENT_NAME = 'hypelens';
  const SIGNATURE_CHAIN_ID = '0x66eee'; // 421614 (Arbitrum Sepolia) for user-signed actions
  const EIP712_DOMAIN = { name: 'HyperliquidSignTransaction', version: '1', chainId: 421614, verifyingContract: '0x0000000000000000000000000000000000000000' };

  const NET = {
    testnet: { chain: 'Testnet', source: 'b', exchange: 'https://api.hyperliquid-testnet.xyz/exchange', info: 'https://api.hyperliquid-testnet.xyz/info' },
    mainnet: { chain: 'Mainnet', source: 'a', exchange: 'https://api.hyperliquid.xyz/exchange', info: 'https://api.hyperliquid.xyz/info' }
  };

  // strictly-increasing millisecond nonce
  let _lastNonce = 0;
  function nonce() { let n = Date.now(); if (n <= _lastNonce) n = _lastNonce + 1; _lastNonce = n; return n; }

  // ---- float_to_wire: no trailing zeros, ≤5 significant figures, integer-safe ----
  // HL rule: prices ≤5 sig figs; perp price decimals ≤ (6 - szDecimals); size to szDecimals.
  function floatToWire(x) {
    if (x == null || typeof x !== 'number' || !isFinite(x)) throw new Error('floatToWire: not a finite number: ' + x);
    if (x === 0) return '0';
    // 5 significant figures, then trim to 8 decimals max, strip trailing zeros.
    const rounded = parseFloat(x.toPrecision(5));
    let s = rounded.toFixed(8);
    s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return s;
  }
  function roundToDecimals(x, decimals) { const f = Math.pow(10, decimals); return Math.round(x * f) / f; }
  // size wire: round to szDecimals then float_to_wire. A positive size that
  // rounds to '0' would be silently rejected (or worse) — throw instead.
  function sizeToWire(sz, szDecimals) {
    const d = Math.max(0, szDecimals | 0);
    const wire = floatToWire(roundToDecimals(Number(sz), d));
    if (Number(sz) > 0 && wire === '0') throw new Error('size rounds to zero at ' + d + ' decimals — increase size');
    return wire;
  }
  // price wire: ≤5 sig figs AND ≤ (6 - szDecimals) decimals (perps), then float_to_wire
  function priceToWire(px, szDecimals) {
    const maxDec = Math.max(0, 6 - (szDecimals | 0));
    const five = parseFloat(Number(px).toPrecision(5));
    return floatToWire(roundToDecimals(five, maxDec));
  }

  function isAddr(a) { return typeof a === 'string' && /^0x[0-9a-fA-F]{40}$/.test(a); }

  // ==== USER-SIGNED actions (master wallet, EIP-712) ====
  function buildApproveAgent(net, agentAddress) {
    const N = NET[net]; if (!N) throw new Error('bad net'); if (!isAddr(agentAddress)) throw new Error('bad agentAddress');
    const action = { type: 'approveAgent', hyperliquidChain: N.chain, signatureChainId: SIGNATURE_CHAIN_ID, agentAddress, agentName: AGENT_NAME, nonce: nonce() };
    const types = { 'HyperliquidTransaction:ApproveAgent': [
      { name: 'hyperliquidChain', type: 'string' }, { name: 'agentAddress', type: 'address' },
      { name: 'agentName', type: 'string' }, { name: 'nonce', type: 'uint64' }
    ] };
    return { action, types, primaryType: 'HyperliquidTransaction:ApproveAgent', domain: EIP712_DOMAIN };
  }
  function buildApproveBuilderFee(net) {
    const N = NET[net]; if (!N) throw new Error('bad net');
    const action = { type: 'approveBuilderFee', hyperliquidChain: N.chain, signatureChainId: SIGNATURE_CHAIN_ID, maxFeeRate: MAX_BUILDER_FEE_RATE, builder: BUILDER, nonce: nonce() };
    const types = { 'HyperliquidTransaction:ApproveBuilderFee': [
      { name: 'hyperliquidChain', type: 'string' }, { name: 'maxFeeRate', type: 'string' },
      { name: 'builder', type: 'address' }, { name: 'nonce', type: 'uint64' }
    ] };
    return { action, types, primaryType: 'HyperliquidTransaction:ApproveBuilderFee', domain: EIP712_DOMAIN };
  }

  // ==== L1 (agent-signed) ORDER action with normalTpsl grouping + builder ====
  // plan: { assetIndex, szDecimals, isBuy, entryPx, size, slPx?, tpPx? }
  function buildOrderAction(plan) {
    if (plan.assetIndex == null || plan.assetIndex < 0) throw new Error('bad assetIndex');
    if (!(plan.size > 0)) throw new Error('bad size');
    const szDec = plan.szDecimals | 0;
    const s = sizeToWire(plan.size, szDec);
    const orders = [];
    // 1) entry — GTC limit
    orders.push({ a: plan.assetIndex, b: !!plan.isBuy, p: priceToWire(plan.entryPx, szDec), s, r: false, t: { limit: { tif: 'Gtc' } } });
    // 2) SL — reduceOnly stop-market trigger (opposite side)
    if (plan.slPx != null) {
      orders.push({ a: plan.assetIndex, b: !plan.isBuy, p: priceToWire(plan.slPx, szDec), s, r: true,
        t: { trigger: { isMarket: true, triggerPx: priceToWire(plan.slPx, szDec), tpsl: 'sl' } } });
    }
    // 3) TP — reduceOnly take-profit trigger (opposite side)
    if (plan.tpPx != null) {
      orders.push({ a: plan.assetIndex, b: !plan.isBuy, p: priceToWire(plan.tpPx, szDec), s, r: true,
        t: { trigger: { isMarket: true, triggerPx: priceToWire(plan.tpPx, szDec), tpsl: 'tp' } } });
    }
    const grouping = (plan.slPx != null || plan.tpPx != null) ? 'normalTpsl' : 'na';
    return { type: 'order', orders, grouping, builder: { b: BUILDER.toLowerCase(), f: BUILDER_F } };
  }

  X3.actions = {
    MAINNET_PLACEMENT_ENABLED,
    BUILDER, BUILDER_F, MAX_BUILDER_FEE_RATE, AGENT_NAME, SIGNATURE_CHAIN_ID, NET, EIP712_DOMAIN,
    nonce, floatToWire, sizeToWire, priceToWire, roundToDecimals, isAddr,
    buildApproveAgent, buildApproveBuilderFee, buildOrderAction
  };
  // CommonJS export so the wire math can be unit-tested under node.
  try { if (typeof module !== 'undefined' && module.exports) module.exports = X3.actions; } catch (e) {}
})(typeof window !== 'undefined' ? window : globalThis);
