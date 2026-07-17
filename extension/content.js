// HypeLens content script — read-only overlay for app.hyperliquid.xyz.
// ---------------------------------------------------------------------
// v1 SHIPPABLE DESIGN: a self-contained liq-heatmap chart + liq-safety slider.
// We do NOT touch HL's TradingView chart (iframe+canvas is unreachable).
// Instead THE ONE WINDOW (opened from a small draggable chip) renders OUR OWN
// candlestick chart from HL candle data on a canvas we fully control, so
// price→pixel is exact. On it we draw: liq-wall heat bands + the user's liq
// line, each COLORED BY VOLATILITY-DISTANCE (red ≤1 daily move · orange ≤2.5 ·
// green beyond) computed from the candles. Dragging the leverage slider moves
// the liq line live and recolors it red→orange→green — the visceral "am I in
// range of a wall" read. A "Place" button stubs the Module-3 order hook
// (no wallet, no signing, no permissions in v1).
//
// COMPLIANCE: informational only; volatility "reach estimate" is explicitly
// not a prediction and never labelled "liquidation chance".

(function () {
  const CHIP_ID = 'hypelens-chip';
  const WIN_ID = 'hypelens-window';
  const VM = window.HLVM;
  const VERSION = (function () { try { return chrome.runtime.getManifest().version; } catch { return ''; } })();
  const DISCLAIMER = 'Informational only · not financial advice · leverage can lose all funds · no tool can prevent liquidation. Volatility figures are estimates, not predictions.';
  try { console.log('[HypeLens] content script loaded v' + VERSION + ' @', location.pathname); } catch {}

  // -------- context guard (ORPHAN DETECTION) --------
  // After an extension reload, this script keeps running as ORPHANED old code:
  // chrome.runtime.id throws / sendMessage fails with context-invalidated. When
  // that happens we must be LOUD (recurring failure mode: operator sees a stale
  // pill and debugs ghosts) — render an unmissable "reload this tab" state.
  let dead = false;
  function ok() { try { return Boolean(chrome && chrome.runtime && chrome.runtime.id); } catch { return false; } }
  function markDead(reason) {
    if (dead) return; dead = true;
    try { console.warn('[HypeLens] content script ORPHANED (' + (reason || 'context invalidated') + ') — old v' + VERSION + ' still in this tab. Reload the tab.'); } catch {}
    // stop EVERY loop/retry — orphaned code must go quiet, not keep polling
    try {
      if (state.pollTimer) clearInterval(state.pollTimer);
      if (state.posTimer) clearInterval(state.posTimer);
      if (routeTimer) clearInterval(routeTimer);
      clearTimeout(state._mktRetry); clearTimeout(state._candlePoll); clearTimeout(state._intelPoll);
    } catch {}
    try { renderStaleChip(); showStaleBanner(); } catch {}
  }
  function send(msg) {
    return new Promise((res) => {
      if (dead) { res(null); return; }
      if (!ok()) { markDead('runtime id gone'); res(null); return; }
      try {
        chrome.runtime.sendMessage(msg, (r) => {
          if (chrome.runtime.lastError) { if (!ok()) markDead('sendMessage: ' + chrome.runtime.lastError.message); res(null); return; }
          // belt-and-braces: background echoes ITS manifest version — a mismatch
          // means this tab runs old code even though the runtime looks valid.
          // Resolve NULL so stale code never renders new-version data as its own.
          if (r && r.v && r.v !== VERSION) { markDead('version mismatch (bg v' + r.v + ' vs tab v' + VERSION + ')'); res(null); return; }
          res(r);
        });
      } catch (e) { markDead('sendMessage threw'); res(null); }
    });
  }
  // fast detection: a lightweight ~5s heartbeat, independent of user actions
  setInterval(() => { if (!dead && !ok()) markDead('heartbeat'); }, 5000);
  // -------- stale UI (chip + window banner) --------
  function renderStaleChip() {
    const chip = document.getElementById(CHIP_ID) || (function () { const c = document.createElement('div'); c.id = CHIP_ID; document.body.appendChild(c); return c; })();
    if (chip.className === 'hlx-stale') return;   // idempotent — already showing the stale state
    chip.className = 'hlx-stale';
    chip.style.left = chip.style.left || '20px'; chip.style.top = chip.style.top || '20px';
    chip.title = 'The HypeLens extension was updated — this tab still runs the old version. Click to reload the tab.';
    chip.innerHTML = '<span class="hlx-chip-dot">⟳</span><span class="hlx-chip-brand">HypeLens updated</span><span class="hlx-chip-sep">·</span><span class="hlx-chip-text">reload this tab</span>';
    chip.onclick = (e) => { e.stopPropagation(); try { location.reload(); } catch {} };
  }
  function showStaleBanner() {
    const w = document.getElementById(WIN_ID);
    if (!w || w.style.display === 'none' || w.querySelector('.hlx-stale-banner')) return;
    const b = document.createElement('div');
    b.className = 'hlx-stale-banner';
    b.innerHTML = '<div class="hlx-stale-msg">⟳ HypeLens was updated.<br>Close and reopen this tab (⌘W) to load the new version.</div><button class="hlx-stale-btn">Reload tab</button>';
    b.addEventListener('click', () => { try { location.reload(); } catch {} });
    w.appendChild(b);
  }

  // -------- state --------
  const state = {
    rows: [], predicted: null, intel: {}, coverage: null, intelLive: false,
    settings: { pollIntervalSec: 30, aprThresholdPct: 40 },
    currentCoin: null, pollTimer: null,
    candles: {}, // "COIN|tf" -> { candles, dmp, at }
    tf: '1d',
    chip: { x: null, y: null, dismissed: false },
    win: { x: null, y: null }, winOpen: false,
    lev: { sizeUsd: 1000, dir: 'long', leverage: null, margin: 'isolated' },
    risk: { stopPct: null, tpPct: null, trailPct: null },
    heat: { intensity: 0.5, opacity: 0.5 },
    // GUARDIAN: the connected wallet's REAL open positions (read-only)
    userAddr: null, addrSource: null,           // 'dom' | 'manual'
    positions: [], posAt: 0, posTimer: null,
    mode: null                                   // null=auto · 'guardian' | 'planner' (user override)
  };

  function rowFor(coin) { if (!coin) return null; const up = coin.toUpperCase(); return state.rows.find((r) => r.coin.toUpperCase() === up) || null; }
  function vmFor(coin) { const row = rowFor(coin); if (!row) return null; const intel = state.intel && state.intel[(coin || '').toUpperCase()]; return VM.buildViewModel({ coin, row, predicted: state.predicted, intel }); }
  function activeCoin() {
    if (state.currentCoin && rowFor(state.currentCoin)) return state.currentCoin;
    let best = null; for (const r of state.rows) { if (r.dayNtlVlm == null) continue; if (!best || r.dayNtlVlm > best.dayNtlVlm) best = r; }
    if (best) return best.coin; if (rowFor('BTC')) return 'BTC'; return state.rows[0] ? state.rows[0].coin : null;
  }
  function activeVm() { return vmFor(activeCoin()); }
  function candlesFor(coin) { return state.candles[(coin || '').toUpperCase() + '|' + state.tf] || null; }
  function positionFor(coin) { if (!coin) return null; const up = coin.toUpperCase(); return state.positions.find((p) => p.coin.toUpperCase() === up) || null; }

  // -------- GUARDIAN: connected-address detection (DOM/storage text ONLY — no
  // wallet permissions, no page-script injection for this) --------
  const ADDR_RE = /0x[0-9a-fA-F]{40}/;
  // Walk a parsed wagmi/rainbowkit store for account addresses (STRUCTURED, not
  // a raw regex over arbitrary values — regex over random blobs matched agent
  // keys, watched addresses etc. and produced guardian false positives).
  function collectWagmiAccounts(node, out, depth) {
    if (!node || depth > 10 || out.length >= 8) return;   // wagmi store nests ~7 deep
    if (typeof node === 'string') { const m = node.match(ADDR_RE); if (m && /^0x[0-9a-fA-F]{40}$/.test(node.trim())) out.push(node.trim()); return; }
    if (Array.isArray(node)) { for (const v of node) collectWagmiAccounts(v, out, depth + 1); return; }
    if (typeof node === 'object') {
      // wagmi store: state.connections.value[i][1].accounts = ['0x…']; also `account`/`address` fields.
      for (const k of Object.keys(node)) {
        if (/^(accounts|account|address|currentAddress)$/i.test(k)) collectWagmiAccounts(node[k], out, depth + 1);
        else if (/^(state|connections|value|current|data)$/i.test(k) || Array.isArray(node[k]) || (node[k] && typeof node[k] === 'object')) collectWagmiAccounts(node[k], out, depth + 1);
      }
    }
  }
  function storageAddressCandidates() {
    // HL's app (wagmi/rainbowkit-style) persists the connected account in the
    // page's localStorage. ONLY wallet-connector keys — no any-value fallback.
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i); if (!k) continue;
        if (!/wagmi|rainbow|walletconnect|connectedWallet/i.test(k)) continue;
        const v = localStorage.getItem(k) || '';
        // prefer the structured wagmi JSON over a raw regex sweep
        try { const j = JSON.parse(v); collectWagmiAccounts(j, out, 0); } catch { const m = v.match(ADDR_RE); if (m) out.push(m[0]); }
      }
    } catch {}
    return out;
  }
  // DOM candidates are only trusted when the page ALSO shows the address as a
  // truncated connected-account label (e.g. "0x1a2b…c3d4") — a bare href/title
  // hit alone (explorer links, other people's wallets) is NOT enough.
  function truncatedLabelMatches(addr) {
    try {
      const lo = addr.toLowerCase(), pre = lo.slice(0, 6), suf = lo.slice(-4);
      const re = new RegExp(pre + '[0-9a-f]{0,2}(…|\\.{2,3})[0-9a-f]{0,2}' + suf, 'i');
      const nodes = document.querySelectorAll('button, header *, nav *, [class*="account" i], [class*="address" i], [class*="wallet" i]');
      let seen = 0;
      for (const n of nodes) {
        if (++seen > 400) break;
        const t = (n.textContent || '').trim(); if (!t || t.length > 60) continue;
        if (re.test(t)) return true;
      }
    } catch {}
    return false;
  }
  function domAddressCandidates() {
    const out = [];
    try {
      for (const el of document.querySelectorAll('[data-address], [data-account], [href*="0x"], [title*="0x"]')) {
        const s = (el.getAttribute('href') || '') + ' ' + (el.getAttribute('title') || '') + ' ' + (el.getAttribute('data-address') || '') + ' ' + (el.getAttribute('data-account') || '');
        const m = s.match(ADDR_RE);
        if (m && !out.includes(m[0]) && truncatedLabelMatches(m[0])) out.push(m[0]);
        if (out.length >= 4) break;
      }
    } catch {}
    return out;
  }
  // Stickiness: an ESTABLISHED userAddr is never silently switched. Only after
  // it has vanished from ALL sources for ≥3 consecutive scans do we switch to a
  // new candidate (logged) or, with no candidate, clear guardian (disconnect).
  const ADDR_MISS_LIMIT = 3;
  let _addrMissScans = 0;
  function detectAddress() {
    if (state.addrSource === 'manual' && state.userAddr) return state.userAddr;   // manual wins
    const cands = storageAddressCandidates().concat(domAddressCandidates());
    if (!state.userAddr) {
      if (cands.length) {
        state.userAddr = cands[0]; state.addrSource = 'dom'; _addrMissScans = 0;
        try { console.log('[HypeLens] guardian: connected address detected', cands[0].slice(0, 6) + '…' + cands[0].slice(-4)); } catch {}
      }
      return state.userAddr;
    }
    const cur = state.userAddr.toLowerCase();
    if (cands.some((a) => a.toLowerCase() === cur)) { _addrMissScans = 0; return state.userAddr; }
    _addrMissScans++;
    if (_addrMissScans >= ADDR_MISS_LIMIT) {
      _addrMissScans = 0;
      if (cands.length) {
        try { console.log('[HypeLens] guardian: address SWITCH', cur.slice(0, 6) + '… → ' + cands[0].slice(0, 6) + '…', '(old gone ' + ADDR_MISS_LIMIT + ' scans)'); } catch {}
        state.userAddr = cands[0]; state.addrSource = 'dom';
        state.positions = []; state.account = null; state.posAt = 0;
      } else {
        // wallet disconnected: clear guardian so we never show stale positions
        try { console.log('[HypeLens] guardian: address gone from all sources — clearing'); } catch {}
        state.userAddr = null; state.addrSource = null;
        state.positions = []; state.account = null; state.posAt = 0;
        render();
      }
    }
    return state.userAddr;
  }
  function setManualAddress(a) {
    const m = String(a || '').match(ADDR_RE);
    state.userAddr = m ? m[0] : null; state.addrSource = m ? 'manual' : null;
    try { chrome.storage.local.set({ hlx_addr: state.userAddr }); } catch {}
    state.positions = []; if (state.userAddr) fetchPositions();
    render();
  }
  // Poll the REAL positions (~20s while chip/window visible; reuses the bg cache).
  async function fetchPositions() {
    if (dead) return;
    const addr = detectAddress(); if (!addr) return;
    const r = await send({ type: 'getUserState', address: addr });
    // STALE-RESPONSE GUARD: the address may have switched/cleared while the
    // request was in flight — never apply positions for a previous address.
    if ((state.userAddr || '').toLowerCase() !== addr.toLowerCase()) return;
    if (r && r.ok && Array.isArray(r.positions)) {
      state.positions = r.positions; state.account = r.account || null; state.posAt = Date.now();
      // the chip risk light needs the coin's candles (daily-move vol) — fetch once
      const pos = positionFor(activeCoin());
      if (pos && !candlesFor(activeCoin())) fetchCandles(activeCoin());
      // portfolio distance-to-liq is in daily moves → get each held coin's candles
      // (cheap, cached 60s) but only while the window is open, throttled per coin.
      if (state.winOpen && state.positions.length) {
        state._dmpFetch = state._dmpFetch || {};
        for (const p of state.positions) {
          const key = (p.coin || '').toUpperCase();
          if (!candlesFor(p.coin) && Date.now() - (state._dmpFetch[key] || 0) > 30000) { state._dmpFetch[key] = Date.now(); fetchCandles(p.coin); }
        }
      }
      renderChip(); if (state.winOpen) renderWindow();
      fetchAdl();   // estimated ADL exposure per position (throttled per coin)
    }
  }
  // ADL EXPOSURE (estimated · profit×lev rank vs the crawled whale set). One bg
  // round-trip per position, throttled 60s per coin; results in state.adl[COIN].
  async function fetchAdl() {
    if (dead || !state.positions.length) return;
    const acct = state.account && state.account.marginSummary ? state.account.marginSummary.accountValue : null;
    if (!acct) return;
    state.adl = state.adl || {}; state._adlAt = state._adlAt || {};
    let changed = false;
    for (const p of state.positions.slice()) {
      const key = (p.coin || '').toUpperCase();
      if (Date.now() - (state._adlAt[key] || 0) < 60000) continue;
      state._adlAt[key] = Date.now();
      const r = await send({ type: 'getAdlRank', coin: p.coin, side: p.side, mark: p.markPx, entryPx: p.entryPx, notional: p.positionValue, accountValue: acct });
      if (r && r.ok) { state.adl[key] = r; changed = true; }
    }
    if (changed) { renderChip(); if (state.winOpen) renderWindow(); }
  }
  function adlFor(coin) { return (state.adl && state.adl[(coin || '').toUpperCase()]) || null; }
  // portfolio object passed into ctx: positions enriched with per-coin daily move
  // + estimated ADL exposure.
  function buildPortfolio() {
    if (!state.positions || !state.positions.length) return null;
    const positions = state.positions.map((p) => {
      const cd = candlesFor(p.coin);
      return Object.assign({}, p, { dmp: cd ? cd.dmp : null, adl: adlFor(p.coin) });
    });
    return { positions, account: state.account || null };
  }
  function schedulePositions() {
    if (state.posTimer) clearInterval(state.posTimer);
    state.posTimer = setInterval(fetchPositions, 20000);
    fetchPositions();
  }

  // -------- data --------
  // Exponential retry backoff: 2s → 30s cap (fixed 2s-forever hammered the bg).
  const BACKOFF_BASE_MS = 2000, BACKOFF_CAP_MS = 30000;
  function nextBackoff(cur) { return Math.min(BACKOFF_CAP_MS, (cur || BACKOFF_BASE_MS / 2) * 2); }
  async function refreshData() {
    if (dead) return;
    const resp = await send({ type: 'getMarkets' });
    if (resp && resp.ok && Array.isArray(resp.rows) && resp.rows.length) { state.rows = resp.rows; state._mktBackoff = 0; if (resp.settings) applySettings(resp.settings); }
    else {
      state._mktBackoff = nextBackoff(state._mktBackoff);
      try { console.warn('[HypeLens] getMarkets returned no rows — retrying in ' + (state._mktBackoff / 1000) + 's'); } catch {}
      clearTimeout(state._mktRetry); state._mktRetry = setTimeout(refreshData, state._mktBackoff);
    }
    const pred = await send({ type: 'getPredicted' }); if (pred && pred.ok && pred.byCoin) state.predicted = pred.byCoin;
    render();
    fetchIntel(activeCoin());
    if (state.winOpen) fetchCandles(activeCoin());
  }
  // COIN CANONICALIZATION (bg caches are keyed by HL canonical names, e.g.
  // "kPEPE" — the URL/DOM gives us "KPEPE"): resolve through the market rows and
  // send row.coin to the background; the UPPERCASED form stays the local cache key.
  function apiCoinFor(coin) { const row = rowFor(coin); return row ? row.coin : null; }
  // REAL liq walls + smart money for `coin` (whale-derived, background). Polls
  // while the whale set is still aggregating (loading:true).
  async function fetchIntel(coin) {
    if (dead || !coin) return;
    const up = coin.toUpperCase(), row = rowFor(up); if (!row) return;
    const resp = await send({ type: 'getCoinIntel', coin: row.coin, mark: row.markPx });
    if (resp && resp.ok) {
      state.intel[up] = resp;
      // don't clobber the active coin's coverage with a late response for another coin
      if (resp.coverage && up === (activeCoin() || '').toUpperCase()) state.coverage = resp.coverage;
      renderChip(); if (state.winOpen) renderWindow();
      if (resp.loading) { clearTimeout(state._intelPoll); state._intelPoll = setTimeout(() => fetchIntel(up), 1800); }
    }
  }
  const CANDLE_MAX_RETRIES = 10;
  async function fetchCandles(coin) {
    if (dead || !coin) return;
    const up = coin.toUpperCase(), tf = state.tf, key = up + '|' + tf;
    const cur = state.candles[key];
    if (cur && Date.now() - cur.at < 45000) { redrawWindowChart(); return; }
    const apiCoin = apiCoinFor(up) || coin;   // canonical name for the API/bg cache
    const r = await send({ type: 'getCandles', coin: apiCoin, interval: tf, bars: 90 });
    const n = (r && Array.isArray(r.candles)) ? r.candles.length : 0;
    try { console.log('[HypeLens] getCandles', apiCoin, tf, '→', n, 'candles', (r && r.ok) ? '' : '(fetch not ok)'); } catch {}
    if (r && r.ok && n) {
      const dmp = VM.dailyMovePct(r.candles, tf);
      state.candles[key] = { candles: r.candles, dmp, at: Date.now() };
      state._candleTries = state._candleTries || {}; state._candleTries[key] = 0;
      // seed a sensible 1:2 R:R the user then drags — only from the ACTIVE coin
      // (portfolio may fetch candles for other held coins; don't seed from those).
      if (dmp && state.risk.stopPct == null && up === (activeCoin() || '').toUpperCase()) { state.risk.stopPct = +(1.5 * dmp * 100).toFixed(1); state.risk.tpPct = +(3 * dmp * 100).toFixed(1); }
      redrawWindowChart();   // → updateChartData: series.setData + fitContent + heat redraw
    } else if (state.winOpen) {
      // empty/slow fetch — exponential backoff (2s→30s), capped attempts per
      // coin|tf so a dead market can't retry forever; counter resets on success
      // or when the coin/tf changes.
      state._candleTries = state._candleTries || {};
      const tries = (state._candleTries[key] || 0) + 1; state._candleTries[key] = tries;
      if (tries <= CANDLE_MAX_RETRIES) {
        const wait = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * Math.pow(2, tries - 1));
        clearTimeout(state._candlePoll); state._candlePoll = setTimeout(() => fetchCandles(activeCoin()), wait);
      } else { try { console.warn('[HypeLens] getCandles ' + key + ': giving up after ' + CANDLE_MAX_RETRIES + ' attempts'); } catch {} }
    }
  }
  function applySettings(s) { const prev = state.settings.pollIntervalSec; state.settings = { ...state.settings, ...s }; if (state.settings.pollIntervalSec !== prev) schedulePoll(); }
  function schedulePoll() { if (state.pollTimer) clearInterval(state.pollTimer); state.pollTimer = setInterval(() => refreshData(), Math.max(10, state.settings.pollIntervalSec) * 1000); }

  // -------- coin detection --------
  function detectCoin() {
    const m = window.location.pathname.match(/\/trade\/([A-Za-z0-9:@._-]+)/);
    if (m && m[1]) { const seg = decodeURIComponent(m[1]).split('/')[0]; if (seg && !seg.startsWith('@')) return seg.toUpperCase(); }
    const t = (document.title || '').match(/([A-Za-z0-9]+)[\/\-]USD/); if (t) return t[1].toUpperCase();
    return domCoin();
  }
  function domCoin() {
    const known = new Set(state.rows.map((r) => r.coin.toUpperCase())); if (!known.size) return null;
    for (const sel of ['[class*="coin" i]', '[class*="ticker" i]', '[class*="symbol" i]', 'h1']) {
      let nodes; try { nodes = document.querySelectorAll(sel); } catch { continue; }
      for (const n of nodes) { const txt = (n.textContent || '').trim(); if (!txt || txt.length > 40) continue; const c = (txt.match(/[A-Za-z0-9]{2,15}/) || [])[0]; if (c && known.has(c.toUpperCase())) return c.toUpperCase(); }
    }
    return null;
  }
  function previewTag(src) { return src === 'live' ? '' : '<span class="hlx-preview">PREVIEW</span>'; }

  // ctx shared with the toolbar popup via HLHUD (identical rendering).
  function buildCtx(vm) {
    const pos = positionFor(vm.coin);
    return {
      vm, candles: candlesFor(vm.coin), lev: state.lev, risk: state.risk, tf: state.tf, heat: state.heat,
      position: pos ? Object.assign({}, pos, { adl: adlFor(pos.coin) }) : null,   // GUARDIAN + estimated ADL
      mode: state.mode,
      portfolio: buildPortfolio(),                                // PORTFOLIO/CROSS view
      userAddr: state.userAddr, addrSource: state.addrSource,
      onMode: (m) => { state.mode = m; renderWindow(); },
      onCoin: (c) => { if (!c) return; state.currentCoin = c.toUpperCase(); state.mode = 'guardian'; state._candleTries = {}; fetchIntel(state.currentCoin); fetchCandles(state.currentCoin); renderChip(); renderWindow(); },
      onAddr: (a) => setManualAddress(a),
      // NAMED-WHALE DRILL-DOWN: which wallets compose a cluster band (existing
      // whale snapshot in the bg — no new API calls, no new permissions).
      onClusterWallets: (coin, price) => { const row = rowFor(coin); return send({ type: 'getClusterWallets', coin: row ? row.coin : coin, price, mark: row ? row.markPx : vm.markPx }); },
      coverageText: (state.coverage && state.coverage.note) || 'real positions · top wallets',
      disclaimer: DISCLAIMER
    };
  }
  function onTf(tf) { if (tf === state.tf) return; state.tf = tf; state._candleTries = {}; fetchCandles(activeCoin()); renderWindow(); }

  // ================= THE ONE CHIP =================
  function loadPrefs() { try { chrome.storage.local.get(['hlx_chip', 'hlx_win', 'hlx_heat', 'hlx_addr'], (o) => { if (o) { if (o.hlx_chip) state.chip = { ...state.chip, ...o.hlx_chip }; if (o.hlx_win) state.win = { ...state.win, ...o.hlx_win }; if (o.hlx_heat) state.heat = { ...state.heat, ...o.hlx_heat }; if (o.hlx_addr) { state.userAddr = o.hlx_addr; state.addrSource = 'manual'; } renderChip(); if (state.winOpen) renderWindow(); } }); } catch {} }
  function saveChip() { try { chrome.storage.local.set({ hlx_chip: state.chip }); } catch {} }
  function saveWin() { try { chrome.storage.local.set({ hlx_win: state.win }); } catch {} }
  function saveHeat() { try { chrome.storage.local.set({ hlx_heat: state.heat }); } catch {} }
  function ensureChip() { let c = document.getElementById(CHIP_ID); if (c) return c; c = document.createElement('div'); c.id = CHIP_ID; document.body.appendChild(c); if (state.chip.x == null) { state.chip.x = window.innerWidth - 252; state.chip.y = window.innerHeight - 54; } positionChip(); wireChipDrag(c); return c; }
  function positionChip() { const c = document.getElementById(CHIP_ID); if (!c) return; c.style.left = Math.max(4, Math.min(state.chip.x, window.innerWidth - 60)) + 'px'; c.style.top = Math.max(4, Math.min(state.chip.y, window.innerHeight - 40)) + 'px'; }
  // Chip interaction — a single click/tap MUST open the window. We do NOT capture
  // the pointer until an actual drag starts (capturing on pointerdown can swallow
  // the click on SPA hosts), and we add a deduped `click` fallback so the open
  // fires even if pointer events are flaky on app.hyperliquid.xyz.
  function wireChipDrag(chip) {
    let down = false, dragging = false, sx = 0, sy = 0, ox = 0, oy = 0, pid = null;
    const THRESH = 5;
    chip.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.hlx-chip-x')) return;
      down = true; dragging = false; sx = e.clientX; sy = e.clientY; ox = state.chip.x; oy = state.chip.y; pid = e.pointerId;
    });
    chip.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!dragging && Math.abs(dx) + Math.abs(dy) > THRESH) { dragging = true; try { chip.setPointerCapture(pid); } catch {} }
      if (dragging) { state.chip.x = ox + dx; state.chip.y = oy + dy; positionChip(); }
    });
    chip.addEventListener('pointerup', (e) => {
      if (!down) return; down = false;
      if (dragging) { dragging = false; try { chip.releasePointerCapture(pid); } catch {} saveChip(); return; }
      activateChip('pointerup');
    });
    chip.addEventListener('pointercancel', () => { down = false; dragging = false; });
    chip.addEventListener('click', (e) => {
      if (e.target.closest('.hlx-chip-x')) { e.stopPropagation(); dismissChip(); return; }
      activateChip('click');   // fallback; deduped against the pointerup path
    });
  }
  let _lastActivate = 0;
  function activateChip(src) {
    if (dead) { try { location.reload(); } catch {} return; }   // stale chip → reload the tab
    const now = Date.now(); if (now - _lastActivate < 350) return; _lastActivate = now;
    try { console.log('[HypeLens] chip activate via', src, '· dismissed=', state.chip.dismissed, '· winOpen=', state.winOpen); } catch {}
    if (state.chip.dismissed) { state.chip.dismissed = false; saveChip(); renderChip(); }
    toggleWindow();
  }
  function dismissChip() { try { console.log('[HypeLens] chip dismiss'); } catch {} state.chip.dismissed = true; saveChip(); closeWindow(); renderChip(); }
  function renderChip() {
    if (dead) { renderStaleChip(); return; }             // orphaned: unmissable reload state wins
    const chip = ensureChip();
    if (state.chip.dismissed) { chip.className = 'hlx-chip-min'; chip.innerHTML = '<span class="hlx-chip-dot">◉</span>'; chip.title = 'HypeLens — click to restore'; positionChip(); return; }
    chip.className = state.winOpen ? 'hlx-open' : ''; chip.title = 'HypeLens — drag to move · click to open the liq heatmap';
    const vm = activeVm();
    const brand = '<span class="hlx-chip-dot">◉</span><span class="hlx-chip-brand">HypeLens</span>';
    if (!vm) { chip.innerHTML = brand + '<span class="hlx-chip-text hlx-dim">loading…</span>'; positionChip(); return; }
    if (vm.loading) { chip.innerHTML = brand + '<span class="hlx-chip-sep">·</span><span class="hlx-chip-text">' + vm.coin + ' <span class="hlx-dim">loading walls…</span></span><span class="hlx-chip-x" title="minimize">×</span>'; positionChip(); return; }
    // GUARDIAN risk light: an open REAL position on this coin drives the chip.
    const pos = positionFor(vm.coin);
    if (pos && pos.liquidationPx != null && window.HLHUD && HLHUD.positionRead) {
      const read = HLHUD.positionRead(buildCtx(vm), pos);
      chip.className = (state.winOpen ? 'hlx-open ' : '') + 'hlx-risk-' + read.color;
      chip.title = 'HypeLens Guardian — your ' + vm.coin + ' ' + pos.side + ' vs the crowd’s liq clusters · click to open';
      chip.innerHTML = brand + '<span class="hlx-chip-sep">·</span><span class="hlx-chip-text">' + vm.coin + ' ' + pos.side +
        (pos.leverage ? ' ' + pos.leverage + '×' : '') + ' · <b class="hlx-' + (read.color === 'red' ? 'neg' : read.color === 'orange' ? 'warn' : 'pos') + '">' + read.chipText + '</b></span>' +
        '<span class="hlx-chip-x" title="minimize">×</span>';
      positionChip(); return;
    }
    const sm = vm.smartMoney, isShort = sm.side === 'short';
    const sideWord = sm.side === 'mixed' ? 'SPLIT' : (isShort ? 'SHORT' : 'LONG');
    const cls = sm.side === 'mixed' ? 'hlx-dim' : (isShort ? 'hlx-neg' : 'hlx-pos');
    const pct = isShort ? sm.pctShort : (sm.side === 'long' ? 100 - sm.pctShort : sm.pctShort);
    const n = vm.liq.nearest;
    const wall = n ? ' · wall <b class="' + (n.side === 'long' ? 'hlx-neg' : 'hlx-pos') + '">' + VM.fmtUsd(n.sizeUsd) + ' ' + VM.fmtApr(n.distPct) + '</b>' : '';
    chip.innerHTML = brand + '<span class="hlx-chip-sep">·</span><span class="hlx-chip-text">' + vm.coin + ' <b class="' + cls + '">' + pct + '% ' + sideWord + '</b>' + wall + '</span>' + previewTag(vm.liq.source) + '<span class="hlx-chip-x" title="minimize">×</span>';
    positionChip();
  }

  // ================= THE WINDOW =================
  function ensureWindow() { let w = document.getElementById(WIN_ID); if (w) return w; w = document.createElement('div'); w.id = WIN_ID; document.body.appendChild(w); return w; }
  function positionWindow() {
    const w = document.getElementById(WIN_ID), chip = document.getElementById(CHIP_ID); if (!w) return;
    const ww = w.offsetWidth || 380, wh = w.offsetHeight || 360;
    let x = state.win.x, y = state.win.y;
    if (x == null && chip) { const cr = chip.getBoundingClientRect(); x = cr.left - 8 - ww; if (x < 8) x = Math.min(cr.right + 8, window.innerWidth - ww - 8); y = cr.top; }
    if (x == null) x = 60; if (y == null) y = 80;
    x = Math.max(8, Math.min(x, window.innerWidth - ww - 8)); y = Math.max(8, Math.min(y, window.innerHeight - wh - 8));
    w.style.left = Math.round(x) + 'px'; w.style.top = Math.round(y) + 'px';
  }
  function toggleWindow() { try { console.log('[HypeLens] toggleWindow; winOpen=', state.winOpen); } catch {} if (state.winOpen) closeWindow(); else openWindow(); }
  function openWindow() {
    try { console.log('[HypeLens] openWindow'); } catch {}
    state.winOpen = true; renderChip();
    const w = ensureWindow(); w.style.display = 'flex';   // force visible up-front
    renderWindow(); positionWindow();
    fetchCandles(activeCoin()); fetchIntel(activeCoin());
    // LWC/heat can size to 0 if measured before layout — re-render next frame so
    // the chart definitely appears and is positioned on-screen.
    requestAnimationFrame(() => { if (state.winOpen) { renderWindow(); positionWindow(); } });
  }
  function closeWindow() { try { console.log('[HypeLens] closeWindow'); } catch {} state.winOpen = false; const w = document.getElementById(WIN_ID); if (w) w.style.display = 'none'; renderChip(); }

  // Renders via the SHARED HLHUD module (Lightweight Charts) — identical to
  // the toolbar popup. HLHUD mounts on first call / coin change and updates
  // (preserving zoom) otherwise, so calling this on data refresh is cheap.
  function renderWindow() {
    if (dead) { showStaleBanner(); return; }             // orphaned: keep the banner, no stale re-render
    if (!state.winOpen) return;
    const w = ensureWindow(); w.style.display = 'flex';
    const vm = activeVm();
    if (!vm) { w.innerHTML = '<div class="hlx-win-empty">Loading Hyperliquid data…</div>'; delete w.__hlx; positionWindow(); try { console.log('[HypeLens] renderWindow: no market data yet — showing loading'); } catch {} return; }
    try {
      const res = HLHUD.render(w, buildCtx(vm), { showClose: true, onClose: closeWindow, onChange: function () {}, onTf: onTf, onHeat: saveHeat, version: VERSION });
      if (res && res.mounted) { wireWindowDrag(res.dragHandle, w); positionWindow(); try { console.log('[HypeLens] renderWindow: chart mounted'); } catch {} }
      mountPlaceUI(w);
    } catch (err) {
      try { console.error('[HypeLens] renderWindow error', err); } catch {}
      w.innerHTML = '<div class="hlx-win-empty">Chart failed to load — see console.</div>'; positionWindow();
    }
  }
  // Module 3: the current planner state → an order plan (entry limit + SL/TP).
  function getPlan() {
    const vm = activeVm(); if (!vm || !vm.markPx) return null;
    const risk = state.risk || {}, isLong = state.lev.dir !== 'short', entryPx = vm.markPx;
    const size = entryPx ? (Number(state.lev.sizeUsd) || 0) / entryPx : 0;   // notional → coin size
    const slPx = (risk.stopPct > 0) ? (isLong ? entryPx * (1 - risk.stopPct / 100) : entryPx * (1 + risk.stopPct / 100)) : null;
    const tpPx = (risk.tpPct > 0) ? (isLong ? entryPx * (1 + risk.tpPct / 100) : entryPx * (1 - risk.tpPct / 100)) : null;
    return { coin: vm.coin, isBuy: isLong, entryPx, size, slPx, tpPx };
  }
  // Persistent placement section appended below the HUD (survives data-refresh
  // updates; only re-created when HLHUD remounts the window and clears it).
  function mountPlaceUI(w) {
    if (!(window.HLX3 && window.HLX3.ui)) return;
    if (w.querySelector('.hlx-x3-mount')) return;
    const m = document.createElement('div'); m.className = 'hlx-x3-mount'; w.appendChild(m);
    try { window.HLX3.ui.render(m, { getPlan }); } catch (e) { try { console.warn('[HypeLens] place UI failed', e); } catch {} }
  }
  function redrawWindowChart() { renderWindow(); }
  function wireWindowDrag(handle, win) {
    if (!handle) return;
    let down = false, sx = 0, sy = 0, ox = 0, oy = 0;
    handle.addEventListener('pointerdown', (e) => { if (e.target.closest('.hlx-win-close')) return; down = true; sx = e.clientX; sy = e.clientY; const r = win.getBoundingClientRect(); ox = r.left; oy = r.top; try { handle.setPointerCapture(e.pointerId); } catch {} });
    handle.addEventListener('pointermove', (e) => { if (!down) return; state.win.x = ox + (e.clientX - sx); state.win.y = oy + (e.clientY - sy); positionWindow(); });
    handle.addEventListener('pointerup', (e) => { if (!down) return; down = false; try { handle.releasePointerCapture(e.pointerId); } catch {} saveWin(); });
  }

  // ================= render + loops =================
  function render() { renderChip(); if (state.winOpen) renderWindow(); }
  // ROUTE POLL vs onCoin OVERRIDE: only act on a REAL navigation (URL coin
  // actually changed since last look). Without this, a portfolio row-click
  // (onCoin('ETH')) got snapped back to the URL coin within 500ms.
  let lastUrlCoin = null;
  function onRoute() {
    if (dead) return;
    const coin = detectCoin();
    if (coin === lastUrlCoin) return;          // no navigation — keep any override
    lastUrlCoin = coin;
    if (coin !== state.currentCoin) {          // real navigation clears the override
      state.currentCoin = coin;
      renderChip(); fetchIntel(activeCoin());
      if (state.winOpen) { renderWindow(); fetchCandles(activeCoin()); }
    }
  }
  window.addEventListener('popstate', onRoute);
  const routeTimer = setInterval(onRoute, 500);
  window.addEventListener('resize', () => { positionChip(); if (state.winOpen) { positionWindow(); redrawWindowChart(); } });
  try { chrome.storage.onChanged.addListener((ch, area) => { if (area === 'local' && ch.settings && ch.settings.newValue) { applySettings(ch.settings.newValue); render(); } }); } catch {}
  try { chrome.runtime.onMessage.addListener((msg, _s, sr) => { if (msg && msg.type === 'openPanel') { state.chip.dismissed = false; saveChip(); openWindow(); sr({ ok: true }); } return false; }); } catch {}

  // -------- boot --------
  state.currentCoin = detectCoin();
  lastUrlCoin = state.currentCoin;   // route-poll baseline: an onCoin override
                                     // before the first tick must not be reverted
  loadPrefs();
  renderChip();
  refreshData();
  schedulePoll();
  schedulePositions();   // GUARDIAN: poll the connected wallet's real positions (~20s)
})();
