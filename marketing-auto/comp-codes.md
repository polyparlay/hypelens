# Comp codes — free Pro for influencers

20 codes generated. Each is a unique pseudo-wallet (40-hex format, valid for the verify form, never appears on-chain). One per user — only the person you DM the code to can use it.

## How a recipient activates

1. Go to **https://polyparlay.app/upgrade**
2. Scroll to "VERIFY PAYMENT" form
3. Paste the code (it's formatted as a 0x-address) into the wallet field
4. Click "Verify payment & unlock Pro →"
5. Pro is active immediately, valid 365 days (rolls forward — see Revocation below)

They don't need to install MetaMask, sign anything, or send any tx. The code IS the credential.

## How to revoke

A code is privately distributed — only the person you sent it to has it. If they share it / abuse it / churn:

1. Open `worker/verify.js`
2. Delete that line from `COMP_CODES`
3. `cd worker && wrangler deploy`
4. Within 1 hour, the extension's verify cache expires and their access drops back to free

No data loss for them, just feature lock-out.

## Tracking sheet — fill in as you DM each code

| Code | Recipient | Channel | DMed | Activated | Notes |
|---|---|---|---|---|---|
| `0x0000000000000000000000000000000000000001` | @InkByte | X DM | 2026-05-20 |  |  |
| `0x0000000000000000000000000000000000000002` | @the_smart_ape | X DM | 2026-05-20 |  |  |
| `0x0000000000000000000000000000000000000003` | @PolymarketIntel | X DM | 2026-05-20 |  |  |
| `0x0000000000000000000000000000000000000004` | @arndxt_xo | X DM | 2026-05-20 |  |  |
| `0x0000000000000000000000000000000000000005` | @camolNFT | X DM | 2026-05-20 |  |  |
| `0x0000000000000000000000000000000000000006` | _unassigned_ | | | | |
| `0x0000000000000000000000000000000000000007` | _unassigned_ | | | | |
| `0x0000000000000000000000000000000000000008` | _unassigned_ | | | | |
| `0x0000000000000000000000000000000000000009` | _unassigned_ | | | | |
| `0x000000000000000000000000000000000000000a` | _unassigned_ | | | | |
| `0x000000000000000000000000000000000000000b` | _unassigned_ | | | | |
| `0x000000000000000000000000000000000000000c` | _unassigned_ | | | | |
| `0x000000000000000000000000000000000000000d` | _unassigned_ | | | | |
| `0x000000000000000000000000000000000000000e` | _unassigned_ | | | | |
| `0x000000000000000000000000000000000000000f` | _unassigned_ | | | | |
| `0x0000000000000000000000000000000000000010` | _unassigned_ | | | | |
| `0x0000000000000000000000000000000000000011` | _unassigned_ | | | | |
| `0x0000000000000000000000000000000000000012` | _unassigned_ | | | | |
| `0x0000000000000000000000000000000000000013` | _unassigned_ | | | | |
| `0x0000000000000000000000000000000000000014` | _unassigned_ | | | | |

20 codes is enough for ~30 days of outreach. Generate more by editing the `COMP_CODES` Map in `worker/verify.js` and incrementing the address tail.

## Whether they activate is the signal

The "Activated" column is your conversion-rate metric. A DM that produces an activation = high-quality contact. Track:
- **Activation rate** by channel (X DM vs Reddit DM vs email)
- **Activation rate** by recipient archetype (sports bettor vs crypto degen vs forecaster)
- **Time from DM → activation** (the faster they try, the more likely they tweet about it)

If a recipient activates but doesn't post → follow up after 7 days with "what did you think?"
If they don't activate within 14 days → revoke the code, reassign to someone else.
