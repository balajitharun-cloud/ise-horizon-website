/* AVYAKT service worker (offline-first for the app shell) */
var CACHE = "horizon-v59";
var ASSETS = [
  "./",
  "index.html",
  "about.html",
  "events.html",
  "projects.html",
  "team.html",
  "faculty.html",
  "media.html",
  "gallery.html",
  "join.html",
  "contact.html",
  "certificate.html",
  "admin.html",
  "assets/css/style.css",
  "assets/js/data.js",
  "assets/js/backend.js",
  "assets/js/store.js",
  "assets/js/assets-data.js",
  "assets/js/main.js",
  "assets/js/admin.js",
  "assets/js/certificate.js",
  "assets/images/avyakt-emblem.png",
  "assets/images/avyakt-lockup.png",
  "assets/images/avyakt-emblem-ink.png",
  "assets/images/avyakt-lockup-ink.png",
  "assets/images/favicon-32.png",
  "assets/images/icon-192.png",
  "assets/images/icon-512.png",
  "manifest.webmanifest"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS).catch(function () {}); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== location.origin) return;

  // Backend data must always come from the network, never a cache.
  //   /data/*.json  - the content files
  //   /api/*        - the live stats + join endpoints
  // Without the /api/ exclusion these responses get cached by the "everything
  // else" branch below, so a visitor's count freezes at whatever it was the
  // first time they loaded the site - including 0.
  if (url.pathname.indexOf("/data/") !== -1) return;
  if (url.pathname.indexOf("/api/") !== -1) return;

  var dest = req.destination;

  // Documents, scripts and styles: network-first, so updates always arrive.
  if (req.mode === "navigate" || dest === "script" || dest === "style" || dest === "document") {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (m) { return m || caches.match("index.html"); });
      })
    );
    return;
  }

  // Everything else (images, fonts): cache-first.
  e.respondWith(
    caches.match(req).then(function (cached) {
      return cached || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      });
    })
  );
});
