#!/usr/bin/env python3
"""Real liquidation aggregator — crawls actual HL wallet positions and builds
REAL per-coin liquidation density (not the estimated leverage-model).
Output: data/real_liq.json {coin: {mark, updated, levels:[{price,notional,side}]}}.
Run on a schedule (backend/cron); the extension fetches the JSON.
"""
import json, urllib.request, gzip, concurrent.futures, collections, sys, time
N_WALLETS = int(sys.argv[1]) if len(sys.argv) > 1 else 2000
API = "https://api.hyperliquid.xyz/info"

def get_leaderboard():
    raw = urllib.request.urlopen(urllib.request.Request(
        "https://stats-data.hyperliquid.xyz/Mainnet/leaderboard",
        headers={'User-Agent':'Mozilla/5.0','Accept-Encoding':'gzip'}), timeout=60).read()
    try: raw = gzip.decompress(raw)
    except Exception: pass
    rows = json.loads(raw).get('leaderboardRows', [])
    def av(r):
        try: return float(r.get('accountValue') or 0)
        except Exception: return 0
    rows = [r for r in rows if r.get('ethAddress') and av(r) > 50000]
    rows.sort(key=av, reverse=True)
    return [r['ethAddress'] for r in rows[:N_WALLETS]]

def state(a):
    try:
        b = json.dumps({"type":"clearinghouseState","user":a}).encode()
        return json.load(urllib.request.urlopen(urllib.request.Request(
            API, data=b, headers={'Content-Type':'application/json','User-Agent':'Mozilla/5.0'}), timeout=12))
    except Exception: return None

def mids():
    b = json.dumps({"type":"allMids"}).encode()
    return json.load(urllib.request.urlopen(urllib.request.Request(
        API, data=b, headers={'Content-Type':'application/json','User-Agent':'Mozilla/5.0'}), timeout=15))

addrs = get_leaderboard()
mark = {k: float(v) for k, v in mids().items()}
positions = 0
percoin = collections.defaultdict(list)   # coin -> [(liqPx, notional, side)]
with concurrent.futures.ThreadPoolExecutor(max_workers=16) as ex:
    for r in ex.map(state, addrs):
        if not r: continue
        for ap in (r.get('assetPositions') or []):
            p = ap.get('position') or {}
            coin, lp = p.get('coin'), p.get('liquidationPx')
            if not coin or not lp: continue
            szi = float(p.get('szi') or 0)
            side = 'long' if szi > 0 else 'short'
            percoin[coin].append((float(lp), float(p.get('positionValue') or 0), side))
            positions += 1

out = {}
for coin, lvls in percoin.items():
    m = mark.get(coin)
    if not m or len(lvls) < 3: continue
    out[coin] = {"mark": m, "n": len(lvls),
                 "levels": [{"price": round(pp, 4), "notional": round(vv), "side": sd}
                            for pp, vv, sd in lvls]}
print(f"crawled {len(addrs)} wallets, {positions} real positions across {len(out)} coins")
for c in ['BTC','ETH','SOL','HYPE']:
    if c in out:
        lv = out[c]['levels']; tot = sum(l['notional'] for l in lv)
        print(f"  {c}: {len(lv)} real liq levels, ${tot/1e6:.0f}M notional")
