# Security

## Architecture — what this extension can and cannot do

- **Your seed phrase / master private key never touches HypeLens.** The optional
  one-click trading module uses Hyperliquid's agent-wallet mechanism: your
  wallet (MetaMask/Rabby) signs two EIP-712 approvals; the extension holds only
  a locally-generated **agent key** that can *trade but not withdraw*.
- The agent key is stored **AES-GCM encrypted** (PBKDF2-SHA256, 250k iterations,
  local password) in `chrome.storage.local`; decrypted only into session storage
  while unlocked, auto-relocks after 30 minutes.
- **Permissions are minimal**: `storage` + the two Hyperliquid API hosts. No
  tabs, no cookies, no browsing history, no other sites.
- The wallet bridge validates a per-page-load handshake secret and relays ONLY
  the two pinned approval types (`ApproveAgent`, `ApproveBuilderFee` with the
  pinned builder + 0.01% max fee). It will not relay arbitrary signing requests.
- **Builder fee is 1bp (0.01%), pinned in code and inside the signed action** —
  you approve exactly that cap, and the extension cannot raise it.
- Mainnet order placement ships **disabled** and is enabled only in tagged
  releases after public testnet verification.
- Every wire-level price/size is previewed before you sign; placement blocks if
  rounding drifts from your input.

## Reporting a vulnerability

Open a GitHub issue titled `[security]` (no exploit details), or email the
address on the Chrome Web Store listing to arrange a private channel. Verified
signing-path issues trigger an immediate kill-switch on one-click placement
for all users while a fix ships.
