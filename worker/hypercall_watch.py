#!/usr/bin/env python3
"""Hypercall (SYN) trigger watcher — instrument, don't build.
Daily cron. Alerts (stdout + state file) when any build-trigger fires:
  T1 crypto underlyings (BTC/ETH/HYPE...) listed
  T2 fees turn on (builder 50% share becomes real revenue)
  T3 traction: >100 unique traders/wk or OI notional >$5M
  T4 alpha exit / audit signal (version string change as cheap proxy)
State: worker/hypercall_watch_state.json (diffs day over day).
"""
import json, urllib.request, datetime, os, sys
B = "https://api.hypercall.xyz"
def get(p):
    try:
        r = urllib.request.Request(B+p, headers={'User-Agent':'hypelens-watch/1.0'})
        return json.load(urllib.request.urlopen(r, timeout=20))
    except Exception as e:
        return {"_err": str(e)}
S = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hypercall_watch_state.json")
prev = json.load(open(S)) if os.path.exists(S) else {}
mkts = get("/markets"); trades = get("/trades"); ver = get("/version")
alerts, state = [], {"t": datetime.datetime.utcnow().isoformat()}
# T1 crypto underlyings
CR = {"BTC","ETH","HYPE","SOL","WBTC","UBTC","UETH"}
def walk(o):
    out=set()
    if isinstance(o,dict):
        for k,v in o.items():
            if k.lower() in ("underlying","symbol","asset","ticker","base") and isinstance(v,str): out.add(v.upper().replace("-PERP",""))
            out |= walk(v)
    elif isinstance(o,list):
        for x in o: out |= walk(x)
    return out
unders = sorted(walk(mkts)); state["underlyings"] = unders
hits = [u for u in unders if any(c in u for c in CR)]
if hits: alerts.append(f"T1 CRYPTO UNDERLYINGS LIVE: {hits} — build the options overlay NOW")
# T2 fees
fees = json.dumps(get("/fees")) + json.dumps(mkts)
state["fees_zero"] = ('"maker_fee": 0' in fees or '"taker_fee": 0' in fees or '0%' in fees)
if prev.get("fees_zero") is True and state["fees_zero"] is False:
    alerts.append("T2 FEES TURNED ON — builder 50% share is now real revenue")
# T3 traction (unique addrs in the visible tape + OI proxy)
addrs=set()
if isinstance(trades,list):
    for t in trades[:1000]:
        for k in ("maker","taker","maker_address","taker_address"):
            v=t.get(k) if isinstance(t,dict) else None
            if v: addrs.add(v)
state["uniq_traders_tape"]=len(addrs)
if len(addrs)>100: alerts.append(f"T3 TRACTION: {len(addrs)} unique traders in tape")
# T4 version churn / alpha exit proxy
state["version"]=json.dumps(ver)[:200]
if prev.get("version") and prev["version"]!=state["version"]: state["version_changed"]=True
json.dump(state, open(S,"w"), indent=1)
today=datetime.date.today().isoformat()
if alerts:
    print(f"[{today}] 🔔 HYPERCALL TRIGGER:\n  " + "\n  ".join(alerts))
else:
    print(f"[{today}] hypercall quiet: underlyings={unders or '?'} traders_tape={len(addrs)} fees_zero={state['fees_zero']}")
