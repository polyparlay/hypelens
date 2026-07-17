// PolyParlay Pro verification worker
// Cloudflare Workers — free tier covers the expected volume.
//
// Endpoint:  GET /verify?wallet=0xUSER_WALLET
// Returns:   { ok: true, pro: bool, expires?: unixTimestamp, paidAt?: ts, txHash?: str, tier?: '30d' | '365d' }
//
// Logic:
//   1. Query Polygonscan for ERC20 transfers of USDC from <wallet> to PAYMENT_ADDRESS
//   2. Bucket each transfer into the highest tier it crosses (monthly or annual)
//   3. Compute expires = paidAt + tier_duration for each tx
//   4. Effective pro = any tx whose expires > now; return the one with furthest expiry
//
// Deploy with: wrangler deploy
// See ./README.md for setup.

// Polygon has TWO USDC contracts. We check BOTH so we don't reject a
// payment based on which version the user holds.
//   USDC_E    — bridged ("USDC.e", the old default, deployed 2020)
//   USDC      — native USDC, Circle-issued, the new default (2023+)
const USDC_CONTRACTS = [
  '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // bridged USDC.e
  '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'  // native USDC
];

// Tiered pricing — listed largest-amount first. A payment is bucketed into the
// largest tier whose threshold it meets. Overpayment goes to the higher tier;
// underpayment below the smallest tier is ignored.
// Tier table — listed largest-amount first. `find()` matches the first tier
// whose threshold the payment crosses, so a payment of $50 lands on the $39
// legacy-annual tier (gets 365d) rather than the $14.99 monthly tier.
//
// Legacy tiers exist so users who paid earlier prices (4.99 monthly,
// 39 annual, 149 annual) keep access on renewal cycles. Anyone with an
// existing on-chain payment ≥ $4.99 still resolves to a valid tier.
const TIERS = [
  { amount: 149_000_000n, seconds: 365 * 24 * 60 * 60, label: '365d' }, // legacy $149 annual
  { amount:  99_000_000n, seconds: 365 * 24 * 60 * 60, label: '365d' }, // current $99 annual ($8.25/mo)
  { amount:  39_000_000n, seconds: 365 * 24 * 60 * 60, label: '365d' }, // legacy $39 annual
  { amount:  14_990_000n, seconds:  30 * 24 * 60 * 60, label: '30d'  }, // current $14.99 monthly
  { amount:   4_990_000n, seconds:   30 * 24 * 60 * 60, label: '30d'  }  // legacy $4.99 monthly
];

// === COMP CODES (one per user) =============================================
// Each entry is a pseudo-wallet (valid 0x... format but never used on-chain)
// uniquely assigned to one influencer/reviewer. They paste it into the verify
// form on /upgrade and get instant Pro without paying. Single-use by virtue
// of being privately distributed — only one person knows each code.
//
// To revoke: delete that line and `wrangler deploy`. Access expires next time
// the extension's hourly verify-cache refreshes.
//
// Tracking: who got which code is in marketing-auto/comp-codes.md
//
// Format: lowercased 0x address as the key, tier label as the value.
const COMP_CODES = new Map([
  ['0x0000000000000000000000000000000000000001', '365d'],
  ['0x0000000000000000000000000000000000000002', '365d'],
  ['0x0000000000000000000000000000000000000003', '365d'],
  ['0x0000000000000000000000000000000000000004', '365d'],
  ['0x0000000000000000000000000000000000000005', '365d'],
  ['0x0000000000000000000000000000000000000006', '365d'],
  ['0x0000000000000000000000000000000000000007', '365d'],
  ['0x0000000000000000000000000000000000000008', '365d'],
  ['0x0000000000000000000000000000000000000009', '365d'],
  ['0x000000000000000000000000000000000000000a', '365d'],
  ['0x000000000000000000000000000000000000000b', '365d'],
  ['0x000000000000000000000000000000000000000c', '365d'],
  ['0x000000000000000000000000000000000000000d', '365d'],
  ['0x000000000000000000000000000000000000000e', '365d'],
  ['0x000000000000000000000000000000000000000f', '365d'],
  ['0x0000000000000000000000000000000000000010', '365d'],
  ['0x0000000000000000000000000000000000000011', '365d'],
  ['0x0000000000000000000000000000000000000012', '365d'],
  ['0x0000000000000000000000000000000000000013', '365d'],
  ['0x0000000000000000000000000000000000000014', '365d']
]);
const COMP_SECONDS = { '30d': 30 * 24 * 60 * 60, '365d': 365 * 24 * 60 * 60 };

