// HypeLens Module 3 — ISOLATED-world side of the window.ethereum bridge.
// Talks to inject-eth-main.js (MAIN world) over window.postMessage. Exposes
// window.HLX3.eth: { connect(), accounts(), signTypedData(from, typedData) }.
// Only usable in a content-script context (the on-page window); the popup has
// no host page and therefore no wallet bridge (setup must be done on-page).
//
// AUTHENTICITY: every REQ carries — and every RES must echo — the per-page-load
// secret captured at document_start by exchange/hl-secret.js (page scripts can
// forge an `id`, not the secret). Posts target window.location.origin, not '*'.
(function (g) {
  'use strict';
  const X3 = g.HLX3 = g.HLX3 || {};
  const REQ = 'HLX3_ETH_REQ', RES = 'HLX3_ETH_RES';
  const pending = new Map();
  let wired = false;

  function secret() { return (typeof window !== 'undefined' && window.__HLX3_BRIDGE_SECRET) || null; }
  function origin() { return window.location.origin; }

  function wire() {
    if (wired || typeof window === 'undefined') return; wired = true;
    window.addEventListener('message', (e) => {
      if (e.source !== window || e.origin !== origin()) return;
      const d = e.data; if (!d || d.__hlx !== RES || !d.id) return;
      const s = secret();
      if (!s || d.s !== s) return;             // forged/unsigned response — ignore
      const p = pending.get(d.id); if (!p) return; pending.delete(d.id);
      if (d.ok) p.resolve(d.result); else p.reject(new Error(d.error || 'wallet error'));
    });
  }
  function call(method, extra, timeoutMs) {
    wire();
    return new Promise((resolve, reject) => {
      const s = secret();
      if (!s) { reject(new Error('wallet bridge secret missing — reload the tab (the extension may have been updated)')); return; }
      const id = 'hlx_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      pending.set(id, { resolve, reject });
      const to = setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error('wallet request timed out (is a wallet installed & unlocked?)')); } }, timeoutMs || 120000);
      const done = (fn) => (v) => { clearTimeout(to); fn(v); };
      const p = pending.get(id); p.resolve = done(resolve); p.reject = done(reject);
      try { window.postMessage(Object.assign({ __hlx: REQ, id, method, s }, extra || {}), origin()); }
      catch (err) { clearTimeout(to); pending.delete(id); reject(err); }
    });
  }
  // Fast bridge-availability probe: the MAIN-world script answers a ping
  // instantly. No pong ≈ the bridge isn't in this tab (stale tab / injection
  // failure) — surface THAT instead of a silent 2-minute hang with no popup.
  async function probe() {
    let r;
    try { r = await call('ping', {}, 1500); }
    catch (e) { throw new Error((e && /secret missing/.test(e.message)) ? e.message : 'wallet bridge not available in this tab — reload the tab (the extension may have been updated)'); }
    if (!r || !r.pong) throw new Error('wallet bridge not responding — reload the tab');
    if (!r.hasProvider) throw new Error('no wallet provider found — is MetaMask/Rabby installed and unlocked?');
    return true;
  }
  async function connect() {
    try { console.log('[HLX3] connect: probing bridge…'); } catch (e) {}
    await probe();
    try { console.log('[HLX3] connect: bridge ok → eth_requestAccounts (wallet should prompt now)'); } catch (e) {}
    // ~20s: if the wallet popup never appears the user gets a VISIBLE error,
    // not an invisible non-prompt.
    const r = await call('eth_requestAccounts', {}, 20000);
    const a = r && r.accounts && r.accounts[0]; if (!a) throw new Error('no account returned by the wallet');
    try { console.log('[HLX3] connect: account', a.slice(0, 6) + '…' + a.slice(-4)); } catch (e) {}
    return { address: a, chainId: r.chainId };
  }
  // read-only: currently-selected accounts (no prompt) — for stale-master checks.
  async function accounts() { const r = await call('eth_accounts', {}, 8000); return (r && r.accounts) || []; }
  async function signTypedData(from, typedData) { const r = await call('eth_signTypedData_v4', { from, typedData }, 120000); return r.signature; }

  X3.eth = { probe, connect, accounts, signTypedData, available: () => typeof window !== 'undefined' };
})(typeof window !== 'undefined' ? window : globalThis);
