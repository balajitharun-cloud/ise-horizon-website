/* =====================================================================
   AVYAKT — content store
   Elite members manage events, news, projects, gallery, members, history
   and the Hall of Fame from the member panel (admin.html).

   Data is shared through the GitHub repo (data/content.json) via
   assets/js/backend.js, so every visitor sees the same content.
   The browser keeps a localStorage copy as an instant/offline cache; the
   backend copy wins whenever it is reachable.
   ===================================================================== */
(function () {
  "use strict";
  var KEY = "horizon-content-v2";
  var PASSCODE = "ise@2007";           // fallback passcode (used until a hash is published)
  var SESSION = "horizon-member";      // sessionStorage unlock flag
  var B = window.AvyaktBackend;

  function today() { return new Date().toISOString().slice(0, 10); }
  function uid(p) { return (p || "id") + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  async function sha256hex(s) {
    try {
      var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(s)));
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
    } catch (e) { return null; }   // no WebCrypto (e.g. file://) — fall back to the code passcode
  }

  function defaults() {
    return {
      settings: { activeMembers: 0, eventsHosted: 0, passcodeHash: "" },
      hackathon: {
        title: "HORIZON Hackathon",
        date: "",
        venue: "",
        description: "Our flagship build sprint — open to every department. Dates and the registration link are posted here by the club.",
        link: "",
        active: true
      },
      events: [],        // upcoming events (managed)
      pastEvents: [],    // archived events (read-only)
      news: [
        { id: "n1", title: "Welcome to the new AVYAKT website", date: today(), tag: "Update",
          excerpt: "Our new club portal is live.", body: "Events, projects and updates are published here by the core committee." }
      ],
      projects: [],      // student projects (managed) — each may carry a GitHub URL
      history: [
        { id: "h1", year: "2026", text: "AVYAKT was founded by students of the Department of Information Science & Engineering at Kalpataru Institute of Technology." }
      ],
      achievements: [],  // Hall of Fame (managed by the committee)
      gallery: [
        { id: "g1", caption: "HORIZON Hackathon — final demo round", emoji: "🚀", wide: true },
        { id: "g2", caption: "Workshop in the computer lab", emoji: "🤖" },
        { id: "g3", caption: "Weekly coding circle", emoji: "🧩" },
        { id: "g4", caption: "Tech talk — packed auditorium", emoji: "🎙️" }
      ],
      members: []        // club members — added by the elite member (starts empty)
    };
  }

  function normalize(o) {
    var d = defaults();
    o = o || {};
    o.settings = Object.assign(d.settings, o.settings || {});
    o.hackathon = Object.assign(d.hackathon, o.hackathon || {});
    ["events", "pastEvents", "news", "projects", "gallery", "members", "history", "achievements"].forEach(function (k) {
      o[k] = Array.isArray(o[k]) ? o[k] : d[k];
    });
    delete o._comment;
    return o;
  }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function loadLocal() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) {}
    if (!raw) { var d = defaults(); save(d); return d; }
    try { return normalize(JSON.parse(raw)); } catch (e) { var d2 = defaults(); save(d2); return d2; }
  }

  var data = loadLocal();
  var state = { synced: false, syncing: false, error: "" };

  function announce(what) {
    try { window.dispatchEvent(new CustomEvent("horizon:content", { detail: { source: what } })); } catch (e) {}
  }

  var Store = {
    PASSCODE: PASSCODE,
    KEY: KEY,
    get: function () { return data; },
    reload: function () { data = loadLocal(); return data; },
    save: function () { save(data); return data; },
    reset: function () { data = defaults(); save(data); return data; },
    state: function () { return state; },

    add: function (section, item) {
      if (!data[section]) data[section] = [];
      item.id = item.id || uid(section);
      data[section].unshift(item);
      save(data); return item;
    },
    update: function (section, id, patch) {
      var arr = data[section] || [];
      for (var i = 0; i < arr.length; i++) if (arr[i].id === id) { Object.assign(arr[i], patch); save(data); return arr[i]; }
      return null;
    },
    remove: function (section, id) {
      data[section] = (data[section] || []).filter(function (x) { return x.id !== id; });
      save(data);
    },
    find: function (section, id) {
      return (data[section] || []).filter(function (x) { return x.id === id; })[0] || null;
    },

    /* the numbers shown on the home page. Active members can never be
       lower than the number of members actually recorded. */
    stats: function () {
      var st = data.settings || {};
      var listed = Array.isArray(data.members) ? data.members.length : 0;
      return {
        activeMembers: Math.max(parseInt(st.activeMembers, 10) || 0, listed),
        eventsHosted: parseInt(st.eventsHosted, 10) || 0
      };
    },

    export: function () { return JSON.stringify(data, null, 2); },
    importJson: function (text) {
      data = normalize(JSON.parse(text)); save(data); return data;
    },

    /* ---------- backend sync ---------- */
    sync: async function () {
      if (!B) return data;
      state.syncing = true;
      try {
        var res = await B.pull(B.paths.content);
        if (res && res.data) {
          data = normalize(res.data);
          save(data);
          state.synced = true; state.error = "";
          announce("backend");
        }
      } catch (e) {
        state.error = e.message || String(e);
      } finally {
        state.syncing = false;
      }
      return data;
    },
    publish: async function (message) {
      if (!B) throw new Error("Backend not loaded.");
      save(data);
      var out = await B.push(B.paths.content, data, message || "Update site content (member panel)");
      state.synced = true; state.error = "";
      return out;
    },

    /* ---------- member gate ---------- */
    unlock: async function (pass) {
      var given = String(pass == null ? "" : pass).trim();
      var ok = false;
      if (data.settings && data.settings.passcodeHash) {
        var h = await sha256hex(given);
        ok = !!h && h === data.settings.passcodeHash;
      }
      if (!ok) ok = given.toLowerCase() === PASSCODE.toLowerCase();   // fallback while no hash is published
      if (ok) { try { sessionStorage.setItem(SESSION, "1"); } catch (e) {} }
      return ok;
    },
    isUnlocked: function () { try { return sessionStorage.getItem(SESSION) === "1"; } catch (e) { return false; } },
    lock: function () { try { sessionStorage.removeItem(SESSION); } catch (e) {} }
  };

  window.HorizonStore = Store;

  /* Public pages: show the cached copy instantly, then refresh from the
     backend in the background. admin.js opts out so it can edit in peace. */
  if (B && !document.body.hasAttribute("data-no-autosync")) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { Store.sync(); });
    else Store.sync();
  }
})();
