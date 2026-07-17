// HypeLens Module 3 — SIGNER ADAPTER over the vendored SDK (window.HLSDK).
// -----------------------------------------------------------------------------
// This is the ONLY place that produces signatures, and it does so ONLY through
// the vendored @nktkas/hyperliquid signing subset. It hand-rolls NOTHING. If
// the SDK is absent it FAILS CLOSED. Before every L1 send it re-derives the
// action hash TWICE via the SDK and asserts equality (guards against accidental
// action mutation / non-deterministic key order). Exposes window.HLX3.signer.
(function (g) {
  'use strict';
  const X3 = g.HLX3 = g.HLX3 || {};

  const SDK_METHODS = ['randomPrivateKey', 'addressFromPrivateKey', 'hashL1Action', 'signL1Action', 'userSignedTypedData', 'orderToWire'];
  function sdk() { const s = g.HLSDK; if (!s) throw new Error('signing SDK not vendored — placement disabled'); return s; }

  // SELF-TEST (runs at load): all 6 adapter methods present + hashL1Action is
  // deterministic (sync string). Fail-closed — cached so ready() reflects it.
  let _selfTest = null;
  function selfTest() {
    try {
      const s = g.HLSDK;
      if (!s) return (_selfTest = { ok: false, error: 'window.HLSDK is null — signing SDK not vendored' });
      for (const m of SDK_METHODS) if (typeof s[m] !== 'function') return (_selfTest = { ok: false, error: 'HLSDK missing method: ' + m });
      const action = { type: 'order', orders: [{ a: 0, b: true, p: '1', s: '1', r: false, t: { limit: { tif: 'Gtc' } } }], grouping: 'na' };
      const h1 = s.hashL1Action(action, 1700000000000, true, null);
      const h2 = s.hashL1Action(action, 1700000000000, true, null);
      if (typeof h1 !== 'string' || !h1 || h1 !== h2) return (_selfTest = { ok: false, error: 'hashL1Action is not deterministic (or not a string) — refusing to enable placement' });
      return (_selfTest = { ok: true, hash: h1 });
    } catch (e) { return (_selfTest = { ok: false, error: 'self-test threw: ' + (e && e.message ? e.message : e) }); }
  }
  function ready() { return (_selfTest || selfTest()).ok; }
  function lastError() { return (_selfTest || selfTest()).error || null; }

  // Deterministic-hash gate: the SAME action + nonce MUST hash identically twice.
  function assertDeterministicHash(action, nonce, isTestnet, vaultAddress) {
    const s = sdk();
    const h1 = s.hashL1Action(action, nonce, isTestnet, vaultAddress || null);
    const h2 = s.hashL1Action(action, nonce, isTestnet, vaultAddress || null);
    if (!h1 || h1 !== h2) throw new Error('action-hash verification FAILED (non-deterministic) — refusing to sign');
    return h1;
  }

  // Sign an L1 (agent) action. `privateKey` comes from the vault at sign time.
  // viem signs ASYNCHRONOUSLY → signL1Action returns a Promise: await it.
  // Returns { signature, action, nonce, hash }.
  async function signL1(privateKey, action, nonce, isTestnet, vaultAddress) {
    const s = sdk();
    const hash = assertDeterministicHash(action, nonce, isTestnet, vaultAddress);
    const signature = await s.signL1Action(privateKey, action, nonce, isTestnet, vaultAddress || null);
    if (!signature || signature.r == null || signature.s == null || signature.v == null) throw new Error('SDK returned an invalid signature');
    return { signature, action, nonce, hash };
  }

  // Build the exact EIP-712 typed-data payload for a user-signed action (the
  // MASTER wallet signs this via the page's window.ethereum bridge — the
  // extension never sees the master key). Returns { domain, types, primaryType, message }.
  function userTypedData(built) {
    const s = sdk();
    if (typeof s.userSignedTypedData === 'function') return s.userSignedTypedData(built.action, built.action.signatureChainId);
    // Fallback to the exact payload the builder already assembled (types + domain
    // are pinned in hl-actions.js). The SDK path is preferred when present.
    return { domain: built.domain, types: built.types, primaryType: built.primaryType, message: built.action };
  }

  X3.signer = { ready, lastError, selfTest, signL1, userTypedData, assertDeterministicHash, addressFromPrivateKey: (pk) => sdk().addressFromPrivateKey(pk) };
  // Run the self-test once at load and surface the result in the console so a
  // broken/absent SDK is obvious. Placement stays fail-closed on failure.
  try { const r = selfTest(); if (r.ok) console.log('[HypeLens] signing SDK self-test PASSED (hash', r.hash.slice(0, 10) + '…)'); else console.warn('[HypeLens] signing SDK self-test FAILED —', r.error); } catch (e) {}
})(typeof window !== 'undefined' ? window : globalThis);
