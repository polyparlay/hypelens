// Loads the SHIPPED HypeLens modules (viewmodel, exchange actions, signer,
// vendored HL SDK) into globalThis — same eval pattern the calibration
// harness uses. The rail never reimplements model or wire math; it evals the
// exact files the extension ships. Dev layout reads from ../extension;
// published layout reads from ./vendor (populated by scripts/bundle-vendor.mjs).
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = dirname(fileURLToPath(import.meta.url));
const RAIL = join(SRC, '..');
const REPO = join(RAIL, '..');

export function assetPath(rel) {
  const candidates = [join(RAIL, 'vendor', rel.split('/').pop()), join(REPO, 'extension', rel)];
  for (const p of candidates) if (existsSync(p)) return p;
  throw new Error('cannot locate shipped module: ' + rel + ' (tried ' + candidates.join(', ') + ')');
}

const g = globalThis;
let _loaded = false;
export function loadShipped() {
  if (_loaded) return api();
  g.window = g;
  // order matters: sdk → signer (self-tests against sdk) → actions → viewmodel
  for (const rel of ['vendor/hl-sdk.js', 'exchange/hl-signer.js', 'exchange/hl-actions.js', 'viewmodel.js']) {
    // eslint-disable-next-line no-eval
    (0, eval)(readFileSync(assetPath(rel), 'utf8'));
  }
  _loaded = true;
  return api();
}

function api() {
  if (!g.HLVM) throw new Error('HLVM did not load');
  if (!g.HLX3 || !g.HLX3.actions || !g.HLX3.signer) throw new Error('HLX3 did not load');
  if (!g.HLSDK) throw new Error('HLSDK did not load');
  return { VM: g.HLVM, actions: g.HLX3.actions, signer: g.HLX3.signer, sdk: g.HLSDK };
}