// Short-code aliases for the comp wallets above. What we actually DM to
// influencers — `POLY-001` reads way better in a DM than a 42-char hex.
// Normalized to uppercase on input. Hex form still works as a fallback so
// codes already in flight aren't invalidated.
const SHORT_CODE_MAP = new Map([
  ['POLY-001', '0x0000000000000000000000000000000000000001'],
  ['POLY-002', '0x0000000000000000000000000000000000000002'],
  ['POLY-003', '0x0000000000000000000000000000000000000003'],
  ['POLY-004', '0x0000000000000000000000000000000000000004'],
  ['POLY-005', '0x0000000000000000000000000000000000000005'],
  ['POLY-006', '0x0000000000000000000000000000000000000006'],
  ['POLY-007', '0x0000000000000000000000000000000000000007'],
  ['POLY-008', '0x0000000000000000000000000000000000000008'],
  ['POLY-009', '0x0000000000000000000000000000000000000009'],
  ['POLY-010', '0x000000000000000000000000000000000000000a'],
  ['POLY-011', '0x000000000000000000000000000000000000000b'],
  ['POLY-012', '0x000000000000000000000000000000000000000c'],
  ['POLY-013', '0x000000000000000000000000000000000000000d'],
  ['POLY-014', '0x000000000000000000000000000000000000000e'],
  ['POLY-015', '0x000000000000000000000000000000000000000f'],
  ['POLY-016', '0x0000000000000000000000000000000000000010'],
  ['POLY-017', '0x0000000000000000000000000000000000000011'],
  ['POLY-018', '0x0000000000000000000000000000000000000012'],
  ['POLY-019', '0x0000000000000000000000000000000000000013'],
  ['POLY-020', '0x0000000000000000000000000000000000000014']
]);

// How far back to scan for payments. Slightly over a year so annual payments
// near expiry still get found; older txs are dropped because their `expires`
// would already be in the past.
const MAX_LOOKBACK_SECONDS = 400 * 24 * 60 * 60;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS,
      ...extraHeaders
    }
  });
}

