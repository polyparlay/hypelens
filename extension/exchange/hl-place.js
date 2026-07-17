// HypeLens Module 3 — placement orchestrator. Ties vault + signer + eth-bridge +
// background POST into the two flows: SETUP (master-signed approveAgent +
// approveBuilderFee) and PLACE (agent-signed order w/ SL/TP + builder). TESTNET
// by default. Fails closed if the signing SDK is not vendored. window.HLX3.place.
(function (g) {
  'use strict';
  const X3 = g.HLX3 = g.HLX3 || {};
  const A = () => X3.actions, V = () => X3.vault, S = () => X3.signer, E = () => X3.eth;
  const NET_PREF = 'hlx_net';   // 'testnet' | 'mainnet'

  function mainnetEnabled() { return Boolean(A() && A().MAINNET_PLACEMENT_ENABLED); }
  function send(msg) { return new Promise((res) => { try { chrome.runtime.sendMessage(msg, (r) => { if (chrome.runtime.lastError) { res({ ok: false, error: chrome.runtime.lastError.message }); return; } res(r); }); } catch (e) { res({ ok: false, error: String(e && e.message || e) }); } }); }
  // getNet coerces any stored 'mainnet' back to 'testnet' while mainnet is blocked.
  function getNet() { return new Promise((res) => { try { chrome.storage.local.get([NET_PREF], (o) => { const n = (o && o[NET_PREF]) === 'mainnet' && mainnetEnabled() ? 'mainnet' : 'testnet'; res(n); }); } catch (e) { res('testnet'); } }); }
  function setNet(net) { const target = (net === 'mainnet' && mainnetEnabled()) ? 'mainnet' : 'testnet'; return new Promise((res) => { try { chrome.storage.local.set({ [NET_PREF]: target }, res); } catch (e) { res(); } }); }
  function assertNet(net) { if (net === 'mainnet' && !mainnetEnabled()) throw new Error('mainnet placement is disabled in this build (testnet only)'); }

  function ready() { return S().ready(); }

  // split a 65-byte hex ECDSA signature into { r, s, v } (parsing, not signing).
  function splitSig(hex) {
    const h = hex.startsWith('0x') ? hex.slice(2) : hex; if (h.length !== 130) throw new Error('bad signature length');
    let v = parseInt(h.slice(128, 130), 16); if (v < 27) v += 27;
    return { r: '0x' + h.slice(0, 64), s: '0x' + h.slice(64, 128), v };
  }

  // POST an EXCHANGE request through the background (host permission lives there).
  async function post(net, payload) {
    const r = await send({ type: 'hlExchange', net, payload });
    if (!r || !r.ok) throw new Error((r && r.error) || 'exchange POST failed');
    if (r.data && r.data.status === 'err') throw new Error(typeof r.data.response === 'string' ? r.data.response : JSON.stringify(r.data.response));
    return r.data;
  }
  async function info(net, body) { const r = await send({ type: 'hlInfo', net, body }); if (!r || !r.ok) throw new Error((r && r.error) || 'info POST failed'); return r.data; }

  // ---- SETUP, reordered for visibility: (1) CONNECT WALLET FIRST — the
  // familiar wallet popup is the very first thing the user sees; (2) THEN the
  // local passphrase (encrypts the agent key, NOT the wallet password);
  // (3+4) the two signatures. place-ui drives the wizard step by step. ----
  async function connectMaster() {
    if (!ready()) throw new Error('signing SDK not vendored — cannot run setup');
    const net = await getNet(); assertNet(net);
    try { console.log('[HLX3] setup 1/4: connect wallet'); } catch (e) {}
    const { address } = await E().connect();               // probes the bridge, then prompts
    try { console.log('[HLX3] setup 1/4: connected', address); } catch (e) {}
    return { master: address, net };
  }
  // STALE-MASTER GUARD: the user can switch MetaMask accounts mid-wizard; a
  // signature from the wrong account approves the agent for the WRONG master.
  // Re-query eth_accounts (read-only, no prompt) before EACH signature.
  async function assertMaster(master) {
    const accts = await E().accounts();
    const cur = (accts && accts[0]) ? String(accts[0]).toLowerCase() : null;
    if (!cur || cur !== String(master).toLowerCase()) throw new Error('wallet account changed — reconnect');
  }
  // steps 2-4: passphrase → agent key, then the two master-wallet signatures.
  async function setup(passphrase, master, onStep) {
    if (!ready()) throw new Error('signing SDK not vendored — cannot run setup');
    if (!master) throw new Error('connect your wallet first');
    const net = await getNet(); assertNet(net);
    const step = (m) => { try { onStep && onStep(m); } catch (e) {} };
    // 2) agent wallet (local, encrypted with the passphrase)
    step('encrypting the local trading key…');
    try { console.log('[HLX3] setup 2/4: passphrase → agent key'); } catch (e) {}
    let agentAddress = await V().agentAddress();
    if (!agentAddress) { agentAddress = (await V().createAgent(passphrase)).agentAddress; }
    else { await V().unlock(passphrase); }
    // 3) approveAgent (user-signed — the wallet prompts)
    await assertMaster(master);                 // account still the connected one?
    step('signature 1 of 2 — approve the agent wallet (check your wallet)…');
    try { console.log('[HLX3] setup 3/4: approveAgent signature'); } catch (e) {}
    const aa = A().buildApproveAgent(net, agentAddress);
    const aaTd = S().userTypedData(aa);
    const aaSig = splitSig(await E().signTypedData(master, aaTd));
    await post(net, { action: aa.action, nonce: aa.action.nonce, signature: aaSig });
    // 4) approveBuilderFee (user-signed) — builder + maxFeeRate are PINNED
    await assertMaster(master);                 // re-check before the second signature
    step('signature 2 of 2 — approve the 0.01% builder fee (check your wallet)…');
    try { console.log('[HLX3] setup 4/4: approveBuilderFee signature'); } catch (e) {}
    const bf = A().buildApproveBuilderFee(net);
    const bfTd = S().userTypedData(bf);
    const bfSig = splitSig(await E().signTypedData(master, bfTd));
    await post(net, { action: bf.action, nonce: bf.action.nonce, signature: bfSig });
    step('setup complete');
    try { console.log('[HLX3] setup complete — ready to place'); } catch (e) {}
    return { agentAddress, master, net, builder: A().BUILDER, maxFeeRate: A().MAX_BUILDER_FEE_RATE };
  }

  // ---- PREVIEW: the exact WIRE values that would be signed (no signing, no
  // POST). place-ui shows these BEFORE placing and blocks on bad normalization
  // (size drift >0.5%, entry crossing an SL/TP trigger after rounding). ----
  async function preview(plan) {
    if (!ready()) throw new Error('signing SDK not vendored');
    const net = await getNet(); assertNet(net);
    const meta = await info(net, { type: 'meta' });
    const uni = (meta && meta.universe) || [];
    const idx = uni.findIndex((u) => u && u.name === plan.coin);
    if (idx < 0) throw new Error('coin not found on ' + net + ': ' + plan.coin);
    const szDecimals = uni[idx].szDecimals | 0;
    return {
      net, assetIndex: idx, szDecimals,
      sizeWire: A().sizeToWire(plan.size, szDecimals),
      entryWire: A().priceToWire(plan.entryPx, szDecimals),
      slWire: plan.slPx != null ? A().priceToWire(plan.slPx, szDecimals) : null,
      tpWire: plan.tpPx != null ? A().priceToWire(plan.tpPx, szDecimals) : null
    };
  }

  // ---- PLACE: agent-signed order (entry + SL + TP) with builder{...,f:10} ----
  // plan: { coin, isBuy, entryPx, size, slPx?, tpPx? }
  async function place(plan) {
    if (!ready()) throw new Error('signing SDK not vendored — cannot place orders');
    const net = await getNet(); assertNet(net);
    if (!(await V().isUnlocked())) throw new Error('agent wallet is locked — unlock first');
    // resolve assetIndex + szDecimals from the SELECTED network's meta
    const meta = await info(net, { type: 'meta' });
    const uni = (meta && meta.universe) || [];
    const idx = uni.findIndex((u) => u && u.name === plan.coin);
    if (idx < 0) throw new Error('coin not found on ' + net + ': ' + plan.coin);
    const szDecimals = uni[idx].szDecimals | 0;
    const action = A().buildOrderAction({ assetIndex: idx, szDecimals, isBuy: !!plan.isBuy, entryPx: plan.entryPx, size: plan.size, slPx: plan.slPx, tpPx: plan.tpPx });
    const nonce = A().nonce();
    const isTestnet = net === 'testnet';
    // sign with the agent key (decrypted only at sign time), hash-verified inside
    const signed = await V().withPrivateKey((pk) => S().signL1(pk, action, nonce, isTestnet, null));
    const data = await post(net, { action: signed.action, nonce: signed.nonce, signature: signed.signature });
    return { net, hash: signed.hash, data };
  }

  async function status() {
    const net = await getNet();
    const sdkErr = (S() && S().lastError) ? S().lastError() : null;
    return { net, mainnetEnabled: mainnetEnabled(), sdkReady: ready(), sdkError: sdkErr, hasVault: await V().hasVault(), unlocked: await V().isUnlocked(), agentAddress: await V().agentAddress(), builder: A().BUILDER, maxFeeRate: A().MAX_BUILDER_FEE_RATE };
  }

  X3.place = { getNet, setNet, ready, status, connectMaster, setup, preview, place, splitSig, mainnetEnabled };
})(typeof window !== 'undefined' ? window : globalThis);
