// prepack: copy the shipped extension modules into agent-rail/vendor so the
// published npm package is self-contained. The rail evals these verbatim.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIL = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXT = join(RAIL, '..', 'extension');
mkdirSync(join(RAIL, 'vendor'), { recursive: true });
for (const f of [['vendor/hl-sdk.js', 'hl-sdk.js'], ['exchange/hl-signer.js', 'hl-signer.js'], ['exchange/hl-actions.js', 'hl-actions.js'], ['viewmodel.js', 'viewmodel.js']]) {
  copyFileSync(join(EXT, f[0]), join(RAIL, 'vendor', f[1]));
  console.log('bundled', f[1]);
}
