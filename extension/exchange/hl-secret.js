// HypeLens Module 3 — ISOLATED-world bridge-secret reader (run_at document_start).
// -----------------------------------------------------------------------------
// inject-eth-main.js (MAIN world, document_start) generates a per-page-load
// random secret and writes it to <html data-hlx3s="…"> BEFORE any page script
// can run. This script (ISOLATED world, document_start) grabs it and DELETES
// the attribute in that same pre-page-script window, so page scripts can never
// read it. The secret then authenticates every bridge REQ/RES — a page script
// can forge a postMessage `id` but not the secret. Stored on the isolated-world
// window global (invisible to the page), read by exchange/hl-eth-bridge.js.
(function () {
  'use strict';
  function grab() {
    try {
      const el = document.documentElement; if (!el) return false;
      const s = el.getAttribute('data-hlx3s');
      if (!s) return false;
      el.removeAttribute('data-hlx3s');       // page scripts must never see it
      window.__HLX3_BRIDGE_SECRET = s;        // isolated-world global only
      return true;
    } catch (e) { return false; }
  }
  if (grab()) return;
  // MAIN/ISOLATED injection order at document_start isn't guaranteed — watch for
  // the attribute; the observer microtask still fires before any page script task.
  try {
    const mo = new MutationObserver(() => { if (grab()) mo.disconnect(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-hlx3s'] });
    // safety: stop observing after 10s regardless (module 3 UI will fail closed)
    setTimeout(() => { try { mo.disconnect(); } catch (e) {} }, 10000);
  } catch (e) {}
})();
