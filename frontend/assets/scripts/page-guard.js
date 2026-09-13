/**
 * ─── Page Script Guard ───
 *
 * Lightweight console warning system that catches "wrong script" wiring bugs
 * like the one where the restaurants page loaded the home page's script.
 *
 * Each page declares its identity and expected scripts in <head>:
 *
 *   <script data-page="restaurants"
 *           data-expected-scripts='["/pages/restaurants/restaurants.js"]'
 *           src="/assets/scripts/page-guard.js"></script>
 *
 * When the DOM is ready, the guard checks that:
 *   1. Every script listed in data-expected-scripts is present on the page.
 *   2. Every page-specific script (src starting with /pages/) present on the
 *      page is listed in data-expected-scripts — i.e. no foreign page script
 *      was loaded by mistake.
 *
 * It also checks duplicate local stylesheet links (same resolved href).
 * Everything is a console.warn — the guard never blocks the page.
 */

(function () {
  'use strict';

  const GUARD_ELEMENT = document.currentScript;
  const PAGE_NAME = GUARD_ELEMENT ? GUARD_ELEMENT.getAttribute('data-page') : null;

  function normalizePath(url) {
    if (!url) return '';
    try {
      return new URL(url, window.location.href).pathname;
    } catch (_error) {
      return url;
    }
  }

  function parseExpectedScripts() {
    if (!GUARD_ELEMENT) return [];
    const raw = GUARD_ELEMENT.getAttribute('data-expected-scripts');
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalizePath) : [];
    } catch (_error) {
      console.warn('[page-guard] Could not parse data-expected-scripts JSON on page "' + PAGE_NAME + '".');
      return [];
    }
  }

  function inspectPage() {
    const pageScriptsOnDom = Array.prototype.slice
      .call(document.querySelectorAll('script[src]'))
      .map(function (script) { return normalizePath(script.getAttribute('src')); })
      .filter(function (src) { return src.indexOf('/pages/') === 0; });

    const expected = parseExpectedScripts();

    // 1. Expected page scripts that are missing
    expected.forEach(function (expectedSrc) {
      if (pageScriptsOnDom.indexOf(expectedSrc) === -1) {
        console.warn(
          '[page-guard] Page "' + PAGE_NAME + '" is missing expected script: ' + expectedSrc
        );
      }
    });

    // 2. Page scripts present but not declared as expected (wrong-page script)
    pageScriptsOnDom.forEach(function (actualSrc) {
      if (expected.indexOf(actualSrc) === -1) {
        console.warn(
          '[page-guard] Page "' + PAGE_NAME + '" loaded unexpected page script: ' + actualSrc +
          ' (expected: ' + (expected.join(', ') || 'none') + '). ' +
          'This is usually a copy/paste wiring bug.'
        );
      }
    });

    // 3. Duplicate local stylesheets
    const seen = {};
    Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"]')).forEach(function (link) {
      const href = normalizePath(link.getAttribute('href'));
      if (!href || href.indexOf('/assets/') !== 0) return;
      if (seen[href]) {
        console.warn('[page-guard] Duplicate stylesheet loaded twice: ' + href);
      }
      seen[href] = true;
    });
    return pageScriptsOnDom;
  }

  function init() {
    if (!PAGE_NAME) {
      console.warn('[page-guard] page-guard.js loaded without a data-page attribute.');
      return;
    }
    inspectPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
