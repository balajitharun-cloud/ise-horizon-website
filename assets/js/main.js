/* =====================================================================
   ISE HORIZON — shared site engine
   Renders header/footer, theme toggle, search, countdown and page content.
   ===================================================================== */
(function () {
  "use strict";
  var H = window.HORIZON || {};
  var club = H.club || {};

  /* ---------- tiny helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function fmtDate(iso, opts) {
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("en-IN", opts || { day: "numeric", month: "short", year: "numeric" });
  }
  function fmtTime(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join("");
  }
  function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

  /* ---------- page registry ---------- */
  var PAGES = [
    { file: "index.html", label: "Home" },
    { file: "about.html", label: "About" },
    { file: "events.html", label: "Events" },
    { file: "projects.html", label: "Projects" },
    { file: "resources.html", label: "Resources" },
    { file: "team.html", label: "Team" },
    { file: "gallery.html", label: "Gallery" },
    { file: "join.html", label: "Join Us" },
    { file: "contact.html", label: "Contact" },
    { file: "certificate.html", label: "Certificates" }
  ];

  function currentFile() {
    var p = location.pathname.split("/").pop();
    return p === "" ? "index.html" : p;
  }

  /* ---------- theme ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("horizon-theme", t); } catch (e) {}
    var btn = $("#themeBtn");
    if (btn) { btn.textContent = t === "dark" ? "☀️" : "🌙"; btn.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode"); }
  }
  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem("horizon-theme"); } catch (e) {}
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));
  }

  /* ---------- header / footer ---------- */
  function buildHeader() {
    var mount = $("#siteHeader");
    if (!mount) return;
    var cur = currentFile();
    var links = PAGES.map(function (p) {
      var aria = p.file === cur ? ' aria-current="page"' : "";
      return '<li><a href="' + p.file + '"' + aria + ">" + p.label + "</a></li>";
    }).join("");
    mount.innerHTML =
      '<div class="container header-inner">' +
        '<a class="brand" href="index.html">' +
          '<img src="assets/images/college-logo.jpeg" alt="Kalpataru Institute of Technology logo">' +
          '<span class="brand-txt">' +
            '<span class="brand-name">ISE <span style="color:var(--brand-orange)">HORIZON</span></span>' +
            '<span class="brand-sub">Kalpataru Institute of Technology</span>' +
          "</span>" +
        "</a>" +
        '<nav class="nav" id="mainNav" aria-label="Main"><ul>' + links + "</ul></nav>" +
        '<div class="header-actions">' +
          '<button class="search-btn" id="searchBtn" aria-label="Search the site" title="Search">🔍</button>' +
          '<button class="theme-btn" id="themeBtn" aria-label="Toggle theme" title="Toggle theme">🌙</button>' +
          '<a class="btn btn-primary btn-sm header-cta" href="join.html">Join Us</a>' +
          '<button class="nav-toggle" id="navToggle" aria-label="Menu" aria-expanded="false"><span></span></button>' +
        "</div>" +
      "</div>";

    $("#navToggle").addEventListener("click", function () {
      var nav = $("#mainNav");
      var open = nav.classList.toggle("open");
      this.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $("#themeBtn").addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(cur);
    });
    $("#searchBtn").addEventListener("click", openSearch);
  }

  function buildFooter() {
    var mount = $("#siteFooter");
    if (!mount) return;
    var s = club.socials || {};
    var socialLinks = [
      ["Instagram", "📷", s.instagram], ["LinkedIn", "in", s.linkedin],
      ["GitHub", "🐙", s.github], ["WhatsApp", "💬", s.whatsapp],
      ["Discord", "🎮", s.discord], ["YouTube", "▶️", s.youtube]
    ].filter(function (x) { return x[2]; }).map(function (x) {
      return '<a href="' + x[2] + '" target="_blank" rel="noopener" aria-label="' + x[0] + '" title="' + x[0] + '">' + x[1] + "</a>";
    }).join("");

    var navLinks = PAGES.map(function (p) { return '<li><a href="' + p.file + '">' + p.label + "</a></li>"; }).join("");

    mount.innerHTML =
      '<div class="container">' +
        '<div class="footer-grid">' +
          "<div>" +
            '<div class="footer-brand">' +
              '<img src="assets/images/college-logo.jpeg" alt="KIT logo">' +
              '<div><strong>ISE HORIZON</strong><br><span class="small">Kalpataru Institute of Technology, Tiptur</span></div>' +
            "</div>" +
            "<p class=\"small\">" + esc(club.tagline) + "</p>" +
            '<div class="socials">' + socialLinks + "</div>" +
          "</div>" +
          '<div class="footer-col"><h4>Explore</h4><ul>' + navLinks + "</ul></div>" +
          '<div class="footer-col"><h4>Community</h4><ul>' +
            '<li><a href="join.html">Become a member</a></li>' +
            '<li><a href="events.html">Upcoming events</a></li>' +
            '<li><a href="projects.html">Projects</a></li>' +
            '<li><a href="certificate.html">Download certificate</a></li>' +
          "</ul></div>" +
          '<div class="footer-col"><h4>Contact</h4><ul>' +
            "<li>📍 " + esc(club.address) + "</li>" +
            '<li>✉️ <a href="mailto:' + esc(club.email) + '">' + esc(club.email) + "</a></li>" +
            "<li>📞 " + esc(club.phone) + "</li>" +
          "</ul></div>" +
        "</div>" +
        '<div class="footer-bottom">' +
          "<span>© " + new Date().getFullYear() + " ISE HORIZON · Dept. of Information Science & Engineering</span>" +
          "<span>Affiliated to VTU Belagavi · Built by students, for students</span>" +
        "</div>" +
      "</div>";
  }

  /* ---------- search ---------- */
  function buildIndex() {
    var idx = [];
    (H.events || []).forEach(function (e) { idx.push({ kind: "Event", title: e.title, url: "events.html#ev-" + e.id, extra: fmtDate(e.date) + " · " + e.venue }); });
    (H.pastEvents || []).forEach(function (e) { idx.push({ kind: "Past event", title: e.title, url: "events.html#past", extra: fmtDate(e.date) }); });
    (H.projects || []).forEach(function (p) { idx.push({ kind: "Project", title: p.title, url: "projects.html#pr-" + slug(p.title), extra: (p.stack || []).join(", ") }); });
    (H.resources || []).forEach(function (r) { idx.push({ kind: "Resource", title: r.title, url: "resources.html", extra: r.type + " · " + r.domain }); });
    (H.team || []).forEach(function (t) { idx.push({ kind: "Team", title: t.name, url: "team.html", extra: t.role }); });
    (H.announcements || []).forEach(function (a) { idx.push({ kind: "News", title: a.title, url: "about.html#news", extra: fmtDate(a.date) }); });
    (H.achievements || []).forEach(function (a) { idx.push({ kind: "Achievement", title: a.title, url: "about.html#achievements", extra: a.year }); });
    PAGES.forEach(function (p) { idx.push({ kind: "Page", title: p.label, url: p.file, extra: "Go to page" }); });
    return idx;
  }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

  function openSearch() {
    var ov = $("#searchOverlay");
    if (!ov) {
      ov = document.createElement("div");
      ov.className = "search-overlay";
      ov.id = "searchOverlay";
      ov.innerHTML =
        '<div class="search-panel">' +
          '<input type="search" id="searchInput" placeholder="Search events, projects, resources…" aria-label="Search">' +
          '<div class="search-results" id="searchResults"></div>' +
        "</div>";
      document.body.appendChild(ov);
      ov.addEventListener("click", function (e) { if (e.target === ov) closeSearch(); });
      $("#searchInput").addEventListener("input", runSearch);
    }
    ov.classList.add("open");
    setTimeout(function () { $("#searchInput").focus(); }, 30);
  }
  function closeSearch() { var ov = $("#searchOverlay"); if (ov) ov.classList.remove("open"); }

  function runSearch() {
    var q = $("#searchInput").value.trim().toLowerCase();
    var box = $("#searchResults");
    if (!q) { box.innerHTML = '<div class="r-empty">Type to search across the site.</div>'; return; }
    var idx = buildIndex();
    var hits = idx.filter(function (r) { return (r.title + " " + (r.extra || "") + " " + r.kind).toLowerCase().indexOf(q) > -1; }).slice(0, 25);
    if (!hits.length) { box.innerHTML = '<div class="r-empty">No results for “' + esc(q) + '”.</div>'; return; }
    box.innerHTML = hits.map(function (r) {
      return '<a href="' + r.url + '"><span class="r-kind">' + esc(r.kind) + "</span><br><strong>" + esc(r.title) + "</strong>" +
        (r.extra ? '<br><span class="small muted">' + esc(r.extra) + "</span>" : "") + "</a>";
    }).join("");
  }

  /* ---------- countdown ---------- */
  function nextEvent() {
    var now = new Date();
    var up = (H.events || []).slice().sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    for (var i = 0; i < up.length; i++) { if (new Date(up[i].date) > now) return up[i]; }
    return up[0];
  }
  function startCountdown(el, targetIso) {
    if (!el) return;
    var target = new Date(targetIso).getTime();
    function tick() {
      var diff = target - Date.now();
      if (diff < 0) diff = 0;
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      el.innerHTML =
        unit(d, "Days") + unit(h, "Hrs") + unit(m, "Min") + unit(s, "Sec");
    }
    function unit(n, l) { return '<div class="unit"><div class="num">' + (n < 10 ? "0" + n : n) + '</div><div class="lbl">' + l + "</div></div>"; }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- reusable markup ---------- */
  function eventCard(e) {
    var dt = new Date(e.date);
    return '<article class="card" id="ev-' + esc(e.id) + '">' +
      '<div class="card-media" style="background:linear-gradient(140deg,#0b2a5b,#123a7a)"><span class="ph" style="font-size:3rem">' + (e.poster || "📅") + "</span></div>" +
      '<div class="card-body">' +
        '<div class="pill-row mb-2"><span class="chip chip--orange">' + esc(e.category) + '</span><span class="chip">' + esc(e.mode) + "</span></div>" +
        "<h3>" + esc(e.title) + "</h3>" +
        '<p class="meta">📅 ' + esc(fmtDate(e.date, { weekday: "short", day: "numeric", month: "long", year: "numeric" })) +
          (e.time ? " · " + esc(e.time) : "") + "<br>📍 " + esc(e.venue) + "</p>" +
        "<p>" + esc(e.description) + "</p>" +
        '<div class="card-actions">' +
          (e.registration ? '<a class="btn btn-primary btn-sm" href="' + esc(e.registration) + '" target="_blank" rel="noopener">Register / RSVP</a>' : "") +
          '<a class="btn btn-ghost btn-sm" href="contact.html">Ask a question</a>' +
        "</div>" +
      "</div>" +
    "</article>";
  }

  function projectCard(p) {
    var tags = (p.stack || []).map(function (t) { return '<span class="chip chip--blue">' + esc(t) + "</span>"; }).join("");
    var team = (p.team || []).map(esc).join(" · ");
    return '<article class="card" id="pr-' + slug(p.title) + '">' +
      '<div class="card-body">' +
        '<div class="pill-row mb-2"><span class="chip ' + (p.status === "Ongoing" ? "chip--green" : "") + '">' + esc(p.status) + "</span></div>" +
        "<h3>" + esc(p.title) + "</h3>" +
        "<p>" + esc(p.desc) + "</p>" +
        '<div class="tags mb-2">' + tags + "</div>" +
        '<p class="meta small">👥 ' + esc(team) + "</p>" +
        '<div class="card-actions">' +
          (p.github ? '<a class="btn btn-ghost btn-sm" href="' + esc(p.github) + '" target="_blank" rel="noopener">GitHub ↗</a>' : "") +
          (p.demo ? '<a class="btn btn-blue btn-sm" href="' + esc(p.demo) + '">Live demo</a>' : "") +
        "</div>" +
      "</div>" +
    "</article>";
  }

  function personCard(t) {
    var soc = t.socials ? Object.keys(t.socials).map(function (k) {
      var icon = { linkedin: "in", github: "🐙", instagram: "📷", twitter: "𝕏" }[k] || "🔗";
      return '<a href="' + esc(t.socials[k]) + '" aria-label="' + k + '">' + icon + "</a>";
    }).join("") : "";
    return '<article class="person card"><div class="card-body">' +
      '<div class="avatar">' + (t.photo ? '<img src="' + esc(t.photo) + '" alt="' + esc(t.name) + '">' : esc(t.initials || initials(t.name))) + "</div>" +
      "<h3 style=\"margin-bottom:.1em\">" + esc(t.name) + "</h3>" +
      '<div class="role">' + esc(t.role) + "</div>" +
      '<div class="small muted">' + esc(t.dept || "") + "</div>" +
      '<p class="bio">' + esc(t.bio || "") + "</p>" +
      (soc ? '<div class="socials">' + soc + "</div>" : "") +
    "</div></article>";
  }

  function resourceCard(r) {
    return '<article class="card"><div class="card-body">' +
      '<div class="pill-row mb-2"><span class="chip chip--orange">' + esc(r.type) + '</span><span class="chip">' + esc(r.domain) + "</span></div>" +
      "<h3>" + esc(r.title) + "</h3>" +
      '<p class="muted small">' + esc(r.desc) + "</p>" +
      '<div class="card-actions"><a class="btn btn-blue btn-sm" href="' + esc(r.link) + '">Open resource</a></div>' +
    "</div></article>";
  }

  /* ---------- calendar ---------- */
  function buildCalendar(mount, events, state) {
    state = state || { y: new Date().getFullYear(), m: new Date().getMonth() };
    function render() {
      var y = state.y, m = state.m;
      var first = new Date(y, m, 1);
      var startDow = first.getDay();
      var daysInMonth = new Date(y, m + 1, 0).getDate();
      var prevDays = new Date(y, m, 0).getDate();
      var byDay = {};
      events.forEach(function (e) {
        var d = new Date(e.date);
        if (d.getFullYear() === y && d.getMonth() === m) { (byDay[d.getDate()] = byDay[d.getDate()] || []).push(e); }
      });
      var today = new Date();
      var cells = "";
      var dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(function (d) { return '<div class="dow">' + d + "</div>"; }).join("");
      for (var i = 0; i < startDow; i++) cells += '<div class="day muted"><span class="dn">' + (prevDays - startDow + i + 1) + "</span></div>";
      for (var day = 1; day <= daysInMonth; day++) {
        var isToday = today.getFullYear() === y && today.getMonth() === m && today.getDate() === day;
        var evs = byDay[day];
        cells += '<div class="day' + (isToday ? " today" : "") + (evs ? " has-event" : "") + '"' +
          (evs ? ' data-ev="' + esc(evs[0].id || evs[0].title) + '" title="' + esc(evs.map(function (x) { return x.title; }).join(", ")) + '"' : "") + ">" +
          '<span class="dn">' + day + "</span>" + (evs ? '<span class="dot"></span>' : "") + "</div>";
      }
      var monthName = first.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      mount.innerHTML =
        '<div class="cal-head"><div class="m">📅 ' + monthName + "</div>" +
          '<div class="cal-nav"><button class="btn btn-ghost btn-sm" data-cal="prev" aria-label="Previous month">‹</button>' +
          '<button class="btn btn-ghost btn-sm" data-cal="today">Today</button>' +
          '<button class="btn btn-ghost btn-sm" data-cal="next" aria-label="Next month">›</button></div></div>' +
        '<div class="cal-grid">' + dows + cells + "</div>";
      $$("[data-cal]", mount).forEach(function (b) {
        b.addEventListener("click", function () {
          var a = this.getAttribute("data-cal");
          if (a === "prev") { state.m--; if (state.m < 0) { state.m = 11; state.y--; } }
          else if (a === "next") { state.m++; if (state.m > 11) { state.m = 0; state.y++; } }
          else { state.y = today.getFullYear(); state.m = today.getMonth(); }
          render();
        });
      });
      $$(".day.has-event", mount).forEach(function (c) {
        c.addEventListener("click", function () {
          var id = this.getAttribute("data-ev");
          var target = document.getElementById("ev-" + id);
          if (target) { target.scrollIntoView({ behavior: "smooth", block: "center" }); target.animate([{ boxShadow: "0 0 0 0 rgba(242,101,34,.6)" }, { boxShadow: "0 0 0 14px rgba(242,101,34,0)" }], { duration: 1200 }); }
        });
      });
    }
    render();
  }

  /* =====================================================================
     PAGE RENDERERS
     ===================================================================== */
  var RENDER = {
    home: function () {
      var nx = nextEvent();
      var cd = $("#heroCountdown");
      if (nx && cd) { startCountdown(cd, nx.date); }
      var upMount = $("#homeUpcoming");
      if (upMount) upMount.innerHTML = (H.events || []).slice(0, 3).map(eventCard).join("");
      var stats = $("#homeStats");
      if (stats) stats.innerHTML = (H.stats || []).map(function (s) { return '<div class="stat"><div class="num">' + esc(s.num) + '</div><div class="lbl">' + esc(s.lbl) + "</div></div>"; }).join("");
      var news = $("#homeNews");
      if (news) news.innerHTML = (H.announcements || []).slice(0, 3).map(function (a) {
        return '<article class="card"><div class="card-body"><span class="chip chip--green mb-2">' + esc(a.tag) + "</span><h3>" + esc(a.title) + "</h3>" +
          '<p class="small muted">' + esc(fmtDate(a.date)) + "</p><p>" + esc(a.excerpt) + "</p>" +
          '<div class="card-actions"><a class="btn btn-ghost btn-sm" href="about.html#news">Read more</a></div></div></article>';
      }).join("");
      var proj = $("#homeProjects");
      if (proj) proj.innerHTML = (H.projects || []).slice(0, 3).map(projectCard).join("");
      var part = $("#homePartners");
      if (part) part.innerHTML = (H.partners || []).map(function (p) {
        return '<div class="card"><div class="card-body center"><div style="font-size:2rem">' + esc(p.emoji) + "</div><h3 style=\"font-size:1rem\">" + esc(p.name) + '</h3><div class="small muted">' + esc(p.kind) + "</div></div></div>";
      }).join("");
    },

    about: function () {
      var tl = $("#aboutTimeline");
      if (tl) {
        var history = [
          { year: "2021", text: "ISE HORIZON founded with 24 students and a single weekly coding circle." },
          { year: "2023", text: "Crossed 200 members; hosted the first inter-college hackathon." },
          { year: "2025", text: "Launched the Learning Hub and the Projects Showcase; 40+ events hosted." },
          { year: "2026", text: "Named Best Student Club at KIT Tech Day; 600+ active members." }
        ];
        tl.innerHTML = history.map(function (h) { return '<div class="item"><div class="year">' + h.year + '</div><div>' + esc(h.text) + "</div></div>"; }).join("");
      }
      var ach = $("#aboutAchievements");
      if (ach) ach.innerHTML = (H.achievements || []).map(function (a) {
        return '<article class="card"><div class="card-body"><span class="chip chip--orange mb-2">' + esc(a.year) + "</span><h3>" + esc(a.title) + '</h3><p class="muted small">' + esc(a.detail) + "</p></div></article>";
      }).join("");
      var news = $("#aboutNews");
      if (news) news.innerHTML = (H.announcements || []).map(function (a) {
        return '<article class="card"><div class="card-body"><span class="chip chip--green mb-2">' + esc(a.tag) + "</span><h3>" + esc(a.title) + "</h3>" +
          '<p class="small muted">' + esc(fmtDate(a.date)) + "</p><p>" + esc(a.excerpt) + "</p><p>" + esc(a.body) + "</p></div></article>";
      }).join("");
      var team = $("#aboutTeam");
      if (team) team.innerHTML = (H.team || []).slice(0, 4).map(personCard).join("");
    },

    events: function () {
      var calMount = $("#eventCalendar");
      if (calMount) buildCalendar(calMount, (H.events || []).concat(H.pastEvents || []).map(function (e) { return { id: e.id, title: e.title, date: e.date }; }));
      var up = $("#eventList");
      if (up) up.innerHTML = (H.events || []).map(eventCard).join("");
      var past = $("#pastList");
      if (past) past.innerHTML = (H.pastEvents || []).map(function (e) {
        return '<article class="card" id="ev-' + esc(e.id) + '"><div class="card-body">' +
          '<div class="pill-row mb-2"><span class="chip">' + esc(e.category) + '</span><span class="chip">' + esc(fmtDate(e.date)) + "</span></div>" +
          "<h3>" + (e.poster ? esc(e.poster) + " " : "") + esc(e.title) + "</h3>" +
          '<p class="muted small">📍 ' + esc(e.venue) + "</p>" +
          "<p>" + esc(e.description) + "</p>" +
          '<p class="small"><strong>Results:</strong> ' + esc(e.results) + "</p>" +
        "</div></article>";
      }).join("");
    },

    projects: function () {
      var mount = $("#projectGrid");
      if (!mount) return;
      function render(filter) {
        var list = (H.projects || []).filter(function (p) { return !filter || filter === "All" || p.status === filter; });
        mount.innerHTML = list.map(projectCard).join("");
      }
      $$(".tab", $("#projectTabs")).forEach(function (t) {
        t.addEventListener("click", function () {
          $$(".tab", $("#projectTabs")).forEach(function (x) { x.classList.remove("active"); });
          this.classList.add("active"); render(this.getAttribute("data-filter"));
        });
      });
      render("All");
    },

    resources: function () {
      var mount = $("#resourceGrid");
      if (!mount) return;
      function render(filter) {
        var list = (H.resources || []).filter(function (r) { return !filter || filter === "All" || r.domain === filter; });
        mount.innerHTML = list.map(resourceCard).join("");
      }
      var domains = ["All"].concat((H.resources || []).map(function (r) { return r.domain; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
      var tabs = $("#resourceTabs");
      tabs.innerHTML = domains.map(function (d, i) { return '<button class="tab' + (i === 0 ? " active" : "") + '" data-filter="' + esc(d) + '">' + esc(d) + "</button>"; }).join("");
      $$(".tab", tabs).forEach(function (t) {
        t.addEventListener("click", function () {
          $$(".tab", tabs).forEach(function (x) { x.classList.remove("active"); });
          this.classList.add("active"); render(this.getAttribute("data-filter"));
        });
      });
      render("All");
    },

    team: function () {
      var mount = $("#teamGrid");
      if (mount) mount.innerHTML = (H.team || []).map(personCard).join("");
    },

    gallery: function () {
      var mount = $("#galleryGrid");
      if (mount) mount.innerHTML = (H.gallery || []).map(function (g) {
        return '<div class="gitem' + (g.wide ? " wide" : "") + '" role="button" tabindex="0" aria-label="' + esc(g.caption) + '">' +
          '<div class="avatar-ph" style="width:100%;height:100%;font-size:2.4rem">' + esc(g.emoji) + "</div>" +
          '<span class="cap">' + esc(g.caption) + "</span></div>";
      }).join("");
    },

    contact: function () { /* static page, form handled below */ },
    join: function () { /* static page, form handled below */ }
  };

  /* ---------- forms (client-side demo handlers) ---------- */
  function wireForms() {
    var joinForm = $("#joinForm");
    if (joinForm) {
      joinForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var note = $("#joinNote");
        var data = Object.fromEntries(new FormData(joinForm).entries());
        if (!data.name || !data.email || !data.usn) {
          note.className = "notice err show"; note.textContent = "Please fill in your name, email and USN.";
          return;
        }
        try { localStorage.setItem("horizon-last-join", JSON.stringify(data)); } catch (err) {}
        note.className = "notice ok show";
        note.textContent = "Thanks, " + data.name + "! Your membership request has been recorded. We'll reach out at " + data.email + ".";
        joinForm.reset();
      });
    }
    var cForm = $("#contactForm");
    if (cForm) {
      cForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var note = $("#contactNote");
        var d = Object.fromEntries(new FormData(cForm).entries());
        if (!d.name || !d.message) { note.className = "notice err show"; note.textContent = "Please add your name and a message."; return; }
        note.className = "notice ok show";
        note.textContent = "Message sent! We'll get back to you soon.";
        cForm.reset();
      });
    }
    var nl = $("#newsletterForm");
    if (nl) {
      nl.addEventListener("submit", function (e) {
        e.preventDefault();
        var note = $("#nlNote");
        note.className = "notice ok show"; note.textContent = "Subscribed! Watch your inbox for club updates.";
        nl.reset();
      });
    }
  }

  /* ---------- boot ---------- */
  function boot() {
    initTheme();
    buildHeader();
    buildFooter();
    var page = document.body.getAttribute("data-page");
    if (page && RENDER[page]) { try { RENDER[page](); } catch (e) { console.error("render error", e); } }
    wireForms();
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeSearch();
      if (e.key === "/" && !/input|textarea|select/i.test((e.target.tagName || ""))) { e.preventDefault(); openSearch(); }
    });
    // PWA
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.HorizonApp = { $: $, $$: $$, esc: esc, fmtDate: fmtDate, slug: slug };
})();
