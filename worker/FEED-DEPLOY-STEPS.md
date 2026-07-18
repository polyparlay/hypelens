# Feed deploy — two operator steps (blocked for agent auto-mode, by design)

The v0.22.0 feed pipeline is fully built and the first feed JSON is committed+pushed
(`docs/feed/hypelens-intel.json`, 72KB, 1,109-wallet leaderboard-union universe).
Two actions need explicit operator execution (the permission system correctly
refuses to let an agent create a public web surface / install a self-pushing cron):

## 1. Enable GitHub Pages (serves /docs on main)

```
gh api -X POST repos/polyparlay/hypelens/pages -f "source[branch]=main" -f "source[path]=/docs"
```

Verify (may take ~1-2 min to first deploy):

```
curl -sI https://polyparlay.github.io/hypelens/feed/hypelens-intel.json | head -3
```

Until this is enabled the extension's feed fetch 404s and it falls back
gracefully (in-browser chunked crawl → dated bundle) with honest badges.

## 2. Install the 15-min feed cron

```
( crontab -l 2>/dev/null; echo '*/15 * * * * /Users/clawdlawd/hypelens/worker/feed-cron.sh # HYPELENS-INTEL-FEED' ) | crontab -
```

`worker/feed-cron.sh` regenerates the feed, commits + pushes ONLY
`docs/feed/hypelens-intel.json`, skips when unchanged, logs to
`worker/feed-cron.log` (bounded at 400 lines).
