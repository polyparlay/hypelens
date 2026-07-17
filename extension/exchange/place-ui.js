// HypeLens Module 3 — placement UI. Renders the "Place on Hyperliquid" section:
// network toggle (TESTNET default), setup wizard (connect wallet → approve agent
// → approve builder fee), unlock, and one-click place from the current plan.
// Fails closed + clearly labels: agent wallet can trade NOT withdraw; places
// REAL orders on the selected network. window.HLX3.ui.render(container, opts).
(function (g) {
  'use strict';
  const X3 = g.HLX3 = g.HLX3 || {};
  const P = () => X3.place, A = () => X3.actions;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shortA = (a) => a && a.length > 12 ? a.slice(0, 6) + '…' + a.slice(-4) : (a || '');

  // wizard state: survives re-renders; cleared once the vault exists.
  const wiz = { master: null };

  async function render(container, opts) {
    opts = opts || {};
    if (!container) return;
    let st; try { st = await P().status(); } catch (e) { st = { sdkReady: false, net: 'testnet' }; }
    if (st.hasVault) wiz.master = null;
    const net = st.net || 'testnet';
    const mainnetOn = Boolean(st.mainnetEnabled);
    // Mainnet is HARD-BLOCKED in code until testnet proof + sign-off: show it as a
    // disabled/locked pill (never selectable) so it's clear it's intentionally off.
    const netToggle =
      '<span class="hlx-x3-net">' +
        '<button class="hlx-x3-nbtn ' + (net === 'testnet' ? 'on' : '') + '" data-net="testnet">TESTNET</button>' +
        (mainnetOn
          ? '<button class="hlx-x3-nbtn ' + (net === 'mainnet' ? 'on' : '') + '" data-net="mainnet">Mainnet</button>'
          : '<button class="hlx-x3-nbtn hlx-x3-locked" disabled title="Mainnet placement is disabled until testnet proof + sign-off">Mainnet 🔒</button>') +
      '</span>';
    let body;
    if (!st.sdkReady) {
      const why = st.sdkError ? esc(st.sdkError) : 'signing SDK not vendored';
      body = '<div class="hlx-x3-msg hlx-x3-warn">Order placement disabled — ' + why + '. The read-only heatmap &amp; planner still work.</div>';
    } else if (!st.hasVault) {
      // SETUP WIZARD — wallet prompt FIRST (step 1), passphrase second, sigs third.
      if (!wiz.master) {
        body =
          '<div class="hlx-x3-step">STEP 1/4 · CONNECT WALLET</div>' +
          '<div class="hlx-x3-msg">Clicking connect opens your wallet (MetaMask/Rabby) — approve the connection there. Then: a local password (2), two approval signatures (3), ready (4). Setup creates an <b>agent wallet</b> that can trade but <b>cannot withdraw</b>; builder fee 0.01% to <code>' + shortA(A().BUILDER) + '</code>.</div>' +
          '<button class="hlx-x3-btn hlx-x3-connect">Connect wallet</button>';
      } else {
        body =
          '<div class="hlx-x3-step">STEP 2/4 · LOCAL PASSWORD <span class="hlx-x3-conn">✓ connected ' + shortA(wiz.master) + '</span></div>' +
          '<div class="hlx-x3-msg">Set a local password (8+ chars). It encrypts HypeLens&#39;s trading key <b>on this device</b> — it is <b>NOT your wallet password</b> and never leaves your machine. You&#39;ll use it to unlock trading each session. Next: two signatures in your wallet (step 3/4) — approve agent, then approve the 0.01% builder fee.</div>' +
          '<label class="hlx-x3-pass">password <input type="password" class="hlx-x3-passin" placeholder="≥ 8 chars — local only"></label>' +
          '<button class="hlx-x3-btn hlx-x3-setup">Continue → signatures (3/4)</button>';
      }
    } else if (!st.unlocked) {
      body =
        '<div class="hlx-x3-msg">Agent wallet <code>' + shortA(st.agentAddress) + '</code> is set up (trade-only). Unlock to place.</div>' +
        '<label class="hlx-x3-pass">passphrase <input type="password" class="hlx-x3-passin" placeholder="unlock agent wallet"></label>' +
        '<button class="hlx-x3-btn hlx-x3-unlock">Unlock</button>';
    } else {
      body =
        '<div class="hlx-x3-msg">Agent <code>' + shortA(st.agentAddress) + '</code> · builder <code>' + shortA(st.builder) + '</code> @ ' + esc(st.maxFeeRate) + ' · <b>' + (net === 'testnet' ? 'TESTNET' : 'MAINNET') + '</b>. Places a REAL entry + SL + TP order.</div>' +
        '<div class="hlx-x3-actions"><button class="hlx-x3-btn hlx-x3-place">Place entry + SL/TP ▸</button><button class="hlx-x3-btn hlx-x3-lock">Lock</button></div>';
    }
    container.innerHTML =
      '<div class="hlx-x3">' +
        '<div class="hlx-x3-head"><span class="hlx-x3-title">Place on Hyperliquid</span>' + netToggle + '</div>' +
        body +
        '<div class="hlx-x3-status"></div>' +
        '<div class="hlx-x3-disc">Read-only tool + opt-in placement. Agent wallet can trade, not withdraw. This places REAL orders on the selected network. Not financial advice.</div>' +
      '</div>';

    const status = (m, cls) => { const el = container.querySelector('.hlx-x3-status'); if (el) { el.className = 'hlx-x3-status ' + (cls || ''); el.textContent = m || ''; } };
    const rerender = () => render(container, opts);

    container.querySelectorAll('.hlx-x3-nbtn').forEach((b) => b.addEventListener('click', async () => {
      await P().setNet(b.getAttribute('data-net')); rerender();
    }));
    // STEP 1/4: connect — fires eth_requestAccounts IMMEDIATELY so the wallet
    // popup is the first thing the user sees. Bridge/provider failures (probe
    // fail, no provider, 20s timeout) land HERE, visibly — never a silent non-prompt.
    const connectBtn = container.querySelector('.hlx-x3-connect');
    if (connectBtn) connectBtn.addEventListener('click', async () => {
      connectBtn.disabled = true; status('opening your wallet — approve the connection…');
      try {
        const r = await P().connectMaster();
        wiz.master = r.master;
        status('connected ' + shortA(r.master) + ' ✓', 'hlx-x3-ok');
        setTimeout(rerender, 500);
      } catch (e) { connectBtn.disabled = false; status(e && e.message ? e.message : 'wallet connection failed', 'hlx-x3-err'); }
    });
    // STEP 2/4 → 3/4: passphrase, then the two signatures.
    const setupBtn = container.querySelector('.hlx-x3-setup');
    if (setupBtn) setupBtn.addEventListener('click', async () => {
      const pass = (container.querySelector('.hlx-x3-passin') || {}).value || '';
      if (!pass || pass.length < 8) { status('password must be at least 8 characters', 'hlx-x3-err'); return; }
      setupBtn.disabled = true;
      try {
        await P().setup(pass, wiz.master, (m) => status('3/4 · ' + m));
        status('4/4 · setup complete ✓ — ready to place', 'hlx-x3-ok');
        setTimeout(rerender, 900);
      }
      catch (e) { setupBtn.disabled = false; status(e && e.message ? e.message : 'setup failed', 'hlx-x3-err'); }
    });
    const unlockBtn = container.querySelector('.hlx-x3-unlock');
    if (unlockBtn) unlockBtn.addEventListener('click', async () => {
      const pass = (container.querySelector('.hlx-x3-passin') || {}).value || '';
      unlockBtn.disabled = true;
      try { await X3.vault.unlock(pass); rerender(); }
      catch (e) { unlockBtn.disabled = false; status(e && e.message ? e.message : 'unlock failed', 'hlx-x3-err'); }
    });
    const lockBtn = container.querySelector('.hlx-x3-lock');
    if (lockBtn) lockBtn.addEventListener('click', async () => { await X3.vault.lock(); rerender(); });
    const placeBtn = container.querySelector('.hlx-x3-place');
    if (placeBtn) placeBtn.addEventListener('click', async () => {
      let plan; try { plan = opts.getPlan && opts.getPlan(); } catch (e) { plan = null; }
      if (!plan || !plan.coin || !(plan.size > 0) || !(plan.entryPx > 0)) { status('set entry/size in the planner first', 'hlx-x3-err'); return; }
      placeBtn.disabled = true; status('checking wire values…');
      try {
        // ---- SHOW WHAT WILL ACTUALLY BE SIGNED (wire-normalized values) and
        // BLOCK on dangerous normalization — never sign values the user
        // hasn't seen. ----
        const pv = await P().preview(plan);
        const wSize = parseFloat(pv.sizeWire), wEntry = parseFloat(pv.entryWire);
        const wSl = pv.slWire != null ? parseFloat(pv.slWire) : null, wTp = pv.tpWire != null ? parseFloat(pv.tpWire) : null;
        // size drift: normalized size must stay within 0.5% of the input
        const drift = Math.abs(wSize - plan.size) / plan.size;
        if (!(wSize > 0)) { status('blocked: size rounds to zero at ' + pv.szDecimals + ' decimals — increase size', 'hlx-x3-err'); placeBtn.disabled = false; return; }
        if (drift > 0.005) { status('blocked: size normalizes to ' + pv.sizeWire + ' (' + (drift * 100).toFixed(1) + '% from your ' + plan.size + ') — adjust size', 'hlx-x3-err'); placeBtn.disabled = false; return; }
        // rounding must not push the entry across an SL/TP trigger
        const long = !!plan.isBuy;
        if (wSl != null && (long ? wEntry <= wSl : wEntry >= wSl)) { status('blocked: rounded entry ' + pv.entryWire + ' crosses the SL trigger ' + pv.slWire, 'hlx-x3-err'); placeBtn.disabled = false; return; }
        if (wTp != null && (long ? wEntry >= wTp : wEntry <= wTp)) { status('blocked: rounded entry ' + pv.entryWire + ' crosses the TP trigger ' + pv.tpWire, 'hlx-x3-err'); placeBtn.disabled = false; return; }
        status('places ' + pv.sizeWire + ' ' + plan.coin + ' @ ' + pv.entryWire +
          (pv.slWire != null ? ' · SL ' + pv.slWire : '') + (pv.tpWire != null ? ' · TP ' + pv.tpWire : '') +
          ' — rounded from your ' + plan.size + ' @ ' + plan.entryPx + ' · signing…');
        const r = await P().place(plan);
        const statuses = r.data && r.data.response && r.data.response.data && r.data.response.data.statuses;
        status('placed ✓ ' + pv.sizeWire + ' ' + plan.coin + ' @ ' + pv.entryWire + ' ' + (statuses ? JSON.stringify(statuses).slice(0, 100) : 'ok'), 'hlx-x3-ok');
      } catch (e) { status(e && e.message ? e.message : 'place failed', 'hlx-x3-err'); }
      finally { placeBtn.disabled = false; }
    });
  }

  X3.ui = { render };
})(typeof window !== 'undefined' ? window : globalThis);
