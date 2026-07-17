// HypeLens popup — renders the SAME shared HLHUD as the injected on-page
// window (mini candlestick chart + liq-wall heatmap + vol-colored liq line +
// leverage/size slider + Place stub). No dense panel, no share card. A coin
// picker lets the popup work standalone (default = most active perp).

const VM = window.HLVM;

function send(msg) { return new Promise((res) => { try { chrome.runtime.sendMessage(msg, (r) => { if (chrome.runtime.lastError) { res(null); return; } res(r); }); } catch { res(null); } }); }

const state = {
  rows: [], predicted: null, intel: {}, coverage: null, intelLive: false,
  candles: {}, focusCoin: null, tf: '1d',
  lev: { sizeUsd: 1000, dir: 'long', leverage: null, margin: 'isolated' },
  risk: { stopPct: null, tpPct: null, trailPct: null },
  heat: { intensity: 0.5, opacity: 0.5 }
};
function saveHeat() { try { chrome.storage.local.set({ hlx_heat: state.heat }); } catch {} }

function rowFor(c) { if (!c) return null; const up = c.toUpperCase(); return state.rows.find((r) => r.coin.toUpperCase() === up) || null; }
function vmFor(c) { const row = rowFor(c); if (!row) return null; const intel = state.intel && state.intel[(c || '').toUpperCase()]; return VM.buildViewModel({ coin: c, row, predicted: state.predicted, intel }); }
function candlesFor(c) { return state.candles[(c || '').toUpperCase() + '|' + state.tf] || null; }
function pickFocus() {
  if (state.focusCoin && rowFor(state.focusCoin)) return state.focusCoin;
  let best = null; for (const r of state.rows) { if (r.dayNtlVlm == null) continue; if (!best || r.dayNtlVlm > best.dayNtlVlm) best = r; }
  return best ? best.coin : (state.rows[0] ? state.rows[0].coin : null);
}

async function load() {
  try { chrome.storage.local.get(['hlx_heat'], (o) => { if (o && o.hlx_heat) { state.heat = { ...state.heat, ...o.hlx_heat }; render(); } }); } catch {}
  const m = await send({ type: 'getMarkets' }); if (m && m.ok && Array.isArray(m.rows)) state.rows = m.rows;
  const p = await send({ type: 'getPredicted' }); if (p && p.ok && p.byCoin) state.predicted = p.byCoin;
  state.focusCoin = pickFocus();
  populateSelect();
  fetchIntel(state.focusCoin);
  await fetchCandles(state.focusCoin);
  render();
}
async function fetchIntel(coin) {
  if (!coin) return;
  const up = coin.toUpperCase(), row = rowFor(up); if (!row) return;
  const resp = await send({ type: 'getCoinIntel', coin: up, mark: row.markPx });
  if (resp && resp.ok) {
    state.intel[up] = resp; if (resp.coverage) state.coverage = resp.coverage; render();
    if (resp.loading) { clearTimeout(state._intelPoll); state._intelPoll = setTimeout(() => fetchIntel(up), 1800); }
  }
}
async function fetchCandles(coin) {
  if (!coin) return;
  const up = coin.toUpperCase(), tf = state.tf, key = up + '|' + tf; const cur = state.candles[key];
  if (cur && Date.now() - cur.at < 45000) { render(); return; }
  const r = await send({ type: 'getCandles', coin: up, interval: tf, bars: 90 });
  if (r && r.ok && Array.isArray(r.candles) && r.candles.length) {
    const dmp = VM.dailyMovePct(r.candles, tf);
    state.candles[key] = { candles: r.candles, dmp, at: Date.now() };
    if (dmp && state.risk.stopPct == null) { state.risk.stopPct = +(1.5 * dmp * 100).toFixed(1); state.risk.tpPct = +(3 * dmp * 100).toFixed(1); }
    render();
  }
}
function onTf(tf) { if (tf === state.tf) return; state.tf = tf; fetchCandles(pickFocus()); render(); }

function populateSelect() {
  const sel = document.getElementById('coinSel'); if (!sel) return;
  if (sel.options.length && sel.dataset.filled === '1') { sel.value = state.focusCoin; return; }
  const top = state.rows.slice().filter((r) => r.dayNtlVlm != null).sort((a, b) => b.dayNtlVlm - a.dayNtlVlm).slice(0, 30);
  sel.innerHTML = top.map((r) => '<option value="' + r.coin + '">' + r.coin + '</option>').join('');
  sel.dataset.filled = '1';
  if (state.focusCoin) sel.value = state.focusCoin;
}

function buildCtx(vm) {
  return {
    vm, candles: candlesFor(vm.coin), lev: state.lev, risk: state.risk, tf: state.tf, heat: state.heat,
    coverageText: (state.coverage && state.coverage.note) || 'real positions · top wallets',
    disclaimer: HLHUD.DISCLAIMER
  };
}
// Module 3: current planner state → an order plan (entry limit + SL/TP).
function popupPlan() {
  const vm = vmFor(pickFocus()); if (!vm || !vm.markPx) return null;
  const risk = state.risk || {}, isLong = state.lev.dir !== 'short', entryPx = vm.markPx;
  const size = entryPx ? (Number(state.lev.sizeUsd) || 0) / entryPx : 0;
  const slPx = (risk.stopPct > 0) ? (isLong ? entryPx * (1 - risk.stopPct / 100) : entryPx * (1 + risk.stopPct / 100)) : null;
  const tpPx = (risk.tpPct > 0) ? (isLong ? entryPx * (1 + risk.tpPct / 100) : entryPx * (1 - risk.tpPct / 100)) : null;
  return { coin: vm.coin, isBuy: isLong, entryPx, size, slPx, tpPx };
}
let _placeMounted = false;
function mountPlace() {
  const m = document.getElementById('placeMount');
  if (!m || _placeMounted || !(window.HLX3 && window.HLX3.ui)) return;
  _placeMounted = true;
  try { window.HLX3.ui.render(m, { getPlan: popupPlan }); } catch (e) {}
}
function render() {
  const hud = document.getElementById('hud');
  const vm = vmFor(pickFocus());
  if (!vm) { hud.innerHTML = '<div class="hlx-win-empty">Loading Hyperliquid data…</div>'; return; }
  HLHUD.render(hud, buildCtx(vm), { showClose: false, onChange: function () {}, onTf: onTf, onHeat: saveHeat, version: (function () { try { return chrome.runtime.getManifest().version; } catch { return ''; } })() });
  mountPlace();
  const note = document.getElementById('popNote');
  if (note) note.textContent = '';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('refresh').addEventListener('click', () => load());
  document.getElementById('coinSel').addEventListener('change', (e) => { state.focusCoin = e.target.value; state.lev.leverage = null; fetchIntel(state.focusCoin); fetchCandles(state.focusCoin); render(); });
  load();
  setInterval(() => { load(); }, 20000);
});
