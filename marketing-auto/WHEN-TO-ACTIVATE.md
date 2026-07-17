# Auto-poster — queued for future activation

Currently **paused** — manual posting only until follower base is built up.

## When to flip this on

Activate when ALL three are true:
- **≥100 X followers** on @polyparlayapp (algorithm starts amplifying once you have real signal)
- **≥10 manual posts published** with consistent voice (so auto-posts don't sound off-brand vs. your manual ones)
- **≥1 post with 1K+ impressions** organically (proves the niche is reachable; auto-posting won't fix reach if no one's listening)

Posting auto-content into an empty timeline at 6×/day actively HURTS — X's anti-bot heuristics flag high-frequency low-engagement accounts and bury them. Wait for organic signal first.

## When activated, you still have to:

1. **Get X API keys** — see `SETUP-AUTOMATION.md` Step 1
2. **Fill in `.env`** — currently has placeholders
3. **Install launchd** — `cp app.polyparlay.x-poster.plist ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/app.polyparlay.x-poster.plist`

Until then: nothing is running. No cron, no auto-tweets. Files sit dormant.

## What's safe to use NOW (no setup, no risk)

- **`node generate-content.mjs`** — generates fresh parlay tweet copy + slip URLs on demand. Run 2-3×/week, pick best output, post manually.
- **`templates.md`** — 40+ pre-written tweets/threads/Reddit posts. Copy-paste, replace tokens.
- **`outreach.md`** — DM/email templates for PM team + influencers. Highest leverage at zero-follower stage.

## Re-evaluate

Set a calendar reminder for 30 days post-launch to check follower count. If ≥100, run through `SETUP-AUTOMATION.md` end-to-end. If <100, focus on outreach instead of automation.
