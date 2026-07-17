// ============================================================================
// HypeLens — Liquidation-Alert Engine (Cloudflare Worker cron module).
// Head-to-toe automated top-of-funnel: polls Hyperliquid, detects liquidation
// cascades from real OI/price moves, and auto-posts branded alerts to
// Telegram (+ X when keys are set). Runs every minute off a cron trigger.
// State (prev snapshot, rate limits, daily flags) lives in KV.
// ============================================================================
const HL_INFO = 'https://api.hyperliquid.xyz/info';

// ---- tunables ----
const MIN_LIQ_USD   = 20e6;      // ignore cascades under $20M (not worth a post)
const OI_DROP       = 0.02;      // ≥2% OI drop in the interval
const PX_MOVE       = 0.008;     // AND ≥0.8% price move = cascade
const MAX_PER_DAY   = 8;         // never spam more than 8 cascade posts/day
const MIN_GAP_MS    = 8 * 60000; // ≥8 min between cascade posts
const DAILY_UTC_HHMM= '13:00';   // when to post the daily board (UTC)

// ---- helpers ----
async function hlMeta() {
  const r = await fetch(HL_INFO, { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ type:'metaAndAssetCtxs' }) });
  const [meta, ctxs] = await r.json();
  const out = {};
  meta.universe.forEach((u, i) => {
    const c = ctxs[i]; const mark = +(c.markPx||0);
    out[u.name] = { oi: (+(c.openInterest||0))*mark, mark, vlm:+(c.dayNtlVlm||0), fund:+(c.funding||0) };
  });
  return out;
}
const fUsd = n => n>=1e9?'$'+(n/1e9).toFixed(2)+'B':n>=1e6?'$'+(n/1e6).toFixed(0)+'M':n>=1e3?'$'+(n/1e3).toFixed(0)+'K':'$'+n.toFixed(0);
const fPx  = n => '$'+n.toLocaleString('en-US',{maximumFractionDigits: n<10?4:0});
const annPct = fundHourly => (fundHourly*8760*100).toFixed(0); // hourly → %/yr

async function tg(env, text) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHANNEL_ID) return false;
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHANNEL_ID, text, parse_mode:'Markdown', disable_web_page_preview:false }) });
  return r.ok;
}
// X/Twitter poster — active only when all four OAuth1.0a secrets are set.
async function xPost(env, text) {
  if (!(env.X_API_KEY && env.X_API_SECRET && env.X_ACCESS_TOKEN && env.X_ACCESS_SECRET)) return false;
  try {
    const { postTweet } = await import('./x-poster.js');
    return await postTweet(env, text);
  } catch (e) { return false; }
}
async function broadcast(env, text) { const a = await tg(env, text); const b = await xPost(env, text); return a || b; }

// ---- main cron entry ----
export async function runLiqAlerts(env) {
  const KV = env.HL_KV || env.LEADERBOARD;            // reuse existing KV
  if (!KV) return { ok:false, err:'no KV binding' };
  const now = Date.now();
  const cur = await hlMeta();
  const prev = JSON.parse((await KV.get('liq:snapshot')) || 'null');
  await KV.put('liq:snapshot', JSON.stringify({ t: now, coins: cur }));
  const url = env.INSTALL_URL || 'https://hypelens.app';
  const day = new Date(now).toISOString().slice(0,10);
  let posted = [];

  // --- 1) cascade detection ---
  if (prev && prev.coins) {
    const events = [];
    for (const [name, c] of Object.entries(cur)) {
      const p = prev.coins[name]; if (!p || p.oi<=0 || !c.mark) continue;
      const dOi = (c.oi-p.oi)/p.oi, dPx = p.mark ? (c.mark-p.mark)/p.mark : 0;
      if (dOi < -OI_DROP && Math.abs(dPx) > PX_MOVE) {
        const liq = p.oi - c.oi; if (liq < MIN_LIQ_USD) continue;
        events.push({ name, liq, side: dPx<0?'longs':'shorts', mark:c.mark, dPx });
      }
    }
    events.sort((a,b)=>b.liq-a.liq);
    const cnt = +((await KV.get('liq:count:'+day)) || 0);
    const last = +((await KV.get('liq:lastpost')) || 0);
    if (events.length && cnt < MAX_PER_DAY && (now-last) > MIN_GAP_MS) {
      const e = events[0], em = e.side==='longs' ? '🔻' : '🚀';
      const text = `🔥 *${fUsd(e.liq)} in ${e.side} just got liquidated* on Hyperliquid\n\n`+
        `${em} *${e.name}* → ${fPx(e.mark)}  (${(e.dPx*100).toFixed(1)}%)\n\n`+
        `See the live liquidation map — free, on-platform, from real positions 👇\n${url}`;
      if (await broadcast(env, text)) {
        await KV.put('liq:count:'+day, String(cnt+1), { expirationTtl: 172800 });
        await KV.put('liq:lastpost', String(now));
        posted.push('cascade:'+e.name);
      }
    }
  }

  // --- 2) daily board (heartbeat so the account is alive on quiet days) ---
  const hhmm = new Date(now).toISOString().slice(11,16);
  if (hhmm === DAILY_UTC_HHMM && !(await KV.get('liq:daily:'+day))) {
    const top = Object.entries(cur).sort((a,b)=>b[1].oi-a[1].oi).slice(0,5);
    let text = `📊 *Hyperliquid liquidation board* — where the leverage sits right now\n\n`;
    for (const [n,c] of top) text += `*${n}*  ${fPx(c.mark)}  · OI ${fUsd(c.oi)} · funding ${annPct(c.fund)}%/yr\n`;
    text += `\nCheck your liq vs the crowd's clusters, live on the chart 👇\n${url}`;
    if (await broadcast(env, text)) { await KV.put('liq:daily:'+day, '1', { expirationTtl: 172800 }); posted.push('daily'); }
  }
  return { ok:true, posted };
}

// ---- Cloudflare Worker entry: cron fires runLiqAlerts; fetch = health/status ----
export default {
  async scheduled(event, env, ctx) { ctx.waitUntil(runLiqAlerts(env)); },
  async fetch(request, env) {
    // manual trigger + status for testing: GET /run or /status
    const url = new URL(request.url);
    if (url.pathname === '/run') { const r = await runLiqAlerts(env); return new Response(JSON.stringify(r), { headers: { 'content-type': 'application/json' } }); }
    return new Response('HypeLens liquidation-alert worker · live · cron every 5 min', { headers: { 'content-type': 'text/plain' } });
  },
};
