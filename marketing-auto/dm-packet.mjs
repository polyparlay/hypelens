#!/usr/bin/env node
/**
 * PolyParlay DM packet generator
 *
 * Assembles a ready-to-paste influencer DM in ~1 second:
 *   1. Reads marketing-auto/comp-codes.md → picks the next "_unassigned_" code
 *   2. Hits Polymarket gamma-api → builds a fresh 3-leg parlay + slip URL
 *   3. Fills the DM template with code + URL
 *   4. Prints to stdout for copy-paste
 *   5. Optionally marks the code as assigned in comp-codes.md
 *
 * Usage:
 *   node dm-packet.mjs                                  # preview, no assignment
 *   node dm-packet.mjs --handle @sharpbet               # personalize, no assignment
 *   node dm-packet.mjs --handle @sharpbet --tweet "..." # full personalization
 *   node dm-packet.mjs --handle @sharpbet --assign      # also mark code as used
 *   node dm-packet.mjs --batch 5                        # generate 5 packets at once
 *
 * No deps — pure Node 18+.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TRACKER = join(__dirname, 'comp-codes.md');

const args = parseArgs(process.argv.slice(2));
const HANDLE = args.handle || null;
const TWEET = args.tweet || null;
const ASSIGN = args.assign === true;
const BATCH = parseInt(args.batch || '1', 10);
const CHANNEL = args.channel || 'X DM';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { out[key] = next; i++; }
      else out[key] = true;
    }
  }
  return out;
}

// === COMP CODE READER ======================================================
// Parses comp-codes.md's table. Each row that has "_unassigned_" in the
// recipient column is fair game. Returns the first available + the row index
// for downstream rewrite.
function findNextCode() {
  const md = readFileSync(TRACKER, 'utf-8');
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('| `0x')) continue;
    if (!line.includes('_unassigned_')) continue;
    // Extract the code from between backticks
    const m = line.match(/`(0x[a-f0-9]{40})`/i);
    if (!m) continue;
    return { code: m[1], lineIndex: i, originalLine: line };
  }
  return null;
}

function markCodeAssigned(lineIndex, recipient, channel) {
  const md = readFileSync(TRACKER, 'utf-8');
  const lines = md.split('\n');
  const line = lines[lineIndex];
  const today = new Date().toISOString().slice(0, 10);
  // Table format: | `code` | recipient | channel | DMed | Activated | Notes |
  // Replace "_unassigned_ |  |  |  |  |" with "@recipient | X DM | 2026-MM-DD |  |  |"
  const newLine = line.replace(
    /\| _unassigned_ \| +\| +\| +\| +\|/,
    `| ${recipient} | ${channel} | ${today} |  |  |`
  );
  lines[lineIndex] = newLine;
  writeFileSync(TRACKER, lines.join('\n'));
}

// === PARLAY BUILDER (reused from generate-content.mjs) ====================
const GAMMA = 'https://gamma-api.polymarket.com';
const TWO_WEEKS = 14 * 86400 * 1000;
const ONE_DAY   =      86400 * 1000;

async function fetchCandidates() {
  const res = await fetch(
    `${GAMMA}/markets?active=true&closed=false&limit=100&order=volume24hr&ascending=false`,
    { headers: { 'User-Agent': 'polyparlay-dm-packet/1.0' } }
  );
  if (!res.ok) throw new Error(`Gamma ${res.status}`);
  const list = await res.json();
  const now = Date.now();
  return list.filter((m) => {
    const prices = parsePrices(m.outcomePrices);
    if (!prices || prices.length !== 2) return false;
    if (prices[0] < 0.30 || prices[0] > 0.70) return false;
    const vol24 = numOr(m.volume24hr, m.volume24Hr, m.volume_24h);
    if (!vol24 || vol24 < 5000) return false;
    if (!m.endDate) return false;
    const ends = new Date(m.endDate).getTime();
    if (isNaN(ends) || ends - now > TWO_WEEKS || ends - now < ONE_DAY) return false;
    if (!m.question || !m.slug) return false;
    return true;
  }).map((m) => ({
    slug: m.slug,
    question: m.question,
    yesPrice: parsePrices(m.outcomePrices)[0],
    noPrice:  parsePrices(m.outcomePrices)[1],
    endDate: m.endDate,
    vol24: numOr(m.volume24hr, m.volume24Hr, m.volume_24h)
  })).sort((a, b) => b.vol24 - a.vol24);
}
function parsePrices(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw.map(Number);
  try { return JSON.parse(raw).map(Number); } catch { return null; }
}
function numOr(...vals) {
  for (const v of vals) { const n = parseFloat(v); if (!isNaN(n) && isFinite(n)) return n; }
  return null;
}

function buildParlay(markets) {
  const legs = markets.map((m) => {
    if (m.yesPrice >= m.noPrice) return { ...m, side: 'YES', price: m.yesPrice };
    return { ...m, side: 'NO', price: m.noPrice };
  });
  const cost = legs.reduce((a, l) => a * l.price, 1);
  const multiplier = cost > 0 ? 1 / cost : 0;
  let wins = 0;
  for (let i = 0; i < 10000; i++) {
    let ok = true;
    for (const l of legs) { if (Math.random() > l.price) { ok = false; break; } }
    if (ok) wins++;
  }
  return { legs, multiplier, winRate: wins / 10000 };
}

function encodeSlipUrl(parlay, stake = 25) {
  const payload = {
    l: parlay.legs.map((l) => ({
      q: l.question, d: l.side, p: l.price, e: l.endDate,
      u: `https://polymarket.com/event/${l.slug}`
    })),
    s: stake
  };
  const b64 = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `https://polyparlay.app/slip#${b64}`;
}

// === DM TEMPLATE ===========================================================
function buildDm({ handle, tweet, code, slipUrl, parlay }) {
  const wr = Math.round(parlay.winRate * 1000) / 10;
  const mult = parlay.multiplier.toFixed(2);
  const name = handle ? handle.replace(/^@/, '') : 'there';
  const tweetRef = tweet
    ? `saw your "${tweet.slice(0, 80)}${tweet.length > 80 ? '…' : ''}" — built a tool for exactly that.`
    : 'noticed your Polymarket takes — built a tool you might find useful.';

  return `Hey ${handle ? '@' + name : 'there'}, ${tweetRef}

PolyParlay (Chrome extension, just launched) runs 10K Monte Carlo on PM parlays + has an Improve Odds button that finds your weakest leg + computes Half-Kelly stake.

Made you a sample slip — ${parlay.legs.length} live markets, ${wr}% real win rate, ${mult}× multiplier:
${slipUrl}

You'd be one of the first PM accounts to try it, so here's a free Pro code (good for 1 year, normally $99):

  →  ${code}

Paste it into the wallet field at polyparlay.app/upgrade — Pro unlocks instantly, no MetaMask required.

If it ends up useful, a tweet would mean a lot. If not, no worries — keep the code anyway.`;
}

// === MAIN ==================================================================
async function generateOne(candidates, legCount = 3) {
  const code = findNextCode();
  if (!code) {
    throw new Error('No unassigned comp codes left. Add more to COMP_CODES in worker/verify.js + comp-codes.md, then `wrangler deploy`.');
  }
  const parlay = buildParlay(candidates.slice(0, legCount));
  const slipUrl = encodeSlipUrl(parlay);
  const dm = buildDm({ handle: HANDLE, tweet: TWEET, code: code.code, slipUrl, parlay });

  if (ASSIGN) {
    if (!HANDLE) {
      console.error('--assign requires --handle so the tracker has a real recipient name. Skipping assignment.');
    } else {
      markCodeAssigned(code.lineIndex, HANDLE, CHANNEL);
    }
  }
  return { code: code.code, dm, slipUrl };
}

async function main() {
  console.log('Fetching live Polymarket markets...\n');
  const candidates = await fetchCandidates();
  if (candidates.length < 3) {
    console.error(`Only ${candidates.length} qualifying markets. Try again in a few hours.`);
    process.exit(1);
  }

  if (BATCH > 1) {
    for (let i = 0; i < BATCH; i++) {
      // Rotate leg count so DMs feel varied
      const legCount = 3 + (i % 3);
      // Shuffle candidates a bit so each DM gets different markets
      const slice = candidates.slice(i, i + 10).sort(() => Math.random() - 0.5);
      const out = await generateOne(slice.length >= legCount ? slice : candidates, legCount);
      console.log(`════════════════ DM #${i + 1} — code ${out.code} ════════════════\n`);
      console.log(out.dm);
      console.log('\n');
    }
    console.log('Done. Paste each block separately into X DM compose.');
    if (ASSIGN) console.log('Tracker updated — codes marked as assigned in comp-codes.md');
    return;
  }

  const out = await generateOne(candidates);
  console.log('════════════════ DM PACKET ════════════════');
  console.log(`Code:    ${out.code}`);
  console.log(`Slip:    ${out.slipUrl}`);
  console.log(`Handle:  ${HANDLE || '(not specified — DM is generic)'}`);
  console.log(`Assign:  ${ASSIGN ? 'YES (tracker updated)' : 'NO (preview only)'}`);
  console.log('═══════════════════════════════════════════\n');
  console.log(out.dm);
  console.log('\n═══════════════════════════════════════════');
  console.log('Copy the DM text above (between header lines), paste into X compose, send.');
  if (!ASSIGN && HANDLE) {
    console.log('\nThis was a preview. Re-run with --assign to mark the code as used:');
    console.log(`  node dm-packet.mjs --handle ${HANDLE} ${TWEET ? `--tweet "${TWEET}"` : ''} --assign`);
  }
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