// === LEADERBOARD =========================================================
// Public opt-in leaderboard of saved slips by realized ROI. Backed by KV.
// Storage shape per entry:
//   key: "lb:<id>" (or null if KV not configured → "feature unavailable")
//   value: JSON { id, handle, savedAt, resolvedAt, stake, multiplier,
//                 winRate, status, pnl, slipUrl, legs:[{q,side,price}] }
// We keep a small denormalized "lb:_index" sorted-set-ish array of recent
// entry ids for fast list reads.
//
// Throttled to 60 submissions/min/IP via CF's edge ratelimit (no-op for v1).
async function handleLeaderboard(request, env) {
  if (!env.LEADERBOARD) {
    return json({ ok: false, error: 'Leaderboard not configured — KV binding missing' }, 503);
  }
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'POST' && path === '/leaderboard/submit') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON' }, 400); }
    // Validate fields. Keep submissions tiny — < 4KB after JSON encode.
    const e = sanitizeLbEntry(body);
    if (!e) return json({ ok: false, error: 'Invalid entry' }, 400);
    e.id = e.id || `slip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    e.submittedAt = Math.floor(Date.now() / 1000);
    await env.LEADERBOARD.put(`lb:${e.id}`, JSON.stringify(e));
    // Update the index — last 200 entries by submittedAt
    const idxRaw = await env.LEADERBOARD.get('lb:_index');
    const idx = idxRaw ? JSON.parse(idxRaw) : [];
    idx.unshift({ id: e.id, ts: e.submittedAt });
    await env.LEADERBOARD.put('lb:_index', JSON.stringify(idx.slice(0, 200)));
    return json({ ok: true, id: e.id });
  }

  if (request.method === 'GET' && path === '/leaderboard/top') {
    const idxRaw = await env.LEADERBOARD.get('lb:_index');
    if (!idxRaw) return json({ ok: true, entries: [] });
    const idx = JSON.parse(idxRaw);
    const limit = Math.min(50, parseInt(url.searchParams.get('limit') || '20', 10));
    const sortKey = (url.searchParams.get('sort') || 'roi').toLowerCase();
    // Fetch entries in parallel
    const entries = (await Promise.all(
      idx.slice(0, 100).map((i) => env.LEADERBOARD.get(`lb:${i.id}`).then((s) => { try { return JSON.parse(s); } catch { return null; } }))
    )).filter(Boolean);
    // Sort by realized ROI (pnl / stake) descending — only resolved ones rank
    if (sortKey === 'roi') {
      entries.sort((a, b) => {
        const aRoi = a.status === 'won' || a.status === 'lost' ? (a.pnl || 0) / Math.max(a.stake, 1) : -999;
        const bRoi = b.status === 'won' || b.status === 'lost' ? (b.pnl || 0) / Math.max(b.stake, 1) : -999;
        return bRoi - aRoi;
      });
    } else if (sortKey === 'recent') {
      entries.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
    }
    return json({ ok: true, entries: entries.slice(0, limit) });
  }

  return json({ ok: false, error: 'Not found' }, 404);
}

function sanitizeLbEntry(b) {
  if (!b || typeof b !== 'object') return null;
  const handle = String(b.handle || 'anon').slice(0, 32).replace(/[^a-z0-9_-]/gi, '');
  const stake = Number(b.stake);
  const mult = Number(b.multiplier);
  const wr = Number(b.winRate);
  if (!stake || stake < 0 || !mult || mult < 1 || isNaN(wr)) return null;
  if (!Array.isArray(b.legs) || b.legs.length === 0 || b.legs.length > 10) return null;
  const legs = b.legs.slice(0, 10).map((l) => ({
    q: String(l.q || '').slice(0, 160),
    side: String(l.side || 'YES').slice(0, 4),
    price: Number(l.price) || 0
  }));
  return {
    id: b.id ? String(b.id).slice(0, 40).replace(/[^a-z0-9_-]/gi, '') : null,
    handle,
    savedAt: Number(b.savedAt) || Date.now(),
    resolvedAt: Number(b.resolvedAt) || null,
    stake,
    multiplier: mult,
    winRate: wr,
    status: ['won', 'lost', 'pending'].includes(b.status) ? b.status : 'pending',
    pnl: Number(b.pnl) || 0,
    slipUrl: b.slipUrl ? String(b.slipUrl).slice(0, 500) : null,
    legs
  };
}

// === TELEGRAM ALERTS =====================================================
// User subscribes via /telegram/subscribe with their chat_id + the slug +
// side + threshold price. Cron worker polls gamma-api for the legs every
// 15 min and sends a Telegram message when price crosses threshold.
//
// Storage shape:
//   key: "alert:<chat_id>:<id>" → { chatId, slug, side, threshold, direction, createdAt }
//   key: "alert:_index" → array of all alert keys for cron iteration
async function handleTelegram(request, env) {
  if (!env.LEADERBOARD) {
    return json({ ok: false, error: 'Alerts not configured — KV binding missing' }, 503);
  }
  if (!env.TELEGRAM_BOT_TOKEN) {
    return json({ ok: false, error: 'Alerts not configured — TELEGRAM_BOT_TOKEN missing' }, 503);
  }
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'POST' && path === '/telegram/subscribe') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON' }, 400); }
    const chatId = String(body.chatId || '').replace(/[^0-9-]/g, '').slice(0, 32);
    const slug = String(body.slug || '').slice(0, 200);
    const side = String(body.side || 'YES').toUpperCase();
    const threshold = Number(body.threshold);
    const direction = body.direction === 'below' ? 'below' : 'above';
    if (!chatId || !slug || !threshold || threshold <= 0 || threshold >= 1) {
      return json({ ok: false, error: 'Invalid subscription' }, 400);
    }
    const id = `${chatId}_${slug.slice(0, 40).replace(/[^a-z0-9-]/gi, '')}_${Date.now()}`;
    const entry = { id, chatId, slug, side, threshold, direction, createdAt: Date.now() };
    await env.LEADERBOARD.put(`alert:${id}`, JSON.stringify(entry));
    const idxRaw = await env.LEADERBOARD.get('alert:_index');
    const idx = idxRaw ? JSON.parse(idxRaw) : [];
    idx.push(id);
    await env.LEADERBOARD.put('alert:_index', JSON.stringify(idx));
    // Send confirmation to the user via Telegram
    await sendTelegram(env, chatId, `🔔 Alert set: ${slug} ${side} ${direction} ${threshold}\nYou'll get a message when this happens.`);
    return json({ ok: true, id });
  }

  if (request.method === 'POST' && path === '/telegram/connect') {
    // Generates a deep-link the user clicks to start a chat with our bot.
    // Our bot's /start handler captures their chat_id (via webhook setup).
    let body;
    try { body = await request.json(); } catch {}
    const botName = env.TELEGRAM_BOT_NAME || 'PolyParlayBot';
    return json({ ok: true, url: `https://t.me/${botName}?start=connect` });
  }

  // Webhook receiver — Telegram posts here when users message the bot.
  // Configure with: curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://polyparlay-verify.../telegram/webhook
  if (request.method === 'POST' && path === '/telegram/webhook') {
    let update;
    try { update = await request.json(); } catch { return json({ ok: true }); }
    const msg = update.message || update.edited_message;
    if (msg && msg.text && msg.chat && msg.chat.id) {
      const chatId = String(msg.chat.id);
      const text = String(msg.text).trim();
      if (text.startsWith('/start')) {
        await sendTelegram(env, chatId, `👋 Connected. Your chat ID is *${chatId}*.\n\nGo to the PolyParlay extension popup → settings → paste this chat ID to wire up price-drift alerts on your saved slips.`);
      } else if (text.startsWith('/alerts')) {
        const idxRaw = await env.LEADERBOARD.get('alert:_index');
        const idx = idxRaw ? JSON.parse(idxRaw) : [];
        const mine = (await Promise.all(idx.map((id) => env.LEADERBOARD.get(`alert:${id}`).then((s) => { try { return JSON.parse(s); } catch { return null; } }))))
          .filter((a) => a && a.chatId === chatId);
        const msg = mine.length === 0
          ? 'No active alerts. Set them from the PolyParlay extension.'
          : mine.map((a) => `• ${a.slug} ${a.side} ${a.direction} ${a.threshold}`).join('\n');
        await sendTelegram(env, chatId, msg);
      } else if (text.startsWith('/stop')) {
        const idxRaw = await env.LEADERBOARD.get('alert:_index');
        const idx = idxRaw ? JSON.parse(idxRaw) : [];
        let cleared = 0;
        for (const id of idx) {
          const raw = await env.LEADERBOARD.get(`alert:${id}`);
          try {
            const a = JSON.parse(raw);
            if (a && a.chatId === chatId) {
              await env.LEADERBOARD.delete(`alert:${id}`);
              cleared++;
            }
          } catch {}
        }
        const remaining = idx.filter(async (id) => await env.LEADERBOARD.get(`alert:${id}`));
        await env.LEADERBOARD.put('alert:_index', JSON.stringify(remaining));
        await sendTelegram(env, chatId, `🛑 Cleared ${cleared} alert${cleared === 1 ? '' : 's'}.`);
      }
    }
    return json({ ok: true });
  }

  return json({ ok: false, error: 'Not found' }, 404);
}

