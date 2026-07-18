#!/bin/bash
# HYPELENS-INTEL-FEED — regenerate docs/feed/hypelens-intel.json from the live
# leaderboard universe and push it (skip if unchanged). Cron: every 15 min.
set -u
REPO="/Users/clawdlawd/hypelens"
LOG="$REPO/worker/feed-cron.log"
cd "$REPO" || exit 1
{
  echo "--- $(date -u +%FT%TZ) feed run"
  /usr/bin/env node worker/aggregate-intel.mjs 2>&1 | tail -5
  if git diff --quiet -- docs/feed/hypelens-intel.json 2>/dev/null && git diff --cached --quiet -- docs/feed/hypelens-intel.json 2>/dev/null && [ -n "$(git ls-files docs/feed/hypelens-intel.json)" ]; then
    echo "feed unchanged — skip commit"
  else
    git add docs/feed/hypelens-intel.json
    git commit -q -m "feed: intel update $(date -u +%FT%TZ)" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>" -- docs/feed/hypelens-intel.json && \
    git push -q origin main && echo "pushed" || echo "push failed"
  fi
} >> "$LOG" 2>&1
# keep the log bounded
tail -400 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
