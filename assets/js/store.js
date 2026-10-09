/* =====================================================================
   AVYAKT — content store
   Elite members add/cancel events, news, projects, gallery items and
   members from the member panel (admin.html). Public pages read from here.
   Data lives in this browser's localStorage; use Export/Import to move it.
   ===================================================================== */
(function () {
  "use strict";
  var KEY = "horizon-content-v1";
  var PASSCODE = "123@2007";           // elite-member passcode
  var SESSION = "horizon-member";      // sessionStorage unlock flag

  function today() { return new Date().toISOString().slice(0, 10); }
  function uid(p) { return (p || "id") + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function defaults() {
    return {
      settings: { passcode: PASSCODE, activeMembers: 8, eventsHosted: 40 },
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
      gallery: [
        { id: "g1", caption: "HORIZON Hackathon — final demo round", emoji: "🚀", wide: true },
        { id: "g2", caption: "Workshop in the computer lab", emoji: "🤖" },
        { id: "g3", caption: "Weekly coding circle", emoji: "🧩" },
        { id: "g4", caption: "Tech talk — packed auditorium", emoji: "🎙️" }
      ],
      members: [
        { id: "m1", name: "Dr. Sunitha R.", role: "Active member", year: "", branch: "ISE" },
        { id: "m2", name: "Aarav Kulkarni", role: "Event host", year: "4th Year", branch: "ISE" },
        { id: "m3", name: "Meghana Shetty", role: "Event host", year: "3rd Year", branch: "ISE" },
        { id: "m4", name: "Rahul Naik", role: "Active member", year: "3rd Year", branch: "ISE" },
        { id: "m5", name: "Sneha Patil", role: "Event host", year: "3rd Year", branch: "ISE" },
        { id: "m6", name: "Kiran Kumar", role: "Active member", year: "2nd Year", branch: "ISE" },
        { id: "m7", name: "Divya Rao", role: "Active member", year: "2nd Year", branch: "ISE" },
        { id: "m8", name: "Arjun Hegde", role: "Active member", year: "3rd Year", branch: "ISE" }
      ]
    };
  }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) {}
    if (!raw) { var d = defaults(); save(d); return d; }
    try { return normalize(JSON.parse(raw)); } catch (e) { var d2 = defaults(); save(d2); return d2; }
  }
  function normalize(o) {
    var d = defaults();
    o = o || {};
    o.settings = Object.assign(d.settings, o.settings || {});
    o.hackathon = Object.assign(d.hackathon, o.hackathon || {});
    ["events", "pastEvents", "news", "projects", "gallery", "members"].forEach(function (k) {
      o[k] = Array.isArray(o[k]) ? o[k] : d[k];
    });
    return o;
  }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }

  var data = load();

  var Store = {
    PASSCODE: PASSCODE,
    KEY: KEY,
    get: function () { return data; },
    reload: function () { data = load(); return data; },
    save: function () { save(data); return data; },
    reset: function () { data = defaults(); save(data); return data; },

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

    export: function () { return JSON.stringify(data, null, 2); },
    importJson: function (text) {
      data = normalize(JSON.parse(text)); save(data); return data;
    },

    unlock: function (pass) {
      if (String(pass) === (data.settings.passcode || PASSCODE)) {
        try { sessionStorage.setItem(SESSION, "1"); } catch (e) {}
        return true;
      }
      return false;
    },
    isUnlocked: function () { try { return sessionStorage.getItem(SESSION) === "1"; } catch (e) { return false; } },
    lock: function () { try { sessionStorage.removeItem(SESSION); } catch (e) {} }
  };

  window.HorizonStore = Store;
})();