async function sendTelegram(env, chatId, text) {
  if (!env.TELEGRAM_BOT_TOKEN) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
    });
    return r.ok;
  } catch { return false; }
}

// Cron handler — runs every 15 min per wrangler.toml [triggers].
// For each active alert, fetch current price from gamma-api; if threshold
// crossed, send Telegram message + delete alert (one-shot).
async function handleScheduled(env) {
  if (!env.LEADERBOARD || !env.TELEGRAM_BOT_TOKEN) return;
  const idxRaw = await env.LEADERBOARD.get('alert:_index');
  if (!idxRaw) return;
  const idx = JSON.parse(idxRaw);
  if (!idx.length) return;
  const survivors = [];
  for (const id of idx) {
    const raw = await env.LEADERBOARD.get(`alert:${id}`);
    if (!raw) continue;
    let alert;
    try { alert = JSON.parse(raw); } catch { continue; }
    // Fetch current price for the slug
    try {
      const r = await fetch(`https://gamma-api.polymarket.com/markets?slug=${encodeURIComponent(alert.slug)}&limit=1`);
      const data = await r.json();
      const m = Array.isArray(data) ? data[0] : null;
      if (!m) { survivors.push(id); continue; }
      const prices = (() => {
        if (!m.outcomePrices) return null;
        if (Array.isArray(m.outcomePrices)) return m.outcomePrices.map(Number);
        try { return JSON.parse(m.outcomePrices).map(Number); } catch { return null; }
      })();
      if (!prices || prices.length !== 2) { survivors.push(id); continue; }
      const sideIdx = alert.side === 'NO' ? 1 : 0;
      const cur = prices[sideIdx];
      const triggered = alert.direction === 'above'
        ? cur >= alert.threshold
        : cur <= alert.threshold;
      if (triggered) {
        await sendTelegram(env, alert.chatId,
          `🚨 *Price alert*\n${alert.slug}\n${alert.side} now at ${(cur * 100).toFixed(0)}¢ (${alert.direction === 'above' ? '≥' : '≤'} ${(alert.threshold * 100).toFixed(0)}¢ threshold)\n\nhttps://polymarket.com/event/${alert.slug}`
        );
        await env.LEADERBOARD.delete(`alert:${id}`);
        // don't push to survivors
      } else {
        survivors.push(id);
      }
    } catch {
      survivors.push(id);
    }
  }
  await env.LEADERBOARD.put('alert:_index', JSON.stringify(survivors));
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(env));
  },
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);

    // Leaderboard endpoints handled separately (POST + GET allowed)
    if (url.pathname.startsWith('/leaderboard/')) {
      return handleLeaderboard(request, env);
    }
    // Telegram endpoints
    if (url.pathname.startsWith('/telegram/')) {
      return handleTelegram(request, env);
    }

    if (request.method !== 'GET') {
      return json({ ok: false, error: 'Method not allowed' }, 405);
    }

    if (url.pathname !== '/verify' && url.pathname !== '/') {
      return json({ ok: false, error: 'Not found' }, 404);
    }

    // Accept either a 0x wallet OR a short comp code like POLY-001.
    // Short codes get normalized to the matching pseudo-wallet for the
    // existing comp-code lookup below.
    let walletInput = (url.searchParams.get('wallet') || '').trim();
    const upper = walletInput.toUpperCase();
    if (SHORT_CODE_MAP.has(upper)) {
      walletInput = SHORT_CODE_MAP.get(upper);
    }
    const wallet = walletInput.toLowerCase();
    if (!/^0x[a-f0-9]{40}$/.test(wallet)) {
      return json({ ok: false, error: 'Invalid wallet address or code' }, 400);
    }

    // === COMP CODE SHORT-CIRCUIT =========================================
    // If the wallet matches a comp code, return Pro immediately without
    // hitting Polygonscan. The first verify call for a comp code defines
    // its activation date — we use the current request time as paidAt so
    // each user's Pro window starts when THEY activate (1 per user).
    if (COMP_CODES.has(wallet)) {
      const label = COMP_CODES.get(wallet);
      const now = Math.floor(Date.now() / 1000);
      const seconds = COMP_SECONDS[label] || COMP_SECONDS['30d'];
      const expires = now + seconds;
      const resp = json({
        ok: true, pro: true, wallet, paidAt: now, expires,
        txHash: 'COMP', tier: label, comp: true
      });
      // Cache 1 hour — comp codes don't change often; revocation needs at
      // most a 1h delay before being honored across the edge.
      resp.headers.set('Cache-Control', 'public, max-age=3600');
      return resp;
    }

    const paymentAddress = (env.PAYMENT_ADDRESS || '').trim().toLowerCase();
    const apiKey = env.POLYGONSCAN_KEY;
    if (!paymentAddress || !apiKey) {
      return json({ ok: false, error: 'Worker not configured (PAYMENT_ADDRESS / POLYGONSCAN_KEY missing)' }, 500);
    }

    // Edge cache the answer for 5 minutes per wallet — Polygonscan throttles at 5 req/sec free tier
    const cacheKey = new Request(`https://cache.polyparlay/${wallet}`, request);
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    // Query Polygonscan for both USDC contracts in parallel — a Pro payment
    // could be in either USDC.e or native USDC.
    const fetches = USDC_CONTRACTS.map((contract) =>
      fetch(
        `https://api.polygonscan.com/api` +
        `?module=account&action=tokentx` +
        `&contractaddress=${contract}` +
        `&address=${paymentAddress}` +
        `&page=1&offset=200&sort=desc` +
        `&apikey=${apiKey}`
      ).then((res) => (res.ok ? res.json() : null)).catch(() => null)
    );

    let results;
    try {
      results = await Promise.all(fetches);
    } catch (err) {
      return json({ ok: false, error: 'Polygonscan fetch failed: ' + (err.message || err) }, 502);
    }

    const txs = [];
    let anyDataReturned = false;
    for (const data of results) {
      if (!data) continue;
      anyDataReturned = true;
      if (data.status === '1' && Array.isArray(data.result)) {
        txs.push(...data.result);
      }
    }
    if (!anyDataReturned) {
      return json({ ok: false, error: 'Polygonscan unavailable' }, 502);
    }

    const now = Math.floor(Date.now() / 1000);

    // First pass: collect every tx that meets a tier threshold, with its raw
    // paidAt + tier metadata. We process them chronologically below so we can
    // stack durations on top of any still-active access window.
    const txWithTier = [];
    for (const tx of txs) {
      if (!tx) continue;
      if ((tx.from || '').toLowerCase() !== wallet) continue;
      if ((tx.to || '').toLowerCase() !== paymentAddress) continue;
      let value;
      try { value = BigInt(tx.value || '0'); } catch { continue; }
      const tier = TIERS.find((t) => value >= t.amount);
      if (!tier) continue;
      const paidAt = parseInt(tx.timeStamp || '0', 10);
      if (!paidAt) continue;
      if ((now - paidAt) > MAX_LOOKBACK_SECONDS) continue;
      txWithTier.push({ paidAt, tier, txHash: tx.hash });
    }
    txWithTier.sort((a, b) => a.paidAt - b.paidAt);

    // Stack durations: if a tx is paid while the prior access window is still
    // active, the new tier's seconds sit on top of the existing expiry instead
    // of restarting from paidAt. This means a monthly user who upgrades mid-
    // cycle to annual gets the prorated remainder back as extra days — no
    // wasted purchase, no per-user discount math on the worker.
    let runningExpiry = 0;
    const matches = [];
    for (const t of txWithTier) {
      const baseTs = Math.max(runningExpiry, t.paidAt);
      runningExpiry = baseTs + t.tier.seconds;
      matches.push({
        paidAt: t.paidAt,
        expires: runningExpiry,
        txHash: t.txHash,
        tier: t.tier.label
      });
    }

    // Only keep matches whose stacked expiry is still in the future.
    const active = matches.filter((m) => m.expires > now);

    let resp;
    if (active.length > 0) {
      // Winner = most-recently-paid tx that still has live access. Its
      // `expires` already reflects the stacked total.
      active.sort((a, b) => b.paidAt - a.paidAt);
      const winner = active[0];
      resp = json({
        ok: true,
        pro: true,
        wallet,
        paidAt: winner.paidAt,
        expires: winner.expires,
        txHash: winner.txHash,
        tier: winner.tier
      });
    } else {
      resp = json({ ok: true, pro: false, wallet });
    }
    resp.headers.set('Cache-Control', 'public, max-age=300');
    await cache.put(cacheKey, resp.clone());
    return resp;
  }
};
