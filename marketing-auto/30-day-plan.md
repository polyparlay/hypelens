# 30-day post-launch marketing plan

The day-by-day script. Each day has a single concrete task — usually ≤ 30 minutes. Don't skip days; consistency is the multiplier.

Assumes CWS goes live around 2026-05-18. Adjust dates accordingly.

---

## Week 1 — Seeding (Days 1-7)

### Day 1 — Launch day (your most important day)
- [ ] **Confirm CWS listing is live + indexed**: search `polyparlay` on chrome.google.com/webstore. If results show, you're live.
- [ ] **Deploy worker with comp codes**: `cd /Users/clawdlawd/polyparlay/worker && wrangler deploy`
- [ ] **Deploy site**: `cd /Users/clawdlawd/polyparlay/web && vercel --prod` (in case any pricing copy is stale)
- [ ] **Test the funnel end-to-end yourself**:
  1. Install from CWS as a fresh Chrome profile
  2. Build a 3-leg parlay on a real PM market
  3. Run Monte Carlo
  4. Activate a comp code at `/upgrade`
  5. Re-open popup → confirm Pro features unlock
- [ ] **First X post** (manual — use a template from `templates.md` T1 or T9). Pin it to profile.
- [ ] **Email Polymarket builders**: send `outreach.md` template to `builders@polymarket.com`. This is the single highest-leverage email of the month.

### Day 2 — Reddit drop
- [ ] **Post to r/PolyMarket** using template R2 (tool announcement). Be transparent that you built it, ask for feedback. Mods generally welcome solo-founder drops if you're honest.
- [ ] **2nd X post**: build a parlay on a topical PM market (Fed, election, BTC) and post the slip URL. Use template T5 or T6.
- [ ] **Reply to ALL comments** within 2 hours during the day. Engagement velocity is what triggers Reddit's algorithm.

### Day 3 — Educational thread
- [ ] **Post X thread T_THREAD_1 (Monte Carlo explainer)** from `templates.md`. Threads outperform single posts ~3-5× for new accounts.
- [ ] **Cross-post that thread** as a Reddit text post in r/predictionmarkets (R4 template).

### Day 4 — Discord seeding (low effort, high optionality)
- [ ] **Join 3 PM-relevant Discord servers**: official Polymarket Discord, plus 2 others (search "Polymarket" on disboard.org or wendys.io directories).
- [ ] **Lurk for 24 hours first**. Don't post yet. Read the channel norms.
- [ ] **3rd X post**: a "vs other tools" angle (template T9 or T10).

