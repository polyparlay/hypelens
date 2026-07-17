// HypeLens Module 3 — MAIN-world bridge for window.ethereum.
// -----------------------------------------------------------------------------
// Content scripts (ISOLATED world) cannot see the page's window.ethereum. This
// script runs in the MAIN world (manifest content_scripts world:"MAIN",
// run_at:document_start) and relays ONLY:
//   - eth_requestAccounts  (connect)
//   - eth_accounts         (read-only account check — no prompt)
//   - eth_signTypedData_v4 (ONLY the two allow-listed Hyperliquid approvals)
// It NEVER sends transactions and never exposes the master key.
//
// BRIDGE AUTHENTICITY: page scripts share window.postMessage, so a matching
// `id` alone is forgeable. At document_start (BEFORE any page script runs) we
// generate a per-page-load random SECRET, hand it to our ISOLATED-world side
// via a DOM attribute (exchange/hl-secret.js reads it and DELETES it in the
// same pre-page-script window), and require it on EVERY request/response.
// Messages without the pinned secret are ignored. Replies target
// window.location.origin, never '*'.
(function () {
  'use strict';
  const REQ = 'HLX3_ETH_REQ', RES = 'HLX3_ETH_RES';
  // --- per-page-load secret (closure-held; the attribute copy is deleted by
  // the isolated reader before any page script can run) ---
  const SECRET = (function () {
    try {
      const b = new Uint8Array(24); crypto.getRandomValues(b);
      return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
    } catch (e) { return 'hlx3_' + Math.random().toString(36).slice(2) + Date.now().toString(36); }
  })();
  try { document.documentElement.setAttribute('data-hlx3s', SECRET); } catch (e) {}
  const ORIGIN = window.location.origin;

  // --- S-M2: this bridge is NOT a general-purpose signTypedData proxy. Only the
  // two Hyperliquid approval payloads are relayed; the builder + fee for
  // ApproveBuilderFee are PINNED here (duplicated from exchange/hl-actions.js —
  // this file runs in the page world and must not trust anything from it). ---
  const PINNED_BUILDER = '0x9548b8e9554a1968843b3c380431b10996247c88'; // lowercase
  const PINNED_MAX_FEE = '0.01%';
  function validateTypedData(payload) {
    let td = payload;
    if (typeof td === 'string') { try { td = JSON.parse(td); } catch (e) { return 'typedData is not valid JSON'; } }
    if (!td || typeof td !== 'object') return 'missing typedData';
    const pt = td.primaryType;
    if (pt === 'HyperliquidTransaction:ApproveAgent') return null;
    if (pt === 'HyperliquidTransaction:ApproveBuilderFee') {
      const m = td.message || {};
      if (String(m.builder || '').toLowerCase() !== PINNED_BUILDER) return 'builder address mismatch — refusing to sign';
      if (m.maxFeeRate !== PINNED_MAX_FEE) return 'maxFeeRate mismatch — refusing to sign';
      return null;
    }
    return 'refused: this bridge only signs Hyperliquid ApproveAgent / ApproveBuilderFee (got ' + String(pt) + ')';
  }

  try { console.log('[HLX3] MAIN-world wallet bridge loaded'); } catch (e) {}
  window.addEventListener('message', async (e) => {
    if (e.source !== window || e.origin !== ORIGIN) return;
    const d = e.data; if (!d || d.__hlx !== REQ || !d.id) return;
    if (d.s !== SECRET) return;   // not from our isolated side — ignore silently
    const reply = (ok, result, error) => { try { window.postMessage({ __hlx: RES, id: d.id, s: SECRET, ok, result, error }, ORIGIN); } catch (x) {} };
    try {
      // ping = bridge-availability handshake (answers instantly, no wallet call)
      if (d.method === 'ping') { reply(true, { pong: true, hasProvider: Boolean(window.ethereum && typeof window.ethereum.request === 'function') }); return; }
      const eth = window.ethereum;
      if (!eth || typeof eth.request !== 'function') { reply(false, null, 'no wallet provider found — is MetaMask/Rabby installed and unlocked?'); return; }
      if (d.method === 'eth_requestAccounts') {
        try { console.log('[HLX3] eth_requestAccounts → prompting wallet'); } catch (x) {}
        const accts = await eth.request({ method: 'eth_requestAccounts' });
        reply(true, { accounts: accts, chainId: await eth.request({ method: 'eth_chainId' }).catch(() => null) });
      } else if (d.method === 'eth_accounts') {
        // read-only: which account is CURRENTLY selected (no prompt) — used to
        // detect a MetaMask account switch mid-setup before each signature.
        const accts = await eth.request({ method: 'eth_accounts' });
        reply(true, { accounts: accts });
      } else if (d.method === 'eth_signTypedData_v4') {
        const from = d.from, payload = d.typedData;
        if (!from || !payload) { reply(false, null, 'missing from/typedData'); return; }
        const verr = validateTypedData(payload);
        if (verr) { reply(false, null, verr); return; }
        const sig = await eth.request({ method: 'eth_signTypedData_v4', params: [from, typeof payload === 'string' ? payload : JSON.stringify(payload)] });
        reply(true, { signature: sig });
      } else {
        reply(false, null, 'unsupported method: ' + d.method);
      }
    } catch (err) {
      reply(false, null, (err && (err.message || err.code)) ? String(err.message || err.code) : 'wallet request failed');
    }
  });
  try { window.postMessage({ __hlx: 'HLX3_ETH_READY' }, ORIGIN); } catch (e) {}
})();
