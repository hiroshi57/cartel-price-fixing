/* =============================================================================
 * sw.js — Cartel Watch Service Worker (T045 PWA)
 * 戦略:
 *   - データ (*.js の data 系) : network-first（鮮度優先、オフライン時はキャッシュ）
 *   - それ以外 (HTML/CSS/SVG)  : network-first + キャッシュフォールバック
 * キャッシュはデプロイごとに CACHE_VERSION を上げて破棄する。
 * ========================================================================== */
"use strict";
const CACHE_VERSION = "cw-v1";
const PRECACHE = [
  "overview.html", "index.html", "procurement.html", "cases.html", "coverage.html",
  "search.html", "company.html", "report.html", "methodology.html", "terms.html", "help.html",
  "data.js", "cases-data.js", "forecast-data.js", "taxonomy.js", "watchlist.js",
  "manifest.json", "icon.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(c => c.addAll(PRECACHE).catch(() => null)) // 一部失敗しても起動は継続
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // 外部リクエストは触らない

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