### Day 5 — First influencer DMs
- [ ] **Find 5 PM-active accounts on X**:
  - Search `polymarket` (Latest tab) → scroll for past-week active posters
  - Filter by 500-10K followers (don't waste codes on mega-accounts who ignore DMs)
  - Open each profile → confirm they post about PM regularly (not bots, not crypto-spam)
- [ ] **DM 5 accounts** using template from `outreach.md` (Section 2 — "PM-focused X influencers"). Personalize each with a reference to their recent PM bet.
- [ ] **Assign 5 comp codes** in `comp-codes.md`. Record date + handle.

### Day 6 — Discord post (after 2 days of lurking)
- [ ] **Drop in #tools or #strategy** (whichever fits) on the most active server you joined. Use template D1 from `templates.md`. Short, no link spam.
- [ ] **DM 5 more X accounts** with comp codes.

### Day 7 — Week-1 retro post
- [ ] **Post a transparency tweet**: "PolyParlay launched 1 week ago. Stats so far: X installs, Y comp codes activated, Z slips shared." Solo-founder transparency posts get retweeted disproportionately well.
- [ ] **Review comp-codes.md**: who activated, who didn't, what worked.

---

## Week 2 — Outreach (Days 8-14)

### Day 8 — Crypto-podcaster pitch
- [ ] **Pitch 3 podcasts** from `outreach.md` Section 5. Free Pro for the host + a written intro paragraph for their show notes.
  - Bankless (long shot but try) — `info@bankless.com`
  - Rollup — `gm@therollup.co`
  - Wassies of the Day — DM the @wassies account on X
  - The Defiant — `team@thedefiant.io`

### Day 9 — Substack pitch
- [ ] **Pitch 3 forecasting Substack writers** (Section 6 template). Search Substack for "prediction markets" — find 3 active writers, send pitch.
- [ ] **DM 5 more X accounts**.

### Day 10 — Sports betting angle
- [ ] **Post in r/sportsbook** (4.5M members — huge but tougher rules). Frame as "alternative to bookmaker parlays using prediction markets" — focus on the EV math, not the tool itself. Drop link in your sig only.
- [ ] **5 more X DMs**.

### Day 11 — Kelly explainer thread
- [ ] **Post T_THREAD_2 (Kelly explainer)** on X. This one performs well with the algo/finance crowd.

### Day 12 — Mid-cycle metrics post
- [ ] **Post a "12-day metrics" tweet** with whatever real numbers you have. Even if modest — "200 installs, 15 paying, $135 MRR" — solo-founder metric transparency is a content format that works.

### Day 13 — Influencer follow-ups
- [ ] **Follow up with influencers** who activated codes but haven't tweeted (Section 2 follow-up template). Soft ask: "Glad the code worked! Curious what you thought — happy to chat if useful."
- [ ] **Revoke unused comp codes** (DMed >14 days ago, no activation) in `comp-codes.md`. Reassign to new targets.

### Day 14 — Half-month check-in
- [ ] **Review metrics**:
  - CWS installs (chrome.google.com/webstore dashboard → Analytics)
  - Paid users (check Polygonscan for transactions to your payment address)
  - Comp activations (worker logs)
- [ ] **Decide**: are X DMs working? Reddit working? Double down on the channel with the highest activation rate.

---

## Week 3 — Amplify (Days 15-21)

### Day 15 — Reddit AMA pitch
- [ ] **Message r/PolyMarket mods** asking permission to do an AMA. Format: "I built this Chrome extension solo, would love to do an AMA next week on how the Monte Carlo works + what I learned about parlay psychology."

### Day 16 — Polymarket-team follow-up
- [ ] **Follow up your Day-1 PM team email**. Bump it with concrete metrics ("Y installs, Z slips shared all linking back to polymarket.com").

### Day 17 — High-effort case study
- [ ] **Write a long-form X thread or Substack post**: "100 PM parlays I ran through Monte Carlo — here's what I learned about leg selection." Use real data from your tool. This is the kind of post that goes viral in the right niche.

### Day 18 — Influencer batch 3
- [ ] **DM 5 more X accounts**. By now you should have ~10 comp codes activated. Use any leftover unactivated codes from earlier batches.

### Day 19 — YouTube outreach
- [ ] **Find 3 small PM/sports-betting YouTubers** (5K-50K subs sweet spot). Email or X DM them. Offer free Pro + a 10-min walkthrough video script if useful.

### Day 20 — Twitter Space
- [ ] **Schedule a Twitter Space** for week 4: "Q&A on Monte Carlo for prediction markets." Even 5 attendees is fine — Spaces show up in followers' notifications and the recording lives on.
- [ ] **Tweet the announcement**, tag 2-3 PM accounts who might co-host.

### Day 21 — Three-week metrics post
- [ ] **Public metrics tweet**. By now you have something to share — even if it's "350 installs / 22 paid / $200 MRR."

---

## Week 4 — Scale signal, kill noise (Days 22-30)

### Day 22 — Channel doubling
- [ ] **Review activation source data**. Which channel produced the most paid users? Triple your effort there. Kill the channel producing zero.

### Day 23 — AMA execution (if approved)
- [ ] **Run the r/PolyMarket AMA** if mods approved. Stay live for 2 hours minimum. Use comp codes as gentle giveaways during the AMA.

### Day 24 — Auto-poster activation check
- [ ] **Check `WHEN-TO-ACTIVATE.md` conditions**:
  - ≥100 followers on @polyparlayapp?
  - ≥10 manual posts published?
  - ≥1 post with 1K+ impressions?
- [ ] **If yes**: run `SETUP-AUTOMATION.md` end-to-end (15 min) → auto-poster goes live, you're done thinking about daily X content.
- [ ] **If no**: stay manual for week 5.

### Day 25 — Influencer retention
- [ ] **Check which comp-code influencers actually tweeted** about you. Send them a personal thank-you DM. These are your 5-10 highest-leverage relationships — invest in them.
- [ ] **For ones who tweeted multiple times**: ask if they want to be on a "Pro for life" perma-comp list (revoke + replace their original code with a new one labeled "perm").

### Day 26 — Newsletter outreach
- [ ] **Pitch 3 prediction-markets newsletters** (e.g., Astral Codex Ten, Star Slate Codex prediction-market roundups, Manifold newsletter if applicable). Use `outreach.md` Section 6.

### Day 27 — Twitter Space execution
- [ ] **Run the Twitter Space**. Record it. Clip the best 30 sec for a follow-up tweet.

### Day 28 — Pricing iteration check
- [ ] **Review paid-user count**:
  - ≥20 paid → pricing is working; keep $14.99/$99
  - 5-19 paid → consider adding a "first month $4.99" intro offer
  - <5 paid → either the product or the marketing is the bottleneck. Survey activated free users to find out which.

### Day 29 — 30-day metrics post
- [ ] **Public "30 days in" tweet** with real numbers + 1-2 things that surprised you. This is the post that closes out launch and frames you as someone who SHIPS, not someone who launched and went silent.

### Day 30 — Plan month 2
- [ ] **Decide month-2 focus**:
  - **Product**: ship the next feature from the roadmap (PM positions match, live price refresh, etc.)
  - **Marketing**: scale what worked, kill what didn't
  - **Pricing**: A/B test if data supports it
- [ ] **Write yourself a one-pager** answering: "what would I tell a founder launching the same product on day 31?"

---

## Cheat sheet — daily 5-min check-list

Open this every morning before doing anything else. Takes 5 min:

1. Check X notifications → reply to anyone mentioning you within the hour
2. Check Reddit DMs / inbox → reply within 6 hours
3. Check Polygonscan for new payments to your address (one-glance signal of paid conversions)
4. Glance at CWS analytics for install count
5. Update `comp-codes.md` if you DMed any codes the day before

That's it. The DAY's work is whatever this 30-day plan says above. The 5-min check-in is just hygiene.

---

## Reality check on numbers

If you execute this plan end-to-end:
- **Best case (1 viral tweet OR PM-team retweet)**: 5,000-15,000 installs, 100-300 paid users, $1,500-$4,500 MRR by day 30
- **Average case**: 500-2,000 installs, 30-80 paid users, $500-$1,200 MRR
- **Bad case (no traction)**: <300 installs, <10 paid users. If you hit this by day 14, ROOT-CAUSE before continuing — likely product or positioning issue, not marketing.

Most likely outcome: average case. Plan for it. Anything above is a bonus.
