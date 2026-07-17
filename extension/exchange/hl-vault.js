// HypeLens Module 3 — AGENT-KEY VAULT (WebCrypto AES-GCM, passphrase-derived).
// -----------------------------------------------------------------------------
// The extension NEVER holds the master key. It holds an AGENT private key that
// can trade but NOT withdraw. The agent key is stored ENCRYPTED in
// chrome.storage.local (AES-GCM, key = PBKDF2(passphrase)); the decrypted key
// lives only in chrome.storage.session (cleared when the browser closes) +
// memory while unlocked. Exposes window.HLX3.vault.
(function (g) {
  'use strict';
  const X3 = g.HLX3 = g.HLX3 || {};
  const enc = new TextEncoder(), dec = new TextDecoder();
  const PBKDF2_ITERS = 250000;
  const STORE_KEY = 'hlx_agent_vault';       // encrypted blob (local, on disk)
  const SESSION_KEY = 'hlx_agent_session';   // decrypted agent state (session only)

  function b64(buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))); }
  function unb64(s) { const bin = atob(s), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }

  async function deriveKey(passphrase, salt) {
    const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: PBKDF2_ITERS, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
  }
  // AUTO-RELOCK: the decrypted agent key must not sit in session storage
  // indefinitely (session storage is readable by every content-script context
  // via the widened access level). Any read past the TTL wipes it — lazy
  // expiry works across SW restarts, no alarms permission needed.
  const UNLOCK_TTL_MS = 30 * 60 * 1000;
  function local() { return new Promise((res) => { try { chrome.storage.local.get([STORE_KEY], (o) => res(o && o[STORE_KEY])); } catch (e) { res(null); } }); }
  // Writes REJECT on chrome.runtime.lastError — a vault write that silently
  // no-ops (quota, eviction) must not report success to the wizard.
  function saveLocal(blob) {
    return new Promise((res, rej) => {
      try { chrome.storage.local.set({ [STORE_KEY]: blob }, () => { const e = chrome.runtime.lastError; if (e) rej(new Error('vault save failed: ' + e.message)); else res(); }); }
      catch (e) { rej(e); }
    });
  }
  function session() {
    return new Promise((res) => {
      try {
        chrome.storage.session.get([SESSION_KEY], (o) => {
          const s = o && o[SESSION_KEY];
          if (s && s.at && Date.now() - s.at > UNLOCK_TTL_MS) {   // expired → relock
            try { chrome.storage.session.remove([SESSION_KEY]); } catch (e) {}
            res(null); return;
          }
          res(s);
        });
      } catch (e) { res(null); }
    });
  }
  function saveSession(v) {
    return new Promise((res, rej) => {
      try { chrome.storage.session.set({ [SESSION_KEY]: v }, () => { const e = chrome.runtime.lastError; if (e) rej(new Error('session save failed: ' + e.message)); else res(); }); }
      catch (e) { rej(e); }
    });
  }

  async function hasVault() { return Boolean(await local()); }

  // Create a NEW agent wallet (needs the vendored SDK for keygen/address) and
  // store it encrypted under `passphrase`. Returns { agentAddress }.
  async function createAgent(passphrase) {
    const sdk = g.HLSDK; if (!sdk || typeof sdk.randomPrivateKey !== 'function') throw new Error('signing SDK not vendored — cannot generate an agent wallet');
    if (!passphrase || passphrase.length < 8) throw new Error('passphrase must be ≥ 8 characters');
    const priv = sdk.randomPrivateKey();
    const agentAddress = sdk.addressFromPrivateKey(priv);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(priv));
    await saveLocal({ v: 1, salt: b64(salt), iv: b64(iv), ct: b64(ct), agentAddress });
    await saveSession({ priv, agentAddress, at: Date.now() });
    return { agentAddress };
  }

  // Unlock the stored agent key into the session cache. Returns { agentAddress }.
  async function unlock(passphrase) {
    const blob = await local(); if (!blob) throw new Error('no agent wallet — run setup first');
    const key = await deriveKey(passphrase, unb64(blob.salt));
    let priv;
    try { priv = dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(blob.iv) }, key, unb64(blob.ct))); }
    catch (e) { throw new Error('wrong passphrase'); }
    await saveSession({ priv, agentAddress: blob.agentAddress, at: Date.now() });
    return { agentAddress: blob.agentAddress };
  }

  async function isUnlocked() { const s = await session(); return Boolean(s && s.priv); }
  async function agentAddress() { const s = await session(); if (s && s.agentAddress) return s.agentAddress; const b = await local(); return b ? b.agentAddress : null; }
  // The decrypted key is handed to the signer ONLY at sign time; callers must not persist it.
  async function withPrivateKey(fn) { const s = await session(); if (!s || !s.priv) throw new Error('agent wallet is locked — unlock first'); return fn(s.priv); }
  function lock() { return new Promise((res) => { try { chrome.storage.session.remove([SESSION_KEY], res); } catch (e) { res(); } }); }
  function wipe() { return new Promise((res) => { try { chrome.storage.local.remove([STORE_KEY]); chrome.storage.session.remove([SESSION_KEY], res); } catch (e) { res(); } }); }

  X3.vault = { hasVault, createAgent, unlock, isUnlocked, agentAddress, withPrivateKey, lock, wipe };
})(typeof window !== 'undefined' ? window : globalThis);
